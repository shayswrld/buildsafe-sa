import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEscrowSplit, escrowAdapter } from "@/lib/adapters/escrow";
import { generateGateOtpPair } from "@/lib/security/gate-otp";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  try {
    const body = await req.json();
    const {
      quoteId,
      fundingOption = "FULL_QUOTE_ESCROW", // CALL_OUT_FIRST | FULL_QUOTE_ESCROW
      paymentMethod = "OZOW_INSTANT_EFT",
    } = body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { workerProfile: true },
    });

    if (!job || !quote || quote.jobId !== jobId) {
      return NextResponse.json(
        { error: "Matching job and quote not found." },
        { status: 404 }
      );
    }

    const config = await prisma.platformConfig.findUnique({
      where: { id: "default" },
    });

    // Check if this homeowner has completed a prior job with this worker (unlocks 4% repeat loyalty rate!)
    const priorCompletedCount = await prisma.job.count({
      where: {
        homeownerId: job.homeownerId,
        selectedWorkerProfileId: quote.workerProfileId,
        status: "COMPLETED",
      },
    });
    const isRepeatBooking = priorCompletedCount > 0;

    // Update quote statuses
    await prisma.quote.updateMany({
      where: { jobId, id: { not: quoteId } },
      data: { status: "DECLINED" },
    });
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "ACCEPTED" },
    });

    const depositResult = escrowAdapter.createProtectedDeposit(paymentMethod);

    if (
      fundingOption === "CALL_OUT_FIRST" &&
      quote.labourAmountZar > job.callOutDepositZar
    ) {
      const callOutSplit = computeEscrowSplit({
        labourZar: job.callOutDepositZar,
        materialsZar: 0,
        isRepeatBooking,
        config: config ?? undefined,
      });

      await prisma.milestone.create({
        data: {
          jobId,
          sequence: 1,
          kind: "CALL_OUT_DEPOSIT",
          title: "Protected Call-Out & Site Inspection Deposit",
          description:
            "Credited 100% toward the total labour quote upon proceeding; unlocks street address & Gate OTP.",
          labourAmountZar: callOutSplit.labourZar,
          materialsAmountZar: 0,
          status: "HELD_IN_ESCROW",
          escrowTransaction: {
            create: {
              paymentMethod,
              providerRef: depositResult.providerRef,
              labourZar: callOutSplit.labourZar,
              materialsZar: 0,
              buyerTrustFeeZar: callOutSplit.buyerTrustFeeZar,
              grossBuyerPaidZar: callOutSplit.grossBuyerPaidZar,
              workerCommissionZar: callOutSplit.workerCommissionZar,
              platformTotalCutZar: callOutSplit.platformTotalCutZar,
              workerNetPayoutZar: callOutSplit.workerNetPayoutZar,
              status: "HELD",
            },
          },
        },
      });

      const remainingLabour = Math.max(
        0,
        quote.labourAmountZar - job.callOutDepositZar
      );

      await prisma.milestone.create({
        data: {
          jobId,
          sequence: 2,
          kind: "MAIN_WORK",
          title: "Remaining Renovation Balance (Labour + Hardware Materials)",
          description: `Remaining labour after R${job.callOutDepositZar} call-out credit, plus reimbursed hardware-store materials.`,
          labourAmountZar: remainingLabour,
          materialsAmountZar: quote.materialsEstimateZar,
          status: "AWAITING_FUNDING",
        },
      });
    } else {
      const fullSplit = computeEscrowSplit({
        labourZar: quote.labourAmountZar,
        materialsZar: quote.materialsEstimateZar,
        isRepeatBooking,
        config: config ?? undefined,
      });

      await prisma.milestone.create({
        data: {
          jobId,
          sequence: 1,
          kind: "MAIN_WORK",
          title: "Full Project Milestone (Labour + Reimbursed Materials)",
          description: quote.scopeSummary,
          labourAmountZar: fullSplit.labourZar,
          materialsAmountZar: fullSplit.materialsZar,
          status: "HELD_IN_ESCROW",
          escrowTransaction: {
            create: {
              paymentMethod,
              providerRef: depositResult.providerRef,
              labourZar: fullSplit.labourZar,
              materialsZar: fullSplit.materialsZar,
              buyerTrustFeeZar: fullSplit.buyerTrustFeeZar,
              grossBuyerPaidZar: fullSplit.grossBuyerPaidZar,
              workerCommissionZar: fullSplit.workerCommissionZar,
              platformTotalCutZar: fullSplit.platformTotalCutZar,
              workerNetPayoutZar: fullSplit.workerNetPayoutZar,
              status: "HELD",
            },
          },
        },
      });
    }

    // Generate Gate Check-In OTP + SAPS-Cleared Crew Manifest
    const otp = generateGateOtpPair();
    let crewIds: string[] = [];
    try {
      crewIds = JSON.parse(quote.proposedCrewIdsJson);
    } catch {
      crewIds = [];
    }

    await prisma.gateVisit.create({
      data: {
        jobId,
        leadWorkerProfileId: quote.workerProfileId,
        checkInCode: otp.checkInCode,
        checkInCodeHash: otp.checkInCodeHash,
        checkOutCode: otp.checkOutCode,
        status: "AWAITING_ARRIVAL",
        crewMembers: {
          create: crewIds.map((cid) => ({
            workerProfileId: cid,
            roleOnSite: "SAPS-Cleared Site Assistant",
          })),
        },
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        selectedWorkerProfileId: quote.workerProfileId,
        isRepeatBooking,
        status: "ESCROW_FUNDED",
      },
    });

    return NextResponse.json({
      success: true,
      isRepeatBooking,
      gateCheckInCode: otp.checkInCode,
    });
  } catch (err) {
    console.error("Failed to accept quote and fund escrow:", err);
    return NextResponse.json(
      { error: "Failed to lock escrow funds." },
      { status: 500 }
    );
  }
}
