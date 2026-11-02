"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  AlertCircle,
  PlusCircle,
  Star,
  Lock,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { TRADE_CATEGORIES, formatZar } from "@/lib/config";

interface JobSummaryDTO {
  id: string;
  homeownerId: string;
  title: string;
  category: string;
  description: string;
  suburb: string;
  city: string;
  urgency: string;
  requiresCoC: boolean;
  callOutDepositZar: number;
  budgetEstimateZar?: number | null;
  status: string;
  homeowner: {
    id: string;
    name: string;
    ratingAvg: number;
    ratingCount: number;
  };
  quotes: { id: string }[];
  milestones: { id: string; status: string }[];
}

function statusPill(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-100 text-emerald-800";
    case "QUOTED":
      return "bg-blue-100 text-blue-800";
    case "ESCROW_FUNDED":
      return "bg-amber-100 text-amber-900";
    case "WORKER_ON_SITE":
      return "bg-purple-100 text-purple-900";
    case "WORK_SUBMITTED":
      return "bg-indigo-100 text-indigo-900";
    case "COMPLETED":
      return "bg-slate-200 text-slate-800";
    case "DISPUTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function JobsListPage() {
  const { currentUser } = usePersona();
  const [jobs, setJobs] = useState<JobSummaryDTO[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/jobs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.jobs)) setJobs(d.jobs);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(
    (j) => categoryFilter === "ALL" || j.category === categoryFilter
  );

  const isTier1Worker =
    currentUser?.role === "WORKER" &&
    currentUser.workerProfile?.vettingTier === "TIER_1_BROWSE_ONLY";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            South African Renovation &amp; Trade Jobs
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Every job is protected by Masked Pre-Booking Chat, Regulated Milestone
            Escrow, and 6-Digit Gate Check-In OTPs.
          </p>
        </div>

        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Log a New Job
        </Link>
      </div>

      {/* Tier 1 Browse-Only Banner for New Roadside Artisans */}
      {isTier1Worker && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-950">
              <div className="font-bold">
                Welcome {currentUser?.name}! You are on Tier 1 (Free Browse Mode)
              </div>
              <p className="text-amber-800 mt-0.5">
                You can browse all real homeowner jobs near{" "}
                <strong>{currentUser?.workerProfile?.nearestHardwareHub}</strong>{" "}
                for free. To unlock quoting and accepting jobs, complete your{" "}
                <strong>R200 HURU / AFISwitch SAPS Fingerprint Check</strong>.
              </p>
            </div>
          </div>
          <Link
            href="/worker/onboarding"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
          >
            Complete SAPS Clearance →
          </Link>
        </div>
      )}

      {/* Trade Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
            categoryFilter === "ALL"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          All Trades ({jobs.length})
        </button>
        {TRADE_CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategoryFilter(c.slug)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
              categoryFilter === c.slug
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 py-12 text-center">
          Loading verified jobs...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-500 shadow-sm transition flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${statusPill(
                        job.status
                      )}`}
                    >
                      {job.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {job.category}
                    </span>
                  </div>

                  {job.requiresCoC ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      Tier 3 Statutory CoC Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                      Tier 2+ SAPS-Cleared Eligible
                    </span>
                  )}
                </div>

                <h2 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition">
                  {job.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                  {job.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {job.suburb}, {job.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Buyer {job.homeowner.ratingAvg.toFixed(1)}★
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {job.quotes.length} quote{job.quotes.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-bold text-emerald-700">
                  {job.budgetEstimateZar ? (
                    <span>Est. {formatZar(job.budgetEstimateZar)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Call-Out {formatZar(job.callOutDepositZar)}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
