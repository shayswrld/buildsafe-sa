import { describe, expect, it } from "vitest";
import {
  checkSaIdBanEvasion,
  validateGateArrivalManifest,
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

  it("blocks workers or crew members whose 12-month SAPS clearance has expired", () => {
    const now = new Date("2026-11-02T12:00:00Z");
    const expiredLead = {
      id: "w_expired",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
      sapsExpiresAt: "2026-10-01T00:00:00Z",
    };

    const resLead = validateQuoteEligibility(expiredLead, standardJob, [], now);
    expect(resLead.allowed).toBe(false);
    expect(resLead.reason).toContain("SAPS Clearance Expired");

    const validLead = {
      id: "w_valid",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
      sapsExpiresAt: "2027-08-01T00:00:00Z",
    };
    const expiredCrewMember = {
      id: "w_crew_expired",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
      sapsExpiresAt: "2026-09-15T00:00:00Z",
      user: { name: "Lapsed Helper" },
    };

    const resCrew = validateQuoteEligibility(
      validLead,
      standardJob,
      [expiredCrewMember],
      now
    );
    expect(resCrew.allowed).toBe(false);
    expect(resCrew.reason).toContain("expired SAPS criminal clearance");
  });

  it("allows Tier 2 SAPS-cleared artisans on non-CoC jobs, but blocks if an accompanying company crew helper is unvetted", () => {
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

  it("prevents ban evasion when a flagged SA ID attempts to re-register or join a company crew roster", () => {
    const existingProfiles = [
      {
        id: "wp_flagged_1",
        saIdHash: "hash_convicted_offender_999",
        vettingTier: "SUSPENDED",
        sapsStatus: "FLAGGED_RECORD",
      },
      {
        id: "wp_active_2",
        saIdHash: "hash_existing_worker_111",
        vettingTier: "TIER_2_SAPS_CLEARED",
        sapsStatus: "CLEARED",
      },
    ];

    const bannedAttempt = checkSaIdBanEvasion(
      "hash_convicted_offender_999",
      existingProfiles
    );
    expect(bannedAttempt.allowed).toBe(false);
    expect(bannedAttempt.reason).toContain("Permanent Safety Ban");

    const duplicateAttempt = checkSaIdBanEvasion(
      "hash_existing_worker_111",
      existingProfiles
    );
    expect(duplicateAttempt.allowed).toBe(false);
    expect(duplicateAttempt.reason).toContain("Duplicate SA ID Blocked");

    const freshCandidate = checkSaIdBanEvasion(
      "hash_brand_new_artisan_777",
      existingProfiles
    );
    expect(freshCandidate.allowed).toBe(true);
  });

  it("enforces Gate Arrival Manifest headcount locks and blocks unannounced company personnel at the door", () => {
    // 1 Lead Builder + 1 Vetted Crew Member (`wp_gift`) = 2 expected people
    const validArrival = validateGateArrivalManifest({
      faceMatchConfirmed: true,
      expectedCrewProfileIds: ["wp_gift"],
      verifiedCrewProfileIds: ["wp_gift"],
      arrivingHeadcount: 2,
      unannouncedPersonnelPresent: false,
    });
    expect(validArrival.allowed).toBe(true);

    // Company shows up with 3 people instead of the 2 vetted people on the manifest
    const extraPersonArrived = validateGateArrivalManifest({
      faceMatchConfirmed: true,
      expectedCrewProfileIds: ["wp_gift"],
      arrivingHeadcount: 3,
    });
    expect(extraPersonArrived.allowed).toBe(false);
    expect(extraPersonArrived.reason).toContain("Gate Headcount Mismatch");

    // Company tries to substitute an unvetted crew member (`wp_thabo`) at the gate
    const substitutedPerson = validateGateArrivalManifest({
      faceMatchConfirmed: true,
      expectedCrewProfileIds: ["wp_gift"],
      verifiedCrewProfileIds: ["wp_thabo"],
      arrivingHeadcount: 2,
    });
    expect(substitutedPerson.allowed).toBe(false);
    expect(substitutedPerson.reason).toContain("Gate Crew Substitution Block");
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
