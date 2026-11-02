"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Hammer,
  PlusCircle,
  Briefcase,
  UserCheck,
  Landmark,
  Star,
  Wallet,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { formatZar } from "@/lib/config";

function tierBadgeLabel(tier?: string) {
  if (tier === "TIER_3_COC_CERTIFIED") return "Tier 3: CoC Pro";
  if (tier === "TIER_2_SAPS_CLEARED") return "Tier 2: SAPS Cleared";
  if (tier === "TIER_1_BROWSE_ONLY") return "Tier 1: Browse Only";
  if (tier === "SUSPENDED") return "Safety Blocked";
  return "";
}

export function Navbar() {
  const pathname = usePathname();
  const { config, personas, currentUser, setCurrentUserId } = usePersona();

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {/* Interactive Demo Persona Switcher Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              Interactive Demo Mode
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Switch active persona to test Homeowner, Tier 1/2/3 Artisans, &amp; Your Admin Cut:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Select Active Demo Persona"
              value={currentUser?.id ?? ""}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-md px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {personas.map((p) => {
                const roleTag =
                  p.role === "ADMIN"
                    ? "Platform Owner / Admin"
                    : p.role === "HOMEOWNER"
                    ? `Homeowner (${p.suburb})`
                    : `${tierBadgeLabel(p.workerProfile?.vettingTier)} Artisan`;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} — {roleTag}
                  </option>
                );
              })}
            </select>

            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">
                <span className="font-semibold text-emerald-400">
                  {currentUser.name}
                </span>
                {currentUser.ratingCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-amber-300">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {currentUser.ratingAvg.toFixed(1)}
                  </span>
                )}
                {currentUser.workerProfile && (
                  <span className="inline-flex items-center gap-1 text-emerald-300 border-l border-slate-700 pl-2">
                    <Wallet className="w-3 h-3" />
                    {formatZar(currentUser.workerProfile.walletBalanceZar)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main App Bar */}
      <nav className="bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-800 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg leading-tight flex items-center gap-1.5">
                {config.platformName}
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  ZA
                </span>
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                SAPS-Cleared Artisans • Milestone Escrow
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm font-medium">
            <Link
              href="/jobs/new"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                pathname === "/jobs/new"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log a Job</span>
            </Link>

            <Link
              href="/jobs"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                pathname === "/jobs" || pathname?.startsWith("/jobs/") && pathname !== "/jobs/new"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Jobs &amp; Escrow</span>
            </Link>

            <Link
              href="/worker/dashboard"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                pathname?.startsWith("/worker")
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>Worker Hub</span>
            </Link>

            <Link
              href="/worker/onboarding"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                pathname === "/worker/onboarding"
                  ? "bg-amber-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden md:inline">SAPS Onboarding</span>
            </Link>

            <Link
              href="/admin"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                pathname === "/admin"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Admin &amp; Your Cut</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
