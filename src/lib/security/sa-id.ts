import crypto from "crypto";

export interface SaIdValidationResult {
  valid: boolean;
  error?: string;
  birthDate?: string; // YYYY-MM-DD
  age?: number;
  gender?: "MALE" | "FEMALE";
  citizenship?: "SA_CITIZEN" | "PERMANENT_RESIDENT";
  maskedId?: string;
  idHash?: string;
}

/**
 * Computes the official South African Home Affairs 13th-digit Luhn checksum.
 */
export function computeSaIdChecksumDigit(first12Digits: string): number {
  if (!/^\d{12}$/.test(first12Digits)) {
    throw new Error("Expected exactly 12 digits to compute SA ID checksum.");
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(first12Digits[i]);
    // Going right-to-left from index 11 (which is the 2nd-to-last digit of the 13-digit ID):
    // Even 0-based indices (0,2,4,6,8,10) are odd positions (1,3,5,7,9,11) -> added directly.
    // Odd 0-based indices (1,3,5,7,9,11) are doubled, and digits summed if > 9.
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Helper to generate checksum-valid 13-digit SA IDs for tests and demo seeds.
 */
export function buildValidSaId(
  yyMmDd: string,
  genderSequence: string,
  citizenshipDigit: "0" | "1" = "0"
): string {
  const base12 = `${yyMmDd}${genderSequence}${citizenshipDigit}8`;
  const check = computeSaIdChecksumDigit(base12);
  return `${base12}${check}`;
}

/**
 * Validates a 13-digit South African ID number against Home Affairs format,
 * calendar date rules, adult age >= 18, citizenship bit, and Luhn checksum.
 * Returns POPIA-compliant masked output and SHA-256 hash.
 */
export function validateSouthAfricanId(
  rawInput: string,
  referenceYear: number = new Date().getFullYear()
): SaIdValidationResult {
  const cleaned = rawInput.replace(/[\s-]/g, "");

  if (!/^\d{13}$/.test(cleaned)) {
    return {
      valid: false,
      error: "South African ID number must be exactly 13 numeric digits.",
    };
  }

  const yy = Number(cleaned.slice(0, 2));
  const mm = Number(cleaned.slice(2, 4));
  const dd = Number(cleaned.slice(4, 6));
  const genderDigits = Number(cleaned.slice(6, 10));
  const citizenChar = cleaned[10];
  const expectedChecksum = computeSaIdChecksumDigit(cleaned.slice(0, 12));
  const actualChecksum = Number(cleaned[12]);

  if (citizenChar !== "0" && citizenChar !== "1") {
    return {
      valid: false,
      error: "Invalid citizenship indicator digit in SA ID number.",
    };
  }

  if (expectedChecksum !== actualChecksum) {
    return {
      valid: false,
      error: "SA ID failed official Home Affairs Luhn checksum verification.",
    };
  }

  const twoDigitCutoff = (referenceYear - 18) % 100;
  const fullYear = yy <= twoDigitCutoff ? 2000 + yy : 1900 + yy;

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return {
      valid: false,
      error: "SA ID contains an invalid date of birth.",
    };
  }

  const constructedDate = new Date(Date.UTC(fullYear, mm - 1, dd));
  if (
    constructedDate.getUTCFullYear() !== fullYear ||
    constructedDate.getUTCMonth() !== mm - 1 ||
    constructedDate.getUTCDate() !== dd
  ) {
    return {
      valid: false,
      error: "SA ID contains a non-existent calendar birth date.",
    };
  }

  const age = referenceYear - fullYear;
  if (age < 18 || age > 95) {
    return {
      valid: false,
      error: "Workers must be at least 18 years old with a valid adult SA ID.",
    };
  }

  const maskedId = `${cleaned.slice(0, 6)}****${cleaned.slice(10, 12)}*`;
  const idHash = crypto.createHash("sha256").update(cleaned).digest("hex");

  return {
    valid: true,
    birthDate: `${fullYear}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
    age,
    gender: genderDigits >= 5000 ? "MALE" : "FEMALE",
    citizenship: citizenChar === "0" ? "SA_CITIZEN" : "PERMANENT_RESIDENT",
    maskedId,
    idHash,
  };
}
