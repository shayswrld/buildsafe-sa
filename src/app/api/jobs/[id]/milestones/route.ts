import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMilestoneSplit, vaultAdapter } from "@/lib/adapters/vault";

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

      const split = computeMilestoneSplit({
        labourZar: ms.labourAmountZar,
        materialsZar: ms.materialsAmountZar,
        isRepeatBooking: job.isRepeatBooking,
        config: config ?? undefined,
      });
      const deposit = vaultAdapter.createProtectedDeposit(paymentMethod);

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

    if (action === "SUBMIT_PROOF" || action === "SUBMIT_WORK") {
      const { milestoneId, photoUrls, notes, materialReceiptRef } = body;
      const ms = await prisma.milestone.findUnique({ where: { id: milestoneId } });
      if (!ms || ms.jobId !== jobId) {
        return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
      }

      const validStatuses = [
        "HELD_IN_ESCROW",
        "WORK_IN_PROGRESS",
        "WORK_SUBMITTED",
        "INSPECTION_COUNTDOWN_ACTIVE",
        "TOUCH_UP_WINDOW_ACTIVE",
      ];
      if (!validStatuses.includes(ms.status)) {
        return NextResponse.json(
          { error: `Cannot submit proof from status ${ms.status}.` },
          { status: 400 }
        );
      }

      const photoList = Array.isArray(photoUrls)
        ? photoUrls
        : photoUrls
        ? [String(photoUrls)]
        : [];
      const autoReleaseDeadline = new Date(Date.now() + 48 * 3600 * 1000);

      await prisma.milestone.update({
        where: { id: ms.id },
        data: {
          status: "INSPECTION_COUNTDOWN_ACTIVE",
          proofPhotosJson: JSON.stringify(photoList),
          proofNotes: notes ? String(notes).trim() : ms.proofNotes,
          proofSubmittedAt: new Date(),
          autoReleaseDeadline,
          cureDeadline: null,
          materialReceiptRef: materialReceiptRef
            ? String(materialReceiptRef).trim()
            : ms.materialReceiptRef,
        },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "WORK_SUBMITTED" },
      });

      return NextResponse.json({
        success: true,
        status: "INSPECTION_COUNTDOWN_ACTIVE",
        autoReleaseDeadline,
      });
    }

    if (action === "APPROVE_PAYOUT" || action === "RELEASE_ESCROW") {
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
          { error: "Milestone vault payout has already been released." },
          { status: 400 }
        );
      }

      const idempotencyKey = `payout_milestone_${ms.id}`;
      await vaultAdapter.disbursePayout(ms.id, idempotencyKey);

      await prisma.$transaction(async (tx) => {
        await tx.escrowTransaction.update({
          where: { id: ms.escrowTransaction!.id },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
          },
        });

        await tx.milestone.update({
          where: { id: ms.id },
          data: { status: "RELEASED" },
        });

        if (job.selectedWorkerProfileId) {
          await tx.workerProfile.update({
            where: { id: job.selectedWorkerProfileId },
            data: {
              walletBalanceZar: {
                increment: ms.escrowTransaction!.workerNetPayoutZar,
              },
            },
          });
        }

        const remainingUnreleased = await tx.milestone.count({
          where: {
            jobId,
            status: { not: "RELEASED" },
          },
        });

        if (remainingUnreleased === 0) {
          await tx.job.update({
            where: { id: jobId },
            data: { status: "COMPLETED" },
          });
          if (job.selectedWorkerProfileId) {
            await tx.workerProfile.update({
              where: { id: job.selectedWorkerProfileId },
              data: { completedJobsCount: { increment: 1 } },
            });
          }
        }
      });

      return NextResponse.json({
        success: true,
        status: "PAID_OUT",
        labourGrossZar: ms.labourAmountZar,
        platformFeeZar: ms.escrowTransaction.platformTotalCutZar,
        workerNetPayoutZar: ms.escrowTransaction.workerNetPayoutZar,
        reimbursedMaterialsZar: ms.materialsAmountZar,
      });
    }

    if (action === "REQUEST_TOUCH_UP") {
      const { milestoneId, defectDescription } = body;
      const ms = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { escrowTransaction: true },
      });

      if (!ms || ms.jobId !== jobId) {
        return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
      }

      if (ms.touchUpCount >= 1) {
        // Enforce maximum 1 touch-up cycle per milestone, escalate to mediation thereafter
        await prisma.milestone.update({
          where: { id: ms.id },
          data: { status: "DISPUTED" },
        });
        await prisma.job.update({
          where: { id: jobId },
          data: { status: "DISPUTED" },
        });
        return NextResponse.json({
          success: false,
          status: "ESCALATED_MEDIATION",
          message: "Touch-up cycle limit reached. Dispute escalated to Fair Resolution Support.",
        });
      }

      const cureDeadline = new Date(Date.now() + 72 * 3600 * 1000);
      await prisma.milestone.update({
        where: { id: ms.id },
        data: {
          status: "TOUCH_UP_WINDOW_ACTIVE",
          autoReleaseDeadline: null,
          cureDeadline,
          defectDescription: String(
            defectDescription || "Client requested touch-up on completed milestone."
          ).trim(),
          touchUpCount: { increment: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        status: "TOUCH_UP_WINDOW_ACTIVE",
        cureDeadline,
      });
    }

    if (action === "REQUEST_EXTENSION") {
      const { milestoneId } = body;
      const ms = await prisma.milestone.findUnique({ where: { id: milestoneId } });
      if (!ms || ms.jobId !== jobId) {
        return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
      }

      if (ms.status !== "INSPECTION_COUNTDOWN_ACTIVE") {
        return NextResponse.json(
          { error: "Extension can only be requested while inspection is active." },
          { status: 400 }
        );
      }

      if (ms.extensionGranted) {
        return NextResponse.json(
          { error: "A 24-hour blackout extension has already been granted for this milestone." },
          { status: 400 }
        );
      }

      const currentDeadline = ms.autoReleaseDeadline
        ? new Date(ms.autoReleaseDeadline).getTime()
        : Date.now();
      const newDeadline = new Date(currentDeadline + 24 * 3600 * 1000);

      await prisma.milestone.update({
        where: { id: ms.id },
        data: {
          autoReleaseDeadline: newDeadline,
          extensionGranted: true,
        },
      });

      return NextResponse.json({
        success: true,
        status: "INSPECTION_COUNTDOWN_ACTIVE",
        autoReleaseDeadline: newDeadline,
        extensionGranted: true,
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
          { error: "Milestone vault transaction not found." },
          { status: 404 }
        );
      }

      await prisma.escrowTransaction.update({
        where: { id: ms.escrowTransaction.id },
        data: {
          status: "DISPUTED",
          disputeReason: String(
            disputeReason || "Workmanship or scope concern flagged for Fair Resolution Support."
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
