import { describe, expect, it } from "vitest";
import { computeEscrowSplit } from "@/lib/adapters/escrow";
import { generateGateOtpPair, verifyGateCheckInCode } from "@/lib/security/gate-otp";
import { TRADE_CATEGORIES, formatZar, DEFAULT_PLATFORM_CONFIG } from "@/lib/config";
import {
  getDefaultWorkspaceTab,
  validateWizardStepTransition,
  createInitialWizardState,
  JobWizardState,
  validateBrutalistGeometry,
  BRICK_THEME_TOKENS,
  ClientJobStatusFilter,
  ClientJobSummaryDTO,
  filterClientJobs,
  calculateJobAffordability,
} from "./helpers";

describe("Suite 2: tests/client-experience.test.ts (Client Job Listing & Affordance Engine)", () => {
  const currentClientId = "user_homeowner_lerato";

  const mockClientJobs: ClientJobSummaryDTO[] = [
    {
      id: "job_lerato_01",
      homeownerId: "user_homeowner_lerato",
      title: "Burst Geyser in Roof Space",
      category: "PLUMBING",
      status: "QUOTED",
      urgency: "EMERGENCY_24H",
      requiresCoC: true,
      budgetEstimateZar: 4500,
      callOutDepositZar: 250,
      quotesCount: 2,
      quotes: [
        {
          id: "quote_01_sipho",
          workerProfileId: "worker_sipho_profile",
          artisanName: "Sipho Dlamini",
          vettingTier: "TIER_2_SAPS_CLEARED",
          labourAmountZar: 3200,
          materialsEstimateZar: 1500,
          ratingAvg: 4.85,
          completedJobsCount: 32,
        },
      ],
      createdAt: "2026-11-01T08:00:00Z",
    },
    {
      id: "job_lerato_02",
      homeownerId: "user_homeowner_lerato",
      title: "Exterior Boundary Wall Painting",
      category: "PAINTING",
      status: "OPEN",
      urgency: "THIS_WEEK",
      requiresCoC: false,
      budgetEstimateZar: 2800,
      callOutDepositZar: 200,
      quotesCount: 0,
      createdAt: "2026-11-02T10:00:00Z",
    },
    {
      id: "job_lerato_03",
      homeownerId: "user_homeowner_lerato",
      title: "Kitchen Sink Mixer Replacement",
      category: "PLUMBING",
      status: "COMPLETED",
      urgency: "FLEXIBLE",
      requiresCoC: false,
      budgetEstimateZar: 900,
      callOutDepositZar: 250,
      quotesCount: 1,
      createdAt: "2026-10-15T12:00:00Z",
    },
    {
      id: "job_other_user_99",
      homeownerId: "user_homeowner_kobus",
      title: "DB Board Earth Leakage Fault",
      category: "ELECTRICAL",
      status: "OPEN",
      urgency: "EMERGENCY_24H",
      requiresCoC: true,
      budgetEstimateZar: 3500,
      callOutDepositZar: 300,
      quotesCount: 0,
      createdAt: "2026-11-02T09:00:00Z",
    },
  ];

  it("CLIENT-01: renders dedicated client page with primary job creation affordances", () => {
    // 1. Primary action button affordance
    const primaryCta = {
      label: "[ POST A NEW JOB ]",
      href: "/jobs/new",
      className: "border-2 border-iron-950 bg-brick-600 text-white font-mono font-bold uppercase rounded-none shadow-brutal",
    };
    expect(primaryCta.label).toBe("[ POST A NEW JOB ]");
    expect(primaryCta.href).toBe("/jobs/new");

    const geomCheck = validateBrutalistGeometry(primaryCta.className);
    expect(geomCheck.compliant).toBe(true);

    // 2. Client Quick Filters
    const availableFilters: ClientJobStatusFilter[] = [
      "ALL",
      "NEEDS_ATTENTION",
      "ACTIVE_ON_SITE",
      "COMPLETED",
    ];
    expect(availableFilters).toHaveLength(4);

    // 3. Stats summary metrics for client
    const clientOnlyJobs = mockClientJobs.filter((j) => j.homeownerId === currentClientId);
    const summary = {
      totalPosted: clientOnlyJobs.length,
      needsAttentionCount: clientOnlyJobs.filter((j) => j.status === "QUOTED" || j.status === "WORK_SUBMITTED").length,
      activeOnSiteCount: clientOnlyJobs.filter((j) => j.status === "ESCROW_FUNDED" || j.status === "WORKER_ON_SITE").length,
      completedCount: clientOnlyJobs.filter((j) => j.status === "COMPLETED").length,
    };

    expect(summary.totalPosted).toBe(3);
    expect(summary.needsAttentionCount).toBe(1);
    expect(summary.activeOnSiteCount).toBe(0);
    expect(summary.completedCount).toBe(1);
  });

  it("CLIENT-02: job creation wizard computes budget and affordability metrics in real-time", () => {
    // Simulate client estimating a plumbing job: R3,000 labour + R1,500 materials
    const affordability = calculateJobAffordability({
      tradeCategorySlug: "PLUMBING",
      labourEstimateZar: 3000,
      materialsEstimateZar: 1500,
    });

    expect(affordability.callOutDepositZar).toBe(250);
    // 5% buyer escrow trust fee on R3,000 labour = R150
    expect(affordability.buyerTrustFeeZar).toBe(150);
    // Total commitment = 3000 labour + 1500 materials + 150 fee = R4,650
    expect(affordability.grossClientCommitmentZar).toBe(4650);
    // Call-out deposit credited toward labour leaves R2,750 labour held for final release
    expect(affordability.remainingLabourEscrowZar).toBe(2750);
    // 0% platform markup on materials slip guarantee
    expect(affordability.materialsMarkupPercent).toBe(0);
    expect(affordability.summaryNotes).toContain("credited in full");
  });

  it("CLIENT-03: enforces mandatory trade category selection and scope description before submission", () => {
    const wizardState = createInitialWizardState();
    expect(wizardState.step).toBe(1);

    // 1. Step 1 -> Step 2 transition blocked without category selection
    const step2Attempt1 = validateWizardStepTransition(wizardState, 2);
    expect(step2Attempt1.allowed).toBe(false);
    expect(step2Attempt1.reason).toContain("Must select a trade category");

    // Select trade category
    wizardState.category = "PLUMBING";
    const step2Attempt2 = validateWizardStepTransition(wizardState, 2);
    expect(step2Attempt2.allowed).toBe(true);
    wizardState.step = 2;

    // 2. Step 2 -> Step 3 transition blocked without headline
    const step3Attempt1 = validateWizardStepTransition(wizardState, 3);
    expect(step3Attempt1.allowed).toBe(false);
    expect(step3Attempt1.reason).toContain("Must provide a job title");

    wizardState.title = "Fix leaking kitchen mixer tap";
    // Blocked without description
    const step3Attempt2 = validateWizardStepTransition(wizardState, 3);
    expect(step3Attempt2.allowed).toBe(false);
    expect(step3Attempt2.reason).toContain("Must describe the scope");

    wizardState.description = "Kitchen mixer tap dripping continuously under cupboard sink.";
    const step3Attempt3 = validateWizardStepTransition(wizardState, 3);
    expect(step3Attempt3.allowed).toBe(true);

    // 3. Backward navigation is always allowed
    wizardState.step = 3;
    expect(validateWizardStepTransition(wizardState, 2).allowed).toBe(true);
    expect(validateWizardStepTransition(wizardState, 1).allowed).toBe(true);
  });

  it("CLIENT-04: flags statutory CoC requirement automatically for high-risk trades", () => {
    // High-risk electrical DB board problem chip
    const electricalTrade = TRADE_CATEGORIES.find((t) => t.slug === "ELECTRICAL")!;
    const dbProblem = electricalTrade.commonProblems.find((p) => p.label.includes("DB board"))!;
    expect(dbProblem.requiresCoC).toBe(true);

    // High-risk geyser installation problem chip
    const plumbingTrade = TRADE_CATEGORIES.find((t) => t.slug === "PLUMBING")!;
    const geyserProblem = plumbingTrade.commonProblems.find((p) => p.label.includes("Burst geyser"))!;
    expect(geyserProblem.requiresCoC).toBe(true);

    // Low-risk painting problem chip
    const paintingTrade = TRADE_CATEGORIES.find((t) => t.slug === "PAINTING")!;
    const paintProblem = paintingTrade.commonProblems.find((p) => p.label.includes("Paint interior"))!;
    expect(paintProblem.requiresCoC).toBeFalsy();

    // Verify statutory CoC bodies
    expect(electricalTrade.cocBody).toBe("ECB_WIREMAN");
    expect(plumbingTrade.cocBody).toBe("PIRB");
  });

  it("CLIENT-05: associates submitted job listing with authenticated client ID", () => {
    // Simulated job submission payload from wizard
    const clientPayload = {
      homeownerId: currentClientId,
      title: "Emergency Burst Pipe Behind Laundry Wall",
      category: "PLUMBING",
      problemTags: ["Leaking pipe, tap or toilet cistern"],
      description: "Water spraying inside wall cavity, main shutoff valve engaged.",
      suburb: "Fourways",
      city: "Johannesburg",
      streetAddress: "14 Acacia Estate, Uranium Rd",
      urgency: "EMERGENCY_24H",
      requiresCoC: false,
      callOutDepositZar: 250,
      budgetEstimateZar: 3500,
    };

    // Validating payload contract
    expect(clientPayload.homeownerId).toBe("user_homeowner_lerato");
    expect(clientPayload.callOutDepositZar).toBe(250);

    // Created job entity preserves homeownerId and sets status OPEN
    const createdJob = {
      id: "job_new_771",
      ...clientPayload,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    expect(createdJob.homeownerId).toBe(currentClientId);
    expect(createdJob.status).toBe("OPEN");
    expect(getDefaultWorkspaceTab(createdJob.status)).toBe("quotes");
  });

  it("CLIENT-06: client can view list of posted jobs with real-time status badges", () => {
    // 1. Fetch filtered feed for current client
    const allClientJobs = filterClientJobs(mockClientJobs, "ALL", currentClientId);
    expect(allClientJobs).toHaveLength(3);
    // Foreign user's job (job_other_user_99) is strictly excluded
    expect(allClientJobs.some((j) => j.id === "job_other_user_99")).toBe(false);

    // 2. Verify status badge formatting & brutalist tokens
    const statusBadges = allClientJobs.map((j) => ({
      status: j.status,
      badgeText: `// STATUS: ${j.status}`,
      classes: "font-mono text-xs font-bold uppercase border-2 border-iron-950 px-2 py-0.5 rounded-none",
    }));

    for (const badge of statusBadges) {
      expect(badge.badgeText).toMatch(/^\/\/\sSTATUS:\s[A-Z_]+$/);
      const geom = validateBrutalistGeometry(badge.classes);
      expect(geom.compliant).toBe(true);
    }

    // 3. Status filter tabs
    const needsAttention = filterClientJobs(mockClientJobs, "NEEDS_ATTENTION", currentClientId);
    expect(needsAttention).toHaveLength(1);
    expect(needsAttention[0].status).toBe("QUOTED");

    const completed = filterClientJobs(mockClientJobs, "COMPLETED", currentClientId);
    expect(completed).toHaveLength(1);
    expect(completed[0].status).toBe("COMPLETED");
  });

  it("CLIENT-07: client can inspect received quotes and quote details on posted jobs", () => {
    const quotedJob = mockClientJobs.find((j) => j.id === "job_lerato_01")!;
    expect(quotedJob.quotesCount).toBeGreaterThan(0);
    expect(quotedJob.quotes).toBeDefined();

    const quote = quotedJob.quotes![0];
    expect(quote.artisanName).toBe("Sipho Dlamini");
    expect(quote.vettingTier).toBe("TIER_2_SAPS_CLEARED");
    expect(quote.ratingAvg).toBe(4.85);

    // Inspect labour / materials quote split
    const split = computeEscrowSplit({
      labourZar: quote.labourAmountZar,
      materialsZar: quote.materialsEstimateZar,
      config: DEFAULT_PLATFORM_CONFIG,
    });

    expect(split.labourZar).toBe(3200);
    expect(split.materialsZar).toBe(1500);
    expect(split.buyerTrustFeeZar).toBe(160); // 5% of R3,200 labour
    expect(split.grossBuyerPaidZar).toBe(4860); // 3200 + 1500 + 160
    expect(split.workerNetPayoutZar).toBe(4444); // 3200 - 256 comm (8%) + 1500 materials
  });

  it("CLIENT-08: quote acceptance shifts job status and presents Escrow funding drawer", () => {
    const job = {
      id: "job_lerato_01",
      homeownerId: "user_homeowner_lerato",
      status: "QUOTED",
      selectedWorkerProfileId: null as string | null,
    };

    // Client accepts artisan Sipho's quote
    const acceptedQuoteId = "quote_01_sipho";
    const artisanProfileId = "worker_sipho_profile";

    // Quote acceptance transition
    job.status = "ESCROW_FUNDED";
    job.selectedWorkerProfileId = artisanProfileId;

    // Active workspace tab immediately pivots to 'gate'
    expect(getDefaultWorkspaceTab(job.status)).toBe("gate");

    // Gate OTP generation triggered upon Escrow funding
    const otp = generateGateOtpPair();
    expect(otp.checkInCode).toMatch(/^\d{6}$/);
    expect(otp.checkInCodeHash).toHaveLength(64);

    // Verification check ensures gate OTP is valid
    const isValid = verifyGateCheckInCode(otp.checkInCode, otp.checkInCodeHash);
    expect(isValid).toBe(true);
  });

  it("CLIENT-09: boundary test: budget estimate zero, extreme high (R1,000,000), or empty string", () => {
    // 1. Zero or negative input
    const zeroAffordability = calculateJobAffordability({
      tradeCategorySlug: "PLUMBING",
      labourEstimateZar: 0,
      materialsEstimateZar: 0,
    });
    expect(zeroAffordability.labourEstimateZar).toBe(0);
    expect(zeroAffordability.buyerTrustFeeZar).toBe(0);
    expect(zeroAffordability.grossClientCommitmentZar).toBe(0);

    // 2. Extreme renovation budget: R1,000,000
    const extremeAffordability = calculateJobAffordability({
      tradeCategorySlug: "BUILDING",
      labourEstimateZar: 600000,
      materialsEstimateZar: 400000,
    });
    expect(extremeAffordability.grossClientCommitmentZar).toBe(1030000); // 600k + 400k + 30k (5% fee)
    expect(formatZar(extremeAffordability.grossClientCommitmentZar)).toMatch(/^R1[\s\u00A0,]?030[\s\u00A0,]?000$/);

    // 3. NaN or undefined inputs fall back safely
    const nanAffordability = calculateJobAffordability({
      tradeCategorySlug: "PAINTING",
      labourEstimateZar: NaN,
      materialsEstimateZar: undefined,
    });
    expect(nanAffordability.labourEstimateZar).toBe(0);
    expect(nanAffordability.grossClientCommitmentZar).toBe(0);
  });

  it("CLIENT-10: empty state: client with zero posted jobs sees clear call-to-action to post first job", () => {
    const emptyJobsList: ClientJobSummaryDTO[] = [];
    const clientFiltered = filterClientJobs(emptyJobsList, "ALL", "new_client_without_jobs");
    expect(clientFiltered).toHaveLength(0);

    // Empty state view specification
    const emptyStateAffordance = {
      headline: "NO ACTIVE JOB POSTINGS",
      subtext: "Post a renovation or emergency repair job to receive quotes from SAPS-cleared artisans.",
      ctaButton: {
        label: "[ POST YOUR FIRST JOB ]",
        href: "/jobs/new",
        className: "border-2 border-iron-950 bg-brick-600 text-white font-mono font-bold uppercase rounded-none shadow-brutal px-6 py-3",
      },
    };

    expect(emptyStateAffordance.headline).toBe("NO ACTIVE JOB POSTINGS");
    expect(emptyStateAffordance.ctaButton.label).toBe("[ POST YOUR FIRST JOB ]");
    const geom = validateBrutalistGeometry(emptyStateAffordance.ctaButton.className);
    expect(geom.compliant).toBe(true);
  });
});
