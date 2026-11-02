import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  TRADE_CATEGORIES,
  SA_LOCATIONS,
  DEFAULT_PLATFORM_CONFIG,
  formatZar,
} from "@/lib/config";
import {
  calculateJobAffordability,
  validateWizardStepTransition,
  createInitialWizardState,
  JobWizardState,
  filterClientJobs,
  ClientJobSummaryDTO,
  ClientJobStatusFilter,
  validateSkillsUpdate,
  UpdateSkillsPayload,
  browseJobsForBuilder,
  JobFeedItem,
  validateBrutalistGeometry,
  MockPersonaSessionManager,
} from "./helpers";
import {
  vettingAdapter,
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

describe("Adversarial Empirical Challenge — Persona Boundaries & Edge Cases", () => {
  // =========================================================================
  // 1. CLIENT EXPERIENCE ADVERSARIAL CHALLENGES
  // =========================================================================
  describe("1. Client Experience Boundary & Edge Case Stress Harness", () => {
    it("CHALLENGE-C1: Extreme & Adversarial Budgets (R0, negative, non-numeric, whitespace, R1,000,000+)", () => {
      // 1. Zero Budget
      const zeroCalc = calculateJobAffordability({
        tradeCategorySlug: "PLUMBING",
        labourEstimateZar: 0,
        materialsEstimateZar: 0,
      });
      expect(zeroCalc.labourEstimateZar).toBe(0);
      expect(zeroCalc.materialsEstimateZar).toBe(0);
      expect(zeroCalc.buyerTrustFeeZar).toBe(0);
      expect(zeroCalc.grossClientCommitmentZar).toBe(0);
      expect(zeroCalc.remainingLabourEscrowZar).toBe(0);
      expect(Number.isFinite(zeroCalc.grossClientCommitmentZar)).toBe(true);

      // 2. Negative inputs (e.g. -500 labour, -300 materials) must be clamped safely to 0
      const negativeCalc = calculateJobAffordability({
        tradeCategorySlug: "ELECTRICAL",
        labourEstimateZar: -500,
        materialsEstimateZar: -300,
      });
      expect(negativeCalc.labourEstimateZar).toBe(0);
      expect(negativeCalc.materialsEstimateZar).toBe(0);
      expect(negativeCalc.grossClientCommitmentZar).toBe(0);

      // 3. Non-numeric and malformed inputs (NaN, undefined, string coerced)
      const nanCalc = calculateJobAffordability({
        tradeCategorySlug: "PAINTING",
        labourEstimateZar: NaN,
        materialsEstimateZar: undefined,
      });
      expect(nanCalc.labourEstimateZar).toBe(0);
      expect(nanCalc.materialsEstimateZar).toBe(0);
      expect(nanCalc.grossClientCommitmentZar).toBe(0);

      // 4. Extreme High Budget (R1,000,000 renovation)
      const millionCalc = calculateJobAffordability({
        tradeCategorySlug: "BUILDING",
        labourEstimateZar: 600000,
        materialsEstimateZar: 400000,
      });
      expect(millionCalc.buyerTrustFeeZar).toBe(30000); // 5% of 600,000
      expect(millionCalc.grossClientCommitmentZar).toBe(1030000); // 600,000 + 400,000 + 30,000
      expect(millionCalc.remainingLabourEscrowZar).toBe(600000 - millionCalc.callOutDepositZar);
      expect(formatZar(millionCalc.grossClientCommitmentZar)).toMatch(/^R1[\s\u00A0,]?030[\s\u00A0,]?000$/);

      // 5. Extreme Super-Cap Budget (R10,000,000 commercial fit-out)
      const tenMillionCalc = calculateJobAffordability({
        tradeCategorySlug: "BUILDING",
        labourEstimateZar: 7000000,
        materialsEstimateZar: 3000000,
      });
      expect(tenMillionCalc.buyerTrustFeeZar).toBe(350000); // 5% of 7M
      expect(tenMillionCalc.grossClientCommitmentZar).toBe(10350000);
      expect(Number.isFinite(tenMillionCalc.grossClientCommitmentZar)).toBe(true);
    });

    it("CHALLENGE-C2: Empty & Whitespace Problem Descriptions in Step Transition Guard", () => {
      const state = createInitialWizardState();
      state.category = "PLUMBING";
      state.step = 2;

      // 1. Empty string description
      state.title = "Burst Pipe";
      state.description = "";
      const emptyCheck = validateWizardStepTransition(state, 3);
      expect(emptyCheck.allowed).toBe(false);
      expect(emptyCheck.reason).toContain("Must describe the scope");

      // 2. Pure whitespace description ("   \t  \n  ")
      state.description = "   \t  \n  ";
      const whitespaceCheck = validateWizardStepTransition(state, 3);
      expect(whitespaceCheck.allowed).toBe(false);
      expect(whitespaceCheck.reason).toContain("Must describe the scope");

      // 3. Pure whitespace title
      state.title = "   \n\t  ";
      state.description = "Valid description of the plumbing leak.";
      const whitespaceTitleCheck = validateWizardStepTransition(state, 3);
      expect(whitespaceTitleCheck.allowed).toBe(false);
      expect(whitespaceTitleCheck.reason).toContain("Must provide a job title");

      // 4. Valid non-empty trimmed inputs succeed
      state.title = "Emergency Pipe Leak";
      state.description = "Water leaking under laundry sink.";
      const validCheck = validateWizardStepTransition(state, 3);
      expect(validCheck.allowed).toBe(true);
    });

    it("CHALLENGE-C3: CoC Auto-Tagging Matrix across High-Risk Trades (Geysers, DB Boards, Gas)", () => {
      // Verify all trade categories in configuration
      for (const trade of TRADE_CATEGORIES) {
        for (const problem of trade.commonProblems) {
          if (
            problem.label.toLowerCase().includes("geyser") ||
            problem.label.toLowerCase().includes("db board") ||
            problem.label.toLowerCase().includes("solar") ||
            problem.label.toLowerCase().includes("gas")
          ) {
            // These high-risk problems must require statutory CoC
            expect(problem.requiresCoC).toBe(true);
          }
        }
      }

      // Check multi-chip toggle logic
      const electricalTrade = TRADE_CATEGORIES.find((t) => t.slug === "ELECTRICAL")!;
      const cocChip = electricalTrade.commonProblems.find((p) => p.requiresCoC)!;
      const nonCocChip = electricalTrade.commonProblems.find((p) => !p.requiresCoC)!;

      expect(cocChip).toBeDefined();
      expect(nonCocChip).toBeDefined();

      // Case A: Only non-CoC chip selected
      const nonCocSelected = [nonCocChip.label];
      const requiresCoC_A = nonCocSelected.some((lbl) => {
        const found = electricalTrade.commonProblems.find((p) => p.label === lbl);
        return Boolean(found?.requiresCoC);
      });
      expect(requiresCoC_A).toBe(false);

      // Case B: Both non-CoC and CoC chips selected -> must be TRUE
      const mixedSelected = [nonCocChip.label, cocChip.label];
      const requiresCoC_B = mixedSelected.some((lbl) => {
        const found = electricalTrade.commonProblems.find((p) => p.label === lbl);
        return Boolean(found?.requiresCoC);
      });
      expect(requiresCoC_B).toBe(true);

      // Case C: Removing CoC chip resets requiresCoC to false
      const unselectedCoC = mixedSelected.filter((lbl) => lbl !== cocChip.label);
      const requiresCoC_C = unselectedCoC.some((lbl) => {
        const found = electricalTrade.commonProblems.find((p) => p.label === lbl);
        return Boolean(found?.requiresCoC);
      });
      expect(requiresCoC_C).toBe(false);
    });

    it("CHALLENGE-C4: Client Job Filtering & Homeowner Isolation Guardrail", () => {
      const mockJobs: ClientJobSummaryDTO[] = [
        {
          id: "job_alice_1",
          homeownerId: "user_alice",
          title: "Alice Plumbing Job",
          category: "PLUMBING",
          status: "OPEN",
          urgency: "THIS_WEEK",
          requiresCoC: false,
          budgetEstimateZar: 1500,
          callOutDepositZar: 250,
          quotesCount: 0,
          createdAt: "2026-11-01T10:00:00Z",
        },
        {
          id: "job_alice_2",
          homeownerId: "user_alice",
          title: "Alice Quoted Painting Job",
          category: "PAINTING",
          status: "QUOTED",
          urgency: "THIS_WEEK",
          requiresCoC: false,
          budgetEstimateZar: 3200,
          callOutDepositZar: 200,
          quotesCount: 2,
          createdAt: "2026-11-01T12:00:00Z",
        },
        {
          id: "job_bob_1",
          homeownerId: "user_bob",
          title: "Bob Electrical Job",
          category: "ELECTRICAL",
          status: "OPEN",
          urgency: "EMERGENCY_24H",
          requiresCoC: true,
          budgetEstimateZar: 4500,
          callOutDepositZar: 300,
          quotesCount: 1,
          createdAt: "2026-11-02T08:00:00Z",
        },
      ];

      // 1. Filtering by user_alice MUST NOT leak user_bob's job
      const aliceJobs = filterClientJobs(mockJobs, "ALL", "user_alice");
      expect(aliceJobs).toHaveLength(2);
      expect(aliceJobs.every((j) => j.homeownerId === "user_alice")).toBe(true);
      expect(aliceJobs.some((j) => j.id === "job_bob_1")).toBe(false);

      // 2. Filtering by user_bob MUST NOT leak user_alice's jobs
      const bobJobs = filterClientJobs(mockJobs, "ALL", "user_bob");
      expect(bobJobs).toHaveLength(1);
      expect(bobJobs[0].id).toBe("job_bob_1");

      // 3. Filtering by non-existent user returns empty array
      const emptyUserJobs = filterClientJobs(mockJobs, "ALL", "user_charlie_none");
      expect(emptyUserJobs).toHaveLength(0);

      // 4. Filtering with injection-like homeownerId returns empty array
      const injectionAttemptJobs = filterClientJobs(mockJobs, "ALL", "user_alice' OR '1'='1");
      expect(injectionAttemptJobs).toHaveLength(0);

      // 5. Quick filter "NEEDS_ATTENTION" on alice's jobs
      const aliceNeedsAttention = filterClientJobs(mockJobs, "NEEDS_ATTENTION", "user_alice");
      expect(aliceNeedsAttention).toHaveLength(1);
      expect(aliceNeedsAttention[0].id).toBe("job_alice_2");
    });
  });

  // =========================================================================
  // 2. BUILDER EXPERIENCE ADVERSARIAL CHALLENGES
  // =========================================================================
  describe("2. Builder Experience Boundary & Edge Case Stress Harness", () => {
    it("CHALLENGE-B1: Skills Updating Boundary Validation (Empty trades, negative exp, short bio, missing hub)", () => {
      const baseValidPayload: UpdateSkillsPayload = {
        workerProfileId: "worker_test_profile",
        trades: ["PLUMBING"],
        yearsExperience: 5,
        bio: "Skilled plumber with over 5 years experience.",
        nearestHardwareHub: "Builders Warehouse Fourways",
      };

      // 1. Empty trades array
      const emptyTrades = { ...baseValidPayload, trades: [] };
      const resEmptyTrades = validateSkillsUpdate(emptyTrades);
      expect(resEmptyTrades.valid).toBe(false);
      expect(resEmptyTrades.error).toContain("At least one trade category is required");

      // 2. Negative years of experience (-1, -100)
      const negExp = { ...baseValidPayload, yearsExperience: -1 };
      const resNegExp = validateSkillsUpdate(negExp);
      expect(resNegExp.valid).toBe(false);
      expect(resNegExp.error).toContain("non-negative number");

      // 3. Zero years of experience IS ALLOWED (entry artisan/apprentice)
      const zeroExp = { ...baseValidPayload, yearsExperience: 0 };
      const resZeroExp = validateSkillsUpdate(zeroExp);
      expect(resZeroExp.valid).toBe(true);
      expect(resZeroExp.sanitized?.yearsExperience).toBe(0);

      // 4. Float years of experience (4.7) is floored
      const floatExp = { ...baseValidPayload, yearsExperience: 4.7 };
      const resFloatExp = validateSkillsUpdate(floatExp);
      expect(resFloatExp.valid).toBe(true);
      expect(resFloatExp.sanitized?.yearsExperience).toBe(4);

      // 5. Short bio (< 10 characters)
      const shortBio = { ...baseValidPayload, bio: "Plumber" };
      const resShortBio = validateSkillsUpdate(shortBio);
      expect(resShortBio.valid).toBe(false);
      expect(resShortBio.error).toContain("at least 10 characters");

      // 6. Whitespace-only bio (15 spaces -> trimmed length 0)
      const spaceBio = { ...baseValidPayload, bio: "               " };
      const resSpaceBio = validateSkillsUpdate(spaceBio);
      expect(resSpaceBio.valid).toBe(false);
      expect(resSpaceBio.error).toContain("at least 10 characters");

      // 7. Missing nearestHardwareHub (empty or whitespace)
      const emptyHub = { ...baseValidPayload, nearestHardwareHub: "   " };
      const resEmptyHub = validateSkillsUpdate(emptyHub);
      expect(resEmptyHub.valid).toBe(false);
      expect(resEmptyHub.error).toContain("Nearest hardware store / trade hub is required");

      // 8. Missing workerProfileId
      const missingId = { ...baseValidPayload, workerProfileId: "" };
      const resMissingId = validateSkillsUpdate(missingId);
      expect(resMissingId.valid).toBe(false);
      expect(resMissingId.error).toContain("Worker profile ID is required");
    });

    it("CHALLENGE-B2: Trade-Matched Job Filtering Logic & Street Address Privacy Masking", () => {
      const feedJobs: JobFeedItem[] = [
        {
          id: "job_feed_plumb",
          category: "PLUMBING",
          title: "Burst Geyser",
          suburb: "Fourways",
          city: "Johannesburg",
          streetAddressEncrypted: "SECRET_ADDR_1",
          urgency: "EMERGENCY_24H",
          requiresCoC: true,
          callOutDepositZar: 250,
          budgetEstimateZar: 4000,
          status: "OPEN",
        },
        {
          id: "job_feed_elec",
          category: "ELECTRICAL",
          title: "Tripping DB Board",
          suburb: "Bryanston",
          city: "Johannesburg",
          streetAddressEncrypted: "SECRET_ADDR_2",
          urgency: "THIS_WEEK",
          requiresCoC: true,
          callOutDepositZar: 300,
          budgetEstimateZar: 2500,
          status: "OPEN",
        },
        {
          id: "job_feed_paint",
          category: "PAINTING",
          title: "Repaint Lounge",
          suburb: "Sandton",
          city: "Johannesburg",
          streetAddressEncrypted: "SECRET_ADDR_3",
          urgency: "FLEXIBLE",
          requiresCoC: false,
          callOutDepositZar: 200,
          budgetEstimateZar: 3000,
          status: "OPEN",
        },
      ];

      // 1. Builder with trades ["PLUMBING"] matches only PLUMBING
      const plumbMatches = browseJobsForBuilder(feedJobs, {
        builderTrades: ["PLUMBING"],
        matchMyTradesOnly: true,
      });
      expect(plumbMatches).toHaveLength(1);
      expect(plumbMatches[0].category).toBe("PLUMBING");

      // 2. Builder with trades ["PAINTING", "TILING"] matches only PAINTING
      const paintMatches = browseJobsForBuilder(feedJobs, {
        builderTrades: ["PAINTING", "TILING"],
        matchMyTradesOnly: true,
      });
      expect(paintMatches).toHaveLength(1);
      expect(paintMatches[0].category).toBe("PAINTING");

      // 3. Builder with trade ["CARPENTRY"] matches 0 jobs
      const noMatches = browseJobsForBuilder(feedJobs, {
        builderTrades: ["CARPENTRY"],
        matchMyTradesOnly: true,
      });
      expect(noMatches).toHaveLength(0);

      // 4. Privacy assertion: Encrypted street address MUST be stripped from all outputs
      for (const j of plumbMatches) {
        expect((j as any).streetAddressEncrypted).toBeUndefined();
        expect(j.suburb).toBe("Fourways");
      }
    });

    it("CHALLENGE-B3: 3-Pillar Vetting Integrity & Quoting Gates", async () => {
      // --- Pillar 1: Identity Integrity ---
      const identityAdapter = new ConfigurableDhaIdentityAdapter();
      const validSaId = buildValidSaId("920202", "5011", "0");

      const validPillar1 = await identityAdapter.verifyIdentityAndBiometrics({
        saIdNumber: validSaId,
        fullName: "Kabelo Sithole",
        selfieConfirmed: true,
      });
      expect(validPillar1.verified).toBe(true);
      expect(validPillar1.idCheck.valid).toBe(true);

      // Corrupted Luhn digit must fail
      const badLuhn = validSaId.slice(0, 12) + (validSaId[12] === "0" ? "9" : "0");
      const badLuhnResult = await identityAdapter.verifyIdentityAndBiometrics({
        saIdNumber: badLuhn,
        fullName: "Kabelo Sithole",
        selfieConfirmed: true,
      });
      expect(badLuhnResult.verified).toBe(false);

      // --- Pillar 2: Verifiability & SAPS Webhook ---
      const clearSim = vettingAdapter.simulateAfiswitchResult("CLEAR");
      expect(clearSim.newVettingTier).toBe("TIER_2_SAPS_CLEARED");
      expect(clearSim.sapsStatus).toBe("CLEARED");

      const flagSim = vettingAdapter.simulateAfiswitchResult("FLAGGED");
      expect(flagSim.newVettingTier).toBe("SUSPENDED");
      expect(flagSim.sapsStatus).toBe("FLAGGED_RECORD");

      // --- Pillar 3: Quoting Security Gates ---
      const standardJob: JobGovernanceSnapshot = {
        id: "job_garden_deck",
        category: "CARPENTRY",
        requiresCoC: false,
        status: "OPEN",
        homeownerId: "user_client_1",
      };

      const cocJob: JobGovernanceSnapshot = {
        id: "job_db_solar",
        category: "ELECTRICAL",
        requiresCoC: true,
        status: "OPEN",
        homeownerId: "user_client_1",
      };

      // Unvetted Tier 1 artisan blocked from ALL quoting
      const tier1Worker: WorkerGovernanceSnapshot = {
        id: "w_tier1",
        vettingTier: "TIER_1_BROWSE_ONLY",
        sapsStatus: "UNSTARTED",
      };
      expect(validateQuoteEligibility(tier1Worker, standardJob).allowed).toBe(false);
      expect(validateQuoteEligibility(tier1Worker, cocJob).allowed).toBe(false);

      // Cleared Tier 2 artisan allowed on standard job, but BLOCKED on CoC job
      const tier2Worker: WorkerGovernanceSnapshot = {
        id: "w_tier2",
        vettingTier: "TIER_2_SAPS_CLEARED",
        sapsStatus: "CLEARED",
        certifications: [],
      };
      expect(validateQuoteEligibility(tier2Worker, standardJob).allowed).toBe(true);
      expect(validateQuoteEligibility(tier2Worker, cocJob).allowed).toBe(false);

      // Certified Tier 3 Wireman allowed on CoC electrical job
      const tier3Worker: WorkerGovernanceSnapshot = {
        id: "w_tier3",
        vettingTier: "TIER_3_COC_CERTIFIED",
        sapsStatus: "CLEARED",
        certifications: [
          {
            tradeCategory: "ELECTRICAL",
            status: "VERIFIED",
            body: "ECB_WIREMAN",
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        ],
      };
      expect(validateQuoteEligibility(tier3Worker, cocJob).allowed).toBe(true);
    });
  });

  // =========================================================================
  // 3. BRUTALIST DESIGN CONSTRAINTS AUDIT ACROSS ALL COMPONENTS
  // =========================================================================
  describe("3. Comprehensive Brutalist Design Constraints Audit", () => {
    const srcDir = path.resolve(__dirname, "../src");

    function getFilesRecursively(dir: string, extensions: string[]): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let results: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(getFilesRecursively(fullPath, extensions));
        } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
          results.push(fullPath);
        }
      }
      return results;
    }

    it("CHALLENGE-D1: Zero soft-rounded corners (no rounded-full, rounded-md, rounded-lg, rounded-sm) in ALL views", () => {
      const allSourceFiles = getFilesRecursively(srcDir, [".tsx", ".ts"]);
      const forbiddenRoundedRegex = /\brounded-(full|3xl|2xl|xl|lg|md|sm)\b/g;

      const violations: { file: string; match: string }[] = [];

      for (const filePath of allSourceFiles) {
        const content = fs.readFileSync(filePath, "utf-8");
        const matches = content.match(forbiddenRoundedRegex);
        if (matches) {
          for (const m of matches) {
            violations.push({ file: path.relative(srcDir, filePath), match: m });
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("CHALLENGE-D2: Transition durations strictly <= 200ms across ALL views and stylesheets", () => {
      const allFiles = getFilesRecursively(srcDir, [".tsx", ".ts", ".css"]);
      const forbiddenSlowClasses = [
        "duration-300",
        "duration-400",
        "duration-500",
        "duration-700",
        "duration-1000",
      ];

      const violations: { file: string; match: string }[] = [];

      for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, "utf-8");
        for (const slow of forbiddenSlowClasses) {
          if (content.includes(slow)) {
            violations.push({ file: path.relative(srcDir, filePath), match: slow });
          }
        }

        // Also check arbitrary duration-[Xms] syntax
        const arbitraryMatches = content.matchAll(/duration-\[(\d+)ms\]/g);
        for (const match of arbitraryMatches) {
          const ms = parseInt(match[1], 10);
          if (ms > 200) {
            violations.push({
              file: path.relative(srcDir, filePath),
              match: `duration-[${ms}ms]`,
            });
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("CHALLENGE-D3: New persona routes (/login, /signup, /client, /client/dashboard) honor brutalist tokens", () => {
      const newRouteFiles = [
        "app/login/page.tsx",
        "app/signup/page.tsx",
        "app/client/page.tsx",
        "app/client/dashboard/page.tsx",
      ];

      for (const rel of newRouteFiles) {
        const full = path.resolve(srcDir, rel);
        expect(fs.existsSync(full)).toBe(true);
        const content = fs.readFileSync(full, "utf-8");

        // Every new page must use rounded-none and hard brutal borders
        if (rel.endsWith("dashboard/page.tsx") || rel.endsWith("login/page.tsx") || rel.endsWith("signup/page.tsx")) {
          expect(content).toContain("rounded-none");
          expect(content).toContain("border-2 border-iron-950");
          expect(content).toContain("shadow-brutal");
        }
      }
    });
  });
});
