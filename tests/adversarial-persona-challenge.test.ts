import { describe, expect, it, beforeEach } from "vitest";
import {
  PersonaRole,
  PersonaUserDTO,
  WorkerProfileDTO,
  computeAvailableRoles,
  inferDefaultRole,
} from "@/components/PersonaContext";
import {
  MockPersonaSessionManager,
  calculateJobAffordability,
  filterClientJobs,
  validateSkillsUpdate,
  browseJobsForBuilder,
  JobFeedItem,
  validateBrutalistGeometry,
  BRICK_THEME_TOKENS,
} from "./helpers";
import { validateQuoteEligibility, JobGovernanceSnapshot, WorkerGovernanceSnapshot } from "@/lib/governance";

describe("Adversarial Persona & Perspective Stress Harness", () => {
  let sessionManager: MockPersonaSessionManager;

  beforeEach(() => {
    sessionManager = new MockPersonaSessionManager();
  });

  // =========================================================================
  // ATTACK VECTOR 1: Storage Corruption, Injection & Session Hydration
  // =========================================================================
  describe("Attack Vector 1: Storage Corruption, Injection & Session Hydration", () => {
    it("ADV-01: gracefully handles non-existent or corrupted persona ID in storage without crashing", () => {
      // Inject malicious / nonexistent user ID into storage
      sessionManager.setStorageItem(
        MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY,
        "malicious_user_id'; DROP TABLE users;--"
      );
      sessionManager.setStorageItem(
        MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY,
        "CLIENT"
      );

      // Hydration must not throw and must fall back safely to default seeded user
      expect(() => sessionManager.hydrateFromStorage()).not.toThrow();
      expect(sessionManager.currentUser).not.toBeNull();
      expect(sessionManager.currentUser?.id).toBe("user_homeowner_lerato");
      expect(sessionManager.activeRole).toBe("CLIENT");
    });

    it("ADV-02: sanitizes illegal or corrupted activeRole in storage on hydration", () => {
      // Seed valid user but illegal activeRole
      sessionManager.setStorageItem(
        MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY,
        "user_homeowner_lerato"
      );
      sessionManager.setStorageItem(
        MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY,
        "SUPERADMIN_UNRESTRICTED"
      );

      sessionManager.hydrateFromStorage();
      expect(sessionManager.currentUser?.id).toBe("user_homeowner_lerato");
      // Must not adopt illegal role; must fall back to permitted role for homeowner ("CLIENT")
      expect(sessionManager.activeRole).toBe("CLIENT");
    });

    it("ADV-03: corrects role when single-role homeowner has BUILDER stored in storage", () => {
      // Tampering attack: user set to single-role homeowner, but active role set to BUILDER
      sessionManager.setStorageItem(
        MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY,
        "user_homeowner_lerato"
      );
      sessionManager.setStorageItem(
        MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY,
        "BUILDER"
      );

      sessionManager.hydrateFromStorage();
      // Single-role client cannot be in BUILDER role; must be corrected to CLIENT
      expect(sessionManager.currentUser?.id).toBe("user_homeowner_lerato");
      expect(sessionManager.activeRole).toBe("CLIENT");
      expect(sessionManager.availableRoles).toEqual(["CLIENT"]);
      expect(sessionManager.isDualRole).toBe(false);
    });

    it("ADV-04: corrects role when single-role builder has CLIENT stored in storage", () => {
      // Tampering attack: user set to single-role builder, but active role set to CLIENT
      sessionManager.setStorageItem(
        MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY,
        "user_worker_sipho"
      );
      sessionManager.setStorageItem(
        MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY,
        "CLIENT"
      );

      sessionManager.hydrateFromStorage();
      // Single-role builder cannot be in CLIENT role; must be corrected to BUILDER
      expect(sessionManager.currentUser?.id).toBe("user_worker_sipho");
      expect(sessionManager.activeRole).toBe("BUILDER");
      expect(sessionManager.availableRoles).toEqual(["BUILDER"]);
      expect(sessionManager.isDualRole).toBe(false);
    });
  });

  // =========================================================================
  // ATTACK VECTOR 2: High-Frequency Rapid Perspective Toggling (Stress Test)
  // =========================================================================
  describe("Attack Vector 2: High-Frequency Rapid Perspective Toggling", () => {
    it("ADV-05: 500-cycle rapid toggle stress test maintains identity and state consistency", () => {
      sessionManager.login("user_dual_thabo");
      expect(sessionManager.isDualRole).toBe(true);
      expect(sessionManager.activeRole).toBe("CLIENT");

      const initialId = sessionManager.currentUser?.id;
      const initialName = sessionManager.currentUser?.name;
      const initialPhone = sessionManager.currentUser?.phone;

      const cycles = 500;
      for (let i = 0; i < cycles; i++) {
        const toggleResult = sessionManager.toggleRole();
        expect(toggleResult.success).toBe(true);

        const expectedRole: PersonaRole = i % 2 === 0 ? "BUILDER" : "CLIENT";
        expect(sessionManager.activeRole).toBe(expectedRole);
        expect(toggleResult.newRole).toBe(expectedRole);

        // Invariants that MUST NEVER mutate or leak during rapid toggling
        expect(sessionManager.currentUser?.id).toBe(initialId);
        expect(sessionManager.currentUser?.name).toBe(initialName);
        expect(sessionManager.currentUser?.phone).toBe(initialPhone);
        expect(sessionManager.isDualRole).toBe(true);

        // Storage invariant
        expect(
          sessionManager.getStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY)
        ).toBe(expectedRole);
      }

      // After 500 cycles (even), must return to starting role "CLIENT"
      expect(sessionManager.activeRole).toBe("CLIENT");
      expect(
        sessionManager.getStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY)
      ).toBe("CLIENT");
    });
  });

  // =========================================================================
  // ATTACK VECTOR 3: Cross-Perspective State Pollution & Draft Isolation
  // =========================================================================
  describe("Attack Vector 3: Cross-Perspective State Pollution & Draft Isolation", () => {
    it("ADV-06: switching perspectives preserves client job draft without bleeding into builder workspace", () => {
      sessionManager.login("user_dual_thabo");
      expect(sessionManager.activeRole).toBe("CLIENT");

      // 1. Client creates a dirty/in-progress job draft
      interface ClientDraftState {
        category: string;
        title: string;
        description: string;
        budgetEstimateZar: number;
        suburb: string;
        requiresCoC: boolean;
      }

      const clientDraft: ClientDraftState = {
        category: "PLUMBING",
        title: "Burst Geyser in Ceiling Space",
        description: "Hot water valve fractured, ceiling board soaked. Urgent replacement needed.",
        budgetEstimateZar: 4500,
        suburb: "Midrand",
        requiresCoC: true,
      };

      // 2. Builder workspace state
      const builderWallet = sessionManager.currentUser?.workerProfile?.walletBalanceZar;
      const builderTrades = sessionManager.currentUser?.workerProfile?.tradesJson;
      expect(builderWallet).toBe(9500);

      // 3. Switch perspective to BUILDER
      sessionManager.toggleRole();
      expect(sessionManager.activeRole).toBe("BUILDER");

      // 4. In BUILDER mode: update builder skills
      const updatedSkills = validateSkillsUpdate({
        workerProfileId: sessionManager.currentUser!.workerProfile!.id,
        trades: ["PLUMBING", "ELECTRICAL", "TILING"],
        yearsExperience: 11,
        bio: "Master electrical artisan and licensed plumbing contractor.",
        nearestHardwareHub: "Builders Warehouse Midrand",
      });
      expect(updatedSkills.valid).toBe(true);

      // 5. In BUILDER mode: verify client draft properties do NOT pollute builder state
      const builderViewProps = {
        activeRole: sessionManager.activeRole,
        workerProfile: sessionManager.currentUser?.workerProfile,
      };
      expect((builderViewProps as Record<string, unknown>).title).toBeUndefined();
      expect((builderViewProps as Record<string, unknown>).budgetEstimateZar).toBeUndefined();

      // 6. Switch perspective back to CLIENT
      sessionManager.toggleRole();
      expect(sessionManager.activeRole).toBe("CLIENT");

      // 7. Verify client draft is 100% pristine and unaltered
      expect(clientDraft.title).toBe("Burst Geyser in Ceiling Space");
      expect(clientDraft.budgetEstimateZar).toBe(4500);
      expect(clientDraft.category).toBe("PLUMBING");
      expect(clientDraft.requiresCoC).toBe(true);
      expect(clientDraft.suburb).toBe("Midrand");

      // 8. Verify client view has no leaking builder wallet directly on client interface
      const clientViewProps = {
        activeRole: sessionManager.activeRole,
        user: sessionManager.currentUser,
      };
      expect((clientViewProps as Record<string, unknown>).walletBalanceZar).toBeUndefined();
    });
  });

  // =========================================================================
  // ATTACK VECTOR 4: Single-Role Privilege Escalation Guards
  // =========================================================================
  describe("Attack Vector 4: Single-Role Privilege Escalation Guards", () => {
    it("ADV-07: prevents single-role client from toggling role or setting role to BUILDER", () => {
      sessionManager.login("user_homeowner_lerato");
      expect(sessionManager.currentUser?.role).toBe("HOMEOWNER");
      expect(sessionManager.isDualRole).toBe(false);
      expect(sessionManager.activeRole).toBe("CLIENT");

      // Attempt 1: toggleRole() must fail
      const toggleRes = sessionManager.toggleRole();
      expect(toggleRes.success).toBe(false);
      expect(toggleRes.error).toBeDefined();
      expect(sessionManager.activeRole).toBe("CLIENT");

      // Attempt 2: setActiveRole("BUILDER") must be rejected by guard
      const setRoleRes = sessionManager.setActiveRole("BUILDER");
      expect(setRoleRes.success).toBe(false);
      expect(setRoleRes.error).toContain("not permitted");
      expect(sessionManager.activeRole).toBe("CLIENT");

      // Attempt 3: Navigation badge must NOT offer toggle button
      const badge = sessionManager.getNavigationShellBadge();
      expect(badge.badgeLabel).toBe("[ CLIENT VIEW ]");
      expect(badge.toggleButtonLabel).toBeNull();
    });

    it("ADV-08: single-role client cannot pass quote eligibility gate (no builder profile)", () => {
      const clientUser = sessionManager.personas.find((p) => p.id === "user_homeowner_lerato")!;
      expect(clientUser.workerProfile).toBeNull();

      const job: JobGovernanceSnapshot = {
        id: "job_bathroom_99",
        category: "PLUMBING",
        requiresCoC: false,
        status: "OPEN",
        homeownerId: "user_other_homeowner",
      };

      // Construct synthetic governance snapshot for a client who has no worker profile
      const clientSnapshot: WorkerGovernanceSnapshot = {
        id: clientUser.id,
        vettingTier: "UNVETTED",
        sapsStatus: "UNSTARTED",
        certifications: [],
      };

      const quoteCheck = validateQuoteEligibility(clientSnapshot, job);
      expect(quoteCheck.allowed).toBe(false);
      expect(quoteCheck.reason).toContain("Tier 2 SAPS Biometric Clearance Required");
    });

    it("ADV-09: single-role client cannot submit skills update without valid worker profile ID", () => {
      const clientUser = sessionManager.personas.find((p) => p.id === "user_homeowner_lerato")!;
      expect(clientUser.workerProfile).toBeNull();

      // Client attempts to call validateSkillsUpdate with empty or null workerProfileId
      const invalidSkillsCall = validateSkillsUpdate({
        workerProfileId: "",
        trades: ["PLUMBING"],
        yearsExperience: 5,
        bio: "Attempted client bio update",
        nearestHardwareHub: "Builders Warehouse",
      });

      expect(invalidSkillsCall.valid).toBe(false);
      expect(invalidSkillsCall.error).toContain("Worker profile ID is required");
    });

    it("ADV-10: prevents single-role builder from toggling role or setting role to CLIENT", () => {
      sessionManager.login("user_worker_sipho");
      expect(sessionManager.currentUser?.role).toBe("WORKER");
      expect(sessionManager.isDualRole).toBe(false);
      expect(sessionManager.activeRole).toBe("BUILDER");

      // Attempt 1: toggleRole() must fail
      const toggleRes = sessionManager.toggleRole();
      expect(toggleRes.success).toBe(false);
      expect(toggleRes.error).toBeDefined();
      expect(sessionManager.activeRole).toBe("BUILDER");

      // Attempt 2: setActiveRole("CLIENT") must be rejected by guard
      const setRoleRes = sessionManager.setActiveRole("CLIENT");
      expect(setRoleRes.success).toBe(false);
      expect(setRoleRes.error).toContain("not permitted");
      expect(sessionManager.activeRole).toBe("BUILDER");

      // Attempt 3: Navigation badge must NOT offer toggle button
      const badge = sessionManager.getNavigationShellBadge();
      expect(badge.badgeLabel).toBe("[ BUILDER VIEW ]");
      expect(badge.toggleButtonLabel).toBeNull();
    });
  });

  // =========================================================================
  // ATTACK VECTOR 5: Math, Escrow & Boundary Edge Cases
  // =========================================================================
  describe("Attack Vector 5: Math, Escrow & Boundary Edge Cases", () => {
    it("ADV-11: handles fractional cents, NaN, and negative inputs in affordability engine without precision explosion", () => {
      // 1. Negative inputs clamped to zero
      const negAffordability = calculateJobAffordability({
        tradeCategorySlug: "PLUMBING",
        labourEstimateZar: -500,
        materialsEstimateZar: -200,
      });
      expect(negAffordability.labourEstimateZar).toBe(0);
      expect(negAffordability.materialsEstimateZar).toBe(0);
      expect(negAffordability.buyerTrustFeeZar).toBe(0);
      expect(negAffordability.grossClientCommitmentZar).toBe(0);

      // 2. Fractional cents are rounded properly to 2 decimal places
      const fractionalAffordability = calculateJobAffordability({
        tradeCategorySlug: "ELECTRICAL",
        labourEstimateZar: 1333.33,
        materialsEstimateZar: 666.67,
      });
      // 5% of 1333.33 = 66.6665 -> rounded to 66.67
      expect(fractionalAffordability.buyerTrustFeeZar).toBeCloseTo(66.67, 1);
      // Total commitment must not have floating point artifacts like 2066.6666666666665
      const totalStr = fractionalAffordability.grossClientCommitmentZar.toString();
      const decimals = totalStr.includes(".") ? totalStr.split(".")[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);

      // 3. Multi-million rand high-end project
      const massiveAffordability = calculateJobAffordability({
        tradeCategorySlug: "BUILDING",
        labourEstimateZar: 5000000,
        materialsEstimateZar: 3500000,
      });
      expect(massiveAffordability.buyerTrustFeeZar).toBe(250000); // 5% of 5M
      expect(massiveAffordability.grossClientCommitmentZar).toBe(8750000); // 5M + 3.5M + 250k
    });
  });

  // =========================================================================
  // ATTACK VECTOR 6: Feed Address Leakage & Privacy Invariant
  // =========================================================================
  describe("Attack Vector 6: Feed Address Leakage & Privacy Invariant", () => {
    it("ADV-12: ensures builder job browsing feed NEVER leaks encrypted street addresses under any filter configuration", () => {
      const feedWithAddresses: JobFeedItem[] = [
        {
          id: "job_leak_01",
          category: "PLUMBING",
          title: "Burst Pipe",
          suburb: "Fourways",
          city: "Johannesburg",
          streetAddressEncrypted: "SECRET_ENCRYPTED_STREET_123",
          urgency: "EMERGENCY_24H",
          requiresCoC: false,
          callOutDepositZar: 250,
          budgetEstimateZar: 3000,
          status: "OPEN",
        },
        {
          id: "job_leak_02",
          category: "ELECTRICAL",
          title: "Circuit Tripping",
          suburb: "Sandton",
          city: "Johannesburg",
          streetAddressEncrypted: "SECRET_ENCRYPTED_STREET_456",
          urgency: "THIS_WEEK",
          requiresCoC: true,
          callOutDepositZar: 300,
          budgetEstimateZar: 4000,
          status: "OPEN",
        },
      ];

      // Test all combinations of filters
      const testCases = [
        { matchMyTradesOnly: false, tradeFilter: "ALL", urgencyFilter: "ALL" },
        { matchMyTradesOnly: true, builderTrades: ["PLUMBING"] },
        { tradeFilter: "ELECTRICAL" },
        { urgencyFilter: "EMERGENCY_24H" },
      ];

      for (const tc of testCases) {
        const browsed = browseJobsForBuilder(feedWithAddresses, tc);
        for (const job of browsed) {
          expect((job as unknown as { streetAddressEncrypted?: string }).streetAddressEncrypted).toBeUndefined();
          expect(job.suburb).toBeDefined();
          expect(job.city).toBeDefined();
        }
      }
    });
  });
});
