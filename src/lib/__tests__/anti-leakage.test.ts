import { describe, expect, it } from "vitest";
import { sanitizeChatMessage } from "@/lib/security/anti-leakage";

describe("Pre-Escrow Masked Chat & Anti-Leakage Filter", () => {
  it("redacts South African +27 and 082 mobile numbers before Escrow is funded", () => {
    const res = sanitizeChatMessage(
      "Hi, call me on 082 456 7890 or +27 73 111 2233 so we can talk",
      false
    );

    expect(res.wasRedacted).toBe(true);
    expect(res.sanitizedBody).not.toContain("082 456 7890");
    expect(res.sanitizedBody).not.toContain("73 111 2233");
    expect(res.sanitizedBody).toContain("[Hidden until Call-Out Escrow is funded]");
    expect(res.warningBanner).toBeDefined();
  });

  it("catches spelled-out phone digits attempting to evade numeric filters", () => {
    const res = sanitizeChatMessage(
      "Reach me at zero eight two five five five one two three four",
      false
    );

    expect(res.wasRedacted).toBe(true);
    expect(res.sanitizedBody).toContain("[Hidden until Call-Out Escrow is funded]");
  });

  it("flags cash-at-the-gate / eWallet fee bypass attempts even without digits", () => {
    const res = sanitizeChatMessage(
      "Just pay cash at the gate or send eWallet so we skip the fee",
      true
    );

    expect(res.wasRedacted).toBe(true);
    expect(res.reasons.length).toBeGreaterThan(0);
  });

  it("allows normal trade scoping questions cleanly without false positives", () => {
    const res = sanitizeChatMessage(
      "Are the bathroom tiles porcelain or ceramic, and is it roughly 8 square meters?",
      false
    );

    expect(res.wasRedacted).toBe(false);
    expect(res.warningBanner).toBeUndefined();
  });
});
