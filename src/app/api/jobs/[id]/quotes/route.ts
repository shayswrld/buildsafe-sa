import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateQuoteEligibility } from "@/lib/governance";
import { computeEscrowSplit } from "@/lib/adapters/escrow";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  try {
    const body = await req.json();
    const {
      workerProfileId,
      labourAmountZar,
      materialsEstimateZar,
      estimatedDays,
      scopeSummary,
      proposedCrewIds,
    } = body;

    if (!workerProfileId || !labourAmountZar || !scopeSummary) {
      return NextResponse.json(
        { error: "Worker profile, labour quote amount, and scope summary are required." },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id: workerProfileId },
      include: { certifications: true, user: true },
    });

    if (!workerProfile) {
      return NextResponse.json(
        { error: "Worker profile not found." },
        { status: 404 }
      );
    }

    const crewIds: string[] = Array.isArray(proposedCrewIds)
      ? proposedCrewIds.filter((cid) => cid && cid !== workerProfileId)
      : [];

    const crewProfiles =
      crewIds.length > 0
        ? await prisma.workerProfile.findMany({
            where: { id: { in: crewIds } },
            include: { user: true, certifications: true },
          })
        : [];

    // Enforce strict South African 3-Tier SAPS + Statutory CoC + Crew Manifest Governance
    const eligibility = validateQuoteEligibility(
      workerProfile,
      job,
      crewProfiles
    );

    if (!eligibility.allowed) {
      return NextResponse.json({ error: eligibility.reason }, { status: 403 });
    }

    const quote = await prisma.quote.create({
      data: {
        jobId,
        workerProfileId,
        labourAmountZar: Number(labourAmountZar),
        materialsEstimateZar: Number(materialsEstimateZar) || 0,
        estimatedDays: Number(estimatedDays) || 1,
        scopeSummary: String(scopeSummary).trim(),
        proposedCrewIdsJson: JSON.stringify(crewIds),
        status: "PENDING",
      },
      include: {
        workerProfile: {
          include: { user: true, certifications: true },
        },
      },
    });

    if (job.status === "OPEN") {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "QUOTED" },
      });
    }

    const config = await prisma.platformConfig.findUnique({
      where: { id: "default" },
    });

    const splitPreview = computeEscrowSplit({
      labourZar: quote.labourAmountZar,
      materialsZar: quote.materialsEstimateZar,
      config: config ?? undefined,
    });

    return NextResponse.json({ quote, splitPreview }, { status: 201 });
  } catch (err) {
    console.error("Failed to submit quote:", err);
    return NextResponse.json(
      { error: "Could not submit quote." },
      { status: 500 }
    );
  }
}
