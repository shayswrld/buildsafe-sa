import crypto from "crypto";

export interface HuruVoucherResult {
  voucherCode: string;
  capturePartnerInstructions: string;
  feeZar: number;
}

export interface SapsWebhookResult {
  sapsStatus: "CLEARED" | "FLAGGED_RECORD";
  sapsCertificateRef: string | null;
  newVettingTier: "TIER_2_SAPS_CLEARED" | "SUSPENDED";
  summary: string;
}

/**
 * Simulated South African HURU + AFISwitch Biometric Criminal Record Vetting Adapter.
 * Ready to swap with live HURU / MIE REST endpoints using process.env.HURU_API_KEY.
 */
export class SimulatedHuruAfiswitchAdapter {
  generateFingerprintVoucher(feeZar: number = 200): HuruVoucherResult {
    const token = crypto.randomBytes(3).toString("hex").toUpperCase();
    return {
      voucherCode: `HURU-ZA-${token}`,
      feeZar,
      capturePartnerInstructions:
        "Present this barcode with your original SA ID book/smart card at any PostNet, Jetline, or participating Builders Hub biometric scanner for AFISwitch -> SAPS Criminal Record capture.",
    };
  }

  simulateAfiswitchResult(simulateOutcome: "CLEAR" | "FLAGGED"): SapsWebhookResult {
    if (simulateOutcome === "FLAGGED") {
      return {
        sapsStatus: "FLAGGED_RECORD",
        sapsCertificateRef: null,
        newVettingTier: "SUSPENDED",
        summary:
          "AFISwitch / SAPS Criminal Record Centre returned a previous conviction match. Account permanently blocked from accepting homeowner jobs.",
      };
    }

    const certNum = Math.floor(100000 + Math.random() * 900000);
    return {
      sapsStatus: "CLEARED",
      sapsCertificateRef: `SAPS-CRC-2026-${certNum}`,
      newVettingTier: "TIER_2_SAPS_CLEARED",
      summary:
        "Zero criminal convictions found on SAPS Criminal Record Centre via AFISwitch biometric match. Cleared to quote and enter client homes.",
    };
  }
}

export const vettingAdapter = new SimulatedHuruAfiswitchAdapter();
