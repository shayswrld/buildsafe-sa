"use client";

import React, { useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { computeMilestoneSplit } from "@/lib/adapters/vault";
import { formatZar, VAULT_LEXICON } from "@/lib/config";

/**
 * Live Milestone Vault & Take-Rate Calculator.
 * Shows how a homeowner payment is split between artisan payout and platform fees.
 */
export function EscrowCalculator() {
  const { config } = usePersona();

  const [labourInput, setLabourInput] = useState<number>(2000);
  const [materialsInput, setMaterialsInput] = useState<number>(800);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  const split = computeMilestoneSplit({
    labourZar: labourInput,
    materialsZar: materialsInput,
    isRepeatBooking: isRepeat,
    config,
  });

  // Escrow proportional visual bar metrics
  const totalPaid = split.grossBuyerPaidZar;
  const labourPct = totalPaid > 0 ? ((labourInput / totalPaid) * 100).toFixed(1) : "0";
  const materialsPct = totalPaid > 0 ? ((materialsInput / totalPaid) * 100).toFixed(1) : "0";
  const feePct = totalPaid > 0 ? ((split.buyerTrustFeeZar / totalPaid) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Sliders Column */}
      <div className="lg:col-span-6 space-y-6">
        {/* Labour Slider */}
        <div className="border-2 border-iron-950 p-4 bg-mortar-50 shadow-brutal-sm rounded-none space-y-2">
          <div className="flex justify-between items-center font-bold text-xs">
            <label htmlFor="labour-range" className="uppercase font-mono tracking-wider text-iron-950">
              Labour quote (ZAR):
            </label>
            <span className="font-mono tabular-nums text-base font-black text-brick-600">
              {formatZar(labourInput)}
            </span>
          </div>
          <input
            id="labour-range"
            type="range"
            min={300}
            max={15000}
            step={100}
            value={labourInput}
            onChange={(e) => setLabourInput(Number(e.target.value))}
            className="w-full accent-[#B93815] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-iron-600">
            <span>R300</span>
            <span>R7,500</span>
            <span>R15,000</span>
          </div>
        </div>

        {/* Materials Slip Slider */}
        <div className="border-2 border-iron-950 p-4 bg-mortar-50 shadow-brutal-sm rounded-none space-y-2">
          <div className="flex justify-between items-center font-bold text-xs">
            <label htmlFor="materials-range" className="uppercase font-mono tracking-wider text-iron-950">
              Materials slip (0% fee):
            </label>
            <span className="font-mono tabular-nums text-base font-black text-iron-950">
              {formatZar(materialsInput)}
            </span>
          </div>
          <input
            id="materials-range"
            type="range"
            min={0}
            max={10000}
            step={100}
            value={materialsInput}
            onChange={(e) => setMaterialsInput(Number(e.target.value))}
            className="w-full accent-[#141416] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-iron-600">
            <span>R0 (Labour Only)</span>
            <span>R5,000</span>
            <span>R10,000</span>
          </div>
        </div>

        {/* Repeat Loyalty Toggle */}
        <label className="flex items-start gap-3 p-3.5 border-2 border-iron-950 bg-safety-50 shadow-brutal-sm rounded-none cursor-pointer">
          <input
            type="checkbox"
            checked={isRepeat}
            onChange={(e) => setIsRepeat(e.target.checked)}
            className="mt-0.5 rounded-none accent-[#B93815] w-4 h-4 border-2 border-iron-950"
          />
          <span className="text-xs text-iron-900 leading-tight">
            <strong className="uppercase font-mono text-brick-700">Repeat booking:</strong>{" "}
            artisan commission drops from{" "}
            <span className="font-mono font-bold">{(config.workerLabourCommissionPct * 100).toFixed(0)}%</span> to{" "}
            <span className="font-mono font-bold">{(config.repeatClientCommissionPct * 100).toFixed(0)}%</span>.
          </span>
        </label>

        {/* Reactive Proportional Split Visual Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono font-bold uppercase text-iron-700">
            <span>{VAULT_LEXICON.vaultName} Breakdown</span>
            <span className="tabular-nums font-mono">Total {formatZar(totalPaid)}</span>
          </div>
          <div className="h-6 w-full border-2 border-iron-950 bg-white flex overflow-hidden rounded-none shadow-brutal-sm">
            <div
              style={{ width: `${labourPct}%` }}
              className="bg-brick-600 transition-all duration-150 ease-out flex items-center justify-center text-[10px] font-mono font-bold text-white overflow-hidden whitespace-nowrap px-1"
              title={`Labour: ${labourPct}%`}
            >
              {Number(labourPct) > 15 ? `Labour ${labourPct}%` : ""}
            </div>
            <div
              style={{ width: `${materialsPct}%` }}
              className="bg-iron-800 transition-all duration-150 ease-out flex items-center justify-center text-[10px] font-mono font-bold text-mortar-100 overflow-hidden whitespace-nowrap px-1"
              title={`Materials: ${materialsPct}%`}
            >
              {Number(materialsPct) > 15 ? `Materials ${materialsPct}%` : ""}
            </div>
            <div
              style={{ width: `${feePct}%` }}
              className="bg-safety-500 transition-all duration-150 ease-out flex items-center justify-center text-[10px] font-mono font-bold text-iron-950 overflow-hidden whitespace-nowrap px-1"
              title={`Fee: ${feePct}%`}
            >
              {Number(feePct) > 8 ? `Fee` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Breakdown Column */}
      <div className="lg:col-span-6 border-2 border-iron-950 bg-mortar-50 p-6 shadow-brutal rounded-none space-y-4">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-iron-700 border-b-2 border-iron-950 pb-2 flex items-center justify-between">
          <span>PAYMENT SPLIT</span>
          <TrendingUp className="w-4 h-4 text-iron-950" />
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center p-3 border-2 border-iron-950 bg-white rounded-none">
            <div className="space-y-0.5">
              <div className="font-bold text-iron-950 uppercase">1. Buyer Vault Total</div>
              <div className="text-[11px] text-iron-600">
                Labour + Materials + {(split.buyerTrustFeePct * 100).toFixed(0)}% fee
              </div>
            </div>
            <span className="font-black text-base text-iron-950 tabular-nums">
              {formatZar(split.grossBuyerPaidZar)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 border-2 border-iron-950 bg-white rounded-none">
            <div className="space-y-0.5">
              <div className="font-bold text-emerald-800 uppercase">2. Artisan Payout</div>
              <div className="text-[11px] text-iron-600">100% materials + net labour</div>
            </div>
            <span className="font-black text-base text-emerald-800 tabular-nums">
              {formatZar(split.workerNetPayoutZar)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 border-2 border-iron-950 bg-safety-100 rounded-none">
            <div className="space-y-0.5">
              <div className="font-bold text-iron-950 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brick-600" />
                3. Platform Cut
              </div>
              <div className="text-[11px] text-iron-700">
                Buyer ({formatZar(split.buyerTrustFeeZar)}) + Artisan ({formatZar(split.workerCommissionZar)})
              </div>
            </div>
            <span className="font-black text-base text-brick-700 tabular-nums">
              {formatZar(split.platformTotalCutZar)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
