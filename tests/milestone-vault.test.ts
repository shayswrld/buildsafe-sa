import { describe, expect, it } from "vitest";
import {
  computeMilestoneSplit,
  computeEscrowSplit,
  vaultAdapter,
  escrowAdapter,
} from "@/lib/adapters/vault";
import { VAULT_LEXICON } from "@/lib/config";
import { sanitizeChatMessage } from "@/lib/security/anti-leakage";

describe("Milestone Vault & Job Guarantee Architecture", () => {
  describe("Financial Engine & 0% Material Pass-Through", () => {
    it("charges 5% buyer fee and 8% artisan commission strictly on labour (0% on materials)", () => {
      const split = computeMilestoneSplit({
        labourZar: 3000,
        materialsZar: 1200,
      });

      expect(split.buyerTrustFeeZar).toBe(150); // 5% of R3,000
      expect(split.workerCommissionZar).toBe(240); // 8% of R3,000
      expect(split.grossBuyerPaidZar).toBe(4350); // R3,000 labour + R1,200 materials + R150 fee
      expect(split.workerNetPayoutZar).toBe(3960); // (R3,000 - R240) + R1,200 100% materials
      expect(split.platformTotalCutZar).toBe(390); // R150 + R240
    });

    it("rewards repeat bookings with 4% loyalty commission rate", () => {
      const split = computeMilestoneSplit({
        labourZar: 3000,
        materialsZar: 0,
        isRepeatBooking: true,
      });

      expect(split.workerCommissionPct).toBe(0.04);
      expect(split.workerCommissionZar).toBe(120);
      expect(split.workerNetPayoutZar).toBe(2880);
    });

    it("preserves backward-compatible computeEscrowSplit and escrowAdapter aliases", () => {
      const split1 = computeMilestoneSplit({ labourZar: 2000, materialsZar: 500 });
      const split2 = computeEscrowSplit({ labourZar: 2000, materialsZar: 500 });

      expect(split1).toEqual(split2);
      expect(escrowAdapter).toBe(vaultAdapter);
    });
  });

  describe("Sandbox Vault Adapter Interface", () => {
    it("allocates funds and returns formatted VAULT reference", async () => {
      const res = await vaultAdapter.allocateFunds({
        milestoneId: "cm3samplemilestone99",
        labourZar: 2500,
        materialsZar: 800,
      });

      expect(res.success).toBe(true);
      expect(res.vaultRef).toContain("VAULT-CM3SAMPL");
    });

    it("pauses for touch-up and returns paused confirmation", async () => {
      const res = await vaultAdapter.pauseForTouchUp("cm3samplemilestone99");
      expect(res.paused).toBe(true);
    });

    it("disburses payout with idempotency key", async () => {
      const res = await vaultAdapter.disbursePayout(
        "cm3samplemilestone99",
        "payout_milestone_cm3samplemilestone99"
      );
      expect(res.success).toBe(true);
      expect(res.disbursedAt).toBeDefined();
    });
  });

  describe("Centralized VAULT_LEXICON", () => {
    it("defines consistent non-jargon terms for all UI touchpoints", () => {
      expect(VAULT_LEXICON.vaultName).toBe("Milestone Vault");
      expect(VAULT_LEXICON.jobGuarantee).toBe("Job Guarantee");
      expect(VAULT_LEXICON.fundedBadge).toBe("FUNDS SECURED IN VAULT");
      expect(VAULT_LEXICON.approveButton).toBe("Approve & Payout Labour");
      expect(VAULT_LEXICON.touchUpButton).toBe("Request a Touch-Up");
      expect(VAULT_LEXICON.touchUpBanner).toBe("72-Hour Fix Window Active");
      expect(VAULT_LEXICON.preBookingProtection).toBe("Pre-Booking Protection");
      expect(VAULT_LEXICON.extensionButton).toBe("Request 24h Blackout Extension");
    });
  });

  describe("Anti-Leakage Protection Compatibility", () => {
    it("masks contact info with boolean parameter", () => {
      const res = sanitizeChatMessage("Call me on 082 123 4567", false);
      expect(res.wasRedacted).toBe(true);
      expect(res.sanitizedBody).toContain("[Hidden until Call-Out deposit is secured in Vault]");
    });

    it("masks contact info with options object { isVaultFunded: false }", () => {
      const res = sanitizeChatMessage("Call me on 082 123 4567", { isVaultFunded: false });
      expect(res.wasRedacted).toBe(true);
      expect(res.sanitizedBody).toContain("[Hidden until Call-Out deposit is secured in Vault]");
    });

    it("unmasks contact info when { isVaultFunded: true }", () => {
      const res = sanitizeChatMessage("Call me on 082 123 4567", { isVaultFunded: true });
      expect(res.wasRedacted).toBe(false);
      expect(res.sanitizedBody).toContain("082 123 4567");
    });
  });
});
