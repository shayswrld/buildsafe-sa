import { PrismaClient } from "@prisma/client";
import { buildValidSaId, validateSouthAfricanId } from "../src/lib/security/sa-id";
import { computeEscrowSplit } from "../src/lib/adapters/escrow";
import { hashGateCode } from "../src/lib/security/gate-otp";

const prisma = new PrismaClient();

function mustValidateId(yyMmDd: string, seq: string) {
  const raw = buildValidSaId(yyMmDd, seq, "0");
  const res = validateSouthAfricanId(raw, 2026);
  if (!res.valid || !res.maskedId || !res.idHash) {
    throw new Error(`Seed SA ID failed: ${res.error}`);
  }
  return res;
}

async function main() {
  await prisma.review.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.gateCrewMember.deleteMany();
  await prisma.gateVisit.deleteMany();
  await prisma.escrowTransaction.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.job.deleteMany();
  await prisma.tradeCertification.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformConfig.deleteMany();

  await prisma.platformConfig.create({
    data: {
      id: "default",
      platformName: "BuildSafe SA",
      buyerTrustFeePct: 0.05,
      workerLabourCommissionPct: 0.08,
      repeatClientCommissionPct: 0.04,
      sapsVettingFeeZar: 200,
      defaultCallOutZar: 250,
    },
  });

  // 1. Admin & Homeowners
  await prisma.user.create({
    data: {
      id: "user_admin_owner",
      name: "Platform Founder (Admin)",
      phone: "+27820000001",
      email: "founder@buildsafesa.co.za",
      role: "ADMIN",
      suburb: "Sandton",
      city: "Johannesburg",
      ratingAvg: 5.0,
      ratingCount: 0,
    },
  });

  const homeownerLerato = await prisma.user.create({
    data: {
      id: "user_homeowner_lerato",
      name: "Lerato Mokoena",
      phone: "+27825551020",
      email: "lerato.m@example.co.za",
      role: "HOMEOWNER",
      suburb: "Fourways",
      city: "Johannesburg",
      avatarUrl: "LM",
      ratingAvg: 4.95,
      ratingCount: 4,
    },
  });

  const homeownerPieter = await prisma.user.create({
    data: {
      id: "user_homeowner_pieter",
      name: "Pieter van der Merwe",
      phone: "+27834449012",
      email: "pieter.vdm@example.co.za",
      role: "HOMEOWNER",
      suburb: "Centurion",
      city: "Pretoria",
      avatarUrl: "PV",
      ratingAvg: 4.85,
      ratingCount: 3,
    },
  });

  // 2. Workers across Tiers 1, 2, and 3
  const siphoId = mustValidateId("860414", "5412");
  const userSipho = await prisma.user.create({
    data: {
      id: "user_worker_sipho",
      name: "Sipho Dlamini",
      phone: "+27723104481",
      role: "WORKER",
      suburb: "Cosmo City / Fourways",
      city: "Johannesburg",
      avatarUrl: "SD",
      ratingAvg: 4.95,
      ratingCount: 14,
      workerProfile: {
        create: {
          id: "wp_sipho",
          vettingTier: "TIER_3_COC_CERTIFIED",
          saIdMasked: siphoId.maskedId!,
          saIdHash: siphoId.idHash!,
          selfieVerified: true,
          selfieVerifiedAt: new Date("2026-08-10T09:00:00Z"),
          popiaConsentSigned: true,
          popiaConsentAt: new Date("2026-08-10T09:05:00Z"),
          huruVoucherCode: "HURU-ZA-88A10C",
          huruFeePaid: true,
          sapsStatus: "CLEARED",
          sapsCertificateRef: "SAPS-CRC-2026-841209",
          sapsClearedAt: new Date("2026-08-12T14:20:00Z"),
          tradesJson: JSON.stringify(["PLUMBING", "TILING"]),
          nearestHardwareHub: "Builders Warehouse Fourways (Johannesburg)",
          yearsExperience: 11,
          bio: "Licensed PIRB plumber & bathroom renovation tiler. Used to wait outside Builders Fourways—now 100% SAPS-cleared with verifiable geyser & bathroom references.",
          walletBalanceZar: 2640,
          totalPaidOutZar: 28450,
          completedJobsCount: 14,
          certifications: {
            create: [
              {
                body: "PIRB",
                registrationNumber: "PIRB-44819-ZA",
                tradeCategory: "PLUMBING",
                status: "VERIFIED",
                verifiedAt: new Date("2026-08-13T10:00:00Z"),
                notes: "Verified active Plumbing Industry Registration Board CoC issuer.",
              },
            ],
          },
        },
      },
    },
    include: { workerProfile: true },
  });

  const kabeloId = mustValidateId("910822", "5809");
  const userKabelo = await prisma.user.create({
    data: {
      id: "user_worker_kabelo",
      name: "Kabelo Ndlovu",
      phone: "+27768192204",
      role: "WORKER",
      suburb: "Roodepoort",
      city: "Johannesburg",
      avatarUrl: "KN",
      ratingAvg: 4.9,
      ratingCount: 9,
      workerProfile: {
        create: {
          id: "wp_kabelo",
          vettingTier: "TIER_2_SAPS_CLEARED",
          saIdMasked: kabeloId.maskedId!,
          saIdHash: kabeloId.idHash!,
          selfieVerified: true,
          selfieVerifiedAt: new Date("2026-09-01T08:30:00Z"),
          popiaConsentSigned: true,
          popiaConsentAt: new Date("2026-09-01T08:35:00Z"),
          huruVoucherCode: "HURU-ZA-41F92B",
          huruFeePaid: true,
          sapsStatus: "CLEARED",
          sapsCertificateRef: "SAPS-CRC-2026-592031",
          sapsClearedAt: new Date("2026-09-03T11:15:00Z"),
          tradesJson: JSON.stringify(["PAINTING", "WATERPROOFING", "TILING"]),
          nearestHardwareHub: "Builders Warehouse Strubensvalley (Roodepoort)",
          yearsExperience: 8,
          bio: "Specialist in damp wall preparation, crack filling, torch-on waterproofing & neat interior/exterior Dulux/Plascon finishes.",
          walletBalanceZar: 2306,
          totalPaidOutZar: 16200,
          completedJobsCount: 9,
        },
      },
    },
    include: { workerProfile: true },
  });

  const giftId = mustValidateId("950219", "5234");
  await prisma.user.create({
    data: {
      id: "user_worker_gift",
      name: "Gift Mthembu",
      phone: "+27639017732",
      role: "WORKER",
      suburb: "Diepsloot / Fourways",
      city: "Johannesburg",
      avatarUrl: "GM",
      ratingAvg: 4.85,
      ratingCount: 6,
      workerProfile: {
        create: {
          id: "wp_gift",
          vettingTier: "TIER_2_SAPS_CLEARED",
          saIdMasked: giftId.maskedId!,
          saIdHash: giftId.idHash!,
          selfieVerified: true,
          selfieVerifiedAt: new Date("2026-09-14T10:00:00Z"),
          popiaConsentSigned: true,
          popiaConsentAt: new Date("2026-09-14T10:04:00Z"),
          huruVoucherCode: "HURU-ZA-77C03E",
          huruFeePaid: true,
          sapsStatus: "CLEARED",
          sapsCertificateRef: "SAPS-CRC-2026-710482",
          sapsClearedAt: new Date("2026-09-16T15:00:00Z"),
          tradesJson: JSON.stringify(["BUILDING", "PAINTING", "TILING"]),
          nearestHardwareHub: "Builders Warehouse Fourways (Johannesburg)",
          yearsExperience: 5,
          bio: "Bricklaying, plastering, screed levelling & vetted site assistant available for solo plaster jobs or multi-artisan renovations.",
          walletBalanceZar: 920,
          totalPaidOutZar: 8400,
          completedJobsCount: 6,
        },
      },
    },
  });

  const aneleId = mustValidateId("881105", "0418");
  await prisma.user.create({
    data: {
      id: "user_worker_anele",
      name: "Anele Khumalo",
      phone: "+27842108843",
      role: "WORKER",
      suburb: "Centurion",
      city: "Pretoria",
      avatarUrl: "AK",
      ratingAvg: 5.0,
      ratingCount: 11,
      workerProfile: {
        create: {
          id: "wp_anele",
          vettingTier: "TIER_3_COC_CERTIFIED",
          saIdMasked: aneleId.maskedId!,
          saIdHash: aneleId.idHash!,
          selfieVerified: true,
          selfieVerifiedAt: new Date("2026-07-20T09:00:00Z"),
          popiaConsentSigned: true,
          popiaConsentAt: new Date("2026-07-20T09:05:00Z"),
          huruVoucherCode: "HURU-ZA-19D84A",
          huruFeePaid: true,
          sapsStatus: "CLEARED",
          sapsCertificateRef: "SAPS-CRC-2026-339104",
          sapsClearedAt: new Date("2026-07-22T12:00:00Z"),
          tradesJson: JSON.stringify(["ELECTRICAL"]),
          nearestHardwareHub: "Builders Warehouse Centurion (Pretoria)",
          yearsExperience: 9,
          bio: "Registered Installation Electrician (Wireman's License). DB board upgrades, earth leakage diagnostics, inverter/solar changeovers & statutory Electrical CoCs.",
          walletBalanceZar: 4100,
          totalPaidOutZar: 39200,
          completedJobsCount: 11,
          certifications: {
            create: [
              {
                body: "ECB_WIREMAN",
                registrationNumber: "DoEL-IE-29481",
                tradeCategory: "ELECTRICAL",
                status: "VERIFIED",
                verifiedAt: new Date("2026-07-23T11:30:00Z"),
                notes: "Verified Dept. of Employment & Labour Installation Electrician.",
              },
              {
                body: "SAQCC_GAS",
                registrationNumber: "SAQCC-LPG-8821",
                tradeCategory: "PLUMBING",
                status: "PENDING",
                notes: "Submitted gas hob compliance card — awaiting Admin review.",
              },
            ],
          },
        },
      },
    },
  });

  // Tier 1 New Worker (Free ID + Selfie done, can browse jobs, needs R200 SAPS check to quote!)
  const thaboId = mustValidateId("970612", "5119");
  await prisma.user.create({
    data: {
      id: "user_worker_thabo",
      name: "Thabo Mabaso",
      phone: "+27719983321",
      role: "WORKER",
      suburb: "Alexandra / Sandton",
      city: "Johannesburg",
      avatarUrl: "TM",
      ratingAvg: 5.0,
      ratingCount: 0,
      workerProfile: {
        create: {
          id: "wp_thabo",
          vettingTier: "TIER_1_BROWSE_ONLY",
          saIdMasked: thaboId.maskedId!,
          saIdHash: thaboId.idHash!,
          selfieVerified: true,
          selfieVerifiedAt: new Date("2026-10-31T16:10:00Z"),
          popiaConsentSigned: false,
          huruFeePaid: false,
          sapsStatus: "UNSTARTED",
          tradesJson: JSON.stringify(["PAINTING", "CARPENTRY"]),
          nearestHardwareHub: "Builders Warehouse Rivonia (Sandton)",
          yearsExperience: 6,
          bio: "Skilled interior painter & door/cupboard carpenter outside Builders Rivonia. Just joined BuildSafe SA—completing SAPS fingerprint clearance.",
          walletBalanceZar: 0,
          totalPaidOutZar: 0,
          completedJobsCount: 0,
        },
      },
    },
  });

  // 3. Job 1: Active Escrow-Funded Bathroom Renovation (Ready for Gate OTP Check-In & Milestone Release!)
  const calloutSplit = computeEscrowSplit({ labourZar: 250, materialsZar: 0 });
  const mainRenoSplit = computeEscrowSplit({ labourZar: 3200, materialsZar: 1850 });

  await prisma.job.create({
    data: {
      id: "job_bathroom_reno",
      homeownerId: homeownerLerato.id,
      selectedWorkerProfileId: "wp_sipho",
      title: "Guest Bathroom Retiling & Concealed Cistern Leak Repair",
      category: "PLUMBING",
      problemTagsJson: JSON.stringify([
        "Leaking pipe, tap or toilet cistern",
        "Bathroom / kitchen renovation plumbing",
      ]),
      description:
        "Concealed toilet cistern is seeping behind the wall tiles. Need the leak repaired properly, wall waterproofed, and 8m2 floor + splashback retiled with tiles I bought at Builders Fourways.",
      suburb: "Fourways",
      city: "Johannesburg",
      streetAddressEncrypted: "42 Cedar Creek Estate, Cedar Rd, Fourways",
      urgency: "THIS_WEEK",
      requiresCoC: false,
      callOutDepositZar: 250,
      budgetEstimateZar: 5200,
      status: "ESCROW_FUNDED",
      quotes: {
        create: [
          {
            id: "quote_sipho_reno",
            workerProfileId: "wp_sipho",
            labourAmountZar: 3200,
            materialsEstimateZar: 1850,
            estimatedDays: 2,
            scopeSummary:
              "Strip damaged wall tiles, replace concealed Geberit seal & copper feed, apply waterproof membrane, and lay 8m2 porcelain tiles. Bringing Gift Mthembu (SAPS-cleared assistant) for tile cutting & grouting.",
            proposedCrewIdsJson: JSON.stringify(["wp_gift"]),
            status: "ACCEPTED",
          },
        ],
      },
      milestones: {
        create: [
          {
            id: "ms_reno_callout",
            sequence: 1,
            kind: "CALL_OUT_DEPOSIT",
            title: "Site Inspection & Leak Assessment Deposit",
            description: "Credited toward project upon hiring; unlocks street address & Gate OTP.",
            labourAmountZar: 250,
            materialsAmountZar: 0,
            status: "RELEASED",
            escrowTransaction: {
              create: {
                paymentMethod: "OZOW_INSTANT_EFT",
                providerRef: "TS-ZA-401928",
                labourZar: calloutSplit.labourZar,
                materialsZar: 0,
                buyerTrustFeeZar: calloutSplit.buyerTrustFeeZar,
                grossBuyerPaidZar: calloutSplit.grossBuyerPaidZar,
                workerCommissionZar: calloutSplit.workerCommissionZar,
                platformTotalCutZar: calloutSplit.platformTotalCutZar,
                workerNetPayoutZar: calloutSplit.workerNetPayoutZar,
                status: "RELEASED",
                releasedAt: new Date("2026-10-30T15:00:00Z"),
              },
            },
          },
          {
            id: "ms_reno_main",
            sequence: 2,
            kind: "MAIN_WORK",
            title: "Cistern Repair, Waterproofing & 8m2 Bathroom Retiling",
            description:
              "R3,200 skilled labour + R1,850 Builders Warehouse adhesive, grout, copper fittings & membrane (0% commission on materials).",
            labourAmountZar: 3200,
            materialsAmountZar: 1850,
            materialReceiptRef: "BW-FOURWAYS-SLIP-99214",
            status: "HELD_IN_ESCROW",
            escrowTransaction: {
              create: {
                paymentMethod: "OZOW_INSTANT_EFT",
                providerRef: "TS-ZA-774810",
                labourZar: mainRenoSplit.labourZar,
                materialsZar: mainRenoSplit.materialsZar,
                buyerTrustFeeZar: mainRenoSplit.buyerTrustFeeZar,
                grossBuyerPaidZar: mainRenoSplit.grossBuyerPaidZar,
                workerCommissionZar: mainRenoSplit.workerCommissionZar,
                platformTotalCutZar: mainRenoSplit.platformTotalCutZar,
                workerNetPayoutZar: mainRenoSplit.workerNetPayoutZar,
                status: "HELD",
              },
            },
          },
        ],
      },
      gateVisits: {
        create: [
          {
            id: "gv_reno_day1",
            leadWorkerProfileId: "wp_sipho",
            checkInCode: "482915",
            checkInCodeHash: hashGateCode("482915"),
            checkOutCode: "910374",
            status: "AWAITING_ARRIVAL",
            crewMembers: {
              create: [
                {
                  workerProfileId: "wp_gift",
                  roleOnSite: "SAPS-Cleared Tile & Grout Assistant",
                  verifiedAtGate: false,
                },
              ],
            },
          },
        ],
      },
      messages: {
        create: [
          {
            senderId: homeownerLerato.id,
            body: "Hi Sipho, do you already have the Geberit seal or should we include it on the Builders Warehouse materials slip?",
            wasRedacted: false,
          },
          {
            senderId: userSipho.id,
            body: "Morning Lerato! I included the Geberit seal, TAL Goldstar adhesive, and waterproof membrane under the R1,850 materials slip. Also registered Gift Mthembu on the Gate Crew Pass so estate security & you can verify both of our SAPS badges.",
            wasRedacted: false,
          },
        ],
      },
    },
  });

  // 4. Job 2: Open Painting Renovation with 2 Incoming Quotes + Masked Chat Redaction Demo
  await prisma.job.create({
    data: {
      id: "job_exterior_paint",
      homeownerId: homeownerLerato.id,
      title: "Boundary Wall Damp Scraping & Exterior Repaint (40m)",
      category: "PAINTING",
      problemTagsJson: JSON.stringify([
        "Peeling damp wall scraping & crack filling",
        "Exterior house & boundary wall repaint",
      ]),
      description:
        "Street-facing boundary wall has rising damp blisters near the bottom. Need bubbling paint scraped back to plaster, damp-seal primer applied, cracks filled, and two coats of grey exterior paint.",
      suburb: "Fourways",
      city: "Johannesburg",
      streetAddressEncrypted: "42 Cedar Creek Estate, Cedar Rd, Fourways",
      urgency: "FLEXIBLE_RENOVATION",
      requiresCoC: false,
      callOutDepositZar: 200,
      budgetEstimateZar: 4000,
      status: "QUOTED",
      quotes: {
        create: [
          {
            id: "quote_kabelo_paint",
            workerProfileId: "wp_kabelo",
            labourAmountZar: 2400,
            materialsEstimateZar: 1450,
            estimatedDays: 2,
            scopeSummary:
              "Wire-brush & scrape all damp blisters, apply Plascon Dampseal coat, Polyfilla exterior crack repair, and 2 coats Weatherguard. Full Builders Strubensvalley till slip provided.",
            proposedCrewIdsJson: JSON.stringify([]),
            status: "PENDING",
          },
          {
            id: "quote_gift_paint",
            workerProfileId: "wp_gift",
            labourAmountZar: 2100,
            materialsEstimateZar: 1450,
            estimatedDays: 3,
            scopeSummary:
              "Scrape loose plaster, patch cement plaster where hollow, prime and paint 2 coats. Neat drop-sheet cleanup daily.",
            proposedCrewIdsJson: JSON.stringify([]),
            status: "PENDING",
          },
        ],
      },
      messages: {
        create: [
          {
            senderId: homeownerLerato.id,
            body: "Hi Kabelo, before I book the call-out, can I send photos on [Hidden until Call-Out Escrow is funded]?",
            wasRedacted: true,
            redactionReasonsJson: JSON.stringify([
              "Phone or bank account number hidden prior to Escrow deposit",
            ]),
          },
          {
            senderId: userKabelo.id,
            body: "No problem Lerato! Once you lock the R200 Call-Out Deposit in Escrow (which comes off my final labour quote), our contact details & Gate OTP unlock automatically.",
            wasRedacted: false,
          },
        ],
      },
    },
  });

  // 5. Job 3: Open Statutory Electrical CoC Job (Tests Tier 3 CoC Enforcement!)
  await prisma.job.create({
    data: {
      id: "job_db_board_coc",
      homeownerId: homeownerPieter.id,
      title: "DB Board Earth Leakage Tripping + Backup Inverter CoC",
      category: "ELECTRICAL",
      problemTagsJson: JSON.stringify([
        "DB board tripping / earth leakage fault",
        "Inverter / solar backup changeover (CoC)",
      ]),
      description:
        "Main earth leakage trips whenever the geyser and kitchen kettle run together, and our insurer needs an official Electrical Certificate of Compliance (CoC) for our 5kVA backup inverter.",
      suburb: "Centurion",
      city: "Pretoria",
      streetAddressEncrypted: "18 Irene View Rd, Centurion",
      urgency: "EMERGENCY_TODAY",
      requiresCoC: true,
      callOutDepositZar: 300,
      budgetEstimateZar: 2800,
      status: "OPEN",
    },
  });

  // 6. Job 4: Completed Job with Released Revenue Ledger & Verified Two-Way Ratings
  const completedSplit = computeEscrowSplit({ labourZar: 2000, materialsZar: 800 });
  await prisma.job.create({
    data: {
      id: "job_completed_paint",
      homeownerId: homeownerLerato.id,
      selectedWorkerProfileId: "wp_kabelo",
      title: "2-Bedroom Interior Repaint & Ceiling Cornice Repair",
      category: "PAINTING",
      problemTagsJson: JSON.stringify(["Paint interior bedrooms / living room"]),
      description:
        "Repainted two bedrooms in washable matt sheen and repaired cracked ceiling cornices.",
      suburb: "Fourways",
      city: "Johannesburg",
      streetAddressEncrypted: "42 Cedar Creek Estate, Cedar Rd, Fourways",
      urgency: "THIS_WEEK",
      requiresCoC: false,
      callOutDepositZar: 200,
      budgetEstimateZar: 2800,
      status: "COMPLETED",
      quotes: {
        create: [
          {
            workerProfileId: "wp_kabelo",
            labourAmountZar: 2000,
            materialsEstimateZar: 800,
            estimatedDays: 2,
            scopeSummary: "2 bedrooms full prep, cornice seal & 2 coats washable paint.",
            status: "ACCEPTED",
          },
        ],
      },
      milestones: {
        create: [
          {
            sequence: 1,
            kind: "MAIN_WORK",
            title: "Complete 2-Bedroom Prep, Cornices & 2 Coats",
            description: "R2,000 labour + R800 Builders Warehouse paint & drop sheets.",
            labourAmountZar: 2000,
            materialsAmountZar: 800,
            materialReceiptRef: "BW-STRUBEN-SLIP-74102",
            status: "RELEASED",
            escrowTransaction: {
              create: {
                paymentMethod: "CARD_3DS",
                providerRef: "TS-ZA-319044",
                labourZar: completedSplit.labourZar,
                materialsZar: completedSplit.materialsZar,
                buyerTrustFeeZar: completedSplit.buyerTrustFeeZar,
                grossBuyerPaidZar: completedSplit.grossBuyerPaidZar,
                workerCommissionZar: completedSplit.workerCommissionZar,
                platformTotalCutZar: completedSplit.platformTotalCutZar,
                workerNetPayoutZar: completedSplit.workerNetPayoutZar,
                status: "RELEASED",
                releasedAt: new Date("2026-10-20T17:15:00Z"),
              },
            },
          },
        ],
      },
      gateVisits: {
        create: [
          {
            leadWorkerProfileId: "wp_kabelo",
            checkInCode: "620194",
            checkInCodeHash: hashGateCode("620194"),
            checkOutCode: "118520",
            status: "CHECKED_OUT",
            faceMatchConfirmed: true,
            crewMatchConfirmed: true,
            arrivedAt: new Date("2026-10-19T08:02:00Z"),
            departedAt: new Date("2026-10-20T16:45:00Z"),
          },
        ],
      },
      reviews: {
        create: [
          {
            reviewerId: homeownerLerato.id,
            revieweeId: userKabelo.id,
            direction: "HOMEOWNER_TO_WORKER",
            overallRating: 5,
            qualityOrClarityScore: 5,
            punctualityOrPaymentScore: 5,
            safetyRespectScore: 5,
            comment:
              "Kabelo arrived on time, matched his SAPS photo badge at our gate, covered all furniture spotless, and uploaded the exact Builders Warehouse slip. Never hiring off the roadside without BuildSafe again!",
          },
          {
            reviewerId: userKabelo.id,
            revieweeId: homeownerLerato.id,
            direction: "WORKER_TO_HOMEOWNER",
            overallRating: 5,
            qualityOrClarityScore: 5,
            punctualityOrPaymentScore: 5,
            safetyRespectScore: 5,
            comment:
              "Lerato had the rooms cleared before 8am, treated me with great respect, and released my R2,640 TradeSafe payout 10 minutes after we inspected the walls.",
          },
        ],
      },
    },
  });

  console.log("Seeded BuildSafe SA database successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
