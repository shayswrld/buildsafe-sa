"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ShieldCheck,
  ShieldAlert,
  Star,
  MapPin,
  CheckCircle2,
  Briefcase,
  Hammer,
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
  const [activeTab, setActiveTab] = useState<"assigned" | "open">("assigned");

  useEffect(() => {
    fetch("/api/jobs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.jobs)) {
          setJobs(d.jobs);
        }
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
        `Paid out ${formatZar(data.paidOutZar)} to ${activeWorker.name}.`
      );
      await refreshBootstrap();
    }
  };

  if (!activeWorker || !wp) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center font-mono text-xs">
        Loading Worker Hub...
      </div>
    );
  }

  const assignedJobs = jobs.filter((j) => j.selectedWorkerProfileId === wp.id);
  const openJobs = jobs.filter(
    (j) => j.status === "OPEN" || j.status === "QUOTED"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {payoutNotice && (
        <div
          role="alert"
          className="p-3.5 border-2 border-iron-950 bg-emerald-50 text-emerald-950 rounded-none shadow-brutal text-xs font-mono flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{payoutNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPayoutNotice(null)}
            className="font-bold uppercase underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Grid: Artisan Profile & Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 border-2 border-iron-950 bg-white rounded-none p-5 shadow-brutal space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-iron-950 pb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-iron-950 bg-iron-950 text-white font-black text-base flex items-center justify-center font-mono rounded-none">
                  {activeWorker.avatarUrl || "W"}
                </div>
                <div>
                  <h1 className="text-xl font-black text-iron-950 tracking-tight">
                    {activeWorker.name}
                  </h1>
                  <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-iron-900">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span className="tabular-nums">{activeWorker.ratingAvg.toFixed(1)}</span>
                    <span className="text-iron-500">({activeWorker.ratingCount})</span>
                  </div>
                </div>
              </div>

              <select
                value={activeWorker.id}
                onChange={(e) => setCurrentUserId(e.target.value)}
                className="text-xs border-2 border-iron-950 rounded-none px-2.5 py-1.5 bg-white font-mono font-bold focus:outline-none"
              >
                {workerPersonas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-mono text-iron-700 flex flex-wrap gap-x-4 gap-y-1">
              <span>HUB: <strong className="text-iron-950">{wp.nearestHardwareHub}</strong></span>
              <span>ID: <strong className="text-iron-950 tabular-nums">{wp.saIdMasked}</strong></span>
            </div>
          </div>

          <div className="pt-2.5 border-t-2 border-iron-950 flex flex-wrap items-center justify-between gap-2">
            {wp.sapsStatus === "CLEARED" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-iron-950 bg-emerald-100 text-emerald-950 font-mono text-xs font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                {wp.vettingTier.replace(/_/g, " ")} · {wp.sapsCertificateRef}
              </span>
            ) : (
              <Link
                href="/worker/onboarding"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-iron-950 bg-amber-100 hover:bg-amber-200 text-amber-950 font-mono text-xs font-bold uppercase"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                {wp.vettingTier.replace(/_/g, " ")} — COMPLETE SAPS →
              </Link>
            )}

            <Link
              href="/worker/onboarding"
              className="text-xs font-mono font-bold uppercase text-brick-600 hover:underline"
            >
              Vetting &amp; CoC &rarr;
            </Link>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="lg:col-span-5 border-2 border-iron-950 bg-iron-950 text-white rounded-none p-5 shadow-brutal flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs uppercase font-mono text-safety-400 font-bold">
              <span>AVAILABLE WALLET</span>
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black tracking-tight tabular-nums mt-1 text-white font-mono">
              {formatZar(wp.walletBalanceZar)}
            </div>
            <div className="text-xs font-mono text-mortar-400 mt-1">
              Paid Out: <strong className="text-white tabular-nums">{formatZar(wp.totalPaidOutZar)}</strong> •{" "}
              <strong className="text-white tabular-nums">{wp.completedJobsCount}</strong> Jobs
            </div>
          </div>

          <button
            type="button"
            disabled={wp.walletBalanceZar <= 0}
            onClick={handleFastPayout}
            className="brutal-btn w-full py-3 bg-brick-600 hover:bg-brick-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Instant Payout ({formatZar(wp.walletBalanceZar)})
          </button>
        </div>
      </div>

      {/* Jobs Tabs */}
      <div className="space-y-4">
        <div className="flex border-b-2 border-iron-950 bg-mortar-200 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("assigned")}
            className={`flex-1 py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 border-2 ${
              activeTab === "assigned"
                ? "border-iron-950 bg-white text-iron-950 shadow-brutal-sm font-black"
                : "border-transparent bg-transparent text-iron-700 hover:bg-mortar-300"
            }`}
          >
            <Briefcase className="w-4 h-4 text-brick-600" />
            <span>Active Contracts</span>
            <span className="px-1.5 py-0.5 border border-iron-950 bg-mortar-100 text-iron-950 tabular-nums">
              {assignedJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("open")}
            className={`flex-1 py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 border-2 ${
              activeTab === "open"
                ? "border-iron-950 bg-white text-iron-950 shadow-brutal-sm font-black"
                : "border-transparent bg-transparent text-iron-700 hover:bg-mortar-300"
            }`}
          >
            <Hammer className="w-4 h-4 text-brick-600" />
            <span>Open Jobs</span>
            <span className="px-1.5 py-0.5 border border-iron-950 bg-mortar-100 text-iron-950 tabular-nums">
              {openJobs.length}
            </span>
          </button>
        </div>

        {activeTab === "assigned" && (
          <div className="space-y-4 transition-all duration-150">
            {assignedJobs.length === 0 ? (
              <div className="border-2 border-iron-950 bg-white p-6 rounded-none shadow-brutal text-center space-y-2">
                <p className="font-mono text-xs font-bold text-iron-700 uppercase">
                  No active contracts.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("open")}
                  className="brutal-btn brutal-btn-outline px-4 py-2 text-xs"
                >
                  Browse Open Jobs &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedJobs.map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="border-2 border-iron-950 bg-white p-4 rounded-none shadow-brutal hover:border-brick-600 transition-all duration-150 flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 border-b border-iron-200 pb-1.5">
                        <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 border border-iron-950 bg-emerald-100 text-emerald-950">
                          {j.status.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-xs text-iron-600 uppercase">
                          {j.category}
                        </span>
                      </div>

                      <h3 className="font-black text-base text-iron-950 group-hover:text-brick-600 transition-colors">
                        {j.title}
                      </h3>

                      <div className="text-xs font-mono text-iron-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brick-600 shrink-0" />
                        <span>{j.suburb}, {j.city}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-iron-200 flex items-center justify-between text-xs font-mono font-bold">
                      <span>Deposit: {formatZar(j.callOutDepositZar)}</span>
                      <span className="text-brick-600">Open Workspace &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "open" && (
          <div className="space-y-4 transition-all duration-150">
            {openJobs.length === 0 ? (
              <div className="border-2 border-iron-950 bg-white p-6 rounded-none shadow-brutal text-center font-mono text-xs text-iron-600">
                No open jobs right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openJobs.map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="border-2 border-iron-950 bg-white p-4 rounded-none shadow-brutal hover:border-brick-600 transition-all duration-150 flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-iron-200 pb-1.5">
                        <span className="font-mono text-xs font-bold text-iron-950 uppercase">
                          {j.category}
                        </span>
                        {j.requiresCoC ? (
                          <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-iron-950 bg-amber-200 text-amber-950">
                            Tier 3 CoC
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-iron-950 bg-mortar-200 text-iron-950">
                            Tier 2+
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-base text-iron-950 group-hover:text-brick-600 transition-colors">
                        {j.title}
                      </h3>

                      <div className="text-xs font-mono text-iron-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brick-600 shrink-0" />
                        <span>
                          {j.suburb}, {j.city} • Est.{" "}
                          <strong className="text-iron-950 tabular-nums">
                            {formatZar(j.budgetEstimateZar ?? j.callOutDepositZar)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-iron-200 flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-iron-600">
                        Call-Out: <span className="text-iron-950 tabular-nums">{formatZar(j.callOutDepositZar)}</span>
                      </span>
                      <span className="text-brick-600">Quote &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
