import { describe, expect, it } from "vitest";
import {
  validateQuoteEligibility,
  validateReviewEligibility,
} from "@/lib/governance";
import {
  generateGateOtpPair,
  verifyGateCheckInCode,
} from "@/lib/security/gate-otp";

describe("3-Tier Worker Security Governance, Crew Manifest & Gate OTP", () => {
  const standardJob = {
    id: "job_1",
    category: "PAINTING",
    requiresCoC: false,
    status: "OPEN",
    homeownerId: "home_1",
  };

  const cocElectricalJob = {
    id: "job_2",
    category: "ELECTRICAL",
    requiresCoC: true,
    status: "OPEN",
    homeownerId: "home_1",
  };

  it("blocks Tier 1 (Browse-Only) workers from submitting quotes before SAPS clearance", () => {
    const res = validateQuoteEligibility(
      { id: "w1", vettingTier: "TIER_1_BROWSE_ONLY", sapsStatus: "UNSTARTED" },
      standardJob
    );

    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Tier 2 SAPS Biometric Clearance Required");
  });

  it("blocks workers with a flagged criminal record permanently", () => {
    const res = validateQuoteEligibility(
      { id: "w_bad", vettingTier: "SUSPENDED", sapsStatus: "FLAGGED_RECORD" },
      standardJob
    );

    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Safety Block");
  });

  it("allows Tier 2 SAPS-cleared artisans on non-CoC jobs, but blocks if an accompanying crew helper is unvetted", () => {
    const clearedLead = {
      id: "w2",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
    };

    expect(validateQuoteEligibility(clearedLead, standardJob, []).allowed).toBe(
      true
    );

    const withUnvettedHelper = validateQuoteEligibility(
      clearedLead,
      standardJob,
      [
        {
          id: "w_unvetted",
          vettingTier: "TIER_1_BROWSE_ONLY",
          sapsStatus: "UNSTARTED",
          user: { name: "Unvetted Street Helper" },
        },
      ]
    );

    expect(withUnvettedHelper.allowed).toBe(false);
    expect(withUnvettedHelper.reason).toContain("Crew Safety Block");
  });

  it("requires a verified Tier 3 CoC specialist when a job requires a statutory Certificate of Compliance", () => {
    const tier2Worker = {
      id: "w2",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
    };
    expect(validateQuoteEligibility(tier2Worker, cocElectricalJob).allowed).toBe(
      false
    );

    const tier3Electrician = {
      id: "w3",
      vettingTier: "TIER_3_COC_CERTIFIED",
      sapsStatus: "CLEARED",
      certifications: [
        {
          tradeCategory: "ELECTRICAL",
          status: "VERIFIED",
          body: "ECB_WIREMAN",
        },
      ],
    };
    expect(
      validateQuoteEligibility(tier3Electrician, cocElectricalJob).allowed
    ).toBe(true);
  });

  it("verifies 6-digit Gate Check-In OTP hashes and enforces verified-job two-way review rules", () => {
    const otp = generateGateOtpPair();
    expect(verifyGateCheckInCode(otp.checkInCode, otp.checkInCodeHash)).toBe(true);
    expect(verifyGateCheckInCode("000000", otp.checkInCodeHash)).toBe(false);

    // Cannot review an OPEN job with no visit
    expect(
      validateReviewEligibility(
        { ...standardJob, selectedWorkerUserId: "u_worker" },
        "home_1"
      ).allowed
    ).toBe(false);

    // Both homeowner and worker CAN review once COMPLETED
    const completedJob = {
      ...standardJob,
      status: "COMPLETED",
      selectedWorkerUserId: "u_worker",
    };
    expect(validateReviewEligibility(completedJob, "home_1").allowed).toBe(true);
    expect(validateReviewEligibility(completedJob, "u_worker").allowed).toBe(
      true
    );
    expect(validateReviewEligibility(completedJob, "random_stranger").allowed).toBe(
      false
    );
  });
});
