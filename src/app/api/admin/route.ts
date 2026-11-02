import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.platformConfig.findUnique({
    where: { id: "default" },
  });

  const transactions = await prisma.escrowTransaction.findMany({
    orderBy: { fundedAt: "desc" },
    include: {
      milestone: {
        include: {
          job: {
            include: {
              homeowner: true,
              selectedWorkerProfile: {
                include: { user: true },
              },
            },
          },
        },
      },
    },
  });

  const workers = await prisma.workerProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      certifications: true,
    },
  });

  const pendingCerts = await prisma.tradeCertification.findMany({
    where: { status: "PENDING" },
    include: {
      workerProfile: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const redactedMessages = await prisma.chatMessage.findMany({
    where: { wasRedacted: true },
    include: {
      sender: true,
      job: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const safetyIncidents = await prisma.gateVisit.findMany({
    where: { status: "SAFETY_INCIDENT_FLAGGED" },
    include: {
      job: { include: { homeowner: true } },
      leadWorkerProfile: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let totalGmvZar = 0;
  let heldInEscrowZar = 0;
  let releasedPlatformRevenueZar = 0;
  let pendingPlatformRevenueZar = 0;

  for (const tx of transactions) {
    totalGmvZar += tx.grossBuyerPaidZar;
    if (tx.status === "HELD" || tx.status === "DISPUTED") {
      heldInEscrowZar += tx.grossBuyerPaidZar;
      pendingPlatformRevenueZar += tx.platformTotalCutZar;
    } else if (tx.status === "RELEASED") {
      releasedPlatformRevenueZar += tx.platformTotalCutZar;
    }
  }

  return NextResponse.json({
    config,
    kpis: {
      totalGmvZar,
      heldInEscrowZar,
      releasedPlatformRevenueZar,
      pendingPlatformRevenueZar,
      clearedWorkersCount: workers.filter((w) => w.sapsStatus === "CLEARED").length,
      blockedWorkersCount: workers.filter((w) => w.sapsStatus === "FLAGGED_RECORD")
        .length,
    },
    transactions,
    workers,
    pendingCerts,
    redactedMessages,
    safetyIncidents,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "UPDATE_FEE_CONFIG") {
      const {
        platformName,
        buyerTrustFeePct,
        workerLabourCommissionPct,
        repeatClientCommissionPct,
        defaultCallOutZar,
      } = body;

      const updated = await prisma.platformConfig.update({
        where: { id: "default" },
        data: {
          platformName: platformName ? String(platformName).trim() : undefined,
          buyerTrustFeePct:
            buyerTrustFeePct !== undefined ? Number(buyerTrustFeePct) : undefined,
          workerLabourCommissionPct:
            workerLabourCommissionPct !== undefined
              ? Number(workerLabourCommissionPct)
              : undefined,
          repeatClientCommissionPct:
            repeatClientCommissionPct !== undefined
              ? Number(repeatClientCommissionPct)
              : undefined,
          defaultCallOutZar:
            defaultCallOutZar !== undefined ? Number(defaultCallOutZar) : undefined,
        },
      });

      return NextResponse.json({ config: updated });
    }

    if (action === "REVIEW_CERTIFICATION") {
      const { certificationId, decision, notes } = body; // VERIFIED | REJECTED
      const cert = await prisma.tradeCertification.update({
        where: { id: certificationId },
        data: {
          status: decision === "VERIFIED" ? "VERIFIED" : "REJECTED",
          verifiedAt: decision === "VERIFIED" ? new Date() : null,
          notes: notes ? String(notes).trim() : undefined,
        },
      });

      if (decision === "VERIFIED") {
        const profile = await prisma.workerProfile.findUnique({
          where: { id: cert.workerProfileId },
        });
        if (profile && profile.sapsStatus === "CLEARED") {
          await prisma.workerProfile.update({
            where: { id: cert.workerProfileId },
            data: { vettingTier: "TIER_3_COC_CERTIFIED" },
          });
        }
      }

      return NextResponse.json({ certification: cert });
    }

    if (action === "RESOLVE_DISPUTE") {
      const { transactionId, outcome, resolutionNote } = body; // RELEASE_TO_WORKER | REFUND_TO_HOMEOWNER
      const tx = await prisma.escrowTransaction.findUnique({
        where: { id: transactionId },
        include: {
          milestone: {
            include: { job: true },
          },
        },
      });

      if (!tx) {
        return NextResponse.json(
          { error: "Escrow transaction not found." },
          { status: 404 }
        );
      }

      if (outcome === "REFUND_TO_HOMEOWNER") {
        await prisma.escrowTransaction.update({
          where: { id: tx.id },
          data: {
            status: "REFUNDED",
            resolutionNote: String(
              resolutionNote || "Refunded to homeowner following Admin mediation."
            ),
          },
        });
        await prisma.milestone.update({
          where: { id: tx.milestoneId },
          data: { status: "REFUNDED" },
        });
      } else {
        await prisma.escrowTransaction.update({
          where: { id: tx.id },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
            resolutionNote: String(
              resolutionNote || "Released to worker following Admin inspection."
            ),
          },
        });
        await prisma.milestone.update({
          where: { id: tx.milestoneId },
          data: { status: "RELEASED" },
        });
        if (tx.milestone.job.selectedWorkerProfileId) {
          await prisma.workerProfile.update({
            where: { id: tx.milestone.job.selectedWorkerProfileId },
            data: {
              walletBalanceZar: { increment: tx.workerNetPayoutZar },
            },
          });
        }
        await prisma.job.update({
          where: { id: tx.milestone.jobId },
          data: { status: "COMPLETED" },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
  } catch (err) {
    console.error("Admin API error:", err);
    return NextResponse.json(
      { error: "Failed to execute admin action." },
      { status: 500 }
    );
  }
}
