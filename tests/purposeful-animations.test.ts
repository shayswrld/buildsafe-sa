import { describe, expect, it } from "vitest";
import {
  ANIMATION_TOKENS,
  calculateEscrowProportions,
} from "./helpers";

describe("Tier 1: Purposeful Micro-Interactions & Mechanical Animations (R3)", () => {
  it("enforces 100ms tactile mechanical button depression with 2px offset and shadow collapse", () => {
    expect(ANIMATION_TOKENS.buttonPress.durationMs).toBe(100);
    expect(ANIMATION_TOKENS.buttonPress.durationClass).toBe("duration-100");
    expect(ANIMATION_TOKENS.buttonPress.activeTranslate).toBe(
      "active:translate-x-[2px] active:translate-y-[2px]"
    );
    expect(ANIMATION_TOKENS.buttonPress.activeShadow).toBe("active:shadow-none");
  });

  it("enforces 150ms transitions for progressive disclosures and tab switches", () => {
    expect(ANIMATION_TOKENS.accordionDisclosure.durationMs).toBe(150);
    expect(ANIMATION_TOKENS.accordionDisclosure.durationClass).toBe("duration-150");
    expect(ANIMATION_TOKENS.tabSwitch.durationMs).toBe(150);
    expect(ANIMATION_TOKENS.tabSwitch.durationClass).toBe("duration-150");
  });

  it("calculates live reactive escrow proportions accurately for animated split bar", () => {
    // R2,000 labour + R800 materials -> total R2,900 (incl R100 fee)
    const prop = calculateEscrowProportions(2000, 800);
    expect(prop.totalZar).toBe(2900);
    expect(prop.split.buyerTrustFeeZar).toBe(100);
    expect(prop.split.workerNetPayoutZar).toBe(2640);

    // Sum of segments equals approximately 100%
    const sum = prop.labourPct + prop.materialsPct + prop.feePct;
    expect(sum).toBeCloseTo(100, 0);

    // Labour is ~69.0%, Materials is ~27.6%, Fee is ~3.4%
    expect(prop.labourPct).toBeGreaterThan(65);
    expect(prop.materialsPct).toBeGreaterThan(25);
    expect(prop.feePct).toBeLessThan(5);
  });

  it("specifies tactile 6-digit OTP verification stamp snap animation with 12-degree tilt", () => {
    expect(ANIMATION_TOKENS.verifiedStamp.rotationDeg).toBe(-12);
    expect(ANIMATION_TOKENS.verifiedStamp.stampClasses).toContain("-rotate-12");
    expect(ANIMATION_TOKENS.verifiedStamp.stampClasses).toContain("scale-100");
    expect(ANIMATION_TOKENS.verifiedStamp.stampClasses).toContain("duration-150");
  });

  it("enforces motion-reduce accessibility compliance to suppress motion for sensitive users", () => {
    const reducedClasses = ANIMATION_TOKENS.accessibility.reducedMotionClasses;
    expect(reducedClasses).toContain("motion-reduce:transition-none");
    expect(reducedClasses).toContain("motion-reduce:transform-none");
  });
});

describe("Tier 2: Animation Boundaries & Extremes", () => {
  it("enforces that no animation in the design system exceeds the 200ms brutalist speed limit", () => {
    const allDurations = [
      ANIMATION_TOKENS.buttonPress.durationMs,
      ANIMATION_TOKENS.accordionDisclosure.durationMs,
      ANIMATION_TOKENS.tabSwitch.durationMs,
      ANIMATION_TOKENS.proportionalBar.durationMs,
      ANIMATION_TOKENS.verifiedStamp.durationMs,
    ];

    for (const d of allDurations) {
      expect(d).toBeLessThanOrEqual(ANIMATION_TOKENS.accessibility.maxAllowedDurationMs);
      expect(d).toBeGreaterThanOrEqual(50); // Snappy, not instant 0ms flash
    }
  });

  it("handles R0 labour and R0 materials in split bar without division by zero errors", () => {
    const zeroSplit = calculateEscrowProportions(0, 0);
    expect(zeroSplit.totalZar).toBe(0);
    expect(zeroSplit.labourPct).toBe(0);
    expect(zeroSplit.materialsPct).toBe(0);
    expect(zeroSplit.feePct).toBe(0);
  });

  it("handles pure hardware materials slip (labour = 0) with 100% materials bar", () => {
    const pureSlip = calculateEscrowProportions(0, 1500);
    expect(pureSlip.totalZar).toBe(1500);
    expect(pureSlip.labourPct).toBe(0);
    expect(pureSlip.materialsPct).toBe(100);
    expect(pureSlip.feePct).toBe(0);
    expect(pureSlip.split.platformTotalCutZar).toBe(0);
  });

  it("clamps negative or NaN slider inputs to 0 gracefully", () => {
    const clampedNegative = calculateEscrowProportions(-500, -200);
    expect(clampedNegative.totalZar).toBe(0);
    expect(clampedNegative.labourPct).toBe(0);

    const nanHandled = calculateEscrowProportions(NaN, NaN);
    expect(nanHandled.totalZar).toBe(0);
  });

  it("handles extreme high-value renovation calculations (R500,000 labour + R250,000 materials)", () => {
    const largeJob = calculateEscrowProportions(500000, 250000);
    expect(largeJob.split.buyerTrustFeeZar).toBe(25000); // 5% of R500k
    expect(largeJob.split.grossBuyerPaidZar).toBe(775000);
    expect(largeJob.split.workerNetPayoutZar).toBe(710000); // 500k - 40k commission + 250k
    expect(largeJob.labourPct + largeJob.materialsPct + largeJob.feePct).toBeCloseTo(100, 0);
  });
});
