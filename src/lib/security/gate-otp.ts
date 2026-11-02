import crypto from "crypto";

export function hashGateCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export function generateGateOtpPair(): {
  checkInCode: string;
  checkInCodeHash: string;
  checkOutCode: string;
} {
  const checkInCode = String(crypto.randomInt(100000, 999999));
  const checkOutCode = String(crypto.randomInt(100000, 999999));
  return {
    checkInCode,
    checkInCodeHash: hashGateCode(checkInCode),
    checkOutCode,
  };
}

export function verifyGateCheckInCode(
  submittedCode: string,
  expectedHash: string
): boolean {
  const normalized = submittedCode.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  return hashGateCode(normalized) === expectedHash;
}
