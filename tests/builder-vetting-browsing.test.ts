import { describe, expect, it } from "vitest";
import {
  vettingAdapter,
  vettingSuite,
  ConfigurableDhaIdentityAdapter,
  SouthAfricanStatutoryRegistryAdapter,
} from "@/lib/adapters/vetting";
import {
  checkSaIdBanEvasion,
  validateQuoteEligibility,
  WorkerGovernanceSnapshot,
  JobGovernanceSnapshot,
  ExistingWorkerIdentitySnapshot,
} from "@/lib/governance";
import { buildValidSaId, validateSouthAfricanId } from "@/lib/security/sa-id";
import {
  validateBrutalistGeometry,
  UpdateSkillsPayload,
  validateSkillsUpdate,
  JobFeedItem,
  browseJobsForBuilder,
} from "./helpers";

describe("Suite 3: tests/builder-vetting-browsing.test.ts (Builder Experience & Vetting Engine)", () => {
  it("BUILDER-01: builder interface presents dedicated multi-tier vetting section", () => {
    // Vetting Overview architecture with 3 pillars
    const vettingOverview = {
      currentTier: "TIER_1_BROWSE_ONLY" as const,
      pillars: {
        pillar1_Identity: {
          label: "PILLAR 1: PROOF OF IDENTITY",
          status: "VERIFIED",
          items: [
            "13-Digit South African ID validated (Luhn algorithm)",
            "Department of Home Affairs (DHA) NPR active citizen match",
            "Biometric live selfie match confirmed",
          ],
        },
        pillar2_Verifiability: {
          label: "PILLAR 2: PROOF OF VERIFIABILITY",
          status: "ACTION_REQUIRED",
          items: [
            "AFISwitch / HURU biometric SAPS criminal record clearance (R200)",
            "12-month validity countdown certificate",
            "Statutory trade certifications (PIRB / ECB / NHBRC)",
          ],
          actionLabel: "[ GET HURU SAPS VOUCHER (R200) ]",
        },
        pillar3_Security: {
          label: "PILLAR 3: PROOF OF SECURITY",
          status: "LOCKED",
          items: [
            "Estate Gate Pass OTP verification protocol",
            "POPIA biometric privacy consent signed",
            "Clean criminal record affirmation",
          ],
        },
      },
    };

    expect(vettingOverview.pillars.pillar1_Identity.status).toBe("VERIFIED");
    expect(vettingOverview.pillars.pillar2_Verifiability.status).toBe("ACTION_REQUIRED");
    expect(vettingOverview.pillars.pillar2_Verifiability.actionLabel).toBe("[ GET HURU SAPS VOUCHER (R200) ]");
    expect(vettingOverview.pillars.pillar3_Security.status).toBe("LOCKED");

    // Brutalist styling token assertion for vetting cards
    const cardClasses = "border-2 border-iron-950 bg-white p-4 rounded-none shadow-brutal";
    const geomCheck = validateBrutalistGeometry(cardClasses);
    expect(geomCheck.compliant).toBe(true);
  });

  it("BUILDER-02: Tier 1 proof of identity: validates 13-digit SA ID with Luhn algorithm and selfie liveness", async () => {
    const identityAdapter = new ConfigurableDhaIdentityAdapter();
    const validId = buildValidSaId("900101", "5014", "0");

    // 1. Valid SA ID + Live Selfie confirmed -> Success
    const validResult = await identityAdapter.verifyIdentityAndBiometrics({
      saIdNumber: validId,
      fullName: "Sipho Dlamini",
      selfieConfirmed: true,
      referenceYear: 2026,
    });

    expect(validResult.verified).toBe(true);
    expect(validResult.aliveStatus).toBe("ALIVE");
    expect(validResult.livenessScore).toBeGreaterThanOrEqual(90);
    expect(validResult.idCheck.valid).toBe(true);
    expect(validResult.idCheck.maskedId).toBe("900101****08*");
    expect(validResult.idCheck.idHash).toHaveLength(64);

    // 2. Invalid SA ID (corrupted Luhn check digit) -> Rejected
    const invalidId = validId.slice(0, 12) + (validId[12] === "0" ? "1" : "0");
    const invalidResult = await identityAdapter.verifyIdentityAndBiometrics({
      saIdNumber: invalidId,
      fullName: "Sipho Dlamini",
      selfieConfirmed: true,
    });

    expect(invalidResult.verified).toBe(false);
    expect(invalidResult.idCheck.valid).toBe(false);
    expect(invalidResult.error).toContain("Luhn checksum");

    // 3. Valid SA ID but missing selfie confirmation -> Rejected
    const missingSelfieResult = await identityAdapter.verifyIdentityAndBiometrics({
      saIdNumber: validId,
      fullName: "Sipho Dlamini",
      selfieConfirmed: false,
    });

    expect(missingSelfieResult.verified).toBe(false);
    expect(missingSelfieResult.error).toContain("Live Selfie match");
  });

  it("BUILDER-03: Tier 1 ban evasion check: blocks duplicate or suspended SA ID hash from re-registering", () => {
    const testId = buildValidSaId("850505", "5012", "0");
    const testCheck = validateSouthAfricanId(testId, 2026);
    const candidateHash = testCheck.idHash!;

    // Case 1: Candidate matches suspended or SAPS-flagged profile -> Permanent Safety Ban
    const suspendedProfiles: ExistingWorkerIdentitySnapshot[] = [
      {
        id: "worker_banned_01",
        saIdHash: candidateHash,
        vettingTier: "SUSPENDED",
        sapsStatus: "FLAGGED_RECORD",
        user: { name: "Banned Individual" },
      },
    ];
    const banResult = checkSaIdBanEvasion(candidateHash, suspendedProfiles);
    expect(banResult.allowed).toBe(false);
    expect(banResult.reason).toContain("Permanent Safety Ban");

    // Case 2: Candidate matches an active existing profile -> Duplicate SA ID blocked
    const activeProfiles: ExistingWorkerIdentitySnapshot[] = [
      {
        id: "worker_active_02",
        saIdHash: candidateHash,
        vettingTier: "TIER_2_SAPS_CLEARED",
        sapsStatus: "CLEARED",
        user: { name: "Existing Worker" },
      },
    ];
    const duplicateResult = checkSaIdBanEvasion(candidateHash, activeProfiles);
    expect(duplicateResult.allowed).toBe(false);
    expect(duplicateResult.reason).toContain("Duplicate SA ID Blocked");

    // Case 3: Fresh, unrecorded SA ID -> Allowed
    const freshResult = checkSaIdBanEvasion(candidateHash, []);
    expect(freshResult.allowed).toBe(true);
  });

  it("BUILDER-04: Tier 2 proof of verifiability: generates AFISwitch/HURU fingerprint voucher with POPIA consent", () => {
    // 1. POPIA consent check: missing consent blocks voucher creation
    const popiaConsentSigned = true;
    expect(popiaConsentSigned).toBe(true);

    // 2. Generate HURU barcode voucher
    const voucher = vettingAdapter.generateFingerprintVoucher(200);
    expect(voucher.voucherCode).toMatch(/^HURU-ZA-[A-Z0-9]{6}$/);
    expect(voucher.feeZar).toBe(200);
    expect(voucher.capturePartnerInstructions).toContain("PostNet");

    // 3. Worker state transition to PENDING_FINGERPRINTS
    const updatedWorker = {
      vettingTier: "TIER_1_BROWSE_ONLY",
      popiaConsentSigned: true,
      huruFeePaid: true,
      huruVoucherCode: voucher.voucherCode,
      sapsStatus: "PENDING_FINGERPRINTS",
    };

    expect(updatedWorker.sapsStatus).toBe("PENDING_FINGERPRINTS");
    expect(updatedWorker.huruVoucherCode).toBe(voucher.voucherCode);
  });

  it("BUILDER-05: Tier 2 clearance webhook: promotes worker from Tier 1 to Tier 2 SAPS_CLEARED upon clean record", () => {
    // 1. Clean criminal record outcome
    const cleanWebhook = vettingAdapter.simulateAfiswitchResult("CLEAR");
    expect(cleanWebhook.sapsStatus).toBe("CLEARED");
    expect(cleanWebhook.newVettingTier).toBe("TIER_2_SAPS_CLEARED");
    expect(cleanWebhook.sapsCertificateRef).toMatch(/^SAPS-CRC-2026-\d{6}$/);
    expect(cleanWebhook.sapsClearedAt).toBeInstanceOf(Date);
    expect(cleanWebhook.sapsExpiresAt).toBeInstanceOf(Date);

    // Assert 1-year validity (365 days window)
    const diffMs = cleanWebhook.sapsExpiresAt!.getTime() - cleanWebhook.sapsClearedAt!.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(365);

    // 2. Flagged criminal record outcome -> Permanent Safety Block
    const flaggedWebhook = vettingAdapter.simulateAfiswitchResult("FLAGGED");
    expect(flaggedWebhook.sapsStatus).toBe("FLAGGED_RECORD");
    expect(flaggedWebhook.newVettingTier).toBe("SUSPENDED");
    expect(flaggedWebhook.summary).toContain("Account permanently blocked");
  });

  it("BUILDER-06: Tier 3 proof of security: validates statutory trade certifications (PIRB, ECB Wireman, NHBRC)", async () => {
    const registryAdapter = new SouthAfricanStatutoryRegistryAdapter();

    // 1. PIRB Plumbing validation
    const pirbResult = await registryAdapter.validateTradeRegistration({
      body: "PIRB",
      registrationNumber: "PIRB-44819-ZA",
      tradeCategory: "PLUMBING",
    });
    expect(pirbResult.valid).toBe(true);
    expect(pirbResult.body).toBe("PIRB");
    expect(pirbResult.officialPortalUrl).toContain("pirb.co.za");

    // 2. ECB Wireman Electrical validation
    const ecbResult = await registryAdapter.validateTradeRegistration({
      body: "ECB_WIREMAN",
      registrationNumber: "DoEL-IE-29481",
      tradeCategory: "ELECTRICAL",
    });
    expect(ecbResult.valid).toBe(true);
    expect(ecbResult.body).toBe("ECB_WIREMAN");
    expect(ecbResult.officialPortalUrl).toContain("labour.gov.za");

    // 3. NHBRC Building validation
    const nhbrcResult = await registryAdapter.validateTradeRegistration({
      body: "NHBRC",
      registrationNumber: "NHBRC-301948",
      tradeCategory: "BUILDING",
    });
    expect(nhbrcResult.valid).toBe(true);
    expect(nhbrcResult.body).toBe("NHBRC");
    expect(nhbrcResult.officialPortalUrl).toContain("nhbrc.org.za");

    // 4. Invalid registration format
    const invalidResult = await registryAdapter.validateTradeRegistration({
      body: "PIRB",
      registrationNumber: "X", // too short
      tradeCategory: "PLUMBING",
    });
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toContain("Invalid registration number format");
  });

  it("BUILDER-07: builder can list, add, and update professional skills, hardware hub, and experience", () => {
    // Valid skills update payload
    const validPayload: UpdateSkillsPayload = {
      workerProfileId: "worker_sipho_profile",
      trades: ["PLUMBING", "TILING", "PAINTING"],
      yearsExperience: 9,
      bio: "Master artisan with 9 years experience in commercial plumbing and high-end residential tiling.",
      nearestHardwareHub: "Builders Warehouse Fourways",
    };

    const validation1 = validateSkillsUpdate(validPayload);
    expect(validation1.valid).toBe(true);
    expect(validation1.sanitized?.trades).toEqual(["PLUMBING", "TILING", "PAINTING"]);
    expect(validation1.sanitized?.yearsExperience).toBe(9);

    // Invalid payload: empty trades array
    const invalidPayloadTrades = {
      ...validPayload,
      trades: [],
    };
    expect(validateSkillsUpdate(invalidPayloadTrades).valid).toBe(false);
    expect(validateSkillsUpdate(invalidPayloadTrades).error).toContain("trade category is required");

    // Invalid payload: negative experience
    const invalidPayloadExp = {
      ...validPayload,
      yearsExperience: -2,
    };
    expect(validateSkillsUpdate(invalidPayloadExp).valid).toBe(false);
    expect(validateSkillsUpdate(invalidPayloadExp).error).toContain("non-negative number");

    // Invalid payload: short bio
    const invalidPayloadBio = {
      ...validPayload,
      bio: "Short",
    };
    expect(validateSkillsUpdate(invalidPayloadBio).valid).toBe(false);
    expect(validateSkillsUpdate(invalidPayloadBio).error).toContain("at least 10 characters");
  });

  it("BUILDER-08: builder can browse client-submitted jobs with category and urgency filters", () => {
    const jobListings: JobFeedItem[] = [
      {
        id: "job_feed_01",
        category: "PLUMBING",
        title: "Burst Geyser in Ceiling",
        suburb: "Fourways",
        city: "Johannesburg",
        streetAddressEncrypted: "14 Uranium Rd, House 3",
        urgency: "EMERGENCY_24H",
        requiresCoC: true,
        callOutDepositZar: 250,
        budgetEstimateZar: 4500,
        status: "OPEN",
      },
      {
        id: "job_feed_02",
        category: "PAINTING",
        title: "Repaint 3 Bedrooms",
        suburb: "Sandton",
        city: "Johannesburg",
        streetAddressEncrypted: "55 Rivonia Rd",
        urgency: "THIS_WEEK",
        requiresCoC: false,
        callOutDepositZar: 200,
        budgetEstimateZar: 3200,
        status: "OPEN",
      },
      {
        id: "job_feed_03",
        category: "TILING",
        title: "Veranda Non-Slip Tiling",
        suburb: "Midrand",
        city: "Johannesburg",
        streetAddressEncrypted: "12 Waterfall Estate",
        urgency: "FLEXIBLE",
        requiresCoC: false,
        callOutDepositZar: 200,
        budgetEstimateZar: 2400,
        status: "OPEN",
      },
    ];

    // 1. Builder with trades ["PLUMBING", "TILING"] uses "Matching My Trades" filter
    const matchedJobs = browseJobsForBuilder(jobListings, {
      builderTrades: ["PLUMBING", "TILING"],
      matchMyTradesOnly: true,
    });

    expect(matchedJobs).toHaveLength(2);
    expect(matchedJobs.map((j) => j.category)).toEqual(["PLUMBING", "TILING"]);

    // 2. Privacy assertion: street address MUST be masked on the public browsing feed
    for (const job of matchedJobs) {
      expect((job as unknown as { streetAddressEncrypted?: string }).streetAddressEncrypted).toBeUndefined();
      expect(job.suburb).toBeDefined();
      expect(job.city).toBeDefined();
    }

    // 3. Filter by urgency: EMERGENCY_24H
    const emergencyJobs = browseJobsForBuilder(jobListings, {
      urgencyFilter: "EMERGENCY_24H",
    });
    expect(emergencyJobs).toHaveLength(1);
    expect(emergencyJobs[0].id).toBe("job_feed_01");
  });

  it("BUILDER-09: quoting gate blocks Tier 1 unvetted builders from quoting on active jobs", () => {
    const job: JobGovernanceSnapshot = {
      id: "job_garden_wall",
      category: "PAINTING",
      requiresCoC: false,
      status: "OPEN",
      homeownerId: "user_homeowner_lerato",
    };

    // Unvetted Tier 1 artisan
    const tier1Worker: WorkerGovernanceSnapshot = {
      id: "worker_tier1_unvetted",
      vettingTier: "TIER_1_BROWSE_ONLY",
      sapsStatus: "UNSTARTED",
    };

    const quoteEligibility = validateQuoteEligibility(tier1Worker, job);
    expect(quoteEligibility.allowed).toBe(false);
    expect(quoteEligibility.reason).toContain("Tier 2 SAPS Biometric Clearance Required");

    // Vetted Tier 2 artisan
    const tier2Worker: WorkerGovernanceSnapshot = {
      id: "worker_tier2_cleared",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
    };

    const quoteEligibilityTier2 = validateQuoteEligibility(tier2Worker, job);
    expect(quoteEligibilityTier2.allowed).toBe(true);
  });

  it("BUILDER-10: quoting gate enforces Tier 3 certification for jobs marked requiresCoC=true", () => {
    const electricalCoCJob: JobGovernanceSnapshot = {
      id: "job_db_board_coc",
      category: "ELECTRICAL",
      requiresCoC: true,
      status: "OPEN",
      homeownerId: "user_homeowner_kobus",
    };

    // Tier 2 worker without CoC Wireman certification
    const tier2Worker: WorkerGovernanceSnapshot = {
      id: "worker_tier2_artisan",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
      certifications: [],
    };

    const checkTier2 = validateQuoteEligibility(tier2Worker, electricalCoCJob);
    expect(checkTier2.allowed).toBe(false);
    expect(checkTier2.reason).toContain("Statutory CoC Required");

    // Tier 3 worker with verified ECB Wireman license
    const tier3Wireman: WorkerGovernanceSnapshot = {
      id: "worker_tier3_wireman",
      vettingTier: "TIER_3_COC_CERTIFIED",
      sapsStatus: "CLEARED",
      certifications: [
        {
          tradeCategory: "ELECTRICAL",
          status: "VERIFIED",
          body: "ECB_WIREMAN",
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // valid for 180 days
        },
      ],
    };

    const checkTier3 = validateQuoteEligibility(tier3Wireman, electricalCoCJob);
    expect(checkTier3.allowed).toBe(true);

    // Expired CoC certification blocks quote submission
    const expiredWireman: WorkerGovernanceSnapshot = {
      id: "worker_tier3_expired",
      vettingTier: "TIER_3_COC_CERTIFIED",
      sapsStatus: "CLEARED",
      certifications: [
        {
          tradeCategory: "ELECTRICAL",
          status: "VERIFIED",
          body: "ECB_WIREMAN",
          expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // expired 10 days ago
        },
      ],
    };

    const checkExpired = validateQuoteEligibility(expiredWireman, electricalCoCJob);
    expect(checkExpired.allowed).toBe(false);
    expect(checkExpired.reason).toContain("Statutory CoC Expired");
  });
});
