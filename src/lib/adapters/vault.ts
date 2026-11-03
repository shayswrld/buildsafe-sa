import { DEFAULT_PLATFORM_CONFIG, FeeConfig } from "@/lib/config";

export interface MilestoneCalculationInput {
  labourZar: number;
  materialsZar?: number;
  isRepeatBooking?: boolean;
  config?: Partial<FeeConfig>;
}

export interface MilestoneSplitBreakdown {
  labourZar: number;
  materialsZar: number;
  buyerTrustFeePct: number;
  buyerTrustFeeZar: number;
  grossBuyerPaidZar: number;
  workerCommissionPct: number;
  workerCommissionZar: number;
  workerNetPayoutZar: number;
  platformTotalCutZar: number;
}

// Backward-compatible type aliases
export type EscrowCalculationInput = MilestoneCalculationInput;
export type EscrowSplitBreakdown = MilestoneSplitBreakdown;

function roundZar(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates the exact South African Rand (ZAR) split for a Call-Out Deposit or Milestone.
 *
 * Key Business Invariant:
 * - Reimbursed hardware-store materials (e.g. Builders Warehouse tile/paint/pipe slips)
 *   incur 0% platform commission so builders never lose margin on material costs.
 * - Platform takes `buyerTrustFeePct` (default 5%) from Buyer on labour +
 *   `workerLabourCommissionPct` (default 8%, or 4% repeat loyalty rate) from Worker on labour.
 */
export function computeMilestoneSplit(
  input: MilestoneCalculationInput
): MilestoneSplitBreakdown {
  const labourZar = Math.max(0, roundZar(input.labourZar));
  const materialsZar = Math.max(0, roundZar(input.materialsZar ?? 0));

  const mergedConfig: FeeConfig = {
    ...DEFAULT_PLATFORM_CONFIG,
    ...input.config,
  };

  const buyerTrustFeePct = mergedConfig.buyerTrustFeePct;
  const workerCommissionPct = input.isRepeatBooking
    ? mergedConfig.repeatClientCommissionPct
    : mergedConfig.workerLabourCommissionPct;

  const buyerTrustFeeZar = roundZar(labourZar * buyerTrustFeePct);
  const grossBuyerPaidZar = roundZar(labourZar + materialsZar + buyerTrustFeeZar);

  const workerCommissionZar = roundZar(labourZar * workerCommissionPct);
  const workerNetPayoutZar = roundZar(
    labourZar - workerCommissionZar + materialsZar
  );
  const platformTotalCutZar = roundZar(buyerTrustFeeZar + workerCommissionZar);

  return {
    labourZar,
    materialsZar,
    buyerTrustFeePct,
    buyerTrustFeeZar,
    grossBuyerPaidZar,
    workerCommissionPct,
    workerCommissionZar,
    workerNetPayoutZar,
    platformTotalCutZar,
  };
}

// Canonical alias for backward compatibility
export const computeEscrowSplit = computeMilestoneSplit;

export interface AbstractVaultAdapter {
  allocateFunds(input: {
    milestoneId: string;
    labourZar: number;
    materialsZar?: number;
  }): Promise<{ success: boolean; vaultRef: string }>;
  pauseForTouchUp(milestoneId: string): Promise<{ paused: boolean }>;
  disbursePayout(
    milestoneId: string,
    idempotencyKey: string
  ): Promise<{ success: boolean; disbursedAt: string }>;
  getVaultStatus(
    milestoneId: string
  ): Promise<{ status: string; balanceZar: number }>;
}

export const vaultAdapter: AbstractVaultAdapter & {
  createProtectedDeposit(paymentMethod: string): {
    providerRef: string;
    escrowAccountLabel: string;
    settledImmediately: boolean;
  };
} = {
  async allocateFunds({ milestoneId }) {
    const shortRef = milestoneId.slice(0, 8).toUpperCase();
    return { success: true, vaultRef: `VAULT-${shortRef}` };
  },
  async pauseForTouchUp() {
    return { paused: true };
  },
  async disbursePayout() {
    return { success: true, disbursedAt: new Date().toISOString() };
  },
  async getVaultStatus() {
    return { status: "SECURED", balanceZar: 3000 };
  },
  createProtectedDeposit(paymentMethod: string) {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    return {
      providerRef: `TS-ZA-${suffix}`,
      escrowAccountLabel: `TradeSafe Regulated Trust (${paymentMethod})`,
      settledImmediately: true,
    };
  },
};

export const escrowAdapter = vaultAdapter;
