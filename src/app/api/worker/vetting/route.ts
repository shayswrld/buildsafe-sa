import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSouthAfricanId } from "@/lib/security/sa-id";
import { vettingAdapter } from "@/lib/adapters/vetting";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "REGISTER_TIER_1") {
      const {
        name,
        phone,
        suburb,
        city,
        saIdNumber,
        selfieConfirmed,
        trades,
        nearestHardwareHub,
        yearsExperience,
        bio,
      } = body;

      if (!name || !phone || !saIdNumber || !selfieConfirmed) {
        return NextResponse.json(
          {
            error:
              "Full name, mobile number, 13-digit SA ID, and Live Selfie confirmation are required.",
          },
          { status: 400 }
        );
      }

      const idCheck = validateSouthAfricanId(String(saIdNumber));
      if (!idCheck.valid || !idCheck.maskedId || !idCheck.idHash) {
        return NextResponse.json(
          { error: idCheck.error ?? "Invalid South African ID." },
          { status: 400 }
        );
      }

      const initials = String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "W")
        .join("");

      const newUser = await prisma.user.create({
        data: {
          name: String(name).trim(),
          phone: String(phone).trim(),
          role: "WORKER",
          suburb: String(suburb || "Fourways").trim(),
          city: String(city || "Johannesburg").trim(),
          avatarUrl: initials,
          workerProfile: {
            create: {
              vettingTier: "TIER_1_BROWSE_ONLY",
              saIdMasked: idCheck.maskedId,
              saIdHash: idCheck.idHash,
              citizenshipStatus: idCheck.citizenship ?? "SA_CITIZEN",
              selfieVerified: true,
              selfieVerifiedAt: new Date(),
              tradesJson: JSON.stringify(
                Array.isArray(trades) && trades.length > 0 ? trades : ["PAINTING"]
              ),
              nearestHardwareHub: String(
                nearestHardwareHub || "Builders Warehouse Fourways (Johannesburg)"
              ),
              yearsExperience: Number(yearsExperience) || 3,
              bio: String(bio || "Independent South African skilled artisan.").trim(),
            },
          },
        },
        include: {
          workerProfile: {
            include: { certifications: true },
          },
        },
      });

      return NextResponse.json({ user: newUser }, { status: 201 });
    }

    if (action === "REQUEST_HURU_VOUCHER") {
      const { workerProfileId, popiaConsent } = body;
      if (!popiaConsent) {
        return NextResponse.json(
          {
            error:
              "POPIA Mandate: Explicit biometric criminal-check consent is legally required before generating an AFISwitch / HURU barcode.",
          },
          { status: 400 }
        );
      }

      const config = await prisma.platformConfig.findUnique({
        where: { id: "default" },
      });
      const voucher = vettingAdapter.generateFingerprintVoucher(
        config?.sapsVettingFeeZar ?? 200
      );

      const updated = await prisma.workerProfile.update({
        where: { id: workerProfileId },
        data: {
          popiaConsentSigned: true,
          popiaConsentAt: new Date(),
          huruFeePaid: true,
          huruVoucherCode: voucher.voucherCode,
          sapsStatus: "PENDING_FINGERPRINTS",
        },
      });

      return NextResponse.json({
        workerProfile: updated,
        voucher,
      });
    }

    if (action === "SIMULATE_AFISWITCH_WEBHOOK") {
      const { workerProfileId, outcome = "CLEAR" } = body;
      const profile = await prisma.workerProfile.findUnique({
        where: { id: workerProfileId },
      });

      if (!profile || !profile.popiaConsentSigned || !profile.huruFeePaid) {
        return NextResponse.json(
          {
            error:
              "Worker must sign POPIA consent and complete the R200 HURU voucher step before biometric SAPS results can be processed.",
          },
          { status: 400 }
        );
      }

      const result = vettingAdapter.simulateAfiswitchResult(
        outcome === "FLAGGED" ? "FLAGGED" : "CLEAR"
      );

      const updated = await prisma.workerProfile.update({
        where: { id: workerProfileId },
        data: {
          sapsStatus: result.sapsStatus,
          sapsCertificateRef: result.sapsCertificateRef,
          sapsClearedAt: result.sapsStatus === "CLEARED" ? new Date() : null,
          vettingTier: result.newVettingTier,
        },
      });

      return NextResponse.json({
        workerProfile: updated,
        summary: result.summary,
      });
    }

    if (action === "RESET_DEMO_TIER_1") {
      const { workerProfileId } = body;
      const updated = await prisma.workerProfile.update({
        where: { id: workerProfileId },
        data: {
          vettingTier: "TIER_1_BROWSE_ONLY",
          popiaConsentSigned: false,
          popiaConsentAt: null,
          huruFeePaid: false,
          huruVoucherCode: null,
          sapsStatus: "UNSTARTED",
          sapsCertificateRef: null,
          sapsClearedAt: null,
        },
      });
      return NextResponse.json({ workerProfile: updated });
    }

    if (action === "SUBMIT_COC_CERT") {
      const { workerProfileId, bodyName, registrationNumber, tradeCategory } = body;
      if (!workerProfileId || !bodyName || !registrationNumber || !tradeCategory) {
        return NextResponse.json(
          { error: "Regulatory body, registration number, and trade are required." },
          { status: 400 }
        );
      }

      const cert = await prisma.tradeCertification.create({
        data: {
          workerProfileId,
          body: String(bodyName),
          registrationNumber: String(registrationNumber).trim(),
          tradeCategory: String(tradeCategory),
          status: "PENDING",
          notes: "Submitted via worker portal — awaiting Admin registry verification.",
        },
      });

      return NextResponse.json({ certification: cert }, { status: 201 });
    }

    if (action === "PAYOUT_WALLET") {
      const { workerProfileId } = body;
      const profile = await prisma.workerProfile.findUnique({
        where: { id: workerProfileId },
      });

      if (!profile || profile.walletBalanceZar <= 0) {
        return NextResponse.json(
          { error: "No available wallet balance to pay out." },
          { status: 400 }
        );
      }

      const amount = profile.walletBalanceZar;
      const updated = await prisma.workerProfile.update({
        where: { id: workerProfileId },
        data: {
          walletBalanceZar: 0,
          totalPaidOutZar: { increment: amount },
        },
      });

      return NextResponse.json({
        workerProfile: updated,
        paidOutZar: amount,
      });
    }

    return NextResponse.json({ error: "Unknown vetting action." }, { status: 400 });
  } catch (err) {
    console.error("Worker vetting API error:", err);
    return NextResponse.json(
      { error: "Failed to process worker onboarding request." },
      { status: 500 }
    );
  }
}
