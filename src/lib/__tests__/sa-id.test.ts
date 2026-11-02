import { describe, expect, it } from "vitest";
import {
  buildValidSaId,
  validateSouthAfricanId,
} from "@/lib/security/sa-id";

describe("South African 13-Digit ID Validation & POPIA Masking", () => {
  it("validates a genuine checksum-valid adult SA citizen ID and masks sensitive digits", () => {
    const validId = buildValidSaId("890514", "5321", "0");
    const result = validateSouthAfricanId(validId, 2026);

    expect(result.valid).toBe(true);
    expect(result.birthDate).toBe("1989-05-14");
    expect(result.age).toBe(37);
    expect(result.gender).toBe("MALE");
    expect(result.citizenship).toBe("SA_CITIZEN");
    expect(result.maskedId).toBe("890514****08*");
    expect(result.idHash).toHaveLength(64);
  });

  it("rejects tampered SA IDs failing the official Home Affairs Luhn checksum", () => {
    const validId = buildValidSaId("920310", "0412", "0");
    const lastDigit = Number(validId[12]);
    const wrongDigit = (lastDigit + 1) % 10;
    const tampered = `${validId.slice(0, 12)}${wrongDigit}`;

    const result = validateSouthAfricanId(tampered, 2026);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Luhn checksum");
  });

  it("rejects impossible calendar dates such as February 30", () => {
    const invalidCalendarId = buildValidSaId("900230", "5111", "0");
    const result = validateSouthAfricanId(invalidCalendarId, 2026);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("birth date");
  });

  it("rejects underage applicants under 18 years old", () => {
    const minorId = buildValidSaId("120615", "5111", "0"); // Born 2012 -> age 14 in 2026
    const result = validateSouthAfricanId(minorId, 2026);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 18");
  });
});
