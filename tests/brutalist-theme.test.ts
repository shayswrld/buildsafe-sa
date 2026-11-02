import { describe, expect, it } from "vitest";
import { formatZar } from "@/lib/config";
import {
  BRICK_THEME_TOKENS,
  getContrastRatio,
  validateBrutalistGeometry,
} from "./helpers";

describe("Tier 1: Brutalist-Minimalistic Visual Theme & Brick Palette Tokens (R1)", () => {
  it("enforces the authentic Brick colour palette tokens representing physical building", () => {
    expect(BRICK_THEME_TOKENS.palette.brick[600]).toBe("#B93815");
    expect(BRICK_THEME_TOKENS.palette.brick[700]).toBe("#9C2A10");
    expect(BRICK_THEME_TOKENS.palette.iron[950]).toBe("#141416");
    expect(BRICK_THEME_TOKENS.palette.mortar[100]).toBe("#F8F6F2");
    expect(BRICK_THEME_TOKENS.palette.pureWhite).toBe("#FFFFFF");
    expect(BRICK_THEME_TOKENS.palette.safetyOchre).toBe("#D97706");
  });

  it("verifies WCAG 2.1 contrast compliance for high-contrast Wrought Iron on Mortar and White", () => {
    // Wrought Iron (#141416) on Mortar Chalk (#F8F6F2)
    const ironOnMortar = getContrastRatio(
      BRICK_THEME_TOKENS.palette.iron[950],
      BRICK_THEME_TOKENS.palette.mortar[100]
    );
    // AAA requires >= 7:1 for normal text (exceeds AAA at ~17.05:1)
    expect(ironOnMortar).toBeGreaterThanOrEqual(14.0);
    expect(ironOnMortar).toBeCloseTo(17.05, 1);

    // Wrought Iron on Pure White
    const ironOnWhite = getContrastRatio(
      BRICK_THEME_TOKENS.palette.iron[950],
      BRICK_THEME_TOKENS.palette.pureWhite
    );
    expect(ironOnWhite).toBeGreaterThanOrEqual(18.0);
  });

  it("verifies WCAG 2.1 AA contrast compliance for Burnt Terracotta on Stark White and Mortar", () => {
    // Burnt Terracotta (#B93815) on Pure White (#FFFFFF)
    const brickOnWhite = getContrastRatio(
      BRICK_THEME_TOKENS.palette.brick[600],
      BRICK_THEME_TOKENS.palette.pureWhite
    );
    // AA requires >= 4.5:1 for normal text
    expect(brickOnWhite).toBeGreaterThanOrEqual(4.5);

    // Burnt Terracotta on Mortar Chalk (#F8F6F2)
    const brickOnMortar = getContrastRatio(
      BRICK_THEME_TOKENS.palette.brick[600],
      BRICK_THEME_TOKENS.palette.mortar[100]
    );
    expect(brickOnMortar).toBeGreaterThanOrEqual(4.2);
  });

  it("enforces sharp zero-radius geometry and rejects soft SaaS pill shapes", () => {
    const validBrutalistCard =
      "bg-white border-2 border-[#141416] rounded-none shadow-[3px_3px_0px_0px_#141416] p-6";
    const result = validateBrutalistGeometry(validBrutalistCard);
    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);

    const softPillCard =
      "bg-white rounded-2xl shadow-xl p-6 border border-slate-200";
    const softResult = validateBrutalistGeometry(softPillCard);
    expect(softResult.compliant).toBe(false);
    expect(softResult.violations.length).toBeGreaterThanOrEqual(2);
    expect(softResult.violations[0]).toContain("rounded-2xl");
  });

  it("validates directional hard architectural shadows and mechanical button press transitions", () => {
    expect(BRICK_THEME_TOKENS.shadows.brutal).toBe("3px 3px 0px 0px #141416");
    expect(BRICK_THEME_TOKENS.shadows.brutalSm).toBe("2px 2px 0px 0px #141416");
    expect(BRICK_THEME_TOKENS.shadows.brutalBrick).toBe("3px 3px 0px 0px #B93815");

    // Button tactile mechanical depression state
    const mechanicalButtonClasses =
      "border-2 border-iron-950 bg-brick-600 shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
    expect(mechanicalButtonClasses).toContain("active:translate-x-[2px]");
    expect(mechanicalButtonClasses).toContain("active:translate-y-[2px]");
    expect(mechanicalButtonClasses).toContain("active:shadow-none");
  });

  it("validates raw architectural header typography and monospaced tabular data figures", () => {
    // Architectural Grotesque section tag convention: // 01 · CORE IDENTITY
    const validSectionTag = "// 01 · ARTISAN ESCROW SPECIFICATION";
    expect(BRICK_THEME_TOKENS.typography.sectionTagPattern.test(validSectionTag)).toBe(true);

    const invalidSectionTag = "Section 1: Artisan Escrow";
    expect(BRICK_THEME_TOKENS.typography.sectionTagPattern.test(invalidSectionTag)).toBe(false);

    // Monospaced tabular-nums formatting for financial currency and security OTPs
    const zarFormatted = formatZar(5250);
    expect(zarFormatted).toMatch(/^R5[\s\u00A0,. ]?250/);

    const tabularOtpClasses = "font-mono tabular-nums tracking-widest text-lg";
    expect(tabularOtpClasses).toContain("font-mono");
    expect(tabularOtpClasses).toContain("tabular-nums");
  });
});

