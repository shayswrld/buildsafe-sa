import { DEFAULT_PLATFORM_CONFIG, FeeConfig } from "@/lib/config";

export interface EscrowCalculationInput {
  labourZar: number;
  materialsZar?: number;
  isRepeatBooking?: boolean;
  config?: Partial<FeeConfig>;
}

export interface EscrowSplitBreakdown {
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
export function computeEscrowSplit(
  input: EscrowCalculationInput
): EscrowSplitBreakdown {
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

export interface EscrowProviderDepositResult {
  providerRef: string;
  escrowAccountLabel: string;
  settledImmediately: boolean;
}

export class SimulatedTradeSafeAdapter {
  createProtectedDeposit(paymentMethod: string): EscrowProviderDepositResult {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    return {
      providerRef: `TS-ZA-${suffix}`,
      escrowAccountLabel: `TradeSafe Regulated Trust (${paymentMethod})`,
      settledImmediately: true,
    };
  }
}

export const escrowAdapter = new SimulatedTradeSafeAdapter();
