"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  AlertCircle,
  Plus,
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

function statusBadgeClasses(status: string) {
  switch (status) {
    case "OPEN":
      return "border-2 border-iron-950 bg-emerald-100 text-emerald-950";
    case "QUOTED":
      return "border-2 border-iron-950 bg-blue-100 text-blue-950";
    case "ESCROW_FUNDED":
      return "border-2 border-iron-950 bg-amber-200 text-amber-950";
    case "WORKER_ON_SITE":
      return "border-2 border-iron-950 bg-purple-100 text-purple-950";
    case "WORK_SUBMITTED":
      return "border-2 border-iron-950 bg-indigo-100 text-indigo-950";
    case "COMPLETED":
      return "border-2 border-iron-950 bg-mortar-300 text-iron-950";
    case "DISPUTED":
      return "border-2 border-iron-950 bg-rose-200 text-rose-950";
    default:
      return "border-2 border-iron-950 bg-mortar-200 text-iron-950";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Primary Action */}
      <div className="border-b-2 border-iron-950 pb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-iron-950 uppercase tracking-tight">
          Active Trade Jobs
        </h1>

        <Link
          href="/jobs/new"
          className="brutal-btn-primary px-4 py-2.5 text-xs font-black inline-flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>[ POST A JOB ]</span>
        </Link>
      </div>

      {/* Tier 1 Browse-Only Notice for Unvetted Workers */}
      {isTier1Worker && (
        <div className="border-2 border-iron-950 bg-safety-50 p-4 shadow-brutal rounded-none flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-mono text-iron-950">
            <AlertCircle className="w-4 h-4 text-safety-600 shrink-0" />
            <span>
              <strong>Tier 1 (Browse Only):</strong> Complete your R200 SAPS check to submit quotes.
            </span>
          </div>

          <Link
            href="/worker/onboarding"
            className="brutal-btn-dark px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider shrink-0"
          >
            COMPLETE SAPS CLEARANCE →
          </Link>
        </div>
      )}

      {/* Trade Category Filter Bar */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter("ALL")}
          className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-iron-950 transition-all duration-100 rounded-none ${
            categoryFilter === "ALL"
              ? "bg-brick-600 text-white shadow-brutal-sm"
              : "bg-white text-iron-950 hover:bg-mortar-200"
          }`}
        >
          All ({jobs.length})
        </button>

        {TRADE_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => setCategoryFilter(cat.slug)}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-iron-950 transition-all duration-100 rounded-none ${
              categoryFilter === cat.slug
                ? "bg-brick-600 text-white shadow-brutal-sm"
                : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Job Card Grid */}
      {loading ? (
        <div className="border-2 border-iron-950 bg-white p-10 text-center shadow-brutal rounded-none font-mono text-xs font-bold uppercase text-iron-600">
          Loading jobs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-2 border-iron-950 bg-white p-10 text-center shadow-brutal rounded-none space-y-3">
          <p className="font-mono text-xs font-bold uppercase text-iron-600">
            No jobs in &quot;{categoryFilter}&quot;
          </p>
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className="brutal-btn-outline px-4 py-2 text-xs font-bold"
          >
            SHOW ALL TRADES
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="border-2 border-iron-950 bg-white p-5 shadow-brutal hover:shadow-brutal-brick transition-all duration-100 rounded-none flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[11px] font-black uppercase px-2 py-0.5 rounded-none ${statusBadgeClasses(
                        job.status
                      )}`}
                    >
                      {job.status.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-xs font-bold uppercase text-iron-600">
                      {job.category}
                    </span>
                  </div>

                  {job.requiresCoC ? (
                    <span className="border-2 border-safety-600 bg-safety-100 text-safety-950 font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded-none flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-safety-600" />
                      CoC Required
                    </span>
                  ) : (
                    <span className="border border-iron-700 bg-mortar-100 text-iron-800 font-mono text-[11px] uppercase px-2 py-0.5 rounded-none">
                      Tier 2+ SAPS
                    </span>
                  )}
                </div>

                <h2 className="font-black text-lg text-iron-950 uppercase tracking-tight group-hover:text-brick-600 transition-colors">
                  {job.title}
                </h2>

                <p className="text-xs text-iron-700 line-clamp-1 font-sans">
                  {job.description}
                </p>
              </div>

              <div className="pt-3 border-t-2 border-iron-950 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-iron-800">
                  <span className="flex items-center gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-brick-600 shrink-0" />
                    {job.suburb}, {job.city}
                  </span>

                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-safety-500 text-safety-500 shrink-0" />
                    <span className="tabular-nums">{job.homeowner.ratingAvg.toFixed(1)}</span>
                  </span>

                  <span className="flex items-center gap-1 text-iron-600">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="tabular-nums">{job.quotes.length}</span> bid{job.quotes.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono font-black text-brick-600">
                  {job.budgetEstimateZar ? (
                    <span className="tabular-nums">Est. {formatZar(job.budgetEstimateZar)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Lock className="w-3 h-3 text-iron-950" />
                      Call-Out {formatZar(job.callOutDepositZar)}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-iron-950 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
