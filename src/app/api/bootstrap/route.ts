import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PLATFORM_CONFIG } from "@/lib/config";

export async function GET() {
  let config = await prisma.platformConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    config = await prisma.platformConfig.create({
      data: {
        id: "default",
        ...DEFAULT_PLATFORM_CONFIG,
      },
    });
  }

  const personas = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      workerProfile: {
        include: {
          certifications: true,
        },
      },
    },
  });

  const clearedCrewPool = await prisma.workerProfile.findMany({
    where: {
      sapsStatus: "CLEARED",
      vettingTier: { in: ["TIER_2_SAPS_CLEARED", "TIER_3_COC_CERTIFIED"] },
    },
    include: {
      user: true,
      certifications: true,
    },
  });

  return NextResponse.json({
    config,
    personas,
    clearedCrewPool,
  });
}
