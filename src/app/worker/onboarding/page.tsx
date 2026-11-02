"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  Award,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Terminal,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { SA_HARDWARE_HUBS, TRADE_CATEGORIES, formatZar } from "@/lib/config";
import { buildValidSaId } from "@/lib/security/sa-id";

export default function WorkerOnboardingPage() {
  const {
    currentUser,
    personas,
    setCurrentUserId,
    config,
    refreshBootstrap,
  } = usePersona();

  const [tab, setTab] = useState<"UPGRADE_EXISTING" | "NEW_SIGNUP">(
    "UPGRADE_EXISTING"
  );
  const [popiaChecked, setPopiaChecked] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const [isCocDrawerOpen, setIsCocDrawerOpen] = useState<boolean>(false);
  const [isDevSandboxOpen, setIsDevSandboxOpen] = useState<boolean>(false);

  const [cocBody, setCocBody] = useState<string>("PIRB");
  const [cocRegNumber, setCocRegNumber] = useState<string>("PIRB-77102-ZA");
  const [cocTrade, setCocTrade] = useState<string>("PLUMBING");

  const [newName, setNewName] = useState<string>("Mandla Zulu");
  const [newPhone, setNewPhone] = useState<string>(
    `+2773${Math.floor(1000000 + Math.random() * 8999999)}`
  );
  const [newSaId, setNewSaId] = useState<string>(
    buildValidSaId("920718", "5304", "0")
  );
  const [newHub, setNewHub] = useState<string>(SA_HARDWARE_HUBS[0]);
  const [newTrade, setNewTrade] = useState<string>("TILING");
  const [newSelfie, setNewSelfie] = useState<boolean>(true);

  const workerPersonas = personas.filter((p) => p.role === "WORKER");
  const activeWorker =
    currentUser?.role === "WORKER"
      ? currentUser
      : workerPersonas.find(
          (w) => w.workerProfile?.vettingTier === "TIER_1_BROWSE_ONLY"
        ) ?? workerPersonas[0];

  const wp = activeWorker?.workerProfile;

  const callVettingApi = async (payload: Record<string, unknown>) => {
    setStatusMsg(null);
    const res = await fetch("/api/worker/vetting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg({ kind: "err", text: data.error || "Vetting step failed." });
      return null;
    }
    await refreshBootstrap();
    return data;
  };

  const handleGenerateVoucher = async () => {
    if (!wp) return;
    const data = await callVettingApi({
      action: "REQUEST_HURU_VOUCHER",
      workerProfileId: wp.id,
      popiaConsent: popiaChecked,
    });
    if (data) {
      setStatusMsg({
        kind: "ok",
        text: `HURU Voucher (${data.voucher.voucherCode}) generated. Scan fingerprints at PostNet or Builders.`,
      });
    }
  };

  const handleSimulateSaps = async (outcome: "CLEAR" | "FLAGGED") => {
    if (!wp) return;
    const data = await callVettingApi({
      action: "SIMULATE_AFISWITCH_WEBHOOK",
      workerProfileId: wp.id,
      outcome,
    });
    if (data) {
      setStatusMsg({
        kind: outcome === "CLEAR" ? "ok" : "err",
        text: data.summary,
      });
    }
  };

  const handleSubmitCoC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wp) return;
    const data = await callVettingApi({
      action: "SUBMIT_COC_CERT",
      workerProfileId: wp.id,
      bodyName: cocBody,
      registrationNumber: cocRegNumber,
      tradeCategory: cocTrade,
    });
    if (data) {
      setStatusMsg({
        kind: "ok",
        text: "CoC submitted to Admin Queue.",
      });
      setIsCocDrawerOpen(false);
    }
  };

  const handleRegisterNewWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callVettingApi({
      action: "REGISTER_TIER_1",
      name: newName,
      phone: newPhone,
      suburb: "Fourways",
      city: "Johannesburg",
      saIdNumber: newSaId,
      selfieConfirmed: newSelfie,
      trades: [newTrade],
      nearestHardwareHub: newHub,
      yearsExperience: 6,
      bio: `Independent ${newTrade.toLowerCase()} artisan registered from ${newHub}.`,
    });

    if (data?.user) {
      setCurrentUserId(data.user.id);
      setTab("UPGRADE_EXISTING");
      setStatusMsg({
        kind: "ok",
        text: `Registered ${data.user.name} (${data.user.workerProfile.saIdMasked}) on Tier 1.`,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header & View Switcher */}
      <div className="border-b-2 border-iron-950 pb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-black text-iron-950 uppercase tracking-tight">
          Artisan Vetting &amp; Onboarding
        </h1>

        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setTab("UPGRADE_EXISTING")}
            className={`px-3 py-1.5 border-2 border-iron-950 font-bold uppercase tracking-wider transition-all duration-150 ${
              tab === "UPGRADE_EXISTING"
                ? "bg-iron-950 text-white shadow-brutal-sm"
                : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            Vetting Tiers
          </button>
          <button
            type="button"
            onClick={() => setTab("NEW_SIGNUP")}
            className={`px-3 py-1.5 border-2 border-iron-950 font-bold uppercase tracking-wider transition-all duration-150 ${
              tab === "NEW_SIGNUP"
                ? "bg-iron-950 text-white shadow-brutal-sm"
                : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            + New Sign-Up
          </button>
        </div>
      </div>

      {/* Status Notice Banner */}
      {statusMsg && (
        <div
          role="alert"
          className={`p-3.5 border-2 border-iron-950 rounded-none shadow-brutal text-xs font-mono flex items-start gap-2.5 transition-all duration-150 ${
            statusMsg.kind === "ok"
              ? "bg-emerald-50 text-emerald-950"
              : "bg-rose-50 text-rose-950"
          }`}
        >
          {statusMsg.kind === "ok" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{statusMsg.text}</div>
        </div>
      )}

      {tab === "NEW_SIGNUP" ? (
        <form
          onSubmit={handleRegisterNewWorker}
          className="border-2 border-iron-950 bg-white p-5 rounded-none shadow-brutal space-y-5"
        >
          <div className="flex items-center gap-2 border-b-2 border-iron-950 pb-2.5">
            <UserPlus className="w-5 h-5 text-brick-600" />
            <h2 className="font-black text-base text-iron-950 uppercase">
              Tier 1 Free Sign-Up (SA ID + Live Selfie)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-iron-950 uppercase mb-1 font-mono">
                Full Name (As on SA ID)
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-iron-950 uppercase mb-1 font-mono">
                Mobile Number
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm font-mono bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-iron-950 uppercase font-mono">
                  13-Digit SA ID
                </label>
                <div className="flex gap-2 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setNewSaId(buildValidSaId("900412", "5409", "0"))}
                    className="text-brick-600 hover:underline font-bold"
                  >
                    Valid ID
                  </button>
                  <span className="text-iron-400">|</span>
                  <button
                    type="button"
                    onClick={() => setNewSaId("9004125409080")}
                    className="text-rose-700 hover:underline font-bold"
                  >
                    Invalid ID
                  </button>
                </div>
              </div>
              <input
                type="text"
                required
                maxLength={13}
                value={newSaId}
                onChange={(e) => setNewSaId(e.target.value)}
                className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm font-mono tabular-nums bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-iron-950 uppercase mb-1 font-mono">
                Nearest Hardware Hub
              </label>
              <select
                value={newHub}
                onChange={(e) => setNewHub(e.target.value)}
                className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm bg-white font-mono focus:outline-none"
              >
                {SA_HARDWARE_HUBS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-iron-950 uppercase mb-1 font-mono">
                Primary Trade
              </label>
              <select
                value={newTrade}
                onChange={(e) => setNewTrade(e.target.value)}
                className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm bg-white font-mono focus:outline-none"
              >
                {TRADE_CATEGORIES.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2.5 p-2.5 border-2 border-iron-950 bg-mortar-100 rounded-none cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={newSelfie}
                  onChange={(e) => setNewSelfie(e.target.checked)}
                  className="w-4 h-4 rounded-none border-2 border-iron-950 text-brick-600 focus:ring-0"
                />
                <span className="text-xs font-bold text-iron-950">
                  Live Selfie Matched to Home Affairs Photo
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="brutal-btn brutal-btn-primary px-5 py-2.5 text-xs"
          >
            Create Tier 1 Account
          </button>
        </form>
      ) : (
        wp && (
          <div className="space-y-4">
            {/* Active Worker Bar */}
            <div className="border-2 border-iron-950 bg-white p-4 rounded-none shadow-brutal flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-iron-950 bg-iron-950 text-white font-black text-base flex items-center justify-center font-mono rounded-none">
                  {activeWorker.avatarUrl || "W"}
                </div>
                <div>
                  <div className="font-black text-iron-950 text-base">
                    {activeWorker.name}
                  </div>
                  <div className="text-xs font-mono text-iron-700">
                    ID: <strong className="tabular-nums text-iron-950">{wp.saIdMasked}</strong> •{" "}
                    <strong className="text-iron-950">{wp.nearestHardwareHub}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeWorker.id}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  className="text-xs border-2 border-iron-950 rounded-none px-2.5 py-1.5 bg-white font-mono font-bold focus:outline-none"
                >
                  {workerPersonas.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.workerProfile?.vettingTier.replace(/_/g, " ")})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    callVettingApi({
                      action: "RESET_DEMO_TIER_1",
                      workerProfileId: wp.id,
                    })
                  }
                  className="brutal-btn brutal-btn-outline inline-flex items-center gap-1 px-2.5 py-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Tier 1
                </button>
              </div>
            </div>

            {/* TIER 1 */}
            <div className="border-2 border-iron-950 bg-white rounded-none shadow-brutal p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-iron-950 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase text-brick-600">
                    // TIER 01
                  </span>
                  <h3 className="font-black text-base text-iron-950 uppercase">
                    Free Browse (SA ID &amp; Selfie)
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase px-2 py-0.5 border border-iron-950 bg-emerald-100 text-emerald-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  VERIFIED
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex flex-wrap gap-4 text-iron-700">
                  <span>SA ID: <strong className="text-iron-950 tabular-nums">{wp.saIdMasked}</strong></span>
                  <span>Selfie: <strong className="text-iron-950">Liveness Matched</strong></span>
                  <span>Access: <strong className="text-iron-950">Browse Only</strong></span>
                </div>
                <Link
                  href="/jobs"
                  className="brutal-btn brutal-btn-outline inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
                >
                  Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* TIER 2 */}
            <div
              className={`border-2 border-iron-950 bg-white rounded-none shadow-brutal p-5 space-y-3 ${
                wp.sapsStatus === "CLEARED"
                  ? "border-l-8 border-l-emerald-600"
                  : wp.sapsStatus === "FLAGGED_RECORD"
                  ? "border-l-8 border-l-rose-600"
                  : "border-l-8 border-l-amber-500"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-iron-950 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase text-brick-600">
                    // TIER 02
                  </span>
                  <h3 className="font-black text-base text-iron-950 uppercase">
                    SAPS Fingerprint Clearance (Required to Quote)
                  </h3>
                </div>
                <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 border border-iron-950 bg-mortar-200 text-iron-950">
                  {formatZar(config.sapsVettingFeeZar)} FEE
                </span>
              </div>

              {wp.sapsStatus === "CLEARED" && (
                <div className="border-2 border-iron-950 bg-emerald-50 p-3.5 text-emerald-950 flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono text-xs space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 font-black uppercase text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      CLEARED · REF: {wp.sapsCertificateRef}
                    </div>
                    <div className="text-emerald-800">
                      Authorized to quote, chat, and receive Gate OTP passes.
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 bg-emerald-700 text-white border border-iron-950">
                    TIER 2 ACTIVE
                  </span>
                </div>
              )}

              {wp.sapsStatus === "FLAGGED_RECORD" && (
                <div className="border-2 border-iron-950 bg-rose-50 p-3.5 text-rose-950 font-mono text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                  <strong>CRIMINAL RECORD FLAGGED — ACCOUNT BLOCKED FROM QUOTING &amp; SITE ENTRY</strong>
                </div>
              )}

              {wp.sapsStatus !== "CLEARED" && wp.sapsStatus !== "FLAGGED_RECORD" && !wp.huruVoucherCode && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 p-3 border-2 border-iron-950 bg-mortar-100 rounded-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={popiaChecked}
                      onChange={(e) => setPopiaChecked(e.target.checked)}
                      className="w-4 h-4 rounded-none border-2 border-iron-950 text-brick-600 focus:ring-0"
                    />
                    <span className="text-xs font-mono text-iron-950">
                      <strong>POPIA Consent:</strong> Authorize HURU &amp; AFISwitch SAPS criminal fingerprint check.
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateVoucher}
                    className="brutal-btn brutal-btn-primary px-4 py-2.5 text-xs flex items-center gap-2"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Pay {formatZar(config.sapsVettingFeeZar)} &amp; Generate PostNet Barcode
                  </button>
                </div>
              )}

              {wp.sapsStatus !== "CLEARED" && wp.sapsStatus !== "FLAGGED_RECORD" && wp.huruVoucherCode && (
                <div className="border-2 border-iron-950 bg-iron-950 text-white p-3.5 font-mono flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-safety-400 uppercase font-bold">
                      POSTNET / BUILDERS BIOMETRIC VOUCHER
                    </div>
                    <div className="text-xl font-black tracking-widest tabular-nums text-white">
                      {wp.huruVoucherCode}
                    </div>
                  </div>
                  <div className="text-xs text-mortar-300">
                    Scan fingerprints at any kiosk (valid 14 days)
                  </div>
                </div>
              )}
            </div>

            {/* TIER 3 */}
            <div className="border-2 border-iron-950 bg-white rounded-none shadow-brutal p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-iron-950 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase text-brick-600">
                    // TIER 03
                  </span>
                  <h3 className="font-black text-base text-iron-950 uppercase">
                    Statutory CoC Pro (PIRB • ECB • NHBRC)
                  </h3>
                </div>
                <Award className="w-4 h-4 text-brick-600" />
              </div>

              {wp.certifications.length > 0 && (
                <div className="space-y-1.5 font-mono text-xs">
                  {wp.certifications.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 border border-iron-950 bg-mortar-50 flex flex-wrap items-center justify-between gap-2"
                    >
                      <span className="font-bold text-iron-950">
                        {c.body}: <span className="tabular-nums">{c.registrationNumber}</span> ({c.tradeCategory})
                      </span>
                      <span
                        className={`px-2 py-0.5 border border-iron-950 text-[10px] font-bold uppercase ${
                          c.status === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-950"
                            : "bg-amber-100 text-amber-950"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => setIsCocDrawerOpen(!isCocDrawerOpen)}
                  className="brutal-btn brutal-btn-outline w-full py-2 flex items-center justify-between px-3.5 text-xs"
                >
                  <span>
                    {isCocDrawerOpen
                      ? "[-] CLOSE COC FORM"
                      : "[+] SUBMIT COC LICENSE (PIRB / ECB / NHBRC)"}
                  </span>
                  {isCocDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isCocDrawerOpen && (
                  <form
                    onSubmit={handleSubmitCoC}
                    className="mt-2.5 p-3.5 border-2 border-iron-950 bg-mortar-50 space-y-3 text-xs transition-all duration-150"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-iron-950 uppercase font-mono mb-1 text-[11px]">
                          Authority
                        </label>
                        <select
                          value={cocBody}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCocBody(val);
                            if (val === "ECB_WIREMAN") setCocTrade("ELECTRICAL");
                            else if (val === "NHBRC") setCocTrade("BUILDING");
                            else if (val === "SAQCC_GAS") setCocTrade("GAS");
                            else setCocTrade("PLUMBING");
                          }}
                          className="w-full border-2 border-iron-950 rounded-none px-3 py-1.5 bg-white font-mono text-xs focus:outline-none"
                        >
                          <option value="PIRB">PIRB (Plumber)</option>
                          <option value="ECB_WIREMAN">ECB Wireman (Electrical)</option>
                          <option value="NHBRC">NHBRC (Builder)</option>
                          <option value="SAQCC_GAS">SAQCC (Gas)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-iron-950 uppercase font-mono mb-1 text-[11px]">
                          Registration #
                        </label>
                        <input
                          type="text"
                          required
                          value={cocRegNumber}
                          onChange={(e) => setCocRegNumber(e.target.value)}
                          placeholder="e.g. PIRB-77102-ZA"
                          className="w-full border-2 border-iron-950 rounded-none px-3 py-1.5 bg-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="brutal-btn brutal-btn-primary px-4 py-2 text-xs"
                    >
                      Submit CoC
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* SANDBOX DRAWER */}
            <div className="border-2 border-iron-950 bg-white rounded-none shadow-brutal overflow-hidden">
              <button
                type="button"
                onClick={() => setIsDevSandboxOpen(!isDevSandboxOpen)}
                className="w-full px-4 py-3 bg-iron-950 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between hover:bg-iron-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-safety-400" />
                  <span>SANDBOX: SIMULATE SAPS WEBHOOK {isDevSandboxOpen ? "[-]" : "[+]"}</span>
                </div>
              </button>

              {isDevSandboxOpen && (
                <div className="p-4 bg-mortar-100 border-t-2 border-iron-950 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-150">
                  <button
                    type="button"
                    onClick={() => handleSimulateSaps("CLEAR")}
                    className="brutal-btn bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Simulate SAPS: CLEAR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateSaps("FLAGGED")}
                    className="brutal-btn bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Simulate SAPS: FLAGGED
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
