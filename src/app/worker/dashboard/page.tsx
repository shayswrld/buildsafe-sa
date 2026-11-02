"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Lock,
  UserCheck,
  BadgeCheck,
  Clock,
  Edit3,
  SlidersHorizontal,
  X,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import {
  formatZar,
  TRADE_CATEGORIES,
  SA_HARDWARE_HUBS,
} from "@/lib/config";

interface WorkerJobCard {
  id: string;
  title: string;
  category: string;
  description?: string;
  problemTagsJson?: string;
  suburb: string;
  city: string;
  status: string;
  urgency?: "EMERGENCY_24H" | "THIS_WEEK" | "FLEXIBLE" | string;
  requiresCoC: boolean;
  budgetEstimateZar?: number | null;
  callOutDepositZar: number;
  selectedWorkerProfileId?: string | null;
  homeowner?: {
    id: string;
    name: string;
    ratingAvg: number;
    ratingCount: number;
    suburb: string;
  } | null;
  quotes?: Array<{
    id: string;
    workerProfileId: string;
  }>;
}

export default function WorkerDashboardPage() {
  const { currentUser, personas, setCurrentUserId, refreshBootstrap } =
    usePersona();
  const [jobs, setJobs] = useState<WorkerJobCard[]>([]);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"assigned" | "open">("assigned");

  // Skills Editing Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editTrades, setEditTrades] = useState<string[]>([]);
  const [editYears, setEditYears] = useState<number>(3);
  const [editBio, setEditBio] = useState<string>("");
  const [editHub, setEditHub] = useState<string>("");
  const [isSavingSkills, setIsSavingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [skillsSuccess, setSkillsSuccess] = useState<string | null>(null);

  // Job Browsing Filter State
  const [matchMyTradesOnly, setMatchMyTradesOnly] = useState(false);
  const [selectedTradeFilter, setSelectedTradeFilter] = useState("ALL");
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/jobs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.jobs)) {
          setJobs(d.jobs);
        }
      });
  }, []);

  const workerPersonas = personas.filter(
    (p) => p.role === "WORKER" || p.workerProfile
  );
  const activeWorker =
    (currentUser?.role === "WORKER" || currentUser?.isDualRole) &&
    currentUser.workerProfile
      ? currentUser
      : workerPersonas[0];
  const wp = activeWorker?.workerProfile;

  const activeTrades = useMemo(() => {
    if (!wp?.tradesJson) return ["PAINTING"];
    try {
      const parsed = JSON.parse(wp.tradesJson);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["PAINTING"];
    } catch {
      return ["PAINTING"];
    }
  }, [wp?.tradesJson]);

  // Sync drawer form state when drawer opens or active worker changes
  useEffect(() => {
    if (wp) {
      setEditTrades(activeTrades);
      setEditYears(wp.yearsExperience ?? 3);
      setEditBio(wp.bio ?? "");
      setEditHub(wp.nearestHardwareHub ?? SA_HARDWARE_HUBS[0]);
    }
  }, [wp, activeTrades, isDrawerOpen]);

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

  const toggleTrade = (slug: string) => {
    setEditTrades((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  const handleSaveSkills = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wp) return;
    setSkillsError(null);
    setSkillsSuccess(null);

    if (editTrades.length === 0) {
      setSkillsError("At least one trade category is required.");
      return;
    }
    if (editYears < 0 || isNaN(editYears)) {
      setSkillsError("Years of experience must be a non-negative number.");
      return;
    }
    if (editBio.trim().length < 10) {
      setSkillsError("Professional bio must be at least 10 characters long.");
      return;
    }
    if (!editHub || editHub.trim().length === 0) {
      setSkillsError("Nearest hardware hub is required.");
      return;
    }

    setIsSavingSkills(true);
    try {
      const res = await fetch("/api/worker/vetting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SKILLS",
          workerProfileId: wp.id,
          trades: editTrades,
          yearsExperience: Number(editYears),
          bio: editBio.trim(),
          nearestHardwareHub: editHub.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile skills.");
      }

      setSkillsSuccess("Skills and professional profile updated successfully.");
      await refreshBootstrap();
      setTimeout(() => {
        setIsDrawerOpen(false);
        setSkillsSuccess(null);
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update skills.";
      setSkillsError(msg);
    } finally {
      setIsSavingSkills(false);
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

  const matchingMyTradesCount = openJobs.filter((j) =>
    activeTrades.includes(j.category)
  ).length;

  const filteredOpenJobs = openJobs.filter((j) => {
    if (matchMyTradesOnly && activeTrades.length > 0) {
      if (!activeTrades.includes(j.category)) return false;
    } else if (selectedTradeFilter !== "ALL") {
      if (j.category !== selectedTradeFilter) return false;
    }

    if (selectedUrgencyFilter !== "ALL") {
      if (j.urgency !== selectedUrgencyFilter) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
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

      {skillsSuccess && !isDrawerOpen && (
        <div
          role="alert"
          className="p-3.5 border-2 border-iron-950 bg-emerald-50 text-emerald-950 rounded-none shadow-brutal text-xs font-mono flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{skillsSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSkillsSuccess(null)}
            className="font-bold uppercase underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: ARTISAN PROFILE, BIO, SKILLS & WALLET
         ========================================================================= */}
      <div>
        <div className="mb-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-iron-500">
            {"// 01 · BUILDER IDENTITY & TRADE SPECIALIZATION"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Profile Card */}
          <div className="lg:col-span-7 border-2 border-iron-950 bg-white rounded-none p-5 shadow-brutal space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-iron-950 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 border-2 border-iron-950 bg-iron-950 text-white font-black text-lg flex items-center justify-center font-mono rounded-none">
                    {activeWorker.avatarUrl || "W"}
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-iron-950 tracking-tight">
                      {activeWorker.name}
                    </h1>
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-iron-900">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="tabular-nums">
                          {activeWorker.ratingAvg.toFixed(1)}
                        </span>
                        <span className="text-iron-500">
                          ({activeWorker.ratingCount} reviews)
                        </span>
                      </span>
                      <span>•</span>
                      <span className="text-iron-700">
                        {activeWorker.suburb}, {activeWorker.city}
                      </span>
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
                      {w.name} {w.isDualRole ? "(Dual Role)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trade Specialties Badges */}
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-iron-600 block">
                  Registered Trade Specialties:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeTrades.map((tradeSlug) => {
                    const meta = TRADE_CATEGORIES.find(
                      (t) => t.slug === tradeSlug
                    );
                    return (
                      <span
                        key={tradeSlug}
                        className="px-2.5 py-1 border border-iron-950 bg-iron-950 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-none"
                      >
                        {meta ? meta.label : tradeSlug}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Years Experience & Hardware Hub */}
              <div className="text-xs font-mono text-iron-800 flex flex-wrap gap-x-5 gap-y-1 pt-1 border-t border-iron-200">
                <span>
                  Experience:{" "}
                  <strong className="text-iron-950 tabular-nums">
                    {wp.yearsExperience} Years
                  </strong>{" "}
                  in Trade
                </span>
                <span>
                  Hardware Hub:{" "}
                  <strong className="text-iron-950">
                    {wp.nearestHardwareHub}
                  </strong>
                </span>
                <span>
                  ID:{" "}
                  <strong className="text-iron-950 tabular-nums">
                    {wp.saIdMasked}
                  </strong>
                </span>
              </div>

              {/* Professional Biography */}
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-iron-600 block">
                  Professional Biography:
                </span>
                <p className="text-xs font-mono text-iron-800 bg-mortar-100 border border-iron-300 p-2.5 leading-relaxed rounded-none">
                  {wp.bio || "No biography provided. Click below to add your background."}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-iron-950 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="brutal-btn brutal-btn-outline px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-brick-600" />
                [ Edit Skills &amp; Expertise ]
              </button>

              <Link
                href="/worker/onboarding"
                className="text-xs font-mono font-bold uppercase text-brick-600 hover:underline flex items-center gap-1"
              >
                Vetting Simulator &amp; CoC Hub &rarr;
              </Link>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="lg:col-span-5 border-2 border-iron-950 bg-iron-950 text-white rounded-none p-5 shadow-brutal flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs uppercase font-mono text-safety-400 font-bold">
                <span>AVAILABLE WALLET</span>
                <Wallet className="w-4 h-4 text-safety-400" />
              </div>
              <div className="text-3xl font-black tracking-tight tabular-nums mt-1 text-white font-mono">
                {formatZar(wp.walletBalanceZar)}
              </div>
              <div className="text-xs font-mono text-mortar-400 mt-2 space-y-1">
                <div>
                  Lifetime Paid Out:{" "}
                  <strong className="text-white tabular-nums">
                    {formatZar(wp.totalPaidOutZar)}
                  </strong>
                </div>
                <div>
                  Completed Escrow Jobs:{" "}
                  <strong className="text-white tabular-nums">
                    {wp.completedJobsCount}
                  </strong>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={wp.walletBalanceZar <= 0}
                onClick={handleFastPayout}
                className="brutal-btn w-full py-3 bg-brick-600 hover:bg-brick-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Instant Payout ({formatZar(wp.walletBalanceZar)})
              </button>
              <p className="text-[10px] font-mono text-mortar-400 text-center">
                Automated clearing into verified South African bank account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: DEDICATED 3-PILLAR BUILDER VETTING & SECURITY FRAMEWORK
         ========================================================================= */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-iron-500">
              {"// 02 · BUILDER VETTING & SECURITY FRAMEWORK"}
            </span>
            <h2 className="text-lg font-black text-iron-950 uppercase tracking-tight">
              3-Pillar Verifiability &amp; Gate Security Clearance
            </h2>
          </div>
          <Link
            href="/worker/onboarding"
            className="text-xs font-mono font-bold uppercase text-brick-600 hover:underline"
          >
            Upgrade Vetting Tiers &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PILLAR 1: PROOF OF IDENTITY */}
          <div className="border-2 border-iron-950 bg-white p-5 rounded-none shadow-brutal flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-iron-200 pb-2">
                <span className="font-mono text-[11px] font-black uppercase text-iron-950 tracking-wider">
                  PILLAR 1: PROOF OF IDENTITY
                </span>
                <span className="px-2 py-0.5 border border-iron-950 bg-emerald-100 text-emerald-950 font-mono text-[10px] font-black uppercase">
                  VERIFIED
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    13-Digit South African ID:
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="font-black text-iron-950 tabular-nums">
                      {wp.saIdMasked}
                    </span>
                    <span className="px-1.5 py-0.5 border border-iron-950 bg-mortar-100 text-iron-900 text-[10px] font-bold">
                      Luhn Validated
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    DHA NPR Citizen Status:
                  </span>
                  <div className="font-bold text-iron-900 flex items-center gap-1.5 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      {wp.citizenshipStatus === "SA_CITIZEN"
                        ? "Active Citizen Match"
                        : wp.citizenshipStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    Biometric Live Selfie:
                  </span>
                  <div className="font-bold text-iron-900 flex items-center gap-1.5 mt-0.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Match Confirmed</span>
                  </div>
                  <span className="text-[10px] text-iron-500 block mt-0.5">
                    Verified:{" "}
                    {wp.selfieVerified
                      ? "Live Biometric Match Confirmed"
                      : "Pending Registration Verification"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-iron-200 text-[11px] font-mono text-iron-600 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>13-Digit SA ID validated (Luhn algorithm)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>Home Affairs NPR active citizen match</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>Biometric live selfie match confirmed</span>
              </div>
            </div>
          </div>

          {/* PILLAR 2: PROOF OF VERIFIABILITY */}
          <div className="border-2 border-iron-950 bg-white p-5 rounded-none shadow-brutal flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-iron-200 pb-2">
                <span className="font-mono text-[11px] font-black uppercase text-iron-950 tracking-wider">
                  PILLAR 2: PROOF OF VERIFIABILITY
                </span>
                {wp.sapsStatus === "CLEARED" ? (
                  <span className="px-2 py-0.5 border border-iron-950 bg-emerald-100 text-emerald-950 font-mono text-[10px] font-black uppercase">
                    CLEARED
                  </span>
                ) : wp.sapsStatus === "PENDING_FINGERPRINTS" ? (
                  <span className="px-2 py-0.5 border border-iron-950 bg-amber-100 text-amber-950 font-mono text-[10px] font-black uppercase">
                    PENDING PRINTS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 border border-iron-950 bg-amber-100 text-amber-950 font-mono text-[10px] font-black uppercase">
                    ACTION REQUIRED
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    SAPS Criminal Record Clearance:
                  </span>
                  <div className="font-bold text-iron-900 flex items-center gap-1.5 mt-0.5">
                    {wp.sapsStatus === "CLEARED" ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="text-emerald-950">CLEARED (Clean Record)</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="text-amber-950">{wp.sapsStatus.replace(/_/g, " ")}</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    Certificate Reference:
                  </span>
                  <span className="font-bold text-iron-950 block mt-0.5">
                    {wp.sapsCertificateRef || "Pending HURU biometric submission"}
                  </span>
                </div>

                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    12-Month Expiry Countdown:
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-iron-600 shrink-0" />
                    <span className="font-bold text-iron-900">
                      {wp.sapsExpiresAt
                        ? `${Math.max(
                            0,
                            Math.ceil(
                              (new Date(wp.sapsExpiresAt).getTime() -
                                Date.now()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )} days remaining`
                        : wp.sapsStatus === "CLEARED"
                        ? "365 days active countdown"
                        : "Annual 12-month countdown begins on clearance"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    Statutory CoC Certifications:
                  </span>
                  {wp.certifications && wp.certifications.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {wp.certifications.map((cert) => (
                        <div
                          key={cert.id}
                          className="p-1.5 border border-iron-300 bg-mortar-100 flex items-center justify-between text-[11px]"
                        >
                          <span className="font-bold text-iron-950">
                            {cert.body} ({cert.registrationNumber})
                          </span>
                          <span className="px-1 py-0.2 border border-iron-950 bg-emerald-100 text-emerald-950 text-[9px] font-black uppercase">
                            {cert.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-iron-600 block mt-0.5 italic">
                      No statutory CoC licenses on file (PIRB / ECB / NHBRC)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-iron-200">
              <Link
                href="/worker/onboarding"
                className={`brutal-btn w-full py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  wp.sapsStatus === "CLEARED"
                    ? "brutal-btn-outline"
                    : "bg-brick-600 hover:bg-brick-700 text-white"
                }`}
              >
                {wp.sapsStatus === "CLEARED"
                  ? "[ SUBMIT / RENEW CoC LICENSES → ]"
                  : "[ GET HURU SAPS VOUCHER (R200) ]"}
              </Link>
            </div>
          </div>

          {/* PILLAR 3: PROOF OF SECURITY */}
          <div className="border-2 border-iron-950 bg-white p-5 rounded-none shadow-brutal flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-iron-200 pb-2">
                <span className="font-mono text-[11px] font-black uppercase text-iron-950 tracking-wider">
                  PILLAR 3: PROOF OF SECURITY
                </span>
                {wp.sapsStatus === "CLEARED" ? (
                  <span className="px-2 py-0.5 border border-iron-950 bg-emerald-100 text-emerald-950 font-mono text-[10px] font-black uppercase">
                    AUTHORIZED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 border border-iron-950 bg-mortar-200 text-iron-700 font-mono text-[10px] font-black uppercase">
                    LOCKED
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    Estate Gate Access Protocol:
                  </span>
                  <div className="font-bold mt-0.5 flex items-start gap-1.5">
                    {wp.sapsStatus === "CLEARED" ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="text-emerald-950 leading-tight">
                          Authorized for residential gate manifest &amp; OTP generation
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-iron-500 shrink-0 mt-0.5" />
                        <span className="text-iron-600 leading-tight">
                          Restricted — Requires Tier 2 SAPS clearance for residential gate manifest &amp; OTP generation
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    POPIA Biometric Consent:
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-iron-700 shrink-0" />
                    <span className="font-bold text-iron-900">
                      {wp.popiaConsentSigned
                        ? "Signed & Compliant (Act 4 of 2013)"
                        : "Pending Signed Consent"}
                    </span>
                  </div>
                  {wp.popiaConsentSigned && (
                    <span className="text-[10px] text-iron-500 block mt-0.5">
                      Status: Active Legally Enforceable Consent
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-iron-500 block text-[10px] uppercase font-bold">
                    Clean Criminal Record Affirmation:
                  </span>
                  <p className="text-[11px] text-iron-700 leading-relaxed mt-0.5">
                    {wp.sapsStatus === "CLEARED"
                      ? "Zero criminal convictions flagged by SAPS Criminal Record Centre AFISwitch database."
                      : "Affirmation pending verified biometric clearance capture."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-iron-200">
              <Link
                href="/worker/onboarding"
                className="text-xs font-mono font-bold uppercase text-brick-600 hover:underline flex items-center justify-between"
              >
                <span>Estate Security Mandate</span>
                <span>Learn More &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: JOB MANAGEMENT (ACTIVE CONTRACTS & ENHANCED OPEN JOBS BROWSER)
         ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-iron-950 pb-2">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-iron-500">
              {"// 03 · WORKSPACE & CLIENT OPPORTUNITIES"}
            </span>
            <h2 className="text-lg font-black text-iron-950 uppercase tracking-tight">
              Contracts &amp; Client Job Board
            </h2>
          </div>
        </div>

        {/* Tab Selection */}
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

        {/* ACTIVE CONTRACTS TAB */}
        {activeTab === "assigned" && (
          <div className="space-y-4 transition-all duration-150">
            {assignedJobs.length === 0 ? (
              <div className="border-2 border-iron-950 bg-white p-8 rounded-none shadow-brutal text-center space-y-3">
                <Briefcase className="w-8 h-8 text-iron-400 mx-auto" />
                <p className="font-mono text-xs font-bold text-iron-700 uppercase">
                  No active contracts right now.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("open")}
                  className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-mono font-bold uppercase"
                >
                  Browse Open Client Jobs &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedJobs.map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="border-2 border-iron-950 bg-white p-5 rounded-none shadow-brutal hover:border-brick-600 transition-all duration-150 flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-iron-200 pb-2">
                        <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 border border-iron-950 bg-emerald-100 text-emerald-950">
                          {j.status.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-xs text-iron-600 uppercase font-bold">
                          {j.category}
                        </span>
                      </div>

                      <h3 className="font-black text-base text-iron-950 group-hover:text-brick-600 transition-colors">
                        {j.title}
                      </h3>

                      <div className="text-xs font-mono text-iron-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brick-600 shrink-0" />
                        <span>
                          {j.suburb}, {j.city}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-iron-200 flex items-center justify-between text-xs font-mono font-bold">
                      <span>Call-Out Deposit: {formatZar(j.callOutDepositZar)}</span>
                      <span className="text-brick-600 group-hover:translate-x-0.5 transition-transform">
                        Open Workspace &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OPEN JOBS BROWSER TAB */}
        {activeTab === "open" && (
          <div className="space-y-4 transition-all duration-150">
            {/* Filter Bar with "Matching My Trades" Pill */}
            <div className="border-2 border-iron-950 bg-mortar-100 p-3.5 rounded-none shadow-brutal flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Primary Quick Filter Pill: "Matching My Trades" */}
                <button
                  type="button"
                  onClick={() => setMatchMyTradesOnly((prev) => !prev)}
                  className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 border-2 flex items-center gap-1.5 ${
                    matchMyTradesOnly
                      ? "border-iron-950 bg-brick-600 text-white shadow-brutal-sm font-black"
                      : "border-iron-950 bg-white text-iron-900 hover:bg-mortar-200"
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Matching My Trades ({matchingMyTradesCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMatchMyTradesOnly(false);
                    setSelectedTradeFilter("ALL");
                    setSelectedUrgencyFilter("ALL");
                  }}
                  className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 border-2 ${
                    !matchMyTradesOnly &&
                    selectedTradeFilter === "ALL" &&
                    selectedUrgencyFilter === "ALL"
                      ? "border-iron-950 bg-iron-950 text-white shadow-brutal-sm font-black"
                      : "border-iron-950 bg-white text-iron-900 hover:bg-mortar-200"
                  }`}
                >
                  All Open Jobs ({openJobs.length})
                </button>
              </div>

              {/* Secondary Select Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-xs font-mono">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-iron-600" />
                  <span className="text-iron-600 font-bold uppercase">Trade:</span>
                  <select
                    value={selectedTradeFilter}
                    disabled={matchMyTradesOnly}
                    onChange={(e) => setSelectedTradeFilter(e.target.value)}
                    className="border-2 border-iron-950 bg-white px-2 py-1 text-xs font-mono font-bold disabled:opacity-50"
                  >
                    <option value="ALL">All Categories</option>
                    {TRADE_CATEGORIES.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 text-xs font-mono">
                  <span className="text-iron-600 font-bold uppercase">Urgency:</span>
                  <select
                    value={selectedUrgencyFilter}
                    onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
                    className="border-2 border-iron-950 bg-white px-2 py-1 text-xs font-mono font-bold"
                  >
                    <option value="ALL">All Timelines</option>
                    <option value="EMERGENCY_24H">Emergency 24H</option>
                    <option value="THIS_WEEK">This Week</option>
                    <option value="FLEXIBLE">Flexible Timeline</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filtered Jobs Grid */}
            {filteredOpenJobs.length === 0 ? (
              <div className="border-2 border-iron-950 bg-white p-8 rounded-none shadow-brutal text-center space-y-3 font-mono text-xs">
                <Hammer className="w-8 h-8 text-iron-400 mx-auto" />
                <p className="font-bold text-iron-700 uppercase">
                  No open jobs match your current filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMatchMyTradesOnly(false);
                    setSelectedTradeFilter("ALL");
                    setSelectedUrgencyFilter("ALL");
                  }}
                  className="brutal-btn brutal-btn-outline px-4 py-2 font-bold uppercase"
                >
                  Clear All Filters &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOpenJobs.map((j) => {
                  let parsedTags: string[] = [];
                  if (j.problemTagsJson) {
                    try {
                      parsedTags = JSON.parse(j.problemTagsJson);
                    } catch {
                      parsedTags = [];
                    }
                  }

                  const quotesCount = j.quotes?.length ?? 0;

                  return (
                    <div
                      key={j.id}
                      className="border-2 border-iron-950 bg-white p-5 rounded-none shadow-brutal hover:border-brick-600 transition-all duration-150 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        {/* Card Header: Category, Urgency & CoC Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-iron-200 pb-2">
                          <span className="font-mono text-xs font-bold text-iron-950 uppercase tracking-wider">
                            {j.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {j.urgency === "EMERGENCY_24H" ? (
                              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 border border-iron-950 bg-brick-600 text-white">
                                Emergency 24H
                              </span>
                            ) : j.urgency === "THIS_WEEK" ? (
                              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-iron-950 bg-amber-100 text-amber-950">
                                This Week
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-iron-950 bg-mortar-200 text-iron-800">
                                Flexible
                              </span>
                            )}

                            {j.requiresCoC ? (
                              <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 border border-iron-950 bg-amber-200 text-amber-950">
                                Tier 3 CoC
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-iron-950 bg-mortar-200 text-iron-950">
                                Tier 2+
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-black text-base text-iron-950 leading-snug">
                          {j.title}
                        </h3>

                        {/* Problem Tags Chips */}
                        {parsedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {parsedTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 border border-iron-300 bg-mortar-100 text-iron-800 font-mono text-[11px] font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Homeowner Trust Rating & Location */}
                        <div className="space-y-1 text-xs font-mono text-iron-700 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-iron-500 font-bold uppercase">
                              Client:
                            </span>
                            <span className="font-bold text-iron-950">
                              {j.homeowner?.name || "Verified Client"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-iron-900 font-bold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span className="tabular-nums">
                                {j.homeowner?.ratingAvg
                                  ? j.homeowner.ratingAvg.toFixed(1)
                                  : "5.0"}
                              </span>
                              <span className="text-iron-500 text-[10px]">
                                ({j.homeowner?.ratingCount ?? 1})
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-iron-600">
                            <MapPin className="w-3.5 h-3.5 text-brick-600 shrink-0" />
                            <span>
                              {j.suburb}, {j.city}
                            </span>
                          </div>
                        </div>

                        {/* Financials & Competition Indicator */}
                        <div className="p-2.5 border border-iron-300 bg-mortar-50 font-mono text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-iron-600">Budget Estimate:</span>
                            <strong className="text-iron-950 tabular-nums">
                              {formatZar(
                                j.budgetEstimateZar ?? j.callOutDepositZar
                              )}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between text-iron-700">
                            <span>Call-Out Deposit:</span>
                            <strong className="text-iron-950 tabular-nums">
                              {formatZar(j.callOutDepositZar)}{" "}
                              <span className="text-[10px] text-iron-500 font-normal">
                                (Credited)
                              </span>
                            </strong>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-iron-200">
                            <span className="text-iron-600">Competition:</span>
                            {quotesCount === 0 ? (
                              <span className="text-emerald-700 font-bold">
                                0 quotes submitted — Be first!
                              </span>
                            ) : quotesCount === 1 ? (
                              <span className="text-iron-800 font-bold">
                                1 quote submitted
                              </span>
                            ) : (
                              <span className="text-iron-800 font-bold tabular-nums">
                                {quotesCount} quotes submitted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Direct Action Link */}
                      <div className="pt-2">
                        <Link
                          href={`/jobs/${j.id}`}
                          className="brutal-btn w-full py-2.5 bg-iron-950 hover:bg-brick-600 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                        >
                          [ VIEW SCOPE &amp; QUOTE &rarr; ]
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          INTERACTIVE "EDIT SKILLS & EXPERTISE" DRAWER / MODAL
         ========================================================================= */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-iron-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-none"
        >
          <div className="border-2 border-iron-950 bg-white p-6 rounded-none shadow-brutal max-w-xl w-full max-h-[92vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b-2 border-iron-950 pb-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-iron-500">
                  {"// BUILDER PROFILE CONFIGURATION"}
                </span>
                <h3 className="text-lg font-black text-iron-950 uppercase tracking-tight">
                  Edit Skills &amp; Trade Expertise
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setSkillsError(null);
                }}
                className="p-1 border border-iron-950 bg-mortar-100 hover:bg-mortar-200 font-mono text-xs font-bold"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-iron-950" />
              </button>
            </div>

            {skillsError && (
              <div
                role="alert"
                className="p-3 border-2 border-brick-600 bg-red-50 text-red-950 font-mono text-xs font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-brick-600 shrink-0" />
                <span>{skillsError}</span>
              </div>
            )}

            {skillsSuccess && (
              <div
                role="alert"
                className="p-3 border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-mono text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{skillsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSkills} className="space-y-4">
              {/* Trade Categories Multi-Select Toggles */}
              <div className="space-y-2">
                <label className="font-mono text-xs font-bold uppercase text-iron-950 block">
                  Trade Categories (Select all that apply):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TRADE_CATEGORIES.map((trade) => {
                    const isSelected = editTrades.includes(trade.slug);
                    return (
                      <button
                        key={trade.slug}
                        type="button"
                        onClick={() => toggleTrade(trade.slug)}
                        className={`p-2.5 border-2 text-left font-mono text-xs transition-all duration-150 flex items-center justify-between ${
                          isSelected
                            ? "border-iron-950 bg-brick-600 text-white font-black shadow-brutal-sm"
                            : "border-iron-950 bg-white text-iron-900 hover:bg-mortar-100"
                        }`}
                      >
                        <div>
                          <div className="font-bold">{trade.label}</div>
                          <div
                            className={`text-[10px] ${
                              isSelected ? "text-mortar-200" : "text-iron-500"
                            }`}
                          >
                            Call-Out: {formatZar(trade.defaultCallOutZar)}
                          </div>
                        </div>
                        <span className="font-black text-sm">
                          {isSelected ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Years Experience Input */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase text-iron-950 block">
                  Years of Experience in the Trade:
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  value={editYears}
                  onChange={(e) => setEditYears(parseInt(e.target.value) || 0)}
                  className="w-full border-2 border-iron-950 bg-white px-3 py-2 font-mono text-xs font-bold focus:outline-none"
                  required
                />
              </div>

              {/* Preferred Hardware Hub Selector */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase text-iron-950 block">
                  Preferred Hardware Store / Supply Hub:
                </label>
                <select
                  value={editHub}
                  onChange={(e) => setEditHub(e.target.value)}
                  className="w-full border-2 border-iron-950 bg-white px-3 py-2 font-mono text-xs font-bold focus:outline-none"
                  required
                >
                  {SA_HARDWARE_HUBS.map((hub) => (
                    <option key={hub} value={hub}>
                      {hub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Professional Bio Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-bold uppercase text-iron-950">
                    Professional Biography:
                  </label>
                  <span className="font-mono text-[10px] text-iron-500">
                    {editBio.length} / 500 characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Describe your background, craftsmanship specialties, certifications, and high-standard renovation commitments..."
                  className="w-full border-2 border-iron-950 bg-white p-3 font-mono text-xs leading-relaxed focus:outline-none"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t-2 border-iron-950 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-mono font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSkills}
                  className="brutal-btn px-5 py-2 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {isSavingSkills
                    ? "Saving..."
                    : "[ SAVE SKILLS & PROFILE ]"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
