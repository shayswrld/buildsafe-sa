import { describe, expect, it } from "vitest";
import { computeEscrowSplit } from "@/lib/adapters/escrow";

describe("Escrow Commission & Labour-vs-Materials Split Engine", () => {
  it("charges 5% buyer fee and 8% worker commission strictly on labour (0% on hardware materials)", () => {
    const split = computeEscrowSplit({
      labourZar: 2000,
      materialsZar: 800,
    });

    expect(split.buyerTrustFeeZar).toBe(100); // 5% of R2,000 labour
    expect(split.grossBuyerPaidZar).toBe(2900); // R2,000 + R800 + R100
    expect(split.workerCommissionZar).toBe(160); // 8% of R2,000 labour
    expect(split.workerNetPayoutZar).toBe(2640); // R1,840 net labour + 100% of R800 materials
    expect(split.platformTotalCutZar).toBe(260); // R100 + R160
  });

  it("rewards repeat-client bookings with the 4% loyalty worker commission rate", () => {
    const split = computeEscrowSplit({
      labourZar: 2000,
      materialsZar: 500,
      isRepeatBooking: true,
    });

    expect(split.workerCommissionPct).toBe(0.04);
    expect(split.workerCommissionZar).toBe(80);
    expect(split.workerNetPayoutZar).toBe(2420);
    expect(split.platformTotalCutZar).toBe(180);
  });

  it("charges R0 commission on a pure hardware-store material slip reimbursement", () => {
    const split = computeEscrowSplit({
      labourZar: 0,
      materialsZar: 1450,
    });

    expect(split.buyerTrustFeeZar).toBe(0);
    expect(split.workerCommissionZar).toBe(0);
    expect(split.grossBuyerPaidZar).toBe(1450);
    expect(split.workerNetPayoutZar).toBe(1450);
    expect(split.platformTotalCutZar).toBe(0);
  });
});
