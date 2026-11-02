"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  QrCode,
  Star,
  ArrowRight,
  CheckCircle2,
  HardHat,
  Banknote,
  Users,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { computeEscrowSplit } from "@/lib/adapters/escrow";
import { formatZar } from "@/lib/config";

export default function HomePage() {
  const { config, setCurrentUserId } = usePersona();

  const [labourInput, setLabourInput] = useState<number>(2000);
  const [materialsInput, setMaterialsInput] = useState<number>(800);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  const split = computeEscrowSplit({
    labourZar: labourInput,
    materialsZar: materialsInput,
    isRepeatBooking: isRepeat,
    config,
  });

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Built for South Africa • AFISwitch SAPS Vetting + Milestone Escrow
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Hire the Skilled Artisan Outside Builders—
              <span className="text-emerald-400"> Without the Safety or Cash Risk.</span>
            </h1>

            <p className="text-slate-200 text-base sm:text-lg max-w-2xl leading-relaxed">
              Every day across South Africa, talented plumbers, painters, tilers,
              bricklayers, and electricians wait outside hardware stores hoping for
              work—while homeowners hesitate over criminal safety and deposit scams.{" "}
              <strong>{config.platformName}</strong> bridges both sides with{" "}
              <strong>biometric SAPS clearance</strong>,{" "}
              <strong>Gate Check-In OTPs for the whole crew</strong>, and{" "}
              <strong>Milestone Escrow</strong>.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg transition"
              >
                Log a Renovation Job in 60s
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/jobs/job_bathroom_reno"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                Live Demo: Gate OTP &amp; Escrow Job
              </Link>
              <Link
                href="/worker/onboarding"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-semibold text-sm transition"
              >
                <HardHat className="w-4 h-4" />
                Artisan SAPS Onboarding
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-800/60 text-xs sm:text-sm">
              <div>
                <div className="font-bold text-white text-base sm:text-lg">
                  100% Fingerprinted
                </div>
                <div className="text-emerald-200/80">
                  Zero SAPS criminal record before quoting
                </div>
              </div>
              <div>
                <div className="font-bold text-white text-base sm:text-lg">
                  0% Fee on Slips
                </div>
                <div className="text-emerald-200/80">
                  Hardware materials reimbursed at cost
                </div>
              </div>
              <div>
                <div className="font-bold text-white text-base sm:text-lg">
                  Crew Gate OTP
                </div>
                <div className="text-emerald-200/80">
                  Every helper through your gate is vetted
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Escrow & Take-Rate Calculator */}
          <div className="lg:col-span-5 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Transparent Pricing Model
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Live Escrow &amp; Platform Cut Calculator
                </h2>
              </div>
              <Banknote className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <label htmlFor="labour-range">Quoted Skilled Labour</label>
                  <span className="font-bold text-emerald-700">
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
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <label htmlFor="materials-range">
                    Builders Warehouse Materials Slip (0% Fee!)
                  </label>
                  <span className="font-bold text-slate-700">
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
                  className="w-full accent-amber-600"
                />
              </div>

              <label className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRepeat}
                  onChange={(e) => setIsRepeat(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>
                  <strong>Repeat Booking Loyalty Rate:</strong> Drops worker labour
                  fee from {(config.workerLabourCommissionPct * 100).toFixed(0)}% to{" "}
                  {(config.repeatClientCommissionPct * 100).toFixed(0)}% so repeat
                  clients stay on-platform!
                </span>
              </label>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">
                  1. Homeowner Locks in Escrow (+{(split.buyerTrustFeePct * 100).toFixed(0)}% Labour Trust Fee):
                </span>
                <span className="font-bold text-slate-900 text-base">
                  {formatZar(split.grossBuyerPaidZar)}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-800">
                <span>2. Artisan Fast Payout on Approval:</span>
                <span className="font-bold">{formatZar(split.workerNetPayoutZar)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-amber-800 bg-amber-50/80 -mx-2 px-2 py-1.5 rounded-lg">
                <span className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  3. Your Platform Revenue Cut:
                </span>
                <span className="font-extrabold text-base">
                  {formatZar(split.platformTotalCutZar)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Includes <strong>{formatZar(split.buyerTrustFeeZar)}</strong> buyer
              fee + <strong>{formatZar(split.workerCommissionZar)}</strong> worker
              labour commission, split automatically by TradeSafe upon milestone
              sign-off.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Interactive Walkthrough Scenarios */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/jobs/job_bathroom_reno"
            onClick={() => setCurrentUserId("user_homeowner_lerato")}
            className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:border-emerald-500 transition group"
          >
            <div className="text-xs font-bold text-emerald-700 uppercase mb-1">
              Scenario 1 • Homeowner Safety
            </div>
            <div className="font-bold text-slate-900 group-hover:text-emerald-700">
              Verify Gate OTP (482915) &amp; Release Escrow →
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Inspect Sipho + Vetted Assistant Gift on the Gate Crew Pass and release R5,050 milestone.
            </p>
          </Link>

          <Link
            href="/worker/onboarding"
            onClick={() => setCurrentUserId("user_worker_thabo")}
            className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:border-amber-500 transition group"
          >
            <div className="text-xs font-bold text-amber-700 uppercase mb-1">
              Scenario 2 • Tier 1 Roadside Worker
            </div>
            <div className="font-bold text-slate-900 group-hover:text-amber-700">
              Test HURU / SAPS Biometric Vetting →
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Switch to Thabo (Tier 1 Browse Only), sign POPIA consent, and test Clear vs Criminal-Flagged SAPS outcomes.
            </p>
          </Link>

          <Link
            href="/jobs/job_exterior_paint"
            onClick={() => setCurrentUserId("user_homeowner_lerato")}
            className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:border-emerald-500 transition group"
          >
            <div className="text-xs font-bold text-blue-700 uppercase mb-1">
              Scenario 3 • Anti-Leakage Chat
            </div>
            <div className="font-bold text-slate-900 group-hover:text-blue-700">
              Compare Quotes &amp; Test Masked Chat →
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Try sending a cell number or &quot;pay cash&quot; before funding Escrow—watch automatic redaction protect your cut.
            </p>
          </Link>

          <Link
            href="/admin"
            onClick={() => setCurrentUserId("user_admin_owner")}
            className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:border-slate-900 transition group"
          >
            <div className="text-xs font-bold text-slate-700 uppercase mb-1">
              Scenario 4 • Founder Console
            </div>
            <div className="font-bold text-slate-900 group-hover:text-emerald-700">
              Track Your Revenue Ledger &amp; CoCs →
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Adjust commission %, approve pending trade CoCs, audit redactions, and resolve disputes.
            </p>
          </Link>
        </div>
      </section>

      {/* Why Competitors Fail vs How BuildSafe SA Works */}
      <section className="max-w-7xl mx-auto px-4 py-14 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered Around South Africa&apos;s Real Security &amp; Cash-Leakage Risks
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Lead directories spam homeowners and fleece workers for dead leads, while
            traditional vetting still lets contractors drop off unvetted street-corner
            helpers at your gate. Here is how {config.platformName} closes every gap:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              3-Tier Governed SAPS &amp; CoC Vetting
            </h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tier 1 (Free):</strong> 13-digit SA ID Luhn check + Live
                  Selfie lets workers outside hardware hubs browse real local demand.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tier 2 (Mandatory to Quote):</strong> POPIA consent + R200
                  HURU / AFISwitch biometric fingerprint SAPS clearance.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tier 3 (Statutory CoC):</strong> Verified PIRB, ECB Wireman,
                  &amp; NHBRC pros enforced automatically on regulated electrical/geyser jobs.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              No &quot;Subcontractor Bait-and-Switch&quot;
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              On other sites, a vetted boss wins the quote and drops off two
              unvetted casual labourers at your house. On{" "}
              <strong>{config.platformName}</strong>, any assistant accompanying a
              builder must be pre-linked on the{" "}
              <strong>Vetted Crew Gate Manifest</strong>—and you verify every face +
              6-digit OTP before opening your gate.
            </p>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                One-tap <strong>Unmatched Person / Gate Panic Button</strong>{" "}
                freezes the job and alerts Platform Security immediately.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              Escrow That Beats Cash Bypass + 2-Way Ratings
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Masked Chat hides phone numbers until the{" "}
              <strong>Credited Call-Out Deposit</strong> is locked in Escrow.
              Separating <strong>Labour</strong> from{" "}
              <strong>0%-fee Hardware Slips</strong> plus{" "}
              <strong>1-Tap Scope Variation Milestones</strong> keeps renovations
              fair—and <strong>Two-Way Ratings</strong> reward respectful,
              prompt-paying homeowners too.
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 pt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              Both Homeowners &amp; Artisans earn verified trust scores!
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
