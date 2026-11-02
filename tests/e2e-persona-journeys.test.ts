import { describe, expect, it } from "vitest";
import { computeEscrowSplit } from "@/lib/adapters/escrow";
import {
  vettingAdapter,
  vettingSuite,
  ConfigurableDhaIdentityAdapter,
  SouthAfricanStatutoryRegistryAdapter,
} from "@/lib/adapters/vetting";
import {
  validateQuoteEligibility,
  validateGateArrivalManifest,
  validateReviewEligibility,
  WorkerGovernanceSnapshot,
  JobGovernanceSnapshot,
} from "@/lib/governance";
import { generateGateOtpPair, verifyGateCheckInCode } from "@/lib/security/gate-otp";
import { buildValidSaId, validateSouthAfricanId } from "@/lib/security/sa-id";
import { TRADE_CATEGORIES, DEFAULT_PLATFORM_CONFIG } from "@/lib/config";
import {
  getDefaultWorkspaceTab,
  validateWizardStepTransition,
  createInitialWizardState,
  MockPersonaSessionManager,
  calculateJobAffordability,
  filterClientJobs,
  validateSkillsUpdate,
  browseJobsForBuilder,
} from "./helpers";

describe("Suite 4: tests/e2e-persona-journeys.test.ts (Real-World Multi-Role Workflows)", () => {
  it("E2E-P1: Dual-Role Full Lifecycle Journey: Client Renovation Posting -> Toggle to Builder -> Skills Update -> Job Browsing -> Toggle to Client", () => {
    // -------------------------------------------------------------
    // Step 1: User signs in with dual role
    // -------------------------------------------------------------
    const session = new MockPersonaSessionManager();
    const loginRes = session.login("user_dual_thabo");
    expect(loginRes.success).toBe(true);
    expect(session.isDualRole).toBe(true);
    expect(session.activeRole).toBe("CLIENT");
    expect(session.getNavigationShellBadge().badgeLabel).toBe("[ CLIENT VIEW ]");

    // -------------------------------------------------------------
    // Step 2: Posts bathroom renovation job as Client
    // -------------------------------------------------------------
    const clientAffordability = calculateJobAffordability({
      tradeCategorySlug: "PLUMBING",
      labourEstimateZar: 4500,
      materialsEstimateZar: 1800,
    });
    expect(clientAffordability.callOutDepositZar).toBe(250);
    expect(clientAffordability.buyerTrustFeeZar).toBe(225); // 5% of R4,500
    expect(clientAffordability.grossClientCommitmentZar).toBe(6525); // 4500 + 1800 + 225

    const postedJob = {
      id: "job_thabo_bath_01",
      homeownerId: session.currentUser!.id,
      title: "Master Ensuite Bathroom Renovation & Tiling",
      category: "PLUMBING",
      status: "OPEN" as const,
      urgency: "THIS_WEEK" as const,
      requiresCoC: false,
      callOutDepositZar: clientAffordability.callOutDepositZar,
      budgetEstimateZar: clientAffordability.grossClientCommitmentZar,
      createdAt: new Date().toISOString(),
    };

    expect(postedJob.homeownerId).toBe("user_dual_thabo");
    expect(getDefaultWorkspaceTab(postedJob.status)).toBe("quotes");

    // -------------------------------------------------------------
    // Step 3: Toggles perspective to Builder
    // -------------------------------------------------------------
    const toggleToBuilder = session.toggleRole();
    expect(toggleToBuilder.success).toBe(true);
    expect(session.activeRole).toBe("BUILDER");
    expect(session.getNavigationShellBadge().badgeLabel).toBe("[ BUILDER VIEW ]");
    expect(session.currentUser?.id).toBe("user_dual_thabo"); // Account invariant

    // -------------------------------------------------------------
    // Step 4: Updates builder profile skills & verifies wallet
    // -------------------------------------------------------------
    const skillsUpdate = validateSkillsUpdate({
      workerProfileId: session.currentUser!.workerProfile!.id,
      trades: ["PLUMBING", "TILING", "BUILDING"],
      yearsExperience: 10,
      bio: "Master contractor with 10 years experience in complete bathroom fit-outs, tiling, and waterproofing.",
      nearestHardwareHub: "Builders Express Midrand",
    });
    expect(skillsUpdate.valid).toBe(true);
    expect(skillsUpdate.sanitized?.trades).toContain("TILING");
    expect(session.currentUser?.workerProfile?.walletBalanceZar).toBe(9500);

    // -------------------------------------------------------------
    // Step 5: Browses client jobs with "Matching My Trades" filter
    // -------------------------------------------------------------
    const clientJobPool = [
      {
        id: "job_client_901",
        category: "TILING",
        title: "Kitchen splashback and floor tiling",
        suburb: "Midrand",
        city: "Johannesburg",
        streetAddressEncrypted: "88 Waterfall Estate",
        urgency: "THIS_WEEK" as const,
        requiresCoC: false,
        callOutDepositZar: 200,
        budgetEstimateZar: 3400,
        status: "OPEN" as const,
      },
      {
        id: "job_client_902",
        category: "ELECTRICAL",
        title: "Inverter DB board changeover",
        suburb: "Centurion",
        city: "Pretoria",
        streetAddressEncrypted: "12 Southdowns Way",
        urgency: "EMERGENCY_24H" as const,
        requiresCoC: true,
        callOutDepositZar: 300,
        budgetEstimateZar: 5500,
        status: "OPEN" as const,
      },
    ];

    const builderFeed = browseJobsForBuilder(clientJobPool, {
      builderTrades: skillsUpdate.sanitized!.trades,
      matchMyTradesOnly: true,
    });
    expect(builderFeed).toHaveLength(1);
    expect(builderFeed[0].id).toBe("job_client_901");
    expect((builderFeed[0] as unknown as { streetAddressEncrypted?: string }).streetAddressEncrypted).toBeUndefined();

    // -------------------------------------------------------------
    // Step 6: Toggles back to Client view
    // -------------------------------------------------------------
    const toggleToClient = session.toggleRole();
    expect(toggleToClient.success).toBe(true);
    expect(session.activeRole).toBe("CLIENT");
    expect(session.getNavigationShellBadge().badgeLabel).toBe("[ CLIENT VIEW ]");

    // -------------------------------------------------------------
    // Step 7: Verifies bathroom job is still listed and active without state corruption
    // -------------------------------------------------------------
    const clientJobsAfterToggle = filterClientJobs(
      [
        {
          ...postedJob,
          quotesCount: 0,
        },
      ],
      "ALL",
      session.currentUser!.id
    );
    expect(clientJobsAfterToggle).toHaveLength(1);
    expect(clientJobsAfterToggle[0].id).toBe("job_thabo_bath_01");
    expect(clientJobsAfterToggle[0].status).toBe("OPEN");
  });

  it("E2E-P2: Client End-to-End Experience: Registration -> Job Creation with Affordability -> Quote Review -> Milestone Release", () => {
    // -------------------------------------------------------------
    // Step 1: Client registration
    // -------------------------------------------------------------
    const session = new MockPersonaSessionManager();
    const regResult = session.register({
      name: "Mpho Sithole",
      phone: "082 555 7788",
      email: "mpho.sithole@example.com",
      role: "CLIENT",
      suburb: "Bryanston",
      city: "Johannesburg",
    });

    expect(regResult.user.role).toBe("HOMEOWNER");
    expect(session.activeRole).toBe("CLIENT");
    expect(session.currentUser?.name).toBe("Mpho Sithole");

    // -------------------------------------------------------------
    // Step 2: Job Creation with 3-Step Wizard & Affordability Breakdown
    // -------------------------------------------------------------
    const wizard = createInitialWizardState();
    // Step 1: Select trade category ELECTRICAL
    wizard.category = "ELECTRICAL";
    expect(validateWizardStepTransition(wizard, 2).allowed).toBe(true);
    wizard.step = 2;

    // Step 2: Scope description & auto CoC flag
    wizard.title = "Emergency DB Board Earth Leakage Trips";
    wizard.description = "Main trip switch drops every time oven or kettle turns on. Need urgent inspection.";
    wizard.problemTags = ["DB board tripping / earth leakage fault"];
    const electricalMeta = TRADE_CATEGORIES.find((t) => t.slug === "ELECTRICAL")!;
    wizard.requiresCoC = wizard.problemTags.some((tag) =>
      electricalMeta.commonProblems.some((p) => p.label === tag && p.requiresCoC)
    );
    expect(wizard.requiresCoC).toBe(true);
    expect(validateWizardStepTransition(wizard, 3).allowed).toBe(true);
    wizard.step = 3;

    // Step 3: Affordability calculator check
    const affordability = calculateJobAffordability({
      tradeCategorySlug: "ELECTRICAL",
      labourEstimateZar: 4000,
      materialsEstimateZar: 2000,
    });
    expect(affordability.callOutDepositZar).toBe(300);
    expect(affordability.buyerTrustFeeZar).toBe(200); // 5% of R4,000 labour
    expect(affordability.grossClientCommitmentZar).toBe(6200); // 4000 + 2000 + 200

    const clientJob = {
      id: "job_mpho_db_01",
      homeownerId: session.currentUser!.id,
      title: wizard.title,
      category: wizard.category,
      requiresCoC: wizard.requiresCoC,
      status: "OPEN" as string,
      callOutDepositZar: affordability.callOutDepositZar,
      selectedWorkerUserId: null as string | null,
    };
    expect(getDefaultWorkspaceTab(clientJob.status)).toBe("quotes");

    // -------------------------------------------------------------
    // Step 3: Receives and reviews quote from certified Wireman artisan
    // -------------------------------------------------------------
    const wiremanWorker: WorkerGovernanceSnapshot = {
      id: "worker_thabo_profile",
      vettingTier: "TIER_3_COC_CERTIFIED",
      sapsStatus: "CLEARED",
      certifications: [
        {
          tradeCategory: "ELECTRICAL",
          status: "VERIFIED",
          body: "ECB_WIREMAN",
          expiresAt: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
        },
      ],
      user: { name: "Thabo Molefe" },
    };

    const quoteEligibility = validateQuoteEligibility(wiremanWorker, clientJob as JobGovernanceSnapshot);
    expect(quoteEligibility.allowed).toBe(true);

    const receivedQuote = {
      id: "quote_db_wireman_thabo",
      artisanName: "Thabo Molefe",
      labourAmountZar: 3800,
      materialsEstimateZar: 1800,
      workerProfileId: wiremanWorker.id,
      workerUserId: "user_dual_thabo",
    };

    const quoteSplit = computeEscrowSplit({
      labourZar: receivedQuote.labourAmountZar,
      materialsZar: receivedQuote.materialsEstimateZar,
      config: DEFAULT_PLATFORM_CONFIG,
    });
    expect(quoteSplit.buyerTrustFeeZar).toBe(190); // 5% of R3,800
    expect(quoteSplit.grossBuyerPaidZar).toBe(5790); // 3800 + 1800 + 190
    expect(quoteSplit.workerCommissionZar).toBe(304); // 8% of R3,800
    expect(quoteSplit.workerNetPayoutZar).toBe(5296); // 3800 - 304 + 1800 full materials

    // -------------------------------------------------------------
    // Step 4: Client accepts quote into Escrow
    // -------------------------------------------------------------
    clientJob.status = "ESCROW_FUNDED";
    clientJob.selectedWorkerUserId = receivedQuote.workerUserId;
    expect(getDefaultWorkspaceTab(clientJob.status)).toBe("gate");

    const gateOtp = generateGateOtpPair();
    expect(gateOtp.checkInCode).toMatch(/^\d{6}$/);

    // -------------------------------------------------------------
    // Step 5: Artisan arrives on site, client verifies Gate OTP
    // -------------------------------------------------------------
    const otpValid = verifyGateCheckInCode(gateOtp.checkInCode, gateOtp.checkInCodeHash);
    expect(otpValid).toBe(true);

    const manifestCheck = validateGateArrivalManifest({
      faceMatchConfirmed: true,
      expectedCrewProfileIds: [],
      arrivingHeadcount: 1,
      unannouncedPersonnelPresent: false,
    });
    expect(manifestCheck.allowed).toBe(true);

    clientJob.status = "WORKER_ON_SITE";
    expect(getDefaultWorkspaceTab(clientJob.status)).toBe("escrow");

    // -------------------------------------------------------------
    // Step 6: Work completed, electrical CoC issued, milestone released
    // -------------------------------------------------------------
    clientJob.status = "COMPLETED";
    expect(getDefaultWorkspaceTab(clientJob.status)).toBe("ratings");

    // -------------------------------------------------------------
    // Step 7: Mutual verified ratings submitted
    // -------------------------------------------------------------
    expect(validateReviewEligibility(clientJob as JobGovernanceSnapshot, session.currentUser!.id).allowed).toBe(true);
    expect(validateReviewEligibility(clientJob as JobGovernanceSnapshot, receivedQuote.workerUserId).allowed).toBe(true);
    expect(validateReviewEligibility(clientJob as JobGovernanceSnapshot, "unauthorized_person").allowed).toBe(false);
  });

  it("E2E-P3: Builder End-to-End Vetting & Quoting Journey: Registration -> Identity Proof -> Biometric Clearance -> Trade CoC -> Job Bid", async () => {
    // -------------------------------------------------------------
    // Step 1: Artisan registers on Tier 1
    // -------------------------------------------------------------
    const session = new MockPersonaSessionManager();
    const regResult = session.register({
      name: "Kagiso Ndlovu",
      phone: "076 111 2233",
      role: "BUILDER",
      suburb: "Tembisa",
      city: "Johannesburg",
      saIdNumber: buildValidSaId("920718", "5019", "0"),
      selfieConfirmed: true,
      trades: ["PLUMBING"],
    });

    expect(regResult.user.role).toBe("WORKER");
    expect(session.activeRole).toBe("BUILDER");
    const workerProfile = regResult.user.workerProfile!;
    expect(workerProfile.vettingTier).toBe("TIER_1_BROWSE_ONLY");
    expect(workerProfile.sapsStatus).toBe("UNSTARTED");

    // -------------------------------------------------------------
    // Step 2: Proof of Identity (13-digit SA ID Luhn + Selfie Liveness)
    // -------------------------------------------------------------
    const identityAdapter = new ConfigurableDhaIdentityAdapter();
    const validId = buildValidSaId("920718", "5019", "0");
    const idResult = await identityAdapter.verifyIdentityAndBiometrics({
      saIdNumber: validId,
      fullName: "Kagiso Ndlovu",
      selfieConfirmed: true,
      referenceYear: 2026,
    });

    expect(idResult.verified).toBe(true);
    expect(idResult.aliveStatus).toBe("ALIVE");
    expect(idResult.idCheck.valid).toBe(true);
    expect(idResult.idCheck.idHash).toHaveLength(64);
    workerProfile.saIdMasked = idResult.idCheck.maskedId!;
    workerProfile.selfieVerified = true;

    // -------------------------------------------------------------
    // Step 3: Biometric Fingerprint Screening with POPIA Consent
    // -------------------------------------------------------------
    workerProfile.popiaConsentSigned = true;
    const voucher = vettingAdapter.generateFingerprintVoucher(200);
    expect(voucher.voucherCode).toMatch(/^HURU-ZA-[A-Z0-9]{6}$/);
    expect(voucher.feeZar).toBe(200);

    workerProfile.huruVoucherCode = voucher.voucherCode;
    workerProfile.huruFeePaid = true;
    workerProfile.sapsStatus = "PENDING_FINGERPRINTS";
    expect(workerProfile.sapsStatus).toBe("PENDING_FINGERPRINTS");

    // -------------------------------------------------------------
    // Step 4: Simulated SAPS clearance webhook arrives (Tier 2 promotion)
    // -------------------------------------------------------------
    const webhookResult = vettingAdapter.simulateAfiswitchResult("CLEAR");
    expect(webhookResult.sapsStatus).toBe("CLEARED");
    expect(webhookResult.newVettingTier).toBe("TIER_2_SAPS_CLEARED");

    workerProfile.sapsStatus = webhookResult.sapsStatus;
    workerProfile.sapsCertificateRef = webhookResult.sapsCertificateRef;
    workerProfile.sapsClearedAt = webhookResult.sapsClearedAt?.toISOString();
    workerProfile.sapsExpiresAt = webhookResult.sapsExpiresAt?.toISOString();
    workerProfile.vettingTier = webhookResult.newVettingTier;
    expect(workerProfile.vettingTier).toBe("TIER_2_SAPS_CLEARED");

    // -------------------------------------------------------------
    // Step 5: Trade Certification Registry validation (Tier 3 promotion)
    // -------------------------------------------------------------
    const registryAdapter = new SouthAfricanStatutoryRegistryAdapter();
    const pirbValidation = await registryAdapter.validateTradeRegistration({
      body: "PIRB",
      registrationNumber: "PIRB-44819-ZA",
      tradeCategory: "PLUMBING",
    });
    expect(pirbValidation.valid).toBe(true);

    workerProfile.certifications.push({
      id: "cert_pirb_kagiso",
      body: "PIRB",
      registrationNumber: pirbValidation.normalizedRegNumber,
      tradeCategory: "PLUMBING",
      status: "VERIFIED",
      expiresAt: pirbValidation.recommendedExpiryDate.toISOString(),
    });
    workerProfile.vettingTier = "TIER_3_COC_CERTIFIED";
    expect(workerProfile.vettingTier).toBe("TIER_3_COC_CERTIFIED");

    // -------------------------------------------------------------
    // Step 6: Browses client jobs, finds statutory CoC plumbing job
    // -------------------------------------------------------------
    const availableJobs: JobGovernanceSnapshot[] = [
      {
        id: "job_burst_geyser_coc",
        category: "PLUMBING",
        requiresCoC: true,
        status: "OPEN",
        homeownerId: "user_homeowner_lerato",
      },
    ];

    // -------------------------------------------------------------
    // Step 7: Quoting gate checks artisan eligibility -> Quote allowed
    // -------------------------------------------------------------
    const quoteCheck = validateQuoteEligibility(
      {
        id: workerProfile.id,
        vettingTier: workerProfile.vettingTier,
        sapsStatus: workerProfile.sapsStatus,
        sapsExpiresAt: workerProfile.sapsExpiresAt,
        certifications: workerProfile.certifications,
        user: { name: "Kagiso Ndlovu" },
      },
      availableJobs[0]
    );

    expect(quoteCheck.allowed).toBe(true);

    // Artisan successfully bids
    const submittedQuote = {
      jobId: availableJobs[0].id,
      workerProfileId: workerProfile.id,
      labourAmountZar: 2800,
      materialsEstimateZar: 1200,
    };
    const bidFinancials = computeEscrowSplit({
      labourZar: submittedQuote.labourAmountZar,
      materialsZar: submittedQuote.materialsEstimateZar,
      config: DEFAULT_PLATFORM_CONFIG,
    });
    expect(bidFinancials.grossBuyerPaidZar).toBe(4140); // 2800 + 1200 + 140 fee
    expect(bidFinancials.workerNetPayoutZar).toBe(3776); // 2800 - 224 comm + 1200 materials
  });
});
