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

type JobWorkspaceTab = "escrow" | "gate" | "quotes" | "chat" | "ratings";

const DEFAULT_TAB_MAP: Record<string, JobWorkspaceTab> = {
  OPEN: "quotes",
  QUOTED: "quotes",
  ESCROW_FUNDED: "gate",
  WORKER_ON_SITE: "escrow",
  WORK_SUBMITTED: "escrow",
  COMPLETED: "ratings",
};

function getDefaultWorkspaceTab(
  jobStatus: string | undefined | null
): JobWorkspaceTab {
  return (jobStatus && DEFAULT_TAB_MAP[jobStatus]) || "quotes";
}

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

  const [activeTab, setActiveTab] = useState<JobWorkspaceTab>("quotes");
  const [userSelectedTab, setUserSelectedTab] = useState<boolean>(false);

  const [quoteLabour, setQuoteLabour] = useState<string>("2200");
  const [quoteMaterials, setQuoteMaterials] = useState<string>("950");
  const [quoteDays, setQuoteDays] = useState<string>("2");
  const [quoteSummary, setQuoteSummary] = useState<string>(
    "Full surface prep, installation, cleanup, and hardware slip."
  );
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<string>("OZOW_INSTANT_EFT");

  const [otpInput, setOtpInput] = useState<string>("");
  const [faceConfirmed, setFaceConfirmed] = useState<boolean>(false);

  const [showVariationForm, setShowVariationForm] = useState<boolean>(false);
  const [varTitle, setVarTitle] = useState<string>("");
  const [varLabour, setVarLabour] = useState<string>("450");
  const [varMaterials, setVarMaterials] = useState<string>("280");
  const [varSlip, setVarSlip] = useState<string>("BW-SLIP-EXTRA-104");

  const [chatInput, setChatInput] = useState<string>("");

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
      if (!userSelectedTab && data.job) {
        setActiveTab(getDefaultWorkspaceTab(data.job.status));
      }
    }
    setLoading(false);
  }, [jobId, currentUser?.id, userSelectedTab]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  if (loading || !job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center font-mono text-xs uppercase text-iron-700 font-bold">
        Loading Job #{jobId}...
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

  const fundedMilestones = job.milestones.filter((m) =>
    ["HELD_IN_ESCROW", "WORK_SUBMITTED", "RELEASED"].includes(m.status)
  );
  const escrowHeldZar = fundedMilestones.reduce((sum, m) => {
    if (m.escrowTransaction?.grossBuyerPaidZar) {
      return sum + m.escrowTransaction.grossBuyerPaidZar;
    }
    return sum + m.labourAmountZar + m.materialsAmountZar;
  }, 0);

  const gateOtpDisplay = activeVisit
    ? activeVisit.status === "VERIFIED_ON_SITE"
      ? "VERIFIED"
      : activeVisit.checkInCode
    : job.hasFundedEscrow
    ? "PENDING"
    : "LOCKED";

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
      setBanner({
        type: "err",
        text: data.error || "Quote blocked by security governance.",
      });
      return;
    }

    setBanner({
      type: "ok",
      text: "Quote submitted.",
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
      text: `Escrow funded. Gate OTP (${data.gateCheckInCode}) & Crew Pass issued.`,
    });
    setActiveTab("gate");
    setUserSelectedTab(true);
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
      text: "Gate Check-In Verified.",
    });
    setActiveTab("escrow");
    setUserSelectedTab(true);
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
        text: "SAFETY FREEZE: Job frozen, Escrow locked, Admin alerted.",
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
        text: `Escrow Released: ${formatZar(data.workerNetPayoutZar)} to Artisan, ${formatZar(
          data.platformTotalCutZar
        )} to Platform.`,
      });
      await refreshBootstrap();
      setActiveTab("ratings");
      setUserSelectedTab(true);
    } else if (payload.action === "CREATE_VARIATION") {
      setShowVariationForm(false);
      setVarTitle("");
      setBanner({
        type: "ok",
        text: "Variation milestone added.",
      });
    } else {
      setBanner({ type: "ok", text: "Milestone updated." });
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
      text: "Review published.",
    });
    await refreshBootstrap();
    await loadJob();
  };

  const canLeaveReview =
    currentUser &&
    (currentUser.id === job.homeownerId ||
      currentUser.id === job.selectedWorkerProfile?.userId) &&
    ["WORKER_ON_SITE", "WORK_SUBMITTED", "COMPLETED"].includes(job.status);

  const tabs: { id: JobWorkspaceTab; label: string; badge: string | number }[] = [
    { id: "escrow", label: "01 // VAULT", badge: job.milestones.length },
    {
      id: "gate",
      label: "02 // GATE OTP",
      badge: activeVisit
        ? activeVisit.status === "VERIFIED_ON_SITE"
          ? "VERIFIED"
          : "READY"
        : "LOCKED",
    },
    { id: "quotes", label: "03 // QUOTES", badge: job.quotes.length },
    { id: "chat", label: "04 // CHAT", badge: job.messages.length },
    { id: "ratings", label: "05 // RATINGS", badge: job.reviews.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Banner Notifications */}
      {banner && (
        <div
          className={`p-3.5 border-2 border-iron-950 rounded-none shadow-brutal text-xs font-mono font-bold flex items-start gap-2.5 ${
            banner.type === "ok"
              ? "bg-emerald-100 text-emerald-950 border-emerald-900"
              : banner.type === "warn"
              ? "bg-safety-100 text-safety-950 border-iron-950"
              : "bg-red-100 text-red-950 border-red-950"
          }`}
        >
          {banner.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-safety-700 shrink-0 mt-0.5" />
          )}
          <div className="leading-relaxed">{banner.text}</div>
        </div>
      )}

      {/* Header Card */}
      <div className="border-2 border-iron-950 bg-white rounded-none shadow-brutal p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black uppercase px-2.5 py-0.5 bg-iron-950 text-white border-2 border-iron-950 rounded-none">
              {job.status}
            </span>
            <span className="font-mono text-xs font-bold uppercase px-2.5 py-0.5 bg-mortar-200 text-iron-950 border-2 border-iron-950 rounded-none">
              {job.category}
            </span>
            {job.requiresCoC && (
              <span className="font-mono text-xs font-bold uppercase px-2.5 py-0.5 bg-safety-100 text-safety-900 border-2 border-iron-950 rounded-none inline-flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-safety-700" />
                CoC Required
              </span>
            )}
            {job.isRepeatBooking && (
              <span className="font-mono text-xs font-bold uppercase px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-2 border-iron-950 rounded-none">
                Repeat (4% Fee)
              </span>
            )}
          </div>

          <div className="font-mono text-xs bg-mortar-100 px-2.5 py-1 border-2 border-iron-950 rounded-none flex items-center gap-1.5">
            <span className="font-bold text-iron-950">{job.homeowner.name}</span>
            <span className="inline-flex items-center gap-0.5 font-bold text-safety-600">
              <Star className="w-3 h-3 fill-safety-500 text-safety-500" />
              {job.homeowner.ratingAvg.toFixed(1)}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-iron-950 uppercase">
            {job.title}
          </h1>
          <p className="text-iron-700 text-xs sm:text-sm leading-relaxed mt-1">
            {job.description}
          </p>
        </div>

        <div className="pt-2.5 border-t border-mortar-300 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-iron-800 font-bold">
            {job.hasFundedEscrow ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-safety-700" />
            )}
            <MapPin className="w-3.5 h-3.5 text-iron-600" />
            <span>
              {job.streetAddressDisplay}, {job.suburb}, {job.city}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Metric Strip */}
      <div className="border-2 border-iron-950 bg-iron-950 text-white rounded-none p-3 shadow-brutal font-mono text-xs font-bold flex flex-wrap items-center justify-between gap-3 tabular-nums">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Banknote className="w-4 h-4" />
          <span>VAULT: {formatZar(escrowHeldZar)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white">
          <QrCode className="w-4 h-4 text-safety-400" />
          <span>GATE OTP: {gateOtpDisplay}</span>
        </div>
        <div className="flex items-center gap-1.5 text-mortar-200">
          <Users className="w-4 h-4" />
          <span>QUOTES: {job.quotes.length}</span>
        </div>
        <div className="flex items-center gap-1.5 text-mortar-300">
          <Receipt className="w-4 h-4" />
          <span>CALL-OUT: {formatZar(job.callOutDepositZar)}</span>
        </div>
      </div>

      {/* 5-Tab Workspace Navigation */}
      <div className="border-2 border-iron-950 bg-mortar-200 p-1.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 rounded-none shadow-brutal-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setUserSelectedTab(true);
              }}
              className={`py-2.5 px-3 text-xs font-mono font-bold uppercase tracking-wider text-left border-2 transition-all duration-150 ease-out flex items-center justify-between gap-1.5 rounded-none ${
                isActive
                  ? "bg-brick-600 text-white border-iron-950 shadow-brutal-sm font-black"
                  : "bg-white text-iron-950 border-iron-950 hover:bg-mortar-100 hover:text-brick-600"
              } active:translate-x-[2px] active:translate-y-[2px] active:shadow-none duration-100`}
            >
              <span className="truncate">{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 border font-mono font-bold rounded-none shrink-0 ${
                  isActive
                    ? "bg-brick-800 text-white border-brick-950"
                    : "bg-mortar-100 text-iron-950 border-iron-950"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-150 ease-out">
        {/* TAB 1: ESCROW & MILESTONES */}
        {activeTab === "escrow" && (
          <div className="border-2 border-iron-950 bg-white rounded-none p-5 shadow-brutal space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-mortar-300 pb-3">
              <h2 className="text-lg font-black text-iron-950 uppercase flex items-center gap-2">
                <Banknote className="w-5 h-5 text-brick-600" />
                Milestones ({job.milestones.length})
              </h2>

              <button
                type="button"
                onClick={() => setShowVariationForm(!showVariationForm)}
                className="brutal-btn brutal-btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5 text-brick-600" />
                {showVariationForm ? "[-] CLOSE VARIATION" : "[+ ADD VARIATION]"}
              </button>
            </div>

            {showVariationForm && (
              <div className="p-4 border-2 border-iron-950 bg-mortar-50 space-y-3 rounded-none shadow-brutal-sm">
                <div className="font-mono text-xs font-black uppercase text-brick-600">
                  // ADD SCOPE VARIATION (0% FEE ON MATERIALS)
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-iron-950 uppercase mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={varTitle}
                    onChange={(e) => setVarTitle(e.target.value)}
                    placeholder="e.g. Replace corroded valve behind tiles"
                    className="w-full border-2 border-iron-950 px-3 py-2 text-xs bg-white rounded-none shadow-brutal-sm font-sans focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-iron-950 uppercase mb-1">
                      Extra Labour (ZAR)
                    </label>
                    <input
                      type="number"
                      value={varLabour}
                      onChange={(e) => setVarLabour(e.target.value)}
                      className="w-full border-2 border-iron-950 px-3 py-2 text-xs bg-white rounded-none font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-iron-950 uppercase mb-1">
                      Materials (0% Fee)
                    </label>
                    <input
                      type="number"
                      value={varMaterials}
                      onChange={(e) => setVarMaterials(e.target.value)}
                      className="w-full border-2 border-iron-950 px-3 py-2 text-xs bg-white rounded-none font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-iron-950 uppercase mb-1">
                      Hardware Slip #
                    </label>
                    <input
                      type="text"
                      value={varSlip}
                      onChange={(e) => setVarSlip(e.target.value)}
                      className="w-full border-2 border-iron-950 px-3 py-2 text-xs bg-white rounded-none font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleMilestoneAction({
                      action: "CREATE_VARIATION",
                      title: varTitle || "Rusted pipe & fitting replacement",
                      labourAmountZar: Number(varLabour),
                      materialsAmountZar: Number(varMaterials),
                      materialReceiptRef: varSlip,
                    })
                  }
                  className="brutal-btn brutal-btn-dark px-4 py-2 text-xs"
                >
                  ADD VARIATION MILESTONE
                </button>
              </div>
            )}

            {job.milestones.length === 0 ? (
              <div className="border-2 border-dashed border-iron-950 p-6 text-center bg-mortar-50 font-mono text-xs text-iron-600">
                No milestones yet. Accept a quote in Tab 03 to start escrow.
              </div>
            ) : (
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
                      className="border-2 border-iron-950 rounded-none p-4 space-y-3 bg-white shadow-brutal-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-iron-600">
                              #{ms.sequence}
                            </span>
                            <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 border border-iron-950 bg-mortar-100 text-iron-950 rounded-none">
                              {ms.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-iron-950 uppercase mt-1">
                            {ms.title}
                          </h3>
                        </div>

                        {tx && (
                          <span className="font-mono text-[11px] font-bold bg-mortar-100 px-2 py-0.5 border border-iron-950 text-iron-800 rounded-none">
                            {tx.providerRef}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-mortar-50 p-3 border-2 border-iron-950 rounded-none text-xs font-mono">
                        <div>
                          <div className="text-iron-600 text-[10px] uppercase">Labour</div>
                          <div className="font-black text-iron-950">
                            {formatZar(ms.labourAmountZar)}
                          </div>
                        </div>
                        <div>
                          <div className="text-iron-600 text-[10px] uppercase">Materials (0%)</div>
                          <div className="font-black text-iron-950">
                            {formatZar(ms.materialsAmountZar)}
                          </div>
                        </div>
                        <div>
                          <div className="text-iron-600 text-[10px] uppercase">Artisan Net</div>
                          <div className="font-black text-brick-600">
                            {formatZar(tx?.workerNetPayoutZar ?? preview.workerNetPayoutZar)}
                          </div>
                        </div>
                        <div>
                          <div className="text-iron-600 text-[10px] uppercase">Platform Cut</div>
                          <div className="font-black text-iron-950">
                            {formatZar(tx?.platformTotalCutZar ?? preview.platformTotalCutZar)}
                          </div>
                        </div>
                      </div>

                      {ms.materialReceiptRef && (
                        <div className="text-xs font-mono text-iron-700 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-brick-600 shrink-0" />
                          <span>Slip: <strong>{ms.materialReceiptRef}</strong></span>
                        </div>
                      )}

                      {/* Role-tailored Milestone Actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ms.status === "AWAITING_FUNDING" && !isWorkerView && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMilestoneAction({
                                action: "FUND_MILESTONE",
                                milestoneId: ms.id,
                                paymentMethod,
                              })
                            }
                            className="brutal-btn brutal-btn-primary px-4 py-2 text-xs"
                          >
                            SECURE {formatZar(preview.grossBuyerPaidZar)} IN VAULT
                          </button>
                        )}

                        {(ms.status === "HELD_IN_ESCROW" || ms.status === "FUNDED_IN_VAULT") && (
                          <>
                            {isWorkerView ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMilestoneAction({
                                    action: "SUBMIT_PROOF",
                                    milestoneId: ms.id,
                                    photoUrls: ["site-completion-wide.webp", "site-completion-detail.webp"],
                                    notes: "Work completed on site, ready for inspection.",
                                  })
                                }
                                className="brutal-btn brutal-btn-dark px-4 py-2 text-xs"
                              >
                                SUBMIT PHOTO PROOF &amp; START 48H INSPECTION
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMilestoneAction({
                                      action: "APPROVE_PAYOUT",
                                      milestoneId: ms.id,
                                    })
                                  }
                                  className="brutal-btn brutal-btn-primary px-4 py-2 text-xs"
                                >
                                  APPROVE &amp; RELEASE PAYOUT
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMilestoneAction({
                                      action: "REQUEST_TOUCH_UP",
                                      milestoneId: ms.id,
                                      defectDescription:
                                        "Inspection requested before final release.",
                                    })
                                  }
                                  className="brutal-btn bg-mortar-200 text-iron-950 border-2 border-iron-950 hover:bg-mortar-300 px-3 py-2 text-xs font-bold"
                                >
                                  REQUEST A TOUCH-UP
                                </button>
                              </>
                            )}
                          </>
                        )}

                        {ms.status === "INSPECTION_COUNTDOWN_ACTIVE" && (
                          <div className="w-full border-2 border-amber-600 bg-amber-50 p-3 space-y-2 rounded-none">
                            <div className="flex flex-wrap justify-between items-center text-xs font-mono font-bold text-amber-950">
                              <span>⏱ 48-HOUR INSPECTION ACTIVE</span>
                              <span>Auto-releases to artisan on deadline</span>
                            </div>
                            {!isWorkerView && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMilestoneAction({
                                      action: "APPROVE_PAYOUT",
                                      milestoneId: ms.id,
                                    })
                                  }
                                  className="brutal-btn brutal-btn-primary px-3 py-1.5 text-xs font-bold"
                                >
                                  APPROVE &amp; PAYOUT NOW
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMilestoneAction({
                                      action: "REQUEST_TOUCH_UP",
                                      milestoneId: ms.id,
                                      defectDescription: "Client identified touch-up items during 48h inspection.",
                                    })
                                  }
                                  className="brutal-btn bg-mortar-200 text-iron-950 border-2 border-iron-950 hover:bg-mortar-300 px-3 py-1.5 text-xs font-bold"
                                >
                                  REQUEST A TOUCH-UP
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMilestoneAction({
                                      action: "REQUEST_EXTENSION",
                                      milestoneId: ms.id,
                                    })
                                  }
                                  className="brutal-btn bg-white text-iron-800 border-2 border-iron-950 hover:bg-mortar-100 px-2.5 py-1.5 text-xs font-mono"
                                >
                                  +24H BLACKOUT EXTENSION
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {ms.status === "TOUCH_UP_WINDOW_ACTIVE" && (
                          <div className="w-full border-2 border-rose-600 bg-rose-50 p-3 space-y-2 rounded-none">
                            <div className="text-xs font-mono font-bold text-rose-950">
                              ⚠️ 72-HOUR FIX WINDOW ACTIVE — Artisan inspecting &amp; rectifying flagged touch-up items
                            </div>
                            {isWorkerView && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMilestoneAction({
                                    action: "SUBMIT_PROOF",
                                    milestoneId: ms.id,
                                    photoUrls: ["rectification-proof-01.webp"],
                                    notes: "Rectification proof submitted. Touch-up items addressed.",
                                  })
                                }
                                className="brutal-btn brutal-btn-dark px-3 py-1.5 text-xs font-bold"
                              >
                                SUBMIT RECTIFICATION PROOF
                              </button>
                            )}
                          </div>
                        )}

                        {ms.status === "WORK_SUBMITTED" && !isWorkerView && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMilestoneAction({
                                action: "RELEASE_ESCROW",
                                milestoneId: ms.id,
                              })
                            }
                            className="brutal-btn brutal-btn-primary px-4 py-2 text-xs"
                          >
                            APPROVE &amp; RELEASE{" "}
                            {formatZar(tx?.workerNetPayoutZar ?? preview.workerNetPayoutZar)}
                          </button>
                        )}

                        {ms.status === "RELEASED" && (
                          <div className="verified-stamp -rotate-12 scale-100 duration-150">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            [FUNDS PAID OUT]
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GATE PASS & CREW */}
        {activeTab === "gate" && (
          <div className="space-y-4">
            {!activeVisit ? (
              <div className="border-2 border-iron-950 bg-white p-6 text-center space-y-3 shadow-brutal">
                <Lock className="w-8 h-8 text-safety-600 mx-auto" />
                <div className="font-mono text-xs font-black uppercase text-iron-950">
                  GATE PASS LOCKED UNTIL FUNDS ARE SECURED IN VAULT
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("quotes");
                    setUserSelectedTab(true);
                  }}
                  className="brutal-btn brutal-btn-primary px-4 py-2 text-xs"
                >
                  VIEW QUOTES →
                </button>
              </div>
            ) : (
              <div className="border-2 border-iron-950 bg-white rounded-none p-5 shadow-brutal space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-mortar-300 pb-3">
                  <h2 className="text-lg font-black text-iron-950 uppercase flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-brick-600" />
                    Authorized Site Crew Manifest
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="font-bold uppercase px-2.5 py-0.5 bg-safety-100 text-iron-950 border-2 border-iron-950 rounded-none tabular-nums">
                      HEADCOUNT LOCK: {1 + activeVisit.crewMembers.length} PERSON(S)
                    </span>
                    <span className="font-black uppercase px-2.5 py-0.5 bg-iron-950 text-white border-2 border-iron-950 rounded-none">
                      {activeVisit.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 border-2 border-iron-950 bg-mortar-100 font-mono text-xs text-iron-950 leading-relaxed rounded-none">
                  <strong>ZERO UNANNOUNCED PERSONNEL:</strong> Only the{" "}
                  <span className="tabular-nums font-bold">
                    {1 + activeVisit.crewMembers.length}
                  </span>{" "}
                  named, SAPS-cleared individual(s) below are authorized to enter your property. If a company or builder arrives with any unvetted or unlisted person at your door, refuse entry and trigger <strong>PANIC FREEZE</strong>.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border-2 border-iron-950 bg-mortar-50 p-3.5 flex items-center gap-3 rounded-none shadow-brutal-sm">
                    <div className="w-12 h-12 border-2 border-iron-950 bg-brick-600 text-white font-black text-base flex items-center justify-center rounded-none shrink-0">
                      {activeVisit.leadWorkerProfile.user.avatarUrl || "LEAD"}
                    </div>
                    <div className="font-mono text-xs space-y-0.5">
                      <div className="font-black text-iron-950 uppercase">
                        {activeVisit.leadWorkerProfile.user.name} (LEAD)
                      </div>
                      <div className="text-brick-600 font-bold">
                        SAPS: {activeVisit.leadWorkerProfile.sapsCertificateRef}
                      </div>
                      <div className="text-iron-700">
                        ID: {activeVisit.leadWorkerProfile.saIdMasked}
                      </div>
                    </div>
                  </div>

                  {activeVisit.crewMembers.map((cm) => (
                    <div
                      key={cm.id}
                      className="border-2 border-iron-950 bg-mortar-50 p-3.5 flex items-center gap-3 rounded-none shadow-brutal-sm"
                    >
                      <div className="w-12 h-12 border-2 border-iron-950 bg-safety-500 text-iron-950 font-black text-xs flex items-center justify-center rounded-none shrink-0">
                        CREW
                      </div>
                      <div className="font-mono text-xs space-y-0.5">
                        <div className="font-black text-iron-950 uppercase">
                          {cm.workerProfile.user.name}
                        </div>
                        <div className="text-safety-700 font-bold">
                          SAPS: {cm.workerProfile.sapsCertificateRef}
                        </div>
                        <div className="text-iron-700">
                          ID: {cm.workerProfile.saIdMasked}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {activeVisit.status === "AWAITING_ARRIVAL" && (
                  <div className="border-2 border-iron-950 bg-mortar-100 p-4 space-y-3 rounded-none shadow-brutal-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                      <span className="font-bold text-iron-800 uppercase">
                        Gate Check-In OTP:
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpInput(activeVisit.checkInCode)}
                        className="brutal-btn brutal-btn-outline font-mono text-xs font-black px-2.5 py-1"
                      >
                        {activeVisit.checkInCode} (AUTO-FILL)
                      </button>
                    </div>

                    <label className="flex items-center gap-2.5 text-xs font-bold text-iron-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faceConfirmed}
                        onChange={(e) => setFaceConfirmed(e.target.checked)}
                        className="rounded-none border-2 border-iron-950 w-4 h-4 text-brick-600 focus:ring-0"
                      />
                      <span>Crew faces &amp; IDs match manifest (no unvetted helpers).</span>
                    </label>

                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="000000"
                        className="border-2 border-iron-950 bg-white text-iron-950 px-3 py-1.5 font-mono text-base font-black tracking-widest w-36 text-center rounded-none shadow-brutal-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGateVerify}
                        className="brutal-btn brutal-btn-primary px-5 py-2 text-xs"
                      >
                        VERIFY &amp; OPEN GATE
                      </button>
                      <button
                        type="button"
                        onClick={handleGatePanic}
                        className="brutal-btn bg-red-600 text-white hover:bg-red-700 px-3.5 py-2 text-xs"
                      >
                        PANIC FREEZE
                      </button>
                    </div>
                  </div>
                )}

                {activeVisit.status === "VERIFIED_ON_SITE" && (
                  <div className="border-2 border-emerald-700 bg-emerald-50 p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-brutal-sm rounded-none">
                    <div className="font-mono text-xs font-black uppercase text-emerald-950">
                      ✓ CREW VERIFIED ON-SITE
                    </div>
                    <div className="verified-stamp -rotate-12 scale-100 duration-150">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      [VERIFIED ON-SITE]
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUOTES & BIDS */}
        {activeTab === "quotes" && (
          <div className="space-y-5">
            <div className="border-2 border-iron-950 bg-white rounded-none p-5 shadow-brutal space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-mortar-300 pb-3">
                <h2 className="text-lg font-black text-iron-950 uppercase">
                  Quotes ({job.quotes.length})
                </h2>

                {!isWorkerView && !job.selectedWorkerProfileId && job.quotes.length > 0 && (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="border-2 border-iron-950 bg-white px-2.5 py-1 font-bold rounded-none shadow-brutal-sm"
                    >
                      <option value="OZOW_INSTANT_EFT">Ozow Instant EFT</option>
                      <option value="CAPITEC_PAY">Capitec Pay</option>
                      <option value="CARD_3DS">3D-Secure Card</option>
                    </select>
                  </div>
                )}
              </div>

              {job.quotes.length === 0 ? (
                <div className="border-2 border-dashed border-iron-950 p-6 text-center bg-mortar-50 font-mono text-xs text-iron-600">
                  No quotes submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {job.quotes.map((q) => {
                    const split = computeEscrowSplit({
                      labourZar: q.labourAmountZar,
                      materialsZar: q.materialsEstimateZar,
                      config,
                    });

                    return (
                      <div
                        key={q.id}
                        className="border-2 border-iron-950 rounded-none p-4 space-y-3 bg-white shadow-brutal-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-iron-950 text-sm uppercase">
                                {q.workerProfile.user.name}
                              </span>
                              <span className="font-mono text-xs font-bold text-safety-600 flex items-center gap-0.5">
                                <Star className="w-3.5 h-3.5 fill-safety-500 text-safety-500" />
                                {q.workerProfile.user.ratingAvg.toFixed(1)}
                              </span>
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-brick-50 text-brick-700 border border-iron-950 flex items-center gap-1 rounded-none">
                                <ShieldCheck className="w-3 h-3 text-brick-600" />
                                {q.workerProfile.sapsCertificateRef}
                              </span>
                              {q.workerProfile.certifications
                                .filter((c) => c.status === "VERIFIED")
                                .map((c) => (
                                  <span
                                    key={c.id}
                                    className="font-mono text-[11px] font-bold px-2 py-0.5 bg-safety-100 text-safety-900 border border-iron-950 rounded-none"
                                  >
                                    {c.body}: {c.registrationNumber}
                                  </span>
                                ))}
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <div className="text-lg font-black text-iron-950">
                              {formatZar(split.grossBuyerPaidZar)}
                            </div>
                            <div className="text-[11px] text-iron-600">
                              incl. {formatZar(split.buyerTrustFeeZar)} fee
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-iron-800 font-sans">
                          {q.scopeSummary}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-2 border-t border-iron-200">
                          <div className="text-iron-700">
                            Labour: <strong>{formatZar(q.labourAmountZar)}</strong> • Materials (0%):{" "}
                            <strong>{formatZar(q.materialsEstimateZar)}</strong> • {q.estimatedDays}d
                          </div>

                          {!isWorkerView &&
                            !job.selectedWorkerProfileId &&
                            q.status === "PENDING" && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptQuote(q.id, "CALL_OUT_FIRST")}
                                  className="brutal-btn brutal-btn-outline px-3 py-1.5 text-xs"
                                >
                                  CALL-OUT ({formatZar(job.callOutDepositZar)})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptQuote(q.id, "FULL_QUOTE_ESCROW")}
                                  className="brutal-btn brutal-btn-primary px-3.5 py-1.5 text-xs"
                                >
                                  ACCEPT &amp; SECURE IN VAULT
                                </button>
                              </div>
                            )}

                          {job.selectedWorkerProfileId === q.workerProfileId && (
                            <span className="font-mono text-xs font-black uppercase px-2.5 py-1 bg-brick-600 text-white border-2 border-iron-950 rounded-none">
                              SELECTED
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Worker Quote Submission Builder (Only shown to Workers) */}
            {isWorkerView && !job.selectedWorkerProfileId && (
              <form
                onSubmit={handleSubmitQuote}
                className="border-2 border-brick-600 bg-white rounded-none p-5 shadow-brutal space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-mortar-300 pb-2.5">
                  <h3 className="text-base font-black text-iron-950 uppercase">
                    Submit Quote ({currentUser?.name})
                  </h3>

                  {currentUser?.workerProfile?.vettingTier === "TIER_1_BROWSE_ONLY" && (
                    <Link
                      href="/worker/onboarding"
                      className="brutal-btn bg-safety-100 text-safety-950 border-2 border-iron-950 px-3 py-1 text-xs font-mono font-bold"
                    >
                      Complete SAPS Clearance →
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-mono text-xs font-bold text-iron-950 uppercase mb-1">
                      Labour (ZAR)
                    </label>
                    <input
                      type="number"
                      value={quoteLabour}
                      onChange={(e) => setQuoteLabour(e.target.value)}
                      className="w-full border-2 border-iron-950 px-3 py-2 text-xs font-mono font-bold rounded-none bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold text-iron-950 uppercase mb-1">
                      Materials (0% Fee)
                    </label>
                    <input
                      type="number"
                      value={quoteMaterials}
                      onChange={(e) => setQuoteMaterials(e.target.value)}
                      className="w-full border-2 border-iron-950 px-3 py-2 text-xs font-mono font-bold rounded-none bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold text-iron-950 uppercase mb-1">
                      Days
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quoteDays}
                      onChange={(e) => setQuoteDays(e.target.value)}
                      className="w-full border-2 border-iron-950 px-3 py-2 text-xs font-mono font-bold rounded-none bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-iron-950 uppercase mb-1">
                    Scope Note
                  </label>
                  <textarea
                    rows={2}
                    value={quoteSummary}
                    onChange={(e) => setQuoteSummary(e.target.value)}
                    className="w-full border-2 border-iron-950 px-3 py-2 text-xs rounded-none bg-white font-sans focus:outline-none"
                  />
                </div>

                <div className="p-3 border-2 border-iron-950 bg-mortar-50 space-y-2 rounded-none">
                  <div className="font-mono text-xs font-bold text-iron-950 flex items-center gap-1.5 uppercase">
                    <Users className="w-3.5 h-3.5 text-brick-600" />
                    Attach Vetted Crew to Gate Pass:
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
                            className={`brutal-btn px-2.5 py-1 text-xs font-mono font-bold ${
                              checked
                                ? "bg-brick-600 text-white"
                                : "bg-white text-iron-950"
                            }`}
                          >
                            {checked ? "✓ " : "+ "}
                            {w.user?.name}
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
                  <span>
                    Net Payout:{" "}
                    <strong className="text-brick-600 text-sm font-black">
                      {formatZar(quoteSplitPreview.workerNetPayoutZar)}
                    </strong>
                  </span>
                  <button
                    type="submit"
                    className="brutal-btn brutal-btn-primary px-5 py-2 text-xs"
                  >
                    SUBMIT QUOTE
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: MASKED CHAT */}
        {activeTab === "chat" && (
          <div className="border-2 border-iron-950 bg-white rounded-none p-5 shadow-brutal flex flex-col h-[480px]">
            <div className="border-b-2 border-mortar-300 pb-2.5 mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brick-600" />
                <span className="font-mono text-xs font-bold uppercase text-iron-800">
                  {job.hasFundedEscrow
                    ? "Milestone Vault Active — Guarantee Enabled"
                    : "Pre-Booking: Phone Numbers & Cash Offers Auto-Redacted"}
                </span>
              </div>

              {!job.hasFundedEscrow && (
                <button
                  type="button"
                  onClick={() =>
                    handleSendChat(
                      "Hey WhatsApp me on 082 991 3344 and pay cash at the gate to skip the fee!"
                    )
                  }
                  className="brutal-btn bg-safety-100 hover:bg-safety-200 text-safety-950 border-2 border-iron-950 px-2.5 py-1 text-xs font-mono font-bold shrink-0"
                >
                  TEST LEAK FILTER
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 p-3.5 border-2 border-iron-950 bg-mortar-50 rounded-none">
              {job.messages.length === 0 ? (
                <div className="text-center font-mono text-xs text-iron-500 py-10">
                  No messages yet.
                </div>
              ) : (
                job.messages.map((m) => {
                  const mine = m.senderId === currentUser?.id;
                  return (
                    <div
                      key={m.id}
                      className={`p-3 border-2 border-iron-950 rounded-none text-xs space-y-1 shadow-brutal-sm ${
                        mine ? "bg-white ml-8 sm:ml-16" : "bg-mortar-200 mr-8 sm:mr-16"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold text-iron-950">
                        <span>{m.sender.name}</span>
                        {m.wasRedacted && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-safety-500 text-iron-950 border border-iron-950 rounded-none">
                            REDACTED
                          </span>
                        )}
                      </div>
                      <p className="text-iron-800 leading-relaxed font-sans">{m.body}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 flex gap-2">
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
                placeholder="Message..."
                className="flex-1 border-2 border-iron-950 px-3.5 py-2 text-xs font-sans rounded-none shadow-brutal-sm focus:outline-none bg-white text-iron-950"
              />
              <button
                type="button"
                onClick={() => handleSendChat()}
                className="brutal-btn brutal-btn-dark px-5 py-2 flex items-center gap-1.5 text-xs"
                aria-label="Send chat message"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SEND</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: RATINGS & TRUST */}
        {activeTab === "ratings" && (
          <div className="border-2 border-iron-950 bg-white rounded-none p-5 shadow-brutal space-y-4">
            <h2 className="text-lg font-black text-iron-950 uppercase flex items-center gap-2 border-b-2 border-mortar-300 pb-2.5">
              <Star className="w-5 h-5 fill-safety-500 text-safety-500" />
              Verified Reviews ({job.reviews.length})
            </h2>

            {job.reviews.length === 0 ? (
              <div className="border-2 border-dashed border-iron-950 p-6 text-center bg-mortar-50 font-mono text-xs text-iron-600">
                No reviews yet. Unlocks once work begins.
              </div>
            ) : (
              <div className="space-y-3">
                {job.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="border-2 border-iron-950 rounded-none p-3.5 space-y-2 bg-mortar-50 shadow-brutal-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-iron-950 text-xs uppercase">
                        {rev.reviewer.name} → {rev.reviewee.name}
                      </span>
                      <span className="font-mono text-xs font-bold text-safety-600">
                        {"★".repeat(rev.overallRating)} ({rev.overallRating}/5)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-white p-2 border border-iron-950 rounded-none">
                      <div>Quality: {rev.qualityOrClarityScore}/5</div>
                      <div>Punctuality: {rev.punctualityOrPaymentScore}/5</div>
                      <div>Safety: {rev.safetyRespectScore}/5</div>
                    </div>
                    <p className="text-xs text-iron-800 font-sans">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {canLeaveReview && (
              <form
                onSubmit={handleSubmitReview}
                className="pt-3 border-t-2 border-mortar-300 space-y-3"
              >
                <div className="font-black text-xs text-iron-950 uppercase font-mono">
                  Rate {currentUser?.id === job.homeownerId ? "Artisan" : "Homeowner"}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-mono text-xs font-bold text-iron-700 uppercase mb-1">
                      {currentUser?.id === job.homeownerId ? "Workmanship" : "Clear Scope"}
                    </label>
                    <select
                      value={score1}
                      onChange={(e) => setScore1(Number(e.target.value))}
                      className="w-full border-2 border-iron-950 px-3 py-1.5 bg-white font-mono font-bold text-xs rounded-none"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold text-iron-700 uppercase mb-1">
                      {currentUser?.id === job.homeownerId ? "Punctuality" : "Fast Release"}
                    </label>
                    <select
                      value={score2}
                      onChange={(e) => setScore2(Number(e.target.value))}
                      className="w-full border-2 border-iron-950 px-3 py-1.5 bg-white font-mono font-bold text-xs rounded-none"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold text-iron-700 uppercase mb-1">
                      Safety &amp; Respect
                    </label>
                    <select
                      value={score3}
                      onChange={(e) => setScore3(Number(e.target.value))}
                      className="w-full border-2 border-iron-950 px-3 py-1.5 bg-white font-mono font-bold text-xs rounded-none"
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
                  placeholder="Review comment..."
                  className="w-full border-2 border-iron-950 px-3 py-2 text-xs rounded-none bg-white font-sans focus:outline-none"
                />

                <button
                  type="submit"
                  className="brutal-btn brutal-btn-primary w-full py-2.5 text-xs font-bold"
                >
                  PUBLISH RATING
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
