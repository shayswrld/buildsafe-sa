export interface SanitizedChatResult {
  sanitizedBody: string;
  wasRedacted: boolean;
  reasons: string[];
  warningBanner?: string;
}

const NUMBER_WORDS =
  "(?:zero|oh|one|two|three|four|five|six|seven|eight|nine|double|triple)";

const SPELLED_PHONE_REGEX = new RegExp(
  `\\b(?:${NUMBER_WORDS}[\\s,.-]+){4,}${NUMBER_WORDS}\\b`,
  "gi"
);

// Matches +27 / 0027 / 0XX South African mobile & landline numbers and 9-11 digit clusters
const SA_PHONE_OR_ACCOUNT_REGEX =
  /(?:\+27|0027|27|0)[\s.-]*[1-8]\d[\s.-]*\d{3}[\s.-]*\d{4}\b|\b\d{9,12}\b/g;

const EMAIL_OR_LINK_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:https?:\/\/|wa\.me\/|www\.)\S+/gi;

const OFF_PLATFORM_SOLICITATION_PATTERNS: { regex: RegExp; reason: string }[] = [
  {
    regex: /\b(?:pay\s*(?:me\s*)?cash|cash\s*in\s*hand|cash\s*at\s*the\s*gate|no\s*escrow)\b/i,
    reason: "Off-platform cash solicitation",
  },
  {
    regex: /\b(?:ewallet|e-wallet|cashsend|instant\s*money|payshap|capitec\s*me|direct\s*eft)\b/i,
    reason: "Direct off-platform payment channel",
  },
  {
    regex: /\b(?:outside\s*the\s*(?:app|site|website)|off\s*-?\s*platform|skip\s*the\s*fee)\b/i,
    reason: "Platform fee bypass attempt",
  },
  {
    regex: /\b(?:whatsapp\s*me|text\s*me\s*on|call\s*me\s*direct|my\s*cell\s*is)\b/i,
    reason: "Pre-booking external contact sharing",
  },
];

export interface AntiLeakageOptions {
  isVaultFunded?: boolean;
  isEscrowFunded?: boolean;
}

/**
 * Protects platform commission and user physical/financial safety by masking
 * phone numbers, bank accounts, links, and cash-bypass attempts before the Milestone Vault is funded.
 */
export function sanitizeChatMessage(
  rawText: string,
  isFundedOrOptions: boolean | AntiLeakageOptions
): SanitizedChatResult {
  const isFunded = typeof isFundedOrOptions === "boolean"
    ? isFundedOrOptions
    : Boolean(isFundedOrOptions?.isVaultFunded ?? isFundedOrOptions?.isEscrowFunded);

  let text = rawText.trim();
  const reasons = new Set<string>();

  if (!isFunded) {
    if (SA_PHONE_OR_ACCOUNT_REGEX.test(text)) {
      reasons.add("Phone or bank account number hidden prior to Vault deposit");
      text = text.replace(
        SA_PHONE_OR_ACCOUNT_REGEX,
        "[Hidden until Call-Out deposit is secured in Vault]"
      );
    }

    if (SPELLED_PHONE_REGEX.test(text)) {
      reasons.add("Spelled-out contact digits hidden prior to Vault deposit");
      text = text.replace(
        SPELLED_PHONE_REGEX,
        "[Hidden until Call-Out deposit is secured in Vault]"
      );
    }

    if (EMAIL_OR_LINK_REGEX.test(text)) {
      reasons.add("External link or email hidden prior to Vault deposit");
      text = text.replace(
        EMAIL_OR_LINK_REGEX,
        "[External contact hidden until deposit is secured in Vault]"
      );
    }
  }

  for (const item of OFF_PLATFORM_SOLICITATION_PATTERNS) {
    if (item.regex.test(rawText)) {
      // Even after call-out deposit, explicit fee-bypass / cash solicitation triggers a warning
      if (!isFunded || item.reason !== "Pre-booking external contact sharing") {
        reasons.add(item.reason);
      }
    }
  }

  const wasRedacted = reasons.size > 0;

  return {
    sanitizedBody: text,
    wasRedacted,
    reasons: Array.from(reasons),
    warningBanner: wasRedacted
      ? "Safety & Guarantee Reminder: Keep quotes and payments inside BuildSafe SA Milestone Vault. Off-platform cash or direct EFTs void SAPS Gate Verification, dispute protection, and verified two-way ratings."
      : undefined,
  };
}
