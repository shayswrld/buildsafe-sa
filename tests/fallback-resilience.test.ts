import { describe, it, expect, vi } from "vitest";
import { DEFAULT_SEED_PERSONAS, DEFAULT_SEED_CREW_POOL } from "@/lib/seed-personas";
import { computeAvailableRoles, inferDefaultRole } from "@/components/PersonaContext";
import { GET as getBootstrap } from "@/app/api/bootstrap/route";
import { GET as getJobs } from "@/app/api/jobs/route";

describe("Runtime Resilience & Fallback Integrity", () => {
  it("provides four verified default seed personas with required fields", () => {
    expect(DEFAULT_SEED_PERSONAS).toHaveLength(4);

    const lerato = DEFAULT_SEED_PERSONAS.find((p) => p.id === "user_homeowner_lerato");
    expect(lerato).toBeDefined();
    expect(lerato?.role).toBe("HOMEOWNER");

    const sipho = DEFAULT_SEED_PERSONAS.find((p) => p.id === "user_worker_sipho");
    expect(sipho).toBeDefined();
    expect(sipho?.role).toBe("WORKER");
    expect(sipho?.workerProfile).toBeDefined();
    expect(sipho?.workerProfile?.vettingTier).toBe("TIER_3_COC_CERTIFIED");
    expect(sipho?.workerProfile?.sapsStatus).toBe("CLEARED");

    const johan = DEFAULT_SEED_PERSONAS.find((p) => p.id === "user_dual_johan");
    expect(johan).toBeDefined();
    expect(johan?.isDualRole).toBe(true);
    expect(johan?.workerProfile).toBeDefined();

    const admin = DEFAULT_SEED_PERSONAS.find((p) => p.id === "user_admin_owner");
    expect(admin).toBeDefined();
    expect(admin?.role).toBe("ADMIN");
  });

  it("cleared crew pool contains vetted worker profiles", () => {
    expect(DEFAULT_SEED_CREW_POOL.length).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_SEED_CREW_POOL[0].sapsStatus).toBe("CLEARED");
  });

  it("correctly computes available roles for seed personas", () => {
    const lerato = DEFAULT_SEED_PERSONAS[0];
    const sipho = DEFAULT_SEED_PERSONAS[1];
    const johan = DEFAULT_SEED_PERSONAS[2];
    const admin = DEFAULT_SEED_PERSONAS[3];

    expect(computeAvailableRoles(lerato)).toEqual(["CLIENT"]);
    expect(computeAvailableRoles(sipho)).toEqual(["BUILDER"]);
    expect(computeAvailableRoles(johan)).toEqual(["CLIENT", "BUILDER"]);
    expect(computeAvailableRoles(admin)).toEqual(["ADMIN", "CLIENT", "BUILDER"]);

    expect(inferDefaultRole(lerato)).toBe("CLIENT");
    expect(inferDefaultRole(sipho)).toBe("BUILDER");
    expect(inferDefaultRole(admin)).toBe("ADMIN");
  });

  it("handles null or undefined user in role computation without crashing", () => {
    expect(computeAvailableRoles(null)).toEqual(["CLIENT", "BUILDER"]);
    expect(inferDefaultRole(null)).toBe("CLIENT");
  });
});
