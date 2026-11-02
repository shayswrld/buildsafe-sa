import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateReviewEligibility } from "@/lib/governance";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  try {
    const body = await req.json();
    const {
      reviewerId,
      qualityOrClarityScore = 5,
      punctualityOrPaymentScore = 5,
      safetyRespectScore = 5,
      comment,
    } = body;

    if (!reviewerId || !comment || !String(comment).trim()) {
      return NextResponse.json(
        { error: "Reviewer and written feedback are required." },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { selectedWorkerProfile: true },
    });

    if (!job || !job.selectedWorkerProfile) {
      return NextResponse.json(
        { error: "Job has no assigned worker to review yet." },
        { status: 400 }
      );
    }

    const workerUserId = job.selectedWorkerProfile.userId;

    const eligibility = validateReviewEligibility(
      {
        id: job.id,
        category: job.category,
        requiresCoC: job.requiresCoC,
        status: job.status,
        homeownerId: job.homeownerId,
        selectedWorkerUserId: workerUserId,
      },
      reviewerId
    );

    if (!eligibility.allowed) {
      return NextResponse.json({ error: eligibility.reason }, { status: 403 });
    }

    const isHomeownerReviewing = reviewerId === job.homeownerId;
    const revieweeId = isHomeownerReviewing ? workerUserId : job.homeownerId;
    const direction = isHomeownerReviewing
      ? "HOMEOWNER_TO_WORKER"
      : "WORKER_TO_HOMEOWNER";

    const q = Math.min(5, Math.max(1, Number(qualityOrClarityScore)));
    const p = Math.min(5, Math.max(1, Number(punctualityOrPaymentScore)));
    const s = Math.min(5, Math.max(1, Number(safetyRespectScore)));
    const overallRating = Math.round((q + p + s) / 3);

    const review = await prisma.review.upsert({
      where: {
        jobId_reviewerId: {
          jobId,
          reviewerId,
        },
      },
      update: {
        overallRating,
        qualityOrClarityScore: q,
        punctualityOrPaymentScore: p,
        safetyRespectScore: s,
        comment: String(comment).trim(),
      },
      create: {
        jobId,
        reviewerId,
        revieweeId,
        direction,
        overallRating,
        qualityOrClarityScore: q,
        punctualityOrPaymentScore: p,
        safetyRespectScore: s,
        comment: String(comment).trim(),
      },
      include: {
        reviewer: true,
        reviewee: true,
      },
    });

    // Recompute reviewee aggregate trust rating
    const agg = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { overallRating: true },
      _count: { overallRating: true },
    });

    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        ratingAvg: Number((agg._avg.overallRating ?? 5).toFixed(2)),
        ratingCount: agg._count.overallRating,
      },
    });

    return NextResponse.json({ review });
  } catch (err) {
    console.error("Failed to save review:", err);
    return NextResponse.json(
      { error: "Unable to record rating." },
      { status: 500 }
    );
  }
}
