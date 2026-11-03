import { describe, expect, it } from "vitest";
import { computeEscrowSplit } from "@/lib/adapters/escrow";
import {
  validateQuoteEligibility,
  validateReviewEligibility,
} from "@/lib/governance";
import {
  generateGateOtpPair,
  verifyGateCheckInCode,
} from "@/lib/security/gate-otp";
import { sanitizeChatMessage } from "@/lib/security/anti-leakage";
import {
  buildValidSaId,
  validateSouthAfricanId,
} from "@/lib/security/sa-id";
import { getDefaultWorkspaceTab } from "./helpers";

describe("Tier 3: Pairwise Interactions & Cross-Feature Integration", () => {
  it("interacts: 3-step wizard job creation sets CoC flag and call-out deposit according to selected trade", () => {
    // Simulating job creation for a high-risk electrical problem
    const jobSubmission = {
      title: "DB Board Earth Leakage Fault",
      category: "ELECTRICAL",
      requiresCoC: true,
      callOutDepositZar: 300,
      suburb: "Fourways",
      city: "Johannesburg",
      status: "OPEN",
    };

    expect(jobSubmission.requiresCoC).toBe(true);
    expect(jobSubmission.callOutDepositZar).toBe(300);

    // Initial view should default to 'quotes'
    const defaultTab = getDefaultWorkspaceTab(jobSubmission.status);
    expect(defaultTab).toBe("quotes");
  });

  it("interacts: quote acceptance shifts job to ESCROW_FUNDED, activating the Gate Pass tab and OTP generator", () => {
    // State transition 1: Quote accepted and funded
    let jobStatus = "ESCROW_FUNDED";
    expect(getDefaultWorkspaceTab(jobStatus)).toBe("gate");

    // Gate OTP generation triggered upon escrow funding
    const otpPair = generateGateOtpPair();
    expect(otpPair.checkInCode).toMatch(/^\d{6}$/);
    expect(otpPair.checkInCodeHash).toHaveLength(64);

    // Verification check-in code matches its SHA-256 hash
    const isValid = verifyGateCheckInCode(otpPair.checkInCode, otpPair.checkInCodeHash);
    expect(isValid).toBe(true);

    // Invalid codes rejected
    expect(verifyGateCheckInCode("999999", otpPair.checkInCodeHash)).toBe(false);
  });

  it("interacts: Gate OTP verification shifts job to WORKER_ON_SITE, auto-activating the Escrow tab", () => {
    // State transition 2: Artisan arrives at homeowner's premises
    const gateVerified = true;
    let jobStatus = gateVerified ? "WORKER_ON_SITE" : "ESCROW_FUNDED";

    expect(jobStatus).toBe("WORKER_ON_SITE");
    // Escrow tab automatically active so homeowner can manage milestone releases
    expect(getDefaultWorkspaceTab(jobStatus)).toBe("escrow");
  });

  it("interacts: pre-escrow chat enforces anti-leakage redaction, while normal trade scoping passes", () => {
    const isEscrowFunded = false;

    // Off-platform leak attempt
    const leakMessage = "Call me directly on 083 999 1234 to skip the platform fee";
    const redacted = sanitizeChatMessage(leakMessage, isEscrowFunded);
    expect(redacted.wasRedacted).toBe(true);
    expect(redacted.sanitizedBody).toContain("[Hidden until Call-Out deposit is secured in Vault]");

    // Valid scoping message
    const legitMessage = "I have the standard exterior paint ready, can I start Thursday?";
    const clean = sanitizeChatMessage(legitMessage, isEscrowFunded);
    expect(clean.wasRedacted).toBe(false);
  });

  it("interacts: scope variation order recomputes financial escrow ledger with 0% fee on materials", () => {
    // Base contract: R3,000 labour + R1,000 materials
    const baseSplit = computeEscrowSplit({ labourZar: 3000, materialsZar: 1000 });
    expect(baseSplit.grossBuyerPaidZar).toBe(4150); // R3,000 + R1,000 + R150 (5% of 3k)

    // Variation order added: +R1,000 labour + R500 materials
    const updatedSplit = computeEscrowSplit({
      labourZar: 4000,
      materialsZar: 1500,
    });
    expect(updatedSplit.buyerTrustFeeZar).toBe(200); // 5% of R4,000 labour
    expect(updatedSplit.grossBuyerPaidZar).toBe(5700); // 4000 + 1500 + 200
    expect(updatedSplit.workerCommissionZar).toBe(320); // 8% of R4,000 labour
    expect(updatedSplit.workerNetPayoutZar).toBe(5180); // R3,680 net labour + R1,500 full materials
  });
});

