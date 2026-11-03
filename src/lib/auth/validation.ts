/**
 * Input validation & normalisation for authentication / profile creation.
 * Pure functions only: safe to import from API routes, middleware and tests.
 */

/**
 * Normalise a South African mobile number to E.164 (+27XXXXXXXXX).
 * Accepts "082 123 4567", "0821234567", "+27 82 123 4567", "27821234567", "0027821234567".
 * Returns null when the number is not a valid SA mobile number.
 */
export function normalizeSaPhone(input: string): string | null {
  if (typeof input !== "string") return null;
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith("0027")) digits = digits.slice(4);
  else if (digits.startsWith("27")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  else return null;

  // SA mobile numbers: 9 digits after the country code, leading 6, 7 or 8.
  if (!/^[678]\d{8}$/.test(digits)) return null;
  return `+27${digits}`;
}

interface PasswordCheck {
  valid: boolean;
  error?: string;
}

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "iloveyou1",
  "letmein123",
  "welcome123",
  "buildsafe123",
]);

export function checkPassword(password: unknown): PasswordCheck {
  if (typeof password !== "string") return { valid: false, error: "Password is required." };
  if (password.length < 10) {
    return { valid: false, error: "Password must be at least 10 characters." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password must be at most 128 characters." };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, error: "That password is too common. Choose a less guessable one." };
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter and one number." };
  }
  return { valid: true };
}

type AccountType = "CLIENT" | "BUILDER" | "DUAL";

interface SignupInput {
  name: string;
  phone: string; // E.164 after validation
  email: string | null;
  password: string;
  accountType: AccountType;
}

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateSignup(raw: unknown): ValidationResult<SignupInput> {
  const b = (raw ?? {}) as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Enter your full name (2-80 characters)." };
  }

  const phone = normalizeSaPhone(String(b.phone ?? ""));
  if (!phone) {
    return { ok: false, error: "Enter a valid South African mobile number, e.g. 082 123 4567." };
  }

  let email: string | null = null;
  if (typeof b.email === "string" && b.email.trim()) {
    email = b.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 120) {
      return { ok: false, error: "Enter a valid email address or leave it blank." };
    }
  }

  const pw = checkPassword(b.password);
  if (!pw.valid) return { ok: false, error: pw.error! };

  const accountType = b.accountType;
  if (accountType !== "CLIENT" && accountType !== "BUILDER" && accountType !== "DUAL") {
    return { ok: false, error: "Choose how you will use BuildSafe SA." };
  }

  return {
    ok: true,
    value: { name, phone, email, password: b.password as string, accountType },
  };
}

interface ProfileSetupInput {
  suburb: string;
  city: string;
  popiaConsent: true;
  trade?: string;
  saId?: string;
}

export function validateProfileSetup(
  raw: unknown,
  needsBuilderFields: boolean,
  allowedTrades: readonly string[]
): ValidationResult<ProfileSetupInput> {
  const b = (raw ?? {}) as Record<string, unknown>;

  const suburb = typeof b.suburb === "string" ? b.suburb.trim() : "";
  const city = typeof b.city === "string" ? b.city.trim() : "";
  if (suburb.length < 2 || suburb.length > 80) {
    return { ok: false, error: "Enter your suburb." };
  }
  if (city.length < 2 || city.length > 80) {
    return { ok: false, error: "Enter your city." };
  }
  if (b.popiaConsent !== true) {
    return {
      ok: false,
      error: "You must accept the POPIA consent to use BuildSafe SA.",
    };
  }

  const value: ProfileSetupInput = { suburb, city, popiaConsent: true };

  if (needsBuilderFields) {
    const trade = typeof b.trade === "string" ? b.trade : "";
    if (!allowedTrades.includes(trade)) {
      return { ok: false, error: "Choose your primary trade." };
    }
    value.trade = trade;

    const saId = typeof b.saId === "string" ? b.saId.replace(/\s+/g, "") : "";
    if (!/^\d{13}$/.test(saId)) {
      return { ok: false, error: "Enter your 13-digit South African ID number." };
    }
    value.saId = saId;
  }

  return { ok: true, value };
}
