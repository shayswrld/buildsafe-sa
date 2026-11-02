"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  Key,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { formatZar } from "@/lib/config";

export type ClientJobStatusFilter =
  | "ALL"
  | "NEEDS_ATTENTION"
  | "ACTIVE_ON_SITE"
  | "COMPLETED";

interface QuoteItemDTO {
  id: string;
  workerProfileId: string;
  labourAmountZar: number;
  materialsEstimateZar: number;
  workerProfile?: {
    user?: {
      name: string;
      avatarUrl?: string | null;
      ratingAvg?: number;
      ratingCount?: number;
    };
    vettingTier?: string;
  };
}

interface GateVisitItemDTO {
  id: string;
  checkInCode: string;
  status: string;
}

interface ClientJobItemDTO {
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
  status:
    | "OPEN"
    | "QUOTED"
    | "ESCROW_FUNDED"
    | "WORKER_ON_SITE"
    | "WORK_SUBMITTED"
    | "COMPLETED"
    | string;
  createdAt: string;
  quotes?: QuoteItemDTO[];
  gateVisits?: GateVisitItemDTO[];
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

export default function ClientDashboardPage() {
  const { currentUser, personas, setCurrentUserId } = usePersona();
  const [jobs, setJobs] = useState<ClientJobItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<ClientJobStatusFilter>("ALL");

  // Determine active client persona
  const clientPersonas = personas.filter(
    (p) => p.role === "HOMEOWNER" || p.role === "DUAL"
  );
  const activeClient =
    currentUser?.role === "HOMEOWNER" || currentUser?.role === "DUAL"
      ? currentUser
      : clientPersonas[0] || currentUser || personas[0];

  useEffect(() => {
    if (!activeClient) return;
    setLoading(true);
    fetch(`/api/jobs?homeownerId=${activeClient.id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.jobs)) {
          // Double-check client-side filtering by homeownerId
          const clientOwned = data.jobs.filter(
            (j: ClientJobItemDTO) => j.homeownerId === activeClient.id
          );
          setJobs(clientOwned);
        }
      })
      .catch((err) => {
        console.error("Failed to load client jobs:", err);
      })
      .finally(() => setLoading(false));
  }, [activeClient?.id]);

  if (!activeClient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center font-mono text-xs">
        Loading Client Hub...
      </div>
    );
  }

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter((j) => {
    switch (activeFilter) {
      case "NEEDS_ATTENTION":
        return j.status === "QUOTED" || j.status === "WORK_SUBMITTED";
      case "ACTIVE_ON_SITE":
        return (
          j.status === "ESCROW_FUNDED" || j.status === "WORKER_ON_SITE"
        );
      case "COMPLETED":
        return j.status === "COMPLETED";
      case "ALL":
      default:
        return true;
    }
  });

  const totalPosted = jobs.length;
  const needsAttentionCount = jobs.filter(
    (j) => j.status === "QUOTED" || j.status === "WORK_SUBMITTED"
  ).length;
  const activeOnSiteCount = jobs.filter(
    (j) => j.status === "ESCROW_FUNDED" || j.status === "WORKER_ON_SITE"
  ).length;
  const completedCount = jobs.filter((j) => j.status === "COMPLETED").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Section Header Tag */}
      <div className="font-mono text-xs font-bold text-iron-500 uppercase tracking-widest">
        // 01 · CLIENT PORTAL — ACTIVE JOB MANAGEMENT
      </div>

      {/* Top Profile Summary & Action Header */}
      <div className="border-2 border-iron-950 bg-white p-5 shadow-brutal rounded-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 border-2 border-iron-950 bg-brick-600 text-white font-black text-lg flex items-center justify-center font-mono rounded-none shadow-brutal-sm shrink-0">
              {activeClient.avatarUrl || "CL"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-iron-950 uppercase tracking-tight">
                  {activeClient.name}
                </h1>
                <span className="border-2 border-iron-950 bg-mortar-200 px-2 py-0.5 font-mono text-[11px] font-bold text-iron-900 uppercase rounded-none">
                  CLIENT ACCOUNT
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono font-bold text-iron-700 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brick-600" />
                  {activeClient.suburb}, {activeClient.city}
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  Homeowner Trust: {activeClient.ratingAvg.toFixed(1)} (
                  {activeClient.ratingCount} reviews)
                </span>
                <span className="text-iron-950">
                  Total Jobs: <strong className="tabular-nums">{totalPosted}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Persona Switcher for dev convenience */}
            <select
              value={activeClient.id}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="text-xs border-2 border-iron-950 rounded-none px-2.5 py-2 bg-white font-mono font-bold focus:outline-none shadow-brutal-sm cursor-pointer"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>

            {/* Primary Action Button */}
            <Link
              href="/jobs/new"
              className="border-2 border-iron-950 bg-brick-600 text-white font-mono font-bold uppercase rounded-none shadow-brutal px-5 py-2.5 hover:bg-brick-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>[ POST A NEW JOB ]</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-2 border-iron-950 bg-mortar-200 p-2 shadow-brutal-sm rounded-none">
        <button
          type="button"
          onClick={() => setActiveFilter("ALL")}
          className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider text-left border-2 border-iron-950 transition-all duration-150 rounded-none flex items-center justify-between ${
            activeFilter === "ALL"
              ? "bg-brick-600 text-white shadow-brutal-sm"
              : "bg-white text-iron-950 hover:bg-mortar-100"
          }`}
        >
          <span>All My Jobs</span>
          <span className="tabular-nums font-black ml-1.5 px-1.5 py-0.2 bg-iron-950 text-white text-[10px] border border-white">
            {totalPosted}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("NEEDS_ATTENTION")}
          className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider text-left border-2 border-iron-950 transition-all duration-150 rounded-none flex items-center justify-between ${
            activeFilter === "NEEDS_ATTENTION"
              ? "bg-brick-600 text-white shadow-brutal-sm"
              : "bg-white text-iron-950 hover:bg-mortar-100"
          }`}
        >
          <span>Needs Attention</span>
          {needsAttentionCount > 0 ? (
            <span className="tabular-nums font-black ml-1.5 px-1.5 py-0.2 bg-blue-600 text-white text-[10px] border border-white">
              {needsAttentionCount}
            </span>
          ) : (
            <span className="tabular-nums font-mono text-[10px] text-iron-500">
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("ACTIVE_ON_SITE")}
          className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider text-left border-2 border-iron-950 transition-all duration-150 rounded-none flex items-center justify-between ${
            activeFilter === "ACTIVE_ON_SITE"
              ? "bg-brick-600 text-white shadow-brutal-sm"
              : "bg-white text-iron-950 hover:bg-mortar-100"
          }`}
        >
          <span>Active &amp; On-Site</span>
          {activeOnSiteCount > 0 ? (
            <span className="tabular-nums font-black ml-1.5 px-1.5 py-0.2 bg-amber-500 text-iron-950 text-[10px] border border-iron-950">
              {activeOnSiteCount}
            </span>
          ) : (
            <span className="tabular-nums font-mono text-[10px] text-iron-500">
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("COMPLETED")}
          className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider text-left border-2 border-iron-950 transition-all duration-150 rounded-none flex items-center justify-between ${
            activeFilter === "COMPLETED"
              ? "bg-brick-600 text-white shadow-brutal-sm"
              : "bg-white text-iron-950 hover:bg-mortar-100"
          }`}
        >
          <span>Completed</span>
          <span className="tabular-nums font-mono text-[10px] text-iron-600">
            {completedCount}
          </span>
        </button>
      </div>

      {/* Jobs List Content Area */}
      {loading ? (
        <div className="border-2 border-iron-950 bg-white p-12 text-center font-mono text-xs uppercase shadow-brutal rounded-none">
          Fetching client jobs &amp; active escrows...
        </div>
      ) : filteredJobs.length === 0 ? (
        /* Brutalist Empty State Card */
        <div className="border-2 border-iron-950 bg-white p-10 sm:p-14 text-center shadow-brutal rounded-none space-y-5">
          <div className="w-16 h-16 border-2 border-iron-950 bg-mortar-200 mx-auto flex items-center justify-center font-mono text-2xl font-black text-iron-950 shadow-brutal-sm">
            !
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-iron-950 uppercase tracking-tight">
              NO ACTIVE JOB POSTINGS
            </h2>
            <p className="font-mono text-xs text-iron-700 leading-relaxed">
              Post a renovation or emergency repair job to receive quotes from
              SAPS-cleared artisans.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/jobs/new"
              className="border-2 border-iron-950 bg-brick-600 text-white font-mono font-bold uppercase rounded-none shadow-brutal px-6 py-3 hover:bg-brick-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>[ POST YOUR FIRST JOB ]</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Rendered Client Job Cards */
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const quotesCount = job.quotes?.length ?? 0;
            const hasActiveGateVisit =
              (job.status === "ESCROW_FUNDED" ||
                job.status === "WORKER_ON_SITE") &&
              job.gateVisits &&
              job.gateVisits.length > 0;
            const gateCode =
              job.gateVisits?.[0]?.checkInCode || "482915";

            return (
              <div
                key={job.id}
                className="border-2 border-iron-950 bg-white p-5 shadow-brutal rounded-none space-y-4 transition-all duration-150 hover:border-brick-600"
              >
                {/* Header row: Status badge, Category, and Date */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-iron-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold uppercase border-2 border-iron-950 px-2 py-0.5 rounded-none ${statusBadgeClasses(
                        job.status
                      )}`}
                    >
                      // STATUS: {job.status}
                    </span>

                    <span className="border-2 border-iron-950 bg-mortar-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-iron-950 uppercase rounded-none">
                      {job.category}
                    </span>

                    {job.requiresCoC && (
                      <span className="border-2 border-iron-950 bg-safety-100 text-safety-900 px-2 py-0.5 font-mono text-[11px] font-bold uppercase rounded-none flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-safety-700 shrink-0" />
                        Statutory CoC Required
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-xs text-iron-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(job.createdAt).toLocaleDateString("en-ZA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Title & Scope description */}
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-iron-950 uppercase tracking-tight">
                    {job.title}
                  </h3>
                  <p className="font-sans text-xs text-iron-800 line-clamp-2">
                    {job.description}
                  </p>
                </div>

                {/* Suburb & Financial Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border-2 border-iron-950 bg-mortar-50 font-mono text-xs">
                  <div>
                    <span className="block text-[10px] text-iron-500 uppercase font-bold">
                      Location
                    </span>
                    <span className="font-bold text-iron-950 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brick-600" />
                      {job.suburb}, {job.city}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-iron-500 uppercase font-bold">
                      Budget Estimate
                    </span>
                    <span className="font-bold text-iron-950 tabular-nums">
                      {job.budgetEstimateZar
                        ? formatZar(job.budgetEstimateZar)
                        : "Flexible / Estimating"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-iron-500 uppercase font-bold">
                      Credited Call-Out Deposit
                    </span>
                    <span className="font-bold text-brick-600 tabular-nums">
                      {formatZar(job.callOutDepositZar)}
                    </span>
                    <span className="text-[10px] text-iron-600 block">
                      100% credited against labour
                    </span>
                  </div>
                </div>

                {/* Quotes Received Indicator */}
                {quotesCount > 0 && (
                  <div className="border-2 border-iron-950 bg-blue-50 p-3 space-y-2 rounded-none">
                    <div className="flex items-center justify-between font-mono text-xs font-bold text-blue-950 uppercase">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-700" />
                        {quotesCount} Quote{quotesCount > 1 ? "s" : ""} Received —
                        Review &amp; Compare
                      </span>
                      <span className="text-[11px] underline text-blue-800">
                        {job.status === "OPEN" || job.status === "QUOTED"
                          ? "Awaiting Acceptance"
                          : "Artisan Assigned"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {job.quotes?.map((q) => {
                        const artisanName =
                          q.workerProfile?.user?.name || "Vetted Artisan";
                        const initials = artisanName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <div
                            key={q.id}
                            className="border-2 border-iron-950 bg-white px-2.5 py-1.5 flex items-center gap-2 rounded-none shadow-brutal-sm"
                          >
                            <div className="w-6 h-6 bg-iron-950 text-white font-mono font-bold text-[10px] flex items-center justify-center rounded-none">
                              {initials}
                            </div>
                            <div className="font-mono text-xs">
                              <span className="font-bold text-iron-950 block">
                                {artisanName}
                              </span>
                              <span className="text-[11px] text-brick-600 font-bold tabular-nums">
                                {formatZar(q.labourAmountZar)} labour
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Gate OTP Callout */}
                {hasActiveGateVisit && (
                  <div className="border-2 border-iron-950 bg-amber-100 p-3 font-mono text-xs font-bold text-amber-950 flex flex-wrap items-center justify-between gap-2 shadow-brutal-sm rounded-none">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-800 shrink-0" />
                      <span>
                        Gate OTP: <strong className="tracking-widest text-base">{gateCode}</strong> ready for arrival
                      </span>
                    </div>
                    <span className="text-[11px] uppercase bg-amber-200 border border-amber-900 px-2 py-0.5">
                      Present to Estate Security Guard
                    </span>
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="pt-2 border-t border-iron-200 flex items-center justify-between gap-3">
                  <div className="font-mono text-[11px] text-iron-600">
                    Job ID: #{job.id.slice(-8)}
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="border-2 border-iron-950 bg-iron-950 text-white font-mono font-bold uppercase text-xs px-4 py-2 hover:bg-brick-600 hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 inline-flex items-center gap-1.5 shadow-brutal-sm rounded-none"
                  >
                    <span>[ OPEN JOB WORKSPACE → ]</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
