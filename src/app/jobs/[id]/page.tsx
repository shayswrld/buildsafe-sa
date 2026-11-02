"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  QrCode,
  Star,
  Send,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Users,
  Receipt,
  Banknote,
  MapPin,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { computeEscrowSplit } from "@/lib/adapters/escrow";
import { formatZar } from "@/lib/config";

interface JobDetailDTO {
  id: string;
  homeownerId: string;
  selectedWorkerProfileId?: string | null;
  title: string;
  category: string;
  problemTagsJson: string;
  description: string;
  suburb: string;
  city: string;
  streetAddressDisplay: string;
  hasFundedEscrow: boolean;
  urgency: string;
  requiresCoC: boolean;
  callOutDepositZar: number;
  budgetEstimateZar?: number | null;
  status: string;
  isRepeatBooking: boolean;
  homeowner: {
    id: string;
    name: string;
    phone: string;
    ratingAvg: number;
    ratingCount: number;
  };
  selectedWorkerProfile?: {
    id: string;
    userId: string;
    vettingTier: string;
    saIdMasked: string;
    sapsCertificateRef?: string | null;
    nearestHardwareHub: string;
    user: { id: string; name: string; ratingAvg: number; ratingCount: number };
    certifications: { id: string; body: string; registrationNumber: string; status: string }[];
  } | null;
  quotes: {
    id: string;
    workerProfileId: string;
    labourAmountZar: number;
    materialsEstimateZar: number;
    estimatedDays: number;
    scopeSummary: string;
    proposedCrewIdsJson: string;
    status: string;
    workerProfile: {
      id: string;
      userId: string;
      vettingTier: string;
      saIdMasked: string;
      sapsCertificateRef?: string | null;
      nearestHardwareHub: string;
      yearsExperience: number;
      user: { id: string; name: string; ratingAvg: number; ratingCount: number };
      certifications: { id: string; body: string; registrationNumber: string; status: string }[];
    };
  }[];
  milestones: {
    id: string;
    sequence: number;
    kind: string;
    title: string;
    description: string;
    labourAmountZar: number;
    materialsAmountZar: number;
    materialReceiptRef?: string | null;
    status: string;
    escrowTransaction?: {
      id: string;
      paymentMethod: string;
      providerRef: string;
      labourZar: number;
      materialsZar: number;
      buyerTrustFeeZar: number;
      grossBuyerPaidZar: number;
      workerCommissionZar: number;
      platformTotalCutZar: number;
      workerNetPayoutZar: number;
      status: string;
      disputeReason?: string | null;
    } | null;
  }[];
  gateVisits: {
    id: string;
    checkInCode: string;
    checkOutCode: string;
    status: string;
    faceMatchConfirmed: boolean;
    arrivedAt?: string | null;
    departedAt?: string | null;
    incidentReport?: string | null;
    leadWorkerProfile: {
      id: string;
      saIdMasked: string;
      sapsCertificateRef?: string | null;
      vettingTier: string;
      user: { name: string; avatarUrl?: string | null };
    };
    crewMembers: {
      id: string;
      roleOnSite: string;
      verifiedAtGate: boolean;
      workerProfile: {
        id: string;
        saIdMasked: string;
        sapsCertificateRef?: string | null;
        user: { name: string };
      };
    }[];
  }[];
  messages: {
    id: string;
    senderId: string;
    body: string;
    wasRedacted: boolean;
    redactionReasonsJson: string;
    createdAt: string;
    sender: { id: string; name: string; role: string };
  }[];
  reviews: {
    id: string;
    reviewerId: string;
    direction: string;
    overallRating: number;
    qualityOrClarityScore: number;
    punctualityOrPaymentScore: number;
    safetyRespectScore: number;
    comment: string;
    reviewer: { name: string };
    reviewee: { name: string };
  }[];
}