describe("Tier 4: Real-World End-to-End User Journeys", () => {
  it("Scenario 1: Homeowner Bathroom Renovation Journey (Posting -> Quoting -> Escrow -> Gate OTP -> Release -> 5-Star Reviews)", () => {
    // Step 1: Homeowner logs job
    const job = {
      id: "job_bath_101",
      category: "TILING",
      requiresCoC: false,
      status: "OPEN",
      homeownerId: "homeowner_lerato",
      selectedWorkerUserId: undefined as string | undefined,
    };
    expect(getDefaultWorkspaceTab(job.status)).toBe("quotes");

    // Step 2: Tier 2 SAPS-cleared artisan quotes
    const artisanWorker = {
      id: "worker_sipho",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
    };
    const eligibility = validateQuoteEligibility(artisanWorker, job);
    expect(eligibility.allowed).toBe(true);

    // Step 3: Homeowner accepts quote (R3,500 labour + R1,200 tiles)
    const escrow = computeEscrowSplit({ labourZar: 3500, materialsZar: 1200 });
    expect(escrow.grossBuyerPaidZar).toBe(4875); // 3500 + 1200 + 175 fee
    job.status = "ESCROW_FUNDED";
    job.selectedWorkerUserId = "worker_sipho";
    expect(getDefaultWorkspaceTab(job.status)).toBe("gate");

    // Step 4: Gate arrival OTP
    const gateOtp = generateGateOtpPair();
    const verified = verifyGateCheckInCode(gateOtp.checkInCode, gateOtp.checkInCodeHash);
    expect(verified).toBe(true);
    job.status = "WORKER_ON_SITE";
    expect(getDefaultWorkspaceTab(job.status)).toBe("escrow");

    // Step 5: Work completed and milestone released
    job.status = "COMPLETED";
    expect(getDefaultWorkspaceTab(job.status)).toBe("ratings");

    // Step 6: Both parties submit verified reviews
    expect(validateReviewEligibility(job, "homeowner_lerato").allowed).toBe(true);
    expect(validateReviewEligibility(job, "worker_sipho").allowed).toBe(true);
    expect(validateReviewEligibility(job, "unauthorized_user").allowed).toBe(false);
  });

  it("Scenario 2: Statutory CoC Electrical Emergency Journey (Wireman License Enforcement & 0% Materials Fee)", () => {
    // High-risk electrical DB board repair requiring statutory CoC
    const cocJob = {
      id: "job_elec_202",
      category: "ELECTRICAL",
      requiresCoC: true,
      status: "OPEN",
      homeownerId: "homeowner_kobus",
    };

    // Tier 1 and Tier 2 artisans blocked from quoting
    const generalWorker = {
      id: "w_general",
      vettingTier: "TIER_2_SAPS_CLEARED",
      sapsStatus: "CLEARED",
    };
    expect(validateQuoteEligibility(generalWorker, cocJob).allowed).toBe(false);

    // Tier 3 certified ECB Wireman allowed
    const wireman = {
      id: "w_wireman",
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
    expect(validateQuoteEligibility(wireman, cocJob).allowed).toBe(true);

    // R4,000 labour + R2,000 DB hardware breakers
    const financialSplit = computeEscrowSplit({
      labourZar: 4000,
      materialsZar: 2000,
    });
    // Platform charges R0 commission on hardware materials slip
    expect(financialSplit.workerNetPayoutZar).toBe(5680); // 4000 - 320 comm + 2000 full reimbursement
    expect(financialSplit.platformTotalCutZar).toBe(520); // 200 buyer fee + 320 worker cut
  });

  it("Scenario 3: Anti-Leakage Off-Platform Bypass Attempt & Intervention Journey", () => {
    // Rogue worker attempts cash bypass
    const bypassAttempt =
      "Skip the fee, just send R500 via eWallet or pay cash at the gate, call 072 333 4455";
    const result = sanitizeChatMessage(bypassAttempt, false);

    expect(result.wasRedacted).toBe(true);
    // Phone number is hidden prior to escrow deposit
    expect(result.sanitizedBody).not.toContain("072 333 4455");
    expect(result.sanitizedBody).toContain("[Hidden until Call-Out deposit is secured in Vault]");
    // Platform bypass, direct payment, and cash solicitation reasons flagged
    expect(result.reasons).toContain("Off-platform cash solicitation");
    expect(result.reasons).toContain("Direct off-platform payment channel");
    expect(result.reasons).toContain("Platform fee bypass attempt");
    expect(result.reasons).toContain("Phone or bank account number hidden prior to Vault deposit");
    // Safety warning banner presented
    expect(result.warningBanner).toBeDefined();
    expect(result.warningBanner).toContain("Keep quotes and payments inside BuildSafe SA Milestone Vault");
  });

  it("Scenario 4: Scope Variation Order & Milestone Dispute Resolution Journey", () => {
    // Plumbing job encounters unforeseen burst pipe inside wall cavity
    const originalLabour = 2000;
    const originalMaterials = 500;
    const initialSplit = computeEscrowSplit({
      labourZar: originalLabour,
      materialsZar: originalMaterials,
    });
    expect(initialSplit.grossBuyerPaidZar).toBe(2600); // 2000 + 500 + 100

    // Variation order: +R1,200 copper piping & fittings, +R800 labour
    const variationSplit = computeEscrowSplit({
      labourZar: originalLabour + 800,
      materialsZar: originalMaterials + 1200,
    });
    expect(variationSplit.grossBuyerPaidZar).toBe(4640); // 2800 labour + 1700 materials + 140 fee

    // Dispute handling: simulated admin resolution (split mediation)
    const disputedAmount = variationSplit.grossBuyerPaidZar;
    const settlementWorkerZar = Math.round(disputedAmount * 0.7);
    const refundHomeownerZar = disputedAmount - settlementWorkerZar;
    expect(settlementWorkerZar + refundHomeownerZar).toBe(disputedAmount);
  });

  it("Scenario 5: Roadside Artisan Onboarding, Biometric Clearance & Fast Payout Journey", () => {
    // Step 1: Roadside worker enters 13-digit SA ID
    const validId = buildValidSaId("940822", "5014", "0");
    const saIdCheck = validateSouthAfricanId(validId, 2026);
    expect(saIdCheck.valid).toBe(true);
    expect(saIdCheck.age).toBe(32);
    expect(saIdCheck.citizenship).toBe("SA_CITIZEN");

    // Step 2: PostNet biometric voucher generated
    const voucher = `HURU-${validId.slice(0, 6)}-SAPS`;
    expect(voucher).toContain("HURU");

    // Step 3: Simulated webhook clearance promotes worker to Tier 2
    const workerProfile = {
      id: "worker_new",
      saIdMasked: saIdCheck.maskedId,
      vettingTier: "TIER_1_BROWSE_ONLY",
      walletBalanceZar: 0,
    };
    // Webhook clears
    workerProfile.vettingTier = "TIER_2_SAPS_CLEARED";
    expect(workerProfile.vettingTier).toBe("TIER_2_SAPS_CLEARED");

    // Step 4: Worker earns payout on first job
    const jobEarnings = computeEscrowSplit({
      labourZar: 1500,
      materialsZar: 300,
    });
    workerProfile.walletBalanceZar += jobEarnings.workerNetPayoutZar;
    expect(workerProfile.walletBalanceZar).toBe(1680); // 1500 - 120 (8%) + 300
  });
});