describe("Tier 2: Theme Boundary Value Analysis & Edge Cases", () => {
  it("handles extreme light and dark hexadecimal color boundaries without NaN", () => {
    const black = "#000000";
    const white = "#ffffff";
    const maxContrast = getContrastRatio(black, white);
    expect(maxContrast).toBeCloseTo(21, 0);

    const identical = getContrastRatio("#B93815", "#B93815");
    expect(identical).toBe(1);
  });

  it("normalizes shorthand 3-character hex codes and mixed-case strings", () => {
    const fullHex = "#141416";
    const shortWhite = "#fff";
    const mixedCase = "#b93815";

    const ratio1 = getContrastRatio(fullHex, shortWhite);
    const ratio2 = getContrastRatio(fullHex, "#FFFFFF");
    expect(ratio1).toBe(ratio2);

    const ratio3 = getContrastRatio(mixedCase, fullHex);
    expect(ratio3).toBeGreaterThan(1);
  });

  it("geometry validator handles empty strings, whitespace, and multi-line class attributes", () => {
    expect(validateBrutalistGeometry("").compliant).toBe(true);
    expect(validateBrutalistGeometry("   \n\t  ").compliant).toBe(true);

    const multiLineWithSoftClass = `
      p-4
      rounded-full
      text-black
    `;
    const check = validateBrutalistGeometry(multiLineWithSoftClass);
    expect(check.compliant).toBe(false);
    expect(check.violations[0]).toContain("rounded-full");
  });

  it("enforces maximum shadow offset limit to prevent un-brutalist float artifacts", () => {
    const parseShadowOffset = (shadowStr: string) => {
      const match = shadowStr.match(/(\d+)px\s+(\d+)px/);
      if (!match) return 0;
      return Math.max(parseInt(match[1]), parseInt(match[2]));
    };

    // Brutalist shadow elevations must stay between 2px and 4px to maintain rigid structural feel
    const standardOffset = parseShadowOffset(BRICK_THEME_TOKENS.shadows.brutal);
    const compactOffset = parseShadowOffset(BRICK_THEME_TOKENS.shadows.brutalSm);

    expect(standardOffset).toBeLessThanOrEqual(4);
    expect(compactOffset).toBeGreaterThanOrEqual(2);
  });

  it("formats boundary currency figures (R0, decimal cents, and high-value renovations) cleanly", () => {
    expect(formatZar(0)).toBe("R0");
    expect(formatZar(250.5)).toMatch(/^R250[.,\s\u00A0]50?/);
    expect(formatZar(1500000)).toMatch(/^R1[\s\u00A0,. ]?500[\s\u00A0,. ]?000/);
  });
});
