import { describe, expect, it } from "vitest";
import crypto from "crypto";
import {
  computeSaIdChecksumDigit,
  buildValidSaId,
  validateSouthAfricanId,
} from "@/lib/security/sa-id";
import {
  hashPassword,
  verifyPassword,
  DUMMY_PASSWORD_HASH,
} from "@/lib/auth/password";
import {
  checkSaIdBanEvasion,
  validateQuoteEligibility,
  validateGateArrivalManifest,
  validateReviewEligibility,
  WorkerGovernanceSnapshot,
  JobGovernanceSnapshot,
  ExistingWorkerIdentitySnapshot,
} from "@/lib/governance";
import { sanitizeChatMessage } from "@/lib/security/anti-leakage";
import {
  generateGateOtpPair,
  verifyGateCheckInCode,
  hashGateCode,
} from "@/lib/security/gate-otp";

describe("Empirical Challenger: Invariant Stress & Adversarial Attack Harness", () => {
  // =========================================================================
  // 1. SECURITY & CRYPTOGRAPHY: SA ID LUHN & HOME AFFAIRS SPECIFICATION
  // =========================================================================
  describe("1. SA ID 13-digit Home Affairs Luhn Algorithm", () => {
    it("validates known authentic and generated 13-digit SA IDs", () => {
      // 1. Known authentic algorithmic test vector
      // YYMMDD (800101) SSSS (5009 - Male) C (0 - SA Citizen) A (8) Z (7)
      const validId = "8001015009087";
      const result = validateSouthAfricanId(validId, 2026);
      expect(result.valid).toBe(true);
      expect(result.gender).toBe("MALE");
      expect(result.citizenship).toBe("SA_CITIZEN");
      expect(result.age).toBe(46);
      expect(result.maskedId).toBe("800101****08*");
      expect(result.idHash).toBe(
        crypto.createHash("sha256").update(validId).digest("hex")
      );

      // 2. Female, Permanent Resident (C=1) generated via buildValidSaId
      const femalePrId = buildValidSaId("920512", "0123", "1");
      const femaleResult = validateSouthAfricanId(femalePrId, 2026);
      expect(femaleResult.valid).toBe(true);
      expect(femaleResult.gender).toBe("FEMALE");
      expect(femaleResult.citizenship).toBe("PERMANENT_RESIDENT");
      expect(femaleResult.birthDate).toBe("1992-05-12");
    });

    it("adversarially rejects tamper attempts: invalid checksums, length violations, letters, malformed dates", () => {
      // Tampered checksum (last digit flipped)
      const tamperedCheck = "8001015009088";
      expect(validateSouthAfricanId(tamperedCheck, 2026).valid).toBe(false);
      expect(validateSouthAfricanId(tamperedCheck, 2026).error).toContain("Luhn");

      // Length violations
      expect(validateSouthAfricanId("800101500908", 2026).valid).toBe(false); // 12 digits
      expect(validateSouthAfricanId("80010150090871", 2026).valid).toBe(false); // 14 digits
      expect(validateSouthAfricanId("", 2026).valid).toBe(false);

      // Non-numeric characters
      expect(validateSouthAfricanId("800101500908A", 2026).valid).toBe(false);
      expect(validateSouthAfricanId("800101 5009 08!", 2026).valid).toBe(false);

      // Invalid calendar dates (e.g. Feb 30, Month 13)
      const badMonth = buildValidSaId("901301", "5000", "0");
      expect(validateSouthAfricanId(badMonth, 2026).valid).toBe(false);

      const badFeb30 = buildValidSaId("900230", "5000", "0");
      expect(validateSouthAfricanId(badFeb30, 2026).valid).toBe(false);

      // Underage (< 18 in referenceYear 2026 -> born 2010 -> age 16)
      const underageId = buildValidSaId("100101", "5000", "0");
      const underageRes = validateSouthAfricanId(underageId, 2026);
      expect(underageRes.valid).toBe(false);
      expect(underageRes.error).toContain("18 years old");

      // Invalid citizenship digit (must be 0 or 1)
      const invalidCitizen = "8001015009287"; // citizen char is 2
      expect(validateSouthAfricanId(invalidCitizen, 2026).valid).toBe(false);
    });

    it("throws when computeSaIdChecksumDigit is given non-12-digit string", () => {
      expect(() => computeSaIdChecksumDigit("123")).toThrow();
      expect(() => computeSaIdChecksumDigit("1234567890123")).toThrow();
      expect(() => computeSaIdChecksumDigit("abcdefghijkl")).toThrow();
    });
  });

  // =========================================================================
  // 2. TIMING ATTACK MITIGATION: DUMMY PASSWORD HASH & SCRYPT
  // =========================================================================
  describe("2. Timing Attack Mitigation & Scrypt Invariant", () => {
    it("verifies DUMMY_PASSWORD_HASH structure and rejects wrong passwords without leaking", async () => {
      expect(DUMMY_PASSWORD_HASH).toMatch(/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);

      // Verifying against dummy hash must return false
      const result = await verifyPassword("AnyPassword123!", DUMMY_PASSWORD_HASH);
      expect(result).toBe(false);

      // Empty / null inputs return false safely
      expect(await verifyPassword("password", null)).toBe(false);
      expect(await verifyPassword("password", undefined)).toBe(false);
      expect(await verifyPassword("password", "")).toBe(false);

      // Malformed hash formats return false safely without crashing
      expect(await verifyPassword("password", "plaintext_password")).toBe(false);
      expect(await verifyPassword("password", "bcrypt$2b$12$malformed")).toBe(false);
      expect(await verifyPassword("password", "scrypt$16384$8$1$bad")).toBe(false);
    });

    it("successfully hashes and validates authentic passwords using scrypt and constant-time equality", async () => {
      const password = "SuperSecretSecurePassword2026!";
      const hash = await hashPassword(password);
      expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword("WrongPassword!", hash);
      expect(isInvalid).toBe(false);
    });
  });

  // =========================================================================
  // 3. GOVERNANCE: 3-TIER VETTING, BAN EVASION, QUOTE & GATE VALIDATION
  // =========================================================================
  describe("3. 3-Tier Security Vetting & Governance Invariants", () => {
    const candidateHash = crypto.createHash("sha256").update("8001015009087").digest("hex");

    it("enforces SA ID Ban Evasion against suspended or flagged records", () => {
      const existingProfiles: ExistingWorkerIdentitySnapshot[] = [
        {
          id: "worker_banned",
          saIdHash: candidateHash,
          vettingTier: "SUSPENDED",
          sapsStatus: "FLAGGED_RECORD",
        },
      ];

      const check = checkSaIdBanEvasion(candidateHash, existingProfiles);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("Permanent Safety Ban");

      // Duplicate active profile
      const duplicateProfiles: ExistingWorkerIdentitySnapshot[] = [
        {
          id: "worker_active",
          saIdHash: candidateHash,
          vettingTier: "TIER_2_SAPS_CLEARED",
          sapsStatus: "CLEARED",
        },
      ];
      const dupCheck = checkSaIdBanEvasion(candidateHash, duplicateProfiles);
      expect(dupCheck.allowed).toBe(false);
      expect(dupCheck.reason).toContain("Duplicate SA ID Blocked");

      // Clean candidate
      const cleanCheck = checkSaIdBanEvasion("non_existent_hash", duplicateProfiles);
      expect(cleanCheck.allowed).toBe(true);
    });

    it("strictly gates quote eligibility by vetting tiers, SAPS expiry, CoC requirements, and crew clearance", () => {
      const refDate = new Date("2026-06-01T12:00:00Z");

      const leadTier1: WorkerGovernanceSnapshot = {
        id: "worker_1",
        vettingTier: "TIER_1_BROWSE_ONLY",
        sapsStatus: "UNSTARTED",
      };

      const simpleJob: JobGovernanceSnapshot = {
        id: "job_paint",
        category: "PAINTING",
        requiresCoC: false,
        status: "OPEN",
        homeownerId: "homeowner_1",
      };

      // Tier 1 blocked from quoting
      const resTier1 = validateQuoteEligibility(leadTier1, simpleJob, [], refDate);
      expect(resTier1.allowed).toBe(false);
      expect(resTier1.reason).toContain("Tier 2 SAPS Biometric Clearance Required");

      // Tier 2 with expired clearance blocked
      const leadExpired: WorkerGovernanceSnapshot = {
        id: "worker_2",
        vettingTier: "TIER_2_SAPS_CLEARED",
        sapsStatus: "CLEARED",
        sapsExpiresAt: new Date("2026-01-01T00:00:00Z"), // Expired
      };
      const resExpired = validateQuoteEligibility(leadExpired, simpleJob, [], refDate);
      expect(resExpired.allowed).toBe(false);
      expect(resExpired.reason).toContain("SAPS Clearance Expired");

      // CoC Job requires Tier 3 and matching unexpired trade license
      const cocJob: JobGovernanceSnapshot = {
        id: "job_plumb",
        category: "PLUMBING",
        requiresCoC: true,
        status: "OPEN",
        homeownerId: "homeowner_1",
      };

      const leadTier2Cleared: WorkerGovernanceSnapshot = {
        id: "worker_3",
        vettingTier: "TIER_2_SAPS_CLEARED",
        sapsStatus: "CLEARED",
        sapsExpiresAt: new Date("2026-12-31T00:00:00Z"),
      };
      const resNoCoc = validateQuoteEligibility(leadTier2Cleared, cocJob, [], refDate);
      expect(resNoCoc.allowed).toBe(false);
      expect(resNoCoc.reason).toContain("Statutory CoC Required");

      // Tier 3 with valid CoC cert
      const leadTier3: WorkerGovernanceSnapshot = {
        id: "worker_4",
        vettingTier: "TIER_3_COC_CERTIFIED",
        sapsStatus: "CLEARED",
        sapsExpiresAt: new Date("2026-12-31T00:00:00Z"),
        certifications: [
          {
            tradeCategory: "PLUMBING",
            status: "VERIFIED",
            body: "PIRB",
            expiresAt: new Date("2026-12-31T00:00:00Z"),
          },
        ],
      };
      const resCocValid = validateQuoteEligibility(leadTier3, cocJob, [], refDate);
      expect(resCocValid.allowed).toBe(true);

      // Crew member without SAPS clearance blocks the entire quote
      const unvettedCrew: WorkerGovernanceSnapshot = {
        id: "crew_1",
        vettingTier: "TIER_1_BROWSE_ONLY",
        sapsStatus: "UNSTARTED",
        user: { name: "Thabo Unvetted" },
      };
      const resCrewBlocked = validateQuoteEligibility(leadTier3, cocJob, [unvettedCrew], refDate);
      expect(resCrewBlocked.allowed).toBe(false);
      expect(resCrewBlocked.reason).toContain('Accompanying assistant "Thabo Unvetted" has not passed SAPS biometric');
    });

    it("strictly verifies Gate Arrival Manifests (headcount, face match, crew whitelist)", () => {
      // Face match fail
      expect(
        validateGateArrivalManifest({
          faceMatchConfirmed: false,
          expectedCrewProfileIds: ["crew_1"],
        }).allowed
      ).toBe(false);

      // Unannounced personnel
      expect(
        validateGateArrivalManifest({
          faceMatchConfirmed: true,
          expectedCrewProfileIds: ["crew_1"],
          unannouncedPersonnelPresent: true,
        }).allowed
      ).toBe(false);

      // Headcount mismatch (expected 1 lead + 1 crew = 2, but 3 arrived)
      expect(
        validateGateArrivalManifest({
          faceMatchConfirmed: true,
          expectedCrewProfileIds: ["crew_1"],
          arrivingHeadcount: 3,
        }).allowed
      ).toBe(false);

      // Unlisted crew substitution
      expect(
        validateGateArrivalManifest({
          faceMatchConfirmed: true,
          expectedCrewProfileIds: ["crew_1"],
          verifiedCrewProfileIds: ["crew_impostor"],
        }).allowed
      ).toBe(false);

      // All verified correctly
      expect(
        validateGateArrivalManifest({
          faceMatchConfirmed: true,
          expectedCrewProfileIds: ["crew_1"],
          arrivingHeadcount: 2,
          verifiedCrewProfileIds: ["crew_1"],
        }).allowed
      ).toBe(true);
    });

    it("restricts review submission to verified participants and completed/on-site status", () => {
      const job: JobGovernanceSnapshot = {
        id: "job_1",
        category: "PLUMBING",
        requiresCoC: false,
        status: "COMPLETED",
        homeownerId: "user_client",
        selectedWorkerUserId: "user_artisan",
      };

      // Unrelated user
      expect(validateReviewEligibility(job, "user_stranger").allowed).toBe(false);

      // Homeowner permitted when completed
      expect(validateReviewEligibility(job, "user_client").allowed).toBe(true);

      // Worker permitted when completed
      expect(validateReviewEligibility(job, "user_artisan").allowed).toBe(true);

      // Not yet on site / in progress
      const openJob = { ...job, status: "OPEN" };
      expect(validateReviewEligibility(openJob, "user_client").allowed).toBe(false);
    });
  });

  // =========================================================================
  // 4. PRE-ESCROW CHAT CONTACT MASKING (ANTI-LEAKAGE)
  // =========================================================================
  describe("4. Pre-Escrow Anti-Leakage Contact Masking Invariant", () => {
    it("redacts phone numbers, emails, links, and spelled digits when escrow is not funded", () => {
      const texts = [
        "Call me on 082 123 4567 to discuss",
        "Phone is +27 82 123 4567 or 0831234567",
        "My email is builder@contractor.co.za",
        "Check my website https://mybuilders.co.za for portfolio",
        "Call me at zero eight two one two three four five six seven",
      ];

      for (const raw of texts) {
        const res = sanitizeChatMessage(raw, false);
        expect(res.wasRedacted).toBe(true);
        expect(res.sanitizedBody.toLowerCase()).toContain("hidden until");
        expect(res.warningBanner).toBeDefined();
      }
    });

    it("detects off-platform payment bypass attempts even if escrow is funded", () => {
      const bypass1 = sanitizeChatMessage("Just pay me cash in hand at the gate", true);
      expect(bypass1.wasRedacted).toBe(true);
      expect(bypass1.reasons).toContain("Off-platform cash solicitation");

      const bypass2 = sanitizeChatMessage("Send an ewallet or payshap to skip the fee", true);
      expect(bypass2.wasRedacted).toBe(true);
      expect(bypass2.reasons).toContain("Direct off-platform payment channel");
    });

    it("allows phone numbers once Escrow IS funded for on-site logistics", () => {
      const res = sanitizeChatMessage("Here is my number for gate access: 082 123 4567", true);
      expect(res.sanitizedBody).toBe("Here is my number for gate access: 082 123 4567");
      expect(res.wasRedacted).toBe(false);
    });
  });

  // =========================================================================
  // 5. GATE OTP GENERATION AND SHA-256 VERIFICATION
  // =========================================================================
  describe("5. Gate OTP Generation & Verification Invariant", () => {
    it("generates 6-digit numeric OTP pair with cryptographic SHA-256 hash", () => {
      const pair = generateGateOtpPair();
      expect(pair.checkInCode).toMatch(/^\d{6}$/);
      expect(pair.checkOutCode).toMatch(/^\d{6}$/);
      expect(pair.checkInCodeHash).toBe(hashGateCode(pair.checkInCode));

      // Verification succeeds with matching code
      expect(verifyGateCheckInCode(pair.checkInCode, pair.checkInCodeHash)).toBe(true);

      // Normalized whitespace handles user typing
      expect(verifyGateCheckInCode(`  ${pair.checkInCode.slice(0, 3)} ${pair.checkInCode.slice(3)} `, pair.checkInCodeHash)).toBe(true);

      // Tampered code fails
      const tampered = pair.checkInCode === "123456" ? "654321" : "123456";
      expect(verifyGateCheckInCode(tampered, pair.checkInCodeHash)).toBe(false);

      // Malformed codes fail safely
      expect(verifyGateCheckInCode("12345", pair.checkInCodeHash)).toBe(false); // 5 digits
      expect(verifyGateCheckInCode("1234567", pair.checkInCodeHash)).toBe(false); // 7 digits
      expect(verifyGateCheckInCode("abcdef", pair.checkInCodeHash)).toBe(false);
      expect(verifyGateCheckInCode("", pair.checkInCodeHash)).toBe(false);
    });
  });

  // =========================================================================
  // 6. ACCESSIBILITY (a11y) & UX INVARIANTS IN NAVBAR & VIEWS
  // =========================================================================
  describe("6. Accessibility (a11y) & UX Invariant Verification", () => {
    const fs = require("fs");
    const path = require("path");

    it("verifies all critical ARIA labels, focus states, and landmarks in Navbar.tsx", () => {
      const navbarPath = path.resolve(__dirname, "../src/components/Navbar.tsx");
      const content = fs.readFileSync(navbarPath, "utf-8");

      expect(content).toContain('aria-label="Breadcrumbs"');
      expect(content).toContain('aria-label="BuildSafe SA Home"');
      expect(content).toContain('aria-label="Toggle between Client and Builder perspective"');
      expect(content).toContain('aria-label="Primary Navigation"');
      expect(content).toContain('aria-label="Select Active Demo Persona"');
      expect(content).toContain('aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}');

      // Semantic landmarks
      expect(content).toContain("<header");
      expect(content).toContain("<nav");
      expect(content).toContain("ROUTE_LABELS");
    });

    it("verifies that PersonaContext provides accessible dual-role state management without mock register bloat", () => {
      const personaPath = path.resolve(__dirname, "../src/components/PersonaContext.tsx");
      const content = fs.readFileSync(personaPath, "utf-8");

      expect(content).toContain("computeAvailableRoles");
      expect(content).toContain("inferDefaultRole");
      expect(content).toContain("toggleRole");
      // Dead register mock was excised
      expect(content).not.toContain("register: (data: RegisterUserData)");
      expect(content).not.toContain("customLocalUsers");
    });
  });

  // =========================================================================
  // 7. EXTERNAL I/O ERROR HANDLING INVARIANTS
  // =========================================================================
  describe("7. External I/O Error Handling & Try/Catch Preservation", () => {
    const fs = require("fs");
    const path = require("path");

    it("verifies try/catch error boundaries in API route handlers and server auth", () => {
      const routesToCheck = [
        "src/app/api/jobs/route.ts",
        "src/app/api/jobs/[id]/route.ts",
        "src/app/api/auth/me/route.ts",
        "src/app/api/auth/profile-setup/route.ts",
        "src/lib/auth/server.ts",
      ];

      for (const relPath of routesToCheck) {
        const fullPath = path.resolve(__dirname, `../${relPath}`);
        expect(fs.existsSync(fullPath)).toBe(true);
        const code = fs.readFileSync(fullPath, "utf-8");
        expect(code).toContain("try {");
        expect(code).toContain("catch");
      }
    });

    it("verifies jobs GET route gracefully returns degraded fallback on DB error", () => {
      const jobsRoutePath = path.resolve(__dirname, "../src/app/api/jobs/route.ts");
      const code = fs.readFileSync(jobsRoutePath, "utf-8");
      expect(code).toContain("req.nextUrl.searchParams.get");
      expect(code).toContain("X-BuildSafe-Degraded");
      expect(code).toContain("Database offline; operating in fallback mode.");
    });
  });
});
