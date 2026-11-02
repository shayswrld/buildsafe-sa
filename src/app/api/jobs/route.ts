import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  let homeownerId: string | null = null;
  if (req && req.url) {
    try {
      const url = new URL(req.url);
      homeownerId = url.searchParams.get("homeownerId");
    } catch {
      // fallback
    }
  }

  const jobs = await prisma.job.findMany({
    where: homeownerId ? { homeownerId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      homeowner: true,
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
          crewMembers: {
            include: {
              workerProfile: {
                include: { user: true },
              },
            },
          },
        },
      },
      reviews: true,
    },
  });

  // Never leak encrypted street address on the public job feed
  const safeJobs = jobs.map((j) => ({
    ...j,
    streetAddressEncrypted: undefined,
  }));

  return NextResponse.json({ jobs: safeJobs });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      homeownerId,
      title,
      category,
      problemTags,
      description,
      suburb,
      city,
      streetAddress,
      urgency,
      requiresCoC,
      callOutDepositZar,
      budgetEstimateZar,
    } = body;

    if (!homeownerId || !title || !category || !description || !suburb || !city) {
      return NextResponse.json(
        { error: "Please complete the required job details (trade, scope, and suburb)." },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        homeownerId,
        title: String(title).trim(),
        category: String(category),
        problemTagsJson: JSON.stringify(Array.isArray(problemTags) ? problemTags : []),
        description: String(description).trim(),
        suburb: String(suburb).trim(),
        city: String(city).trim(),
        streetAddressEncrypted: String(
          streetAddress || `${suburb}, ${city} (House number verified)`
        ).trim(),
        urgency: urgency || "THIS_WEEK",
        requiresCoC: Boolean(requiresCoC),
        callOutDepositZar: Number(callOutDepositZar) || 250,
        budgetEstimateZar: budgetEstimateZar ? Number(budgetEstimateZar) : null,
        status: "OPEN",
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("Failed to create job:", err);
    return NextResponse.json(
      { error: "Unable to create job request." },
      { status: 500 }
    );
  }
}