export default function JobWorkspacePage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const { currentUser, config, clearedCrewPool, refreshBootstrap } = usePersona();

  const [job, setJob] = useState<JobDetailDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [banner, setBanner] = useState<{ type: "ok" | "warn" | "err"; text: string } | null>(
    null
  );

  // Worker Quote Form state
  const [quoteLabour, setQuoteLabour] = useState<string>("2200");
  const [quoteMaterials, setQuoteMaterials] = useState<string>("950");
  const [quoteDays, setQuoteDays] = useState<string>("2");
  const [quoteSummary, setQuoteSummary] = useState<string>(
    "Full surface prep, quality installation, daily cleanup, and original Builders Warehouse material slip."
  );
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);

  // Escrow Checkout selection
  const [paymentMethod, setPaymentMethod] = useState<string>("OZOW_INSTANT_EFT");

  // Gate OTP Verification state
  const [otpInput, setOtpInput] = useState<string>("");
  const [faceConfirmed, setFaceConfirmed] = useState<boolean>(false);

  // Scope Variation Order state
  const [showVariationForm, setShowVariationForm] = useState<boolean>(false);
  const [varTitle, setVarTitle] = useState<string>("");
  const [varLabour, setVarLabour] = useState<string>("450");
  const [varMaterials, setVarMaterials] = useState<string>("280");
  const [varSlip, setVarSlip] = useState<string>("BW-SLIP-EXTRA-104");

  // Chat state
  const [chatInput, setChatInput] = useState<string>("");

  // Two-Way Review state
  const [score1, setScore1] = useState<number>(5);
  const [score2, setScore2] = useState<number>(5);
  const [score3, setScore3] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    const viewerParam = currentUser?.id ? `?viewerId=${currentUser.id}` : "";
    const res = await fetch(`/api/jobs/${jobId}${viewerParam}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setJob(data.job);
    }
    setLoading(false);
  }, [jobId, currentUser?.id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  if (loading || !job) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Loading BuildSafe SA Job Workspace...
      </div>
    );
  }

  const isWorkerView = currentUser?.role === "WORKER";
  const activeVisit = job.gateVisits[0] ?? null;

  const quoteSplitPreview = computeEscrowSplit({
    labourZar: Number(quoteLabour) || 0,
    materialsZar: Number(quoteMaterials) || 0,
    config,
  });

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.workerProfile) return;
    setBanner(null);

    const res = await fetch(`/api/jobs/${job.id}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerProfileId: currentUser.workerProfile.id,
        labourAmountZar: Number(quoteLabour),
        materialsEstimateZar: Number(quoteMaterials),
        estimatedDays: Number(quoteDays),
        scopeSummary: quoteSummary,
        proposedCrewIds: selectedCrewIds,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error || "Quote blocked by security governance." });
      return;
    }

    setBanner({
      type: "ok",
      text: "Quote submitted! Homeowner can now compare your SAPS-cleared profile and fund Escrow.",
    });
    await loadJob();
  };

  const handleAcceptQuote = async (
    quoteId: string,
    fundingOption: "CALL_OUT_FIRST" | "FULL_QUOTE_ESCROW"
  ) => {
    setBanner(null);
    const res = await fetch(`/api/jobs/${job.id}/accept-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId,
        fundingOption,
        paymentMethod,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error || "Failed to fund Escrow." });
      return;
    }
    setOtpInput(data.gateCheckInCode || "");
    setBanner({
      type: "ok",
      text: `Funds locked in TradeSafe Regulated Escrow! 6-Digit Gate Check-In OTP (${data.gateCheckInCode}) & SAPS Crew Pass generated.`,
    });
    await loadJob();
  };

  const handleGateVerify = async () => {
    if (!activeVisit) return;
    setBanner(null);
    const res = await fetch(`/api/jobs/${job.id}/gate-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "VERIFY_ARRIVAL",
        gateVisitId: activeVisit.id,
        submittedCode: otpInput,
        faceMatchConfirmed: faceConfirmed,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error });
      return;
    }
    setBanner({
      type: "ok",
      text: "Gate Check-In Verified! Lead artisan & registered crew confirmed on-site.",
    });
    await loadJob();
  };

  const handleGatePanic = async () => {
    if (!activeVisit) return;
    const res = await fetch(`/api/jobs/${job.id}/gate-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REPORT_GATE_INCIDENT",
        gateVisitId: activeVisit.id,
        incidentReport:
          "Homeowner reported an unvetted / unmatched person at the gate. Entry refused & job frozen.",
      }),
    });
    if (res.ok) {
      setBanner({
        type: "warn",
        text: "EMERGENCY SAFETY FREEZE ACTIVATED: Job frozen, Escrow locked, and Admin Security alerted.",
      });
      await loadJob();
    }
  };

  const handleMilestoneAction = async (payload: Record<string, unknown>) => {
    setBanner(null);
    const res = await fetch(`/api/jobs/${job.id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error || "Milestone update failed." });
      return;
    }
    if (payload.action === "RELEASE_ESCROW") {
      setBanner({
        type: "ok",
        text: `Escrow Released! Artisan received ${formatZar(
          data.workerNetPayoutZar
        )} fast payout, and ${formatZar(
          data.platformTotalCutZar
        )} was credited to Your Platform Revenue Ledger!`,
      });
      await refreshBootstrap();
    } else if (payload.action === "CREATE_VARIATION") {
      setShowVariationForm(false);
      setVarTitle("");
      setBanner({
        type: "ok",
        text: "Scope Variation Mini-Milestone added—Homeowner can approve & fund it into Escrow.",
      });
    } else {
      setBanner({ type: "ok", text: "Milestone status updated." });
    }
    await loadJob();
  };

  const handleSendChat = async (customText?: string) => {
    const textToSend = customText ?? chatInput;
    if (!textToSend.trim() || !currentUser) return;

    const res = await fetch(`/api/jobs/${job.id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: currentUser.id,
        messageText: textToSend,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setChatInput("");
      if (data.warningBanner) {
        setBanner({ type: "warn", text: data.warningBanner });
      }
      await loadJob();
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setBanner(null);

    const res = await fetch(`/api/jobs/${job.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: currentUser.id,
        qualityOrClarityScore: score1,
        punctualityOrPaymentScore: score2,
        safetyRespectScore: score3,
        comment: reviewComment,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error });
      return;
    }
    setReviewComment("");
    setBanner({
      type: "ok",
      text: "Verified Two-Way Trust Rating published!",
    });
    await refreshBootstrap();
    await loadJob();
  };

  const canLeaveReview =
    currentUser &&
    (currentUser.id === job.homeownerId ||
      currentUser.id === job.selectedWorkerProfile?.userId) &&
    ["WORKER_ON_SITE", "WORK_SUBMITTED", "COMPLETED"].includes(job.status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {banner && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium flex items-start gap-3 ${
            banner.type === "ok"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : banner.type === "warn"
              ? "bg-amber-50 border-amber-300 text-amber-950"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          {banner.type === "ok" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>{banner.text}</div>
        </div>
      )}

      {/* Job Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-900 text-white">
              {job.status.replace(/_/g, " ")}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {job.category}
            </span>
            {job.requiresCoC && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                Statutory Tier 3 CoC Required
              </span>
            )}
            {job.isRepeatBooking && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Repeat Booking Loyalty (4% Worker Rate)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500">Homeowner Buyer Score:</span>
            <span className="font-bold text-slate-900">{job.homeowner.name}</span>
            <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {job.homeowner.ratingAvg.toFixed(2)} ({job.homeowner.ratingCount})
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {job.title}
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">{job.description}</p>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            {job.hasFundedEscrow ? (
              <Unlock className="w-4 h-4 text-emerald-600" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600" />
            )}
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{job.streetAddressDisplay}</span>
          </div>
          <div className="text-slate-500">
            Credited Call-Out Deposit:{" "}
            <strong className="text-slate-900">
              {formatZar(job.callOutDepositZar)}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (8 cols): Gate Pass, Milestones, Quotes, Submit Quote */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. GATE CHECK-IN OTP & VETTED CREW MANIFEST */}
          {activeVisit && (
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-6 h-6 text-emerald-400" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                      Physical Home Entry Governance
                    </div>
                    <h2 className="text-lg font-bold">
                      Gate Check-In OTP &amp; Vetted On-Site Crew Pass
                    </h2>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20">
                  {activeVisit.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Expected People Through the Gate */}
              <div className="space-y-3">
                <p className="text-xs text-emerald-200 font-medium">
                  ONLY the SAPS-cleared individuals listed below are authorized to
                  step onto your property:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Lead Artisan Badge */}
                  <div className="bg-white/10 border border-white/15 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 font-extrabold flex items-center justify-center text-base shrink-0">
                      {activeVisit.leadWorkerProfile.user.avatarUrl || "PRO"}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-white text-sm">
                        {activeVisit.leadWorkerProfile.user.name} (Lead)
                      </div>
                      <div className="text-emerald-300 font-semibold">
                        SAPS: {activeVisit.leadWorkerProfile.sapsCertificateRef}
                      </div>
                      <div className="text-slate-300">
                        ID: {activeVisit.leadWorkerProfile.saIdMasked}
                      </div>
                    </div>
                  </div>

                  {/* Accompanying SAPS-Cleared Crew Helpers */}
                  {activeVisit.crewMembers.map((cm) => (
                    <div
                      key={cm.id}
                      className="bg-white/10 border border-white/15 rounded-xl p-3.5 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-extrabold flex items-center justify-center text-xs shrink-0">
                        CREW
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-white text-sm">
                          {cm.workerProfile.user.name}
                        </div>
                        <div className="text-amber-300 font-semibold">
                          SAPS: {cm.workerProfile.sapsCertificateRef}
                        </div>
                        <div className="text-slate-300">
                          ID: {cm.workerProfile.saIdMasked} • {cm.roleOnSite}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {activeVisit.status === "AWAITING_ARRIVAL" && (
                <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-300">
                      Demo Helper — Expected 6-Digit Gate OTP:
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpInput(activeVisit.checkInCode)}
                      className="font-mono font-bold text-sm px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                    >
                      {activeVisit.checkInCode} (Click to Fill)
                    </button>
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faceConfirmed}
                      onChange={(e) => setFaceConfirmed(e.target.checked)}
                      className="mt-0.5 rounded"
                    />
                    <span>
                      I visually matched every person at my gate against the SAPS
                      photo badges above (zero unvetted casual helpers present).
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 6-digit Gate OTP"
                      className="bg-white text-slate-900 rounded-xl px-3.5 py-2 text-sm font-mono font-bold w-48"
                    />
                    <button
                      type="button"
                      onClick={handleGateVerify}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      Verify Arrival &amp; Open Gate
                    </button>
                    <button
                      type="button"
                      onClick={handleGatePanic}
                      className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-200 font-semibold text-xs transition"
                    >
                      Report Unmatched Person (Freeze!)
                    </button>
                  </div>
                </div>
              )}

              {activeVisit.status === "VERIFIED_ON_SITE" && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-100 flex items-center justify-between">
                  <span>
                    ✓ Verified On-Site at{" "}
                    {activeVisit.arrivedAt
                      ? new Date(activeVisit.arrivedAt).toLocaleTimeString()
                      : "Today"}{" "}
                    — SAPS badges &amp; Gate OTP matched.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 2. MILESTONE ESCROW & 1-TAP SCOPE VARIATIONS */}
          {job.milestones.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-700" />
                  <h2 className="font-bold text-lg text-slate-900">
                    Regulated Milestone Escrow &amp; Payout Splits
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVariationForm(!showVariationForm)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Scope Variation Mini-Milestone
                </button>
              </div>

              {showVariationForm && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="font-bold text-slate-900">
                    Log On-Site Scope Variation (Solves Hidden Damage Without Cash Arguments)
                  </div>
                  <input
                    type="text"
                    value={varTitle}
                    onChange={(e) => setVarTitle(e.target.value)}
                    placeholder="e.g. Replace corroded copper shut-off valve behind tiles"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">Extra Labour (ZAR)</label>
                      <input
                        type="number"
                        value={varLabour}
                        onChange={(e) => setVarLabour(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Materials Slip (0% Fee)</label>
                      <input
                        type="number"
                        value={varMaterials}
                        onChange={(e) => setVarMaterials(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Builders Slip #</label>
                      <input
                        type="text"
                        value={varSlip}
                        onChange={(e) => setVarSlip(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleMilestoneAction({
                        action: "CREATE_VARIATION",
                        title: varTitle || "Rusted pipe & fitting replacement behind wall",
                        labourAmountZar: Number(varLabour),
                        materialsAmountZar: Number(varMaterials),
                        materialReceiptRef: varSlip,
                      })
                    }
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold"
                  >
                    Add Variation Milestone
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {job.milestones.map((ms) => {
                  const preview = computeEscrowSplit({
                    labourZar: ms.labourAmountZar,
                    materialsZar: ms.materialsAmountZar,
                    isRepeatBooking: job.isRepeatBooking,
                    config,
                  });
                  const tx = ms.escrowTransaction;

                  return (
                    <div
                      key={ms.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/60"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">
                              #{ms.sequence} • {ms.kind.replace(/_/g, " ")}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900">
                              {ms.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm mt-1">
                            {ms.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {ms.description}
                          </p>
                        </div>

                        {tx && (
                          <span className="text-[11px] font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-600">
                            {tx.providerRef}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <div className="text-slate-500">Labour Quote</div>
                          <div className="font-bold text-slate-900">
                            {formatZar(ms.labourAmountZar)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Materials (0% Fee)</div>
                          <div className="font-bold text-slate-900">
                            {formatZar(ms.materialsAmountZar)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Artisan Net Payout</div>
                          <div className="font-bold text-emerald-700">
                            {formatZar(tx?.workerNetPayoutZar ?? preview.workerNetPayoutZar)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Your Platform Cut</div>
                          <div className="font-bold text-amber-700">
                            {formatZar(tx?.platformTotalCutZar ?? preview.platformTotalCutZar)}
                          </div>
                        </div>
                      </div>

                      {ms.materialReceiptRef && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-amber-600" />
                          Verified Hardware Slip Ref: <strong>{ms.materialReceiptRef}</strong>
                        </div>
                      )}

                      {/* Milestone Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ms.status === "AWAITING_FUNDING" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMilestoneAction({
                                action: "FUND_MILESTONE",
                                milestoneId: ms.id,
                                paymentMethod,
                              })
                            }
                            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                          >
                            Lock {formatZar(preview.grossBuyerPaidZar)} in TradeSafe Escrow
                          </button>
                        )}

                        {ms.status === "HELD_IN_ESCROW" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleMilestoneAction({
                                  action: "SUBMIT_WORK",
                                  milestoneId: ms.id,
                                  materialReceiptRef:
                                    ms.materialReceiptRef || "BW-SLIP-VERIFIED-884",
                                })
                              }
                              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                            >
                              Artisan: Mark Work Done
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMilestoneAction({
                                  action: "RELEASE_ESCROW",
                                  milestoneId: ms.id,
                                })
                              }
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                            >
                              Homeowner: Approve &amp; Release Split Payout
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMilestoneAction({
                                  action: "RAISE_DISPUTE",
                                  milestoneId: ms.id,
                                  disputeReason:
                                    "Tile alignment / leak check requested before final release.",
                                })
                              }
                              className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold"
                            >
                              Freeze / Dispute
                            </button>
                          </>
                        )}

                        {ms.status === "WORK_SUBMITTED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMilestoneAction({
                                action: "RELEASE_ESCROW",
                                milestoneId: ms.id,
                              })
                            }
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            Homeowner: Inspect &amp; Release{" "}
                            {formatZar(tx?.workerNetPayoutZar ?? preview.workerNetPayoutZar)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. QUOTES LIST & ESCROW ACCEPTANCE */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-lg text-slate-900">
                Artisan Quotes ({job.quotes.length})
              </h2>
              {!job.selectedWorkerProfileId && job.quotes.length > 0 && (
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium"
                >
                  <option value="OZOW_INSTANT_EFT">Pay via Ozow Instant EFT</option>
                  <option value="CAPITEC_PAY">Pay via Capitec Pay</option>
                  <option value="CARD_3DS">Pay via 3D-Secure Card</option>
                </select>
              )}
            </div>

            {job.quotes.length === 0 ? (
              <p className="text-xs text-slate-500">
                No quotes yet. Switch to a SAPS-cleared Worker persona at the top bar
                to submit an itemized Labour + Materials quote!
              </p>
            ) : (
              <div className="space-y-4">
                {job.quotes.map((q) => {
                  const split = computeEscrowSplit({
                    labourZar: q.labourAmountZar,
                    materialsZar: q.materialsEstimateZar,
                    config,
                  });

                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-3 hover:border-emerald-400 transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">
                              {q.workerProfile.user.name}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {q.workerProfile.user.ratingAvg.toFixed(2)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                              <ShieldCheck className="w-3 h-3 text-emerald-700" />
                              {q.workerProfile.sapsCertificateRef}
                            </span>
                            {q.workerProfile.certifications
                              .filter((c) => c.status === "VERIFIED")
                              .map((c) => (
                                <span
                                  key={c.id}
                                  className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold"
                                >
                                  {c.body}: {c.registrationNumber}
                                </span>
                              ))}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {q.workerProfile.yearsExperience} yrs exp • Hub:{" "}
                            {q.workerProfile.nearestHardwareHub}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-extrabold text-slate-900">
                            {formatZar(split.grossBuyerPaidZar)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            incl. {formatZar(split.buyerTrustFeeZar)} Escrow Trust Fee
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg">
                        {q.scopeSummary}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <div>
                          Labour: <strong>{formatZar(q.labourAmountZar)}</strong> •
                          Hardware Materials (0% Fee):{" "}
                          <strong>{formatZar(q.materialsEstimateZar)}</strong> • Est.{" "}
                          {q.estimatedDays} day(s)
                        </div>

                        {!job.selectedWorkerProfileId && q.status === "PENDING" && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAcceptQuote(q.id, "CALL_OUT_FIRST")}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                            >
                              Book Call-Out Only ({formatZar(job.callOutDepositZar)})
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleAcceptQuote(q.id, "FULL_QUOTE_ESCROW")
                              }
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                            >
                              Accept &amp; Lock Full Quote in Escrow
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. WORKER QUOTE BUILDER (Tests Tier 1 Block vs Tier 2/3 Approval + Crew Manifest!) */}
          {isWorkerView && !job.selectedWorkerProfileId && (
            <form
              onSubmit={handleSubmitQuote}
              className="bg-white rounded-2xl p-6 border-2 border-emerald-600/30 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-700">
                    Viewing as Artisan: {currentUser?.name}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Submit Itemized Quote &amp; Register On-Site Crew
                  </h3>
                </div>
                {currentUser?.workerProfile?.vettingTier ===
                  "TIER_1_BROWSE_ONLY" && (
                  <Link
                    href="/worker/onboarding"
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300"
                  >
                    Tier 1 (Complete SAPS Check →)
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Skilled Labour (ZAR)
                  </label>
                  <input
                    type="number"
                    value={quoteLabour}
                    onChange={(e) => setQuoteLabour(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Builders Materials (0% Fee!)
                  </label>
                  <input
                    type="number"
                    value={quoteMaterials}
                    onChange={(e) => setQuoteMaterials(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimated Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quoteDays}
                    onChange={(e) => setQuoteDays(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Scope &amp; Materials Note
                </label>
                <textarea
                  rows={2}
                  value={quoteSummary}
                  onChange={(e) => setQuoteSummary(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              {/* Vetted Crew Manifest Selector */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  Bringing a Site Assistant? Attach SAPS-Cleared Helpers to Gate Pass:
                </div>
                <div className="flex flex-wrap gap-2">
                  {clearedCrewPool
                    .filter((w) => w.id !== currentUser?.workerProfile?.id)
                    .map((w) => {
                      const checked = selectedCrewIds.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() =>
                            setSelectedCrewIds(
                              checked
                                ? selectedCrewIds.filter((x) => x !== w.id)
                                : [...selectedCrewIds, w.id]
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs border font-medium ${
                            checked
                              ? "bg-emerald-700 text-white border-emerald-700"
                              : "bg-white text-slate-700 border-slate-300"
                          }`}
                        >
                          {checked ? "✓ " : "+ "}
                          {w.user?.name} ({w.sapsCertificateRef})
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                <span className="text-slate-600">
                  Your Guaranteed Net Payout on Approval:{" "}
                  <strong className="text-emerald-700 text-sm">
                    {formatZar(quoteSplitPreview.workerNetPayoutZar)}
                  </strong>{" "}
                  (100% of materials + 92% of labour)
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Submit Vetted Quote
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols): Masked Chat + Two-Way Ratings */}
        <div className="lg:col-span-5 space-y-6">
          {/* MASKED IN-APP CHAT WITH ANTI-LEAKAGE PROTECTION */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-[460px]">
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Masked Safety Chat
                </h2>
                <p className="text-[11px] text-slate-500">
                  {job.hasFundedEscrow
                    ? "Escrow active — cash-bypass solicitation still monitored."
                    : "Pre-Escrow Mode: Phone numbers, links & cash offers auto-hidden."}
                </p>
              </div>
              {!job.hasFundedEscrow && (
                <button
                  type="button"
                  onClick={() =>
                    handleSendChat(
                      "Hey WhatsApp me on 082 991 3344 and pay cash at the gate to skip the fee!"
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold shrink-0"
                >
                  Test Leakage Filter
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {job.messages.map((m) => {
                const mine = m.senderId === currentUser?.id;
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      mine
                        ? "bg-emerald-50 border border-emerald-200 ml-6"
                        : "bg-slate-50 border border-slate-200 mr-6"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{m.sender.name}</span>
                      {m.wasRedacted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                          Auto-Redacted
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed">{m.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder="Ask about scope, tiles, or arrival time..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleSendChat()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                aria-label="Send chat message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VERIFIED TWO-WAY RATINGS PANEL */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Verified Two-Way Trust Ratings ({job.reviews.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Both Homeowners and Artisans rate each other—only unlocked on
                Escrow-backed jobs.
              </p>
            </div>

            {job.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {rev.reviewer.name} → {rev.reviewee.name}
                  </span>
                  <span className="font-bold text-amber-600">
                    {"★".repeat(rev.overallRating)} ({rev.overallRating}/5)
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                  {rev.direction === "HOMEOWNER_TO_WORKER"
                    ? "Homeowner Rating Artisan"
                    : "Artisan Rating Homeowner Buyer"}
                </div>
                <p className="text-slate-700">{rev.comment}</p>
              </div>
            ))}

            {canLeaveReview && (
              <form
                onSubmit={handleSubmitReview}
                className="pt-3 border-t border-slate-100 space-y-3 text-xs"
              >
                <div className="font-bold text-slate-900">
                  Leave Your Verified{" "}
                  {currentUser?.id === job.homeownerId
                    ? "Artisan Rating"
                    : "Homeowner Client Rating"}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-500 mb-1">
                      {currentUser?.id === job.homeownerId ? "Workmanship" : "Clear Scope"}
                    </label>
                    <select
                      value={score1}
                      onChange={(e) => setScore1(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-bold"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">
                      {currentUser?.id === job.homeownerId ? "Punctuality" : "Fast Release"}
                    </label>
                    <select
                      value={score2}
                      onChange={(e) => setScore2(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-bold"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">
                      Safety &amp; Respect
                    </label>
                    <select
                      value={score3}
                      onChange={(e) => setScore3(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-bold"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <textarea
                  rows={2}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    currentUser?.id === job.homeownerId
                      ? "How was their workmanship, neatness, and Gate badge check-in?"
                      : "Was the homeowner respectful, clear on scope, and prompt to release Escrow?"
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Publish Verified Rating
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
