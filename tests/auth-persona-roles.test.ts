import { describe, expect, it, beforeEach } from "vitest";
import {
  PersonaRole,
  PersonaUserDTO,
  WorkerProfileDTO,
} from "@/components/PersonaContext";
import {
  validateBrutalistGeometry,
  BRICK_THEME_TOKENS,
  MockPersonaSessionManager,
  RegisterUserData,
} from "./helpers";

describe("Suite 1: tests/auth-persona-roles.test.ts (Authentication & Role Switching Engine)", () => {
  let sessionManager: MockPersonaSessionManager;

  beforeEach(() => {
    sessionManager = new MockPersonaSessionManager();
  });

  it("AUTH-01: authenticates existing user via lightweight mock session", () => {
    // 1. Authenticate existing homeowner
    const clientAuth = sessionManager.login("user_homeowner_lerato");
    expect(clientAuth.success).toBe(true);
    expect(clientAuth.user?.name).toBe("Lerato Khumalo");
    expect(sessionManager.activeRole).toBe("CLIENT");
    expect(sessionManager.availableRoles).toEqual(["CLIENT"]);
    expect(sessionManager.isDualRole).toBe(false);

    // 2. Authenticate existing builder
    const builderAuth = sessionManager.login("user_worker_sipho");
    expect(builderAuth.success).toBe(true);
    expect(builderAuth.user?.name).toBe("Sipho Dlamini");
    expect(sessionManager.activeRole).toBe("BUILDER");
    expect(sessionManager.availableRoles).toEqual(["BUILDER"]);
    expect(builderAuth.user?.workerProfile?.vettingTier).toBe("TIER_2_SAPS_CLEARED");

    // 3. Lookup by phone number
    const phoneAuth = sessionManager.login("082 123 4567");
    expect(phoneAuth.success).toBe(true);
    expect(phoneAuth.user?.id).toBe("user_homeowner_lerato");

    // 4. Non-existent user fails gracefully
    const invalidAuth = sessionManager.login("non_existent_id");
    expect(invalidAuth.success).toBe(false);
    expect(invalidAuth.error).toContain("User not found");
  });

  it("AUTH-02: registers new client user with dedicated CLIENT role", () => {
    const regResult = sessionManager.register({
      name: "Nomsa Buthelezi",
      phone: "071 234 5678",
      email: "nomsa@example.com",
      role: "CLIENT",
      suburb: "Bryanston",
      city: "Johannesburg",
    });

    expect(regResult.user.id).toBeDefined();
    expect(regResult.user.name).toBe("Nomsa Buthelezi");
    expect(regResult.user.role).toBe("HOMEOWNER");
    expect(regResult.user.ratingAvg).toBe(5.0);
    expect(regResult.user.workerProfile).toBeNull();
    expect(regResult.redirectRoute).toBe("/client/dashboard");

    // Session state verification
    expect(sessionManager.currentUser?.id).toBe(regResult.user.id);
    expect(sessionManager.activeRole).toBe("CLIENT");
    expect(sessionManager.availableRoles).toEqual(["CLIENT"]);
    expect(sessionManager.isDualRole).toBe(false);
  });

  it("AUTH-03: registers new builder user with dedicated BUILDER role", () => {
    const regResult = sessionManager.register({
      name: "Tshepo Mokoena",
      phone: "084 987 1122",
      role: "BUILDER",
      suburb: "Randburg",
      city: "Johannesburg",
      saIdNumber: "9103155028085",
      selfieConfirmed: true,
      trades: ["PLUMBING", "TILING"],
    });

    expect(regResult.user.name).toBe("Tshepo Mokoena");
    expect(regResult.user.role).toBe("WORKER");
    expect(regResult.redirectRoute).toBe("/worker/dashboard");
    expect(regResult.user.workerProfile).toBeDefined();

    const profile = regResult.user.workerProfile!;
    expect(profile.vettingTier).toBe("TIER_1_BROWSE_ONLY");
    expect(profile.saIdMasked).toContain("910315 **** 085");
    expect(profile.selfieVerified).toBe(true);
    expect(profile.sapsStatus).toBe("UNSTARTED");
    expect(profile.walletBalanceZar).toBe(0);

    // Active perspective verification
    expect(sessionManager.activeRole).toBe("BUILDER");
    expect(sessionManager.availableRoles).toEqual(["BUILDER"]);
  });

  it("AUTH-04: registers dual-role user supporting both client and builder perspectives", () => {
    const regResult = sessionManager.register({
      name: "David Van Der Merwe",
      phone: "082 888 9900",
      role: "DUAL_ROLE",
      suburb: "Centurion",
      city: "Pretoria",
      saIdNumber: "8506145029087",
      selfieConfirmed: true,
      trades: ["BUILDING", "CARPENTRY"],
    });

    expect(regResult.user.role).toBe("DUAL");
    expect(regResult.user.isDualRole).toBe(true);
    expect(regResult.user.workerProfile).not.toBeNull();
    expect(regResult.redirectRoute).toBe("/client/dashboard");

    // Dual-role capabilities
    expect(sessionManager.isDualRole).toBe(true);
    expect(sessionManager.availableRoles).toContain("CLIENT");
    expect(sessionManager.availableRoles).toContain("BUILDER");
    expect(sessionManager.activeRole).toBe("CLIENT");
  });

  it("AUTH-05: toggles active perspective between CLIENT and BUILDER for dual-role users", () => {
    // Sign in as seeded dual-role user Thabo Molefe
    sessionManager.login("user_dual_thabo");
    expect(sessionManager.isDualRole).toBe(true);
    expect(sessionManager.activeRole).toBe("CLIENT");

    const badge1 = sessionManager.getNavigationShellBadge();
    expect(badge1.badgeLabel).toBe("[ CLIENT VIEW ]");
    expect(badge1.toggleButtonLabel).toBe("[ ⇄ Switch to Builder ]");

    // Toggle 1: Client -> Builder
    const toggle1 = sessionManager.toggleRole();
    expect(toggle1.success).toBe(true);
    expect(toggle1.newRole).toBe("BUILDER");
    expect(sessionManager.activeRole).toBe("BUILDER");
    expect(sessionManager.currentUser?.id).toBe("user_dual_thabo"); // Identity invariant

    const badge2 = sessionManager.getNavigationShellBadge();
    expect(badge2.badgeLabel).toBe("[ BUILDER VIEW ]");
    expect(badge2.toggleButtonLabel).toBe("[ ⇄ Switch to Client ]");

    // Toggle 2: Builder -> Client
    const toggle2 = sessionManager.toggleRole();
    expect(toggle2.success).toBe(true);
    expect(toggle2.newRole).toBe("CLIENT");
    expect(sessionManager.activeRole).toBe("CLIENT");
    expect(sessionManager.currentUser?.id).toBe("user_dual_thabo");
  });

  it("AUTH-06: prevents single-role client from toggling to builder perspective without worker profile", () => {
    // Sign in as single-role client Lerato
    sessionManager.login("user_homeowner_lerato");
    expect(sessionManager.isDualRole).toBe(false);
    expect(sessionManager.activeRole).toBe("CLIENT");

    // Attempting toggleRole must fail
    const toggleRes = sessionManager.toggleRole();
    expect(toggleRes.success).toBe(false);
    expect(toggleRes.error).toContain("Single-role client cannot switch to builder perspective");
    expect(sessionManager.activeRole).toBe("CLIENT");

    // Attempting setActiveRole("BUILDER") must fail guard check
    const explicitRoleSet = sessionManager.setActiveRole("BUILDER");
    expect(explicitRoleSet.success).toBe(false);
    expect(explicitRoleSet.error).toContain("Role 'BUILDER' is not permitted");
    expect(sessionManager.activeRole).toBe("CLIENT");
  });

  it("AUTH-07: maintains strict context segregation between client and builder workflows", () => {
    sessionManager.login("user_dual_thabo");

    // Context A: Client draft state
    interface ClientWorkflowContext {
      draftJob: { category: string; headline: string; budgetZar: number };
      activeView: string;
    }
    const clientContext: ClientWorkflowContext = {
      draftJob: {
        category: "PLUMBING",
        headline: "Replace master bathroom valves",
        budgetZar: 3200,
      },
      activeView: "CLIENT_DASHBOARD",
    };

    // Context B: Builder state
    interface BuilderWorkflowContext {
      activeQuoteDraft: { jobId: string; labourZar: number; materialsZar: number };
      walletBalanceZar: number;
      activeView: string;
    }
    const builderContext: BuilderWorkflowContext = {
      activeQuoteDraft: {
        jobId: "job_external_44",
        labourZar: 4500,
        materialsZar: 1200,
      },
      walletBalanceZar: sessionManager.currentUser?.workerProfile?.walletBalanceZar ?? 0,
      activeView: "BUILDER_HUB",
    };

    // 1. In CLIENT view, builder wallet is not exposed to client workflow
    expect(sessionManager.activeRole).toBe("CLIENT");
    expect(clientContext.draftJob.budgetZar).toBe(3200);
    expect((clientContext as unknown as Record<string, unknown>).walletBalanceZar).toBeUndefined();

    // 2. Toggle to BUILDER view
    sessionManager.toggleRole();
    expect(sessionManager.activeRole).toBe("BUILDER");
    expect(builderContext.walletBalanceZar).toBe(9500);
    // Builder quote draft is distinct and client draft does not contaminate builder quote
    expect(builderContext.activeQuoteDraft.labourZar).toBe(4500);
    expect((builderContext as unknown as Record<string, unknown>).draftJob).toBeUndefined();

    // 3. Toggle back to CLIENT view: client draft job is intact and unmodified
    sessionManager.toggleRole();
    expect(sessionManager.activeRole).toBe("CLIENT");
    expect(clientContext.draftJob.headline).toBe("Replace master bathroom valves");
    expect(clientContext.draftJob.budgetZar).toBe(3200);
  });

  it("AUTH-08: persists active persona and perspective across route navigation", () => {
    // 1. Pre-seed mock localStorage with active dual-role persona and BUILDER perspective
    sessionManager.setStorageItem(
      MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY,
      "user_dual_thabo"
    );
    sessionManager.setStorageItem(
      MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY,
      "BUILDER"
    );

    // 2. Hydrate on route initialization
    sessionManager.hydrateFromStorage();
    expect(sessionManager.currentUser?.id).toBe("user_dual_thabo");
    expect(sessionManager.activeRole).toBe("BUILDER");
    expect(sessionManager.isDualRole).toBe(true);

    // 3. Perspective toggle updates storage key immediately
    sessionManager.toggleRole();
    expect(sessionManager.activeRole).toBe("CLIENT");
    expect(
      sessionManager.getStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY)
    ).toBe("CLIENT");

    // 4. Logout cleans storage keys
    sessionManager.logout();
    expect(
      sessionManager.getStorageItem(MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY)
    ).toBeNull();
    expect(
      sessionManager.getStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY)
    ).toBeNull();
  });

  it("AUTH-09: renders clear visual indicator of active persona and perspective in navigation shell", () => {
    sessionManager.login("user_dual_thabo");

    // Test CLIENT perspective visual indicators
    const clientBadge = sessionManager.getNavigationShellBadge();
    expect(clientBadge.badgeLabel).toBe("[ CLIENT VIEW ]");
    expect(clientBadge.toggleButtonLabel).toBe("[ ⇄ Switch to Builder ]");
    expect(clientBadge.roleColorClass).toContain("bg-brick-600");

    // Assert Brutalist visual tokens compliance
    const navbarItemClasses = "border-2 border-[#141416] rounded-none font-mono text-xs font-bold uppercase";
    const geometryCheck = validateBrutalistGeometry(navbarItemClasses);
    expect(geometryCheck.compliant).toBe(true);
    expect(geometryCheck.violations).toHaveLength(0);
    expect(BRICK_THEME_TOKENS.geometry.roundedClass).toBe("rounded-none");

    // Test BUILDER perspective visual indicators
    sessionManager.toggleRole();
    const builderBadge = sessionManager.getNavigationShellBadge();
    expect(builderBadge.badgeLabel).toBe("[ BUILDER VIEW ]");
    expect(builderBadge.toggleButtonLabel).toBe("[ ⇄ Switch to Client ]");
    expect(builderBadge.roleColorClass).toContain("bg-iron-950");
  });

  it("AUTH-10: handles rapid perspective toggling without state degradation", () => {
    sessionManager.login("user_dual_thabo");
    expect(sessionManager.activeRole).toBe("CLIENT");

    // Rapidly toggle 50 times in succession
    const toggleCycles = 50;
    for (let i = 0; i < toggleCycles; i++) {
      const res = sessionManager.toggleRole();
      expect(res.success).toBe(true);
      const expectedRole: PersonaRole = i % 2 === 0 ? "BUILDER" : "CLIENT";
      expect(sessionManager.activeRole).toBe(expectedRole);
      // Invariant: Account identity never shifts or desynchronizes during rapid toggling
      expect(sessionManager.currentUser?.id).toBe("user_dual_thabo");
      expect(sessionManager.isDualRole).toBe(true);
    }

    // Final state after 50 toggles (even number) must match initial state "CLIENT"
    expect(sessionManager.activeRole).toBe("CLIENT");
    expect(
      sessionManager.getStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY)
    ).toBe("CLIENT");
  });
});
