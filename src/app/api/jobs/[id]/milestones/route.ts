import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEscrowSplit, escrowAdapter } from "@/lib/adapters/escrow";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  try {
    const body = await req.json();
    const { action } = body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { milestones: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const config = await prisma.platformConfig.findUnique({
      where: { id: "default" },
    });

    if (action === "CREATE_VARIATION") {
      const { title, description, labourAmountZar, materialsAmountZar, materialReceiptRef } =
        body;
      if (!title || (Number(labourAmountZar) <= 0 && Number(materialsAmountZar) <= 0)) {
        return NextResponse.json(
          { error: "Variation order requires a title and valid labour or materials amount." },
          { status: 400 }
        );
      }

      const nextSeq = job.milestones.length + 1;
      const variation = await prisma.milestone.create({
        data: {
          jobId,
          sequence: nextSeq,
          kind: "VARIATION_ORDER",
          title: String(title).trim(),
          description: String(
            description || "On-site hidden damage / scope variation agreed on platform."
          ).trim(),
          labourAmountZar: Math.max(0, Number(labourAmountZar) || 0),
          materialsAmountZar: Math.max(0, Number(materialsAmountZar) || 0),
          materialReceiptRef: materialReceiptRef ? String(materialReceiptRef).trim() : null,
          status: "AWAITING_FUNDING",
        },
      });

      return NextResponse.json({ milestone: variation }, { status: 201 });
    }

    if (action === "FUND_MILESTONE") {
      const { milestoneId, paymentMethod = "OZOW_INSTANT_EFT" } = body;
      const ms = await prisma.milestone.findUnique({ where: { id: milestoneId } });
      if (!ms || ms.jobId !== jobId) {
        return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
      }
      if (ms.status !== "AWAITING_FUNDING") {
        return NextResponse.json(
          { error: "Milestone is already funded or closed." },
          { status: 400 }
        );
      }

      const split = computeEscrowSplit({
        labourZar: ms.labourAmountZar,
        materialsZar: ms.materialsAmountZar,
        isRepeatBooking: job.isRepeatBooking,
        config: config ?? undefined,
      });
      const deposit = escrowAdapter.createProtectedDeposit(paymentMethod);

      await prisma.escrowTransaction.create({
        data: {
          milestoneId: ms.id,
          paymentMethod,
          providerRef: deposit.providerRef,
          labourZar: split.labourZar,
          materialsZar: split.materialsZar,
          buyerTrustFeeZar: split.buyerTrustFeeZar,
          grossBuyerPaidZar: split.grossBuyerPaidZar,
          workerCommissionZar: split.workerCommissionZar,
          platformTotalCutZar: split.platformTotalCutZar,
          workerNetPayoutZar: split.workerNetPayoutZar,
          status: "HELD",
        },
      });

      await prisma.milestone.update({
        where: { id: ms.id },
        data: { status: "HELD_IN_ESCROW" },
      });

      return NextResponse.json({ success: true, providerRef: deposit.providerRef });
    }

    if (action === "SUBMIT_WORK") {
      const { milestoneId, materialReceiptRef } = body;
      const ms = await prisma.milestone.findUnique({ where: { id: milestoneId } });
      if (!ms || ms.jobId !== jobId) {
        return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
      }

      await prisma.milestone.update({
        where: { id: ms.id },
        data: {
          status: "WORK_SUBMITTED",
          materialReceiptRef: materialReceiptRef
            ? String(materialReceiptRef).trim()
            : ms.materialReceiptRef,
        },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "WORK_SUBMITTED" },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "RELEASE_ESCROW") {
      const { milestoneId } = body;
      const ms = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { escrowTransaction: true },
      });

      if (!ms || ms.jobId !== jobId || !ms.escrowTransaction) {
        return NextResponse.json(
          { error: "Funded milestone transaction not found." },
          { status: 404 }
        );
      }

      if (ms.escrowTransaction.status === "RELEASED") {
        return NextResponse.json(
          { error: "Milestone escrow has already been released." },
          { status: 400 }
        );
      }

      await prisma.escrowTransaction.update({
        where: { id: ms.escrowTransaction.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
        },
      });

      await prisma.milestone.update({
        where: { id: ms.id },
        data: { status: "RELEASED" },
      });

      if (job.selectedWorkerProfileId) {
        await prisma.workerProfile.update({
          where: { id: job.selectedWorkerProfileId },
          data: {
            walletBalanceZar: {
              increment: ms.escrowTransaction.workerNetPayoutZar,
            },
          },
        });
      }

      const remainingUnreleased = await prisma.milestone.count({
        where: {
          jobId,
          status: { not: "RELEASED" },
        },
      });

      if (remainingUnreleased === 0) {
        await prisma.job.update({
          where: { id: jobId },
          data: { status: "COMPLETED" },
        });
        if (job.selectedWorkerProfileId) {
          await prisma.workerProfile.update({
            where: { id: job.selectedWorkerProfileId },
            data: { completedJobsCount: { increment: 1 } },
          });
        }
      }

      return NextResponse.json({
        success: true,
        workerNetPayoutZar: ms.escrowTransaction.workerNetPayoutZar,
        platformTotalCutZar: ms.escrowTransaction.platformTotalCutZar,
      });
    }

    if (action === "RAISE_DISPUTE") {
      const { milestoneId, disputeReason } = body;
      const ms = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { escrowTransaction: true },
      });

      if (!ms || !ms.escrowTransaction) {
        return NextResponse.json(
          { error: "Escrow milestone not found." },
          { status: 404 }
        );
      }

      await prisma.escrowTransaction.update({
        where: { id: ms.escrowTransaction.id },
        data: {
          status: "DISPUTED",
          disputeReason: String(
            disputeReason || "Workmanship or scope concern flagged for Admin mediation."
          ),
        },
      });

      await prisma.milestone.update({
        where: { id: ms.id },
        data: { status: "DISPUTED" },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "DISPUTED" },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported milestone action." }, { status: 400 });
  } catch (err) {
    console.error("Milestone API error:", err);
    return NextResponse.json(
      { error: "Failed to process milestone operation." },
      { status: 500 }
    );
  }
}
