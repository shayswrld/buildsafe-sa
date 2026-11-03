import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { validateProfileSetup } from "@/lib/auth/validation";
import { TRADE_CATEGORIES } from "@/lib/config";
import { validateSouthAfricanId } from "@/lib/security/sa-id";
import { signSession, SESSION_COOKIE, sessionCookieOptions, UserRole } from "@/lib/auth/session";

const ALLOWED_TRADES = TRADE_CATEGORIES.map((t) => t.slug);

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Authentication required to complete profile setup." },
        { status: 401 }
      );
    }

    const needsBuilderFields =
      sessionUser.role === "WORKER" || sessionUser.role === "DUAL";

    const body = await req.json();
    const validation = validateProfileSetup(body, needsBuilderFields, ALLOWED_TRADES);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { suburb, city, trade, saId } = validation.value;

    let saIdMasked = "";
    let saIdHash = "";

    if (needsBuilderFields) {
      const saIdCheck = validateSouthAfricanId(saId!, 2026);
      if (!saIdCheck.valid || !saIdCheck.maskedId || !saIdCheck.idHash) {
        return NextResponse.json(
          { error: saIdCheck.error ?? "Invalid 13-digit South African ID." },
          { status: 400 }
        );
      }
      saIdMasked = saIdCheck.maskedId;
      saIdHash = saIdCheck.idHash;

      // Duplicate SA ID check
      const duplicate = await prisma.workerProfile.findFirst({
        where: {
          saIdHash,
          userId: { not: sessionUser.id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "An artisan profile with this South African ID is already registered." },
          { status: 409 }
        );
      }
    }

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        suburb,
        city,
        profileCompletedAt: new Date(),
        popiaConsentAt: new Date(),
      },
    });

    // If builder/dual, create or update WorkerProfile
    if (needsBuilderFields) {
      await prisma.workerProfile.upsert({
        where: { userId: sessionUser.id },
        update: {
          tradesJson: JSON.stringify([trade]),
          nearestHardwareHub: `Builders Warehouse (${suburb})`,
          saIdMasked,
          saIdHash,
          popiaConsentSigned: true,
          popiaConsentAt: new Date(),
        },
        create: {
          userId: sessionUser.id,
          roleInCompany: "INDEPENDENT_ARTISAN",
          vettingTier: "TIER_1_BROWSE_ONLY",
          saIdMasked,
          saIdHash,
          citizenshipStatus: "SA_CITIZEN",
          selfieVerified: false,
          popiaConsentSigned: true,
          popiaConsentAt: new Date(),
          huruFeePaid: false,
          sapsStatus: "UNSTARTED",
          tradesJson: JSON.stringify([trade]),
          nearestHardwareHub: `Builders Warehouse (${suburb})`,
          yearsExperience: 3,
          bio: `Registered artisan providing professional ${trade} services.`,
          walletBalanceZar: 0,
          totalPaidOutZar: 0,
          completedJobsCount: 0,
        },
      });
    }

    // Refresh JWT token with pc: true (profile completed)
    const token = await signSession({
      sub: updatedUser.id,
      role: updatedUser.role as UserRole,
      pc: true,
      tv: updatedUser.tokenVersion || 0,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        profileCompleted: true,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err: any) {
    console.error("Profile setup API error:", err);
    return NextResponse.json(
      { error: "Failed to finalize profile setup." },
      { status: 500 }
    );
  }
}
