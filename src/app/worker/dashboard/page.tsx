"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Star,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { formatZar } from "@/lib/config";

interface WorkerJobCard {
  id: string;
  title: string;
  category: string;
  suburb: string;
  city: string;
  status: string;
  requiresCoC: boolean;
  budgetEstimateZar?: number | null;
  callOutDepositZar: number;
  selectedWorkerProfileId?: string | null;
}

export default function WorkerDashboardPage() {
  const { currentUser, personas, setCurrentUserId, refreshBootstrap } =
    usePersona();
  const [jobs, setJobs] = useState<WorkerJobCard[]>([]);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.jobs)) setJobs(d.jobs);
      });
  }, []);

  const workerPersonas = personas.filter((p) => p.role === "WORKER");
  const activeWorker =
    currentUser?.role === "WORKER" ? currentUser : workerPersonas[0];
  const wp = activeWorker?.workerProfile;

  const handleFastPayout = async () => {
    if (!wp) return;
    const res = await fetch("/api/worker/vetting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "PAYOUT_WALLET",
        workerProfileId: wp.id,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setPayoutNotice(
        `Instant Payout Sent! ${formatZar(
          data.paidOutZar
        )} disbursed to ${activeWorker.name}'s Capitec / Bank account.`
      );
      await refreshBootstrap();
    }
  };

  if (!activeWorker || !wp) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Loading Artisan Portal...
      </div>
    );
  }

  const assignedJobs = jobs.filter((j) => j.selectedWorkerProfileId === wp.id);
  const openJobs = jobs.filter(
    (j) => j.status === "OPEN" || j.status === "QUOTED"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {payoutNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {payoutNotice}
        </div>
      )}

      {/* Top Worker Profile & Fast-Payout Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {activeWorker.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {activeWorker.ratingAvg.toFixed(2)} ({activeWorker.ratingCount})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hub: <strong>{wp.nearestHardwareHub}</strong> • Masked ID:{" "}
                {wp.saIdMasked}
              </p>
            </div>

            <select
              value={activeWorker.id}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 font-semibold"
            >
              {workerPersonas.map((w) => (
                <option key={w.id} value={w.id}>
                  Switch Worker: {w.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-slate-600">{wp.bio}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {wp.sapsStatus === "CLEARED" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                {wp.vettingTier.replace(/_/g, " ")} • {wp.sapsCertificateRef}
              </span>
            ) : (
              <Link
                href="/worker/onboarding"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300"
              >
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                {wp.vettingTier.replace(/_/g, " ")} — Complete SAPS Check to Quote →
              </Link>
            )}
          </div>
        </div>

        {/* Fast-Payout Wallet (Solves why workers want cash on the day!) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                Artisan Escrow Earnings Wallet
              </div>
              <div className="text-3xl font-extrabold mt-1">
                {formatZar(wp.walletBalanceZar)}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Lifetime Paid Out: {formatZar(wp.totalPaidOutZar)} •{" "}
                {wp.completedJobsCount} Verified Jobs
              </div>
            </div>
            <Wallet className="w-9 h-9 text-emerald-400" />
          </div>

          <button
            type="button"
            disabled={wp.walletBalanceZar <= 0}
            onClick={handleFastPayout}
            className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition"
          >
            Instant Payout to Capitec / Bank / eWallet ({formatZar(wp.walletBalanceZar)})
          </button>
        </div>
      </div>

      {/* Active Assigned Jobs */}
      {assignedJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg text-slate-900">
            Your Active Escrow-Backed Jobs ({assignedJobs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedJobs.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="bg-white rounded-2xl p-5 border-2 border-emerald-500/40 shadow-sm flex items-center justify-between gap-4 hover:border-emerald-600 transition"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-700">
                    {j.status.replace(/_/g, " ")}
                  </span>
                  <h3 className="font-bold text-slate-900 mt-0.5">{j.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {j.suburb}, {j.city}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-700 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Open Jobs Feed */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg text-slate-900">
          Open Homeowner Jobs Available to Quote ({openJobs.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {openJobs.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-500 shadow-sm flex items-center justify-between gap-4 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700">{j.category}</span>
                  {j.requiresCoC && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                      Tier 3 CoC Only
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900">{j.title}</h3>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {j.suburb}, {j.city} • Est.{" "}
                  {formatZar(j.budgetEstimateZar ?? j.callOutDepositZar)}
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 shrink-0">
                Open &amp; Quote →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
