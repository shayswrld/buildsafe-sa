import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PLATFORM_CONFIG } from "@/lib/config";
import { DEFAULT_SEED_PERSONAS, DEFAULT_SEED_CREW_POOL } from "@/lib/seed-personas";

const DUAL_ROLE_JOHAN = {
  id: "user_dual_johan",
  name: "Johan Nel",
  phone: "+27823334455",
  email: "johan.nel@example.co.za",
  role: "DUAL",
  suburb: "Randburg",
  city: "Johannesburg",
  avatarUrl: "JN",
  ratingAvg: 4.9,
  ratingCount: 8,
};

const DUAL_ROLE_WORKER_PROFILE = {
  id: "wp_johan",
  userId: "user_dual_johan",
  roleInCompany: "INDEPENDENT_ARTISAN",
  vettingTier: "TIER_3_COC_CERTIFIED",
  saIdMasked: "820512*****081",
  saIdHash: "hash_johan_nel_820512",
  citizenshipStatus: "SA_CITIZEN",
  selfieVerified: true,
  popiaConsentSigned: true,
  huruFeePaid: true,
  sapsStatus: "CLEARED",
  sapsCertificateRef: "SAPS-CRC-2026-771920",
  tradesJson: JSON.stringify(["ELECTRICAL", "HANDYMAN"]),
  nearestHardwareHub: "Builders Warehouse Northriding (Randburg)",
  yearsExperience: 10,
  bio: "Dual-role homeowner and master electrician. Holds Dept. of Labour ECB Wireman certification and manages residential renovation projects.",
  walletBalanceZar: 3200,
  totalPaidOutZar: 21500,
  completedJobsCount: 11,
};

const DUAL_ROLE_CERTIFICATION = {
  id: "cert_johan_ecb",
  workerProfileId: "wp_johan",
  body: "ECB_WIREMAN",
  registrationNumber: "ECB-90214-GP",
  tradeCategory: "ELECTRICAL",
  status: "VERIFIED",
  registryVerifyUrl: "https://ecb.org.za/verify-registered-person/",
  notes: "Verified Dept. of Labour Single Phase & Three Phase Wireman's License.",
};

export async function GET() {
  try {
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

  const { userId, ...workerProfileData } = DUAL_ROLE_WORKER_PROFILE;

  // Ensure dual-role user Johan Nel exists in DB if possible
  try {
    const existingDual = await prisma.user.findUnique({
      where: { id: DUAL_ROLE_JOHAN.id },
      include: { workerProfile: true },
    });

    if (!existingDual) {
      await prisma.user.create({
        data: {
          ...DUAL_ROLE_JOHAN,
          workerProfile: {
            create: {
              ...workerProfileData,
              selfieVerifiedAt: new Date("2026-07-15T09:00:00Z"),
              popiaConsentAt: new Date("2026-07-15T09:05:00Z"),
              sapsClearedAt: new Date("2026-07-16T11:00:00Z"),
              sapsExpiresAt: new Date("2027-07-16T11:00:00Z"),
              certifications: {
                create: [
                  {
                    body: DUAL_ROLE_CERTIFICATION.body,
                    registrationNumber: DUAL_ROLE_CERTIFICATION.registrationNumber,
                    tradeCategory: DUAL_ROLE_CERTIFICATION.tradeCategory,
                    status: DUAL_ROLE_CERTIFICATION.status,
                    registryVerifyUrl: DUAL_ROLE_CERTIFICATION.registryVerifyUrl,
                    notes: DUAL_ROLE_CERTIFICATION.notes,
                    verifiedAt: new Date("2026-07-16T09:00:00Z"),
                    expiresAt: new Date("2027-07-16T09:00:00Z"),
                  },
                ],
              },
            },
          },
        },
      });
    }
  } catch (err) {
    // If database insertion is constrained, memory fallback ensures availability
    console.warn("Bootstrap dual user seeding note:", err);
  }

  const rawPersonas = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      workerProfile: {
        include: {
          certifications: true,
          company: {
            include: {
              roster: {
                include: {
                  user: true,
                  certifications: true,
                },
              },
            },
          },
        },
      },
      postedJobs: {
        select: { id: true },
      },
    },
  });

  // Map personas to include dual-role affordances and posted job counts
  let personas = rawPersonas.map((p) => ({
    ...p,
    postedJobsCount: p.postedJobs?.length || 0,
    isDualRole:
      p.role === "DUAL" ||
      Boolean(p.workerProfile && p.role === "HOMEOWNER") ||
      Boolean(p.workerProfile && p.postedJobs && p.postedJobs.length > 0),
  }));

  // Ensure Johan Nel is included even if database write was skipped
  const hasJohan = personas.some((p) => p.id === DUAL_ROLE_JOHAN.id);
  if (!hasJohan) {
    const memoryJohan = {
      ...DUAL_ROLE_JOHAN,
      postedJobsCount: 2,
      isDualRole: true,
      workerProfile: {
        ...DUAL_ROLE_WORKER_PROFILE,
        certifications: [DUAL_ROLE_CERTIFICATION],
        company: null,
      },
    };
    personas.push(memoryJohan as any);
  }

  const clearedCrewPool = await prisma.workerProfile.findMany({
    where: {
      sapsStatus: "CLEARED",
      vettingTier: { in: ["TIER_2_SAPS_CLEARED", "TIER_3_COC_CERTIFIED"] },
    },
    include: {
      user: true,
      certifications: true,
      company: true,
    },
  });

  // Ensure Johan's profile is in cleared crew pool if not already there
  const hasJohanInCrew = clearedCrewPool.some(
    (w) => w.userId === DUAL_ROLE_JOHAN.id
  );
  if (!hasJohanInCrew) {
    const johanUser = personas.find((p) => p.id === DUAL_ROLE_JOHAN.id);
    if (johanUser?.workerProfile) {
      clearedCrewPool.push({
        ...johanUser.workerProfile,
        user: johanUser,
        certifications: johanUser.workerProfile.certifications || [
          DUAL_ROLE_CERTIFICATION as any,
        ],
        company: null,
      } as any);
    }
  }

    return NextResponse.json({
      config,
      personas,
      clearedCrewPool,
    });
  } catch (err) {
    console.warn("Bootstrap database error; falling back to resilient static seed personas:", err);
    return NextResponse.json(
      {
        config: DEFAULT_PLATFORM_CONFIG,
        personas: DEFAULT_SEED_PERSONAS,
        clearedCrewPool: DEFAULT_SEED_CREW_POOL,
        degraded: true,
      },
      {
        status: 200,
        headers: {
          "X-BuildSafe-Degraded": "true",
        },
      }
    );
  }
}
