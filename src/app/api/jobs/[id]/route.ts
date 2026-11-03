import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewerId = req.nextUrl.searchParams.get("viewerId") ?? "";

    const job = await prisma.job.findUnique({
    where: { id },
    include: {
      homeowner: {
        include: {
          reviewsReceived: {
            include: { reviewer: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      selectedWorkerProfile: {
        include: {
          user: true,
          certifications: true,
        },
      },
      quotes: {
        include: {
          workerProfile: {
            include: {
              user: true,
              certifications: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      milestones: {
        include: {
          escrowTransaction: true,
        },
        orderBy: { sequence: "asc" },
      },
      gateVisits: {
        include: {
          leadWorkerProfile: {
            include: {
              user: true,
              certifications: true,
            },
          },
          crewMembers: {
            include: {
              workerProfile: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      messages: {
        include: {
          sender: true,
        },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        include: {
          reviewer: true,
          reviewee: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const hasFundedEscrow = job.milestones.some(
    (m) => m.status === "HELD_IN_ESCROW" || m.status === "WORK_SUBMITTED" || m.status === "RELEASED"
  );

  const isOwnerOrAdmin =
    viewerId === job.homeownerId || viewerId === "user_admin_owner";
  const isBookedWorker =
    job.selectedWorkerProfile?.userId === viewerId && hasFundedEscrow;

  const canSeeExactAddress = isOwnerOrAdmin || isBookedWorker;

  return NextResponse.json({
    job: {
      ...job,
      hasFundedEscrow,
      streetAddressDisplay: canSeeExactAddress
        ? job.streetAddressEncrypted
        : `${job.suburb}, ${job.city} — Exact street number locked until Escrow Deposit is funded`,
      streetAddressEncrypted: undefined,
      homeowner: {
        ...job.homeowner,
        phone: canSeeExactAddress
          ? job.homeowner.phone
          : "Masked until Escrow Deposit",
      },
    },
  });
  } catch (err) {
    console.error("Failed to fetch job details:", err);
    return NextResponse.json(
      { error: "Failed to load job details." },
      { status: 500 }
    );
  }
}
