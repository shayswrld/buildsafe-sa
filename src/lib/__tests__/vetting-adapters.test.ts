import { describe, expect, it } from "vitest";
import {
  ConfigurableDhaIdentityAdapter,
  SimulatedHuruAfiswitchAdapter,
  SouthAfricanStatutoryRegistryAdapter,
  createVettingAdapterSuite,
} from "@/lib/adapters/vetting";
import { buildValidSaId } from "@/lib/security/sa-id";

describe("Pluggable Multi-Provider South African Vetting Adapters", () => {
  it("verifies valid 13-digit SA IDs and live selfie biometrics via DHA Identity Adapter", async () => {
    const adapter = new ConfigurableDhaIdentityAdapter("SMILE_ID_DHA");
    const validSaId = buildValidSaId("890615", "5312", "0");

    const res = await adapter.verifyIdentityAndBiometrics({
      saIdNumber: validSaId,
      fullName: "Sipho Dlamini",
      selfieConfirmed: true,
      referenceYear: 2026,
    });

    expect(res.verified).toBe(true);
    expect(res.aliveStatus).toBe("ALIVE");
    expect(res.livenessScore).toBeGreaterThan(95);
    expect(res.providerRef).toContain("SMILE_ID_DHA-NPR-");
    expect(res.idCheck.maskedId).toBeDefined();
    expect(res.idCheck.idHash).toHaveLength(64);
  });

  it("rejects identity verification when live selfie match is not confirmed or SA ID is invalid", async () => {
    const adapter = new ConfigurableDhaIdentityAdapter("VERIFYNOW_DHA");
    const validSaId = buildValidSaId("910322", "5104", "0");

    const noSelfie = await adapter.verifyIdentityAndBiometrics({
      saIdNumber: validSaId,
      fullName: "Mandla Zulu",
      selfieConfirmed: false,
    });
    expect(noSelfie.verified).toBe(false);
    expect(noSelfie.error).toContain("Biometric Live Selfie match");

    const badChecksum = await adapter.verifyIdentityAndBiometrics({
      saIdNumber: "9103225104089", // invalid checksum
      fullName: "Mandla Zulu",
      selfieConfirmed: true,
    });
    expect(badChecksum.verified).toBe(false);
  });

  it("generates HURU / MIE fingerprint vouchers and sets 12-month SAPS expiry on clearance", () => {
    const huru = new SimulatedHuruAfiswitchAdapter("HURU_AFISWITCH");
    const voucher = huru.generateFingerprintVoucher(200);
    expect(voucher.voucherCode).toMatch(/^HURU-ZA-[A-F0-9]{6}$/);
    expect(voucher.feeZar).toBe(200);

    const cleared = huru.simulateAfiswitchResult("CLEAR");
    expect(cleared.sapsStatus).toBe("CLEARED");
    expect(cleared.newVettingTier).toBe("TIER_2_SAPS_CLEARED");
    expect(cleared.sapsClearedAt).toBeInstanceOf(Date);
    expect(cleared.sapsExpiresAt).toBeInstanceOf(Date);
    expect(cleared.sapsExpiresAt!.getTime()).toBeGreaterThan(
      cleared.sapsClearedAt!.getTime() + 360 * 24 * 60 * 60 * 1000
    );

    const flagged = huru.simulateAfiswitchResult("FLAGGED");
    expect(flagged.sapsStatus).toBe("FLAGGED_RECORD");
    expect(flagged.newVettingTier).toBe("SUSPENDED");
    expect(flagged.sapsExpiresAt).toBeNull();
  });

  it("validates South African CIPC company registration numbers and binds to a vetted Director SA ID", async () => {
    const registry = new SouthAfricanStatutoryRegistryAdapter();
    const directorSaId = buildValidSaId("860414", "5412", "0");
    const suite = createVettingAdapterSuite({ registry });
    const idRes = await suite.identity.verifyIdentityAndBiometrics({
      saIdNumber: directorSaId,
      fullName: "Sipho Dlamini",
      selfieConfirmed: true,
    });

    const validCipc = await registry.verifyCipcCompany({
      cipcNumber: "2020/619402/07",
      companyName: "Dlamini & Sons Home Renovations (Pty) Ltd",
      directorSaIdHash: idRes.idCheck.idHash!,
      cidbGrading: "2GB",
      nhbrcNumber: "NHBRC-884012",
    });

    expect(validCipc.valid).toBe(true);
    expect(validCipc.companyStatus).toBe("VERIFIED_IN_BUSINESS");
    expect(validCipc.directorMatched).toBe(true);
    expect(validCipc.cidbGradingValidated).toBe("2GB");
    expect(validCipc.providerRef).toMatch(/^CIPC-ZA-[A-F0-9]{8}$/);

    const badFormatCipc = await registry.verifyCipcCompany({
      cipcNumber: "INVALID-CIPC-123",
      companyName: "Fake Renovations",
      directorSaIdHash: idRes.idCheck.idHash!,
    });
    expect(badFormatCipc.valid).toBe(false);
    expect(badFormatCipc.error).toContain("Invalid South African CIPC registration format");
  });

  it("validates statutory trade licenses (PIRB, ECB_WIREMAN, NHBRC, SAQCC_GAS, CIDB) and returns official portal URLs", async () => {
    const registry = new SouthAfricanStatutoryRegistryAdapter();

    const pirb = await registry.validateTradeRegistration({
      body: "PIRB",
      registrationNumber: "PIRB-44819-ZA",
      tradeCategory: "PLUMBING",
    });
    expect(pirb.valid).toBe(true);
    expect(pirb.officialPortalUrl).toContain("pirb.co.za");

    const wireman = await registry.validateTradeRegistration({
      body: "ECB_WIREMAN",
      registrationNumber: "DoEL-IE-29481",
      tradeCategory: "ELECTRICAL",
    });
    expect(wireman.valid).toBe(true);
    expect(wireman.officialPortalUrl).toContain("labour.gov.za");

    const invalidBody = await registry.validateTradeRegistration({
      body: "UNKNOWN_BODY",
      registrationNumber: "12345",
      tradeCategory: "PLUMBING",
    });
    expect(invalidBody.valid).toBe(false);
  });
});
