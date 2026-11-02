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

  // CoC submission state
  const [cocBody, setCocBody] = useState<string>("PIRB");
  const [cocRegNumber, setCocRegNumber] = useState<string>("PIRB-77102-ZA");
  const [cocTrade, setCocTrade] = useState<string>("PLUMBING");

  // New Tier 1 Artisan registration state
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
        text: `POPIA Consent Logged & R${config.sapsVettingFeeZar} HURU Biometric Barcode (${data.voucher.voucherCode}) Generated! Scan fingerprints below.`,
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
        text: "Trade CoC submitted to Admin Governance Queue! Switch to Admin to verify and unlock Tier 3.",
      });
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
        text: `Welcome ${data.user.name}! 13-digit SA ID Luhn checksum passed & POPIA-masked (${data.user.workerProfile.saIdMasked}). You can now browse local jobs on Tier 1!`,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
            <Fingerprint className="w-3.5 h-3.5" />
            POPIA + HURU / AFISwitch Biometric SAPS Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            3-Tier Skilled Artisan Security Onboarding
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Free SA ID + Selfie registration lets roadside artisans see real jobs
            nearby; biometric SAPS criminal clearance is strictly enforced before
            quoting or entering any home.
          </p>
        </div>

        <div className="flex gap-2 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("UPGRADE_EXISTING")}
            className={`px-3.5 py-2 rounded-lg transition ${
              tab === "UPGRADE_EXISTING"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600"
            }`}
          >
            SAPS &amp; CoC Vetting Flow
          </button>
          <button
            type="button"
            onClick={() => setTab("NEW_SIGNUP")}
            className={`px-3.5 py-2 rounded-lg transition ${
              tab === "NEW_SIGNUP"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600"
            }`}
          >
            + New Roadside Sign-Up
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium ${
            statusMsg.kind === "ok"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {tab === "NEW_SIGNUP" ? (
        <form
          onSubmit={handleRegisterNewWorker}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-700" />
            <h2 className="font-bold text-lg text-slate-900">
              Tier 1 Free Registration (13-Digit SA ID Checksum + Live Selfie)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Legal Name (As on SA ID Smart Card)
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                SA Mobile Number
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  13-Digit South African ID Number
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewSaId(buildValidSaId("900412", "5409", "0"))
                    }
                    className="text-emerald-700 underline font-semibold"
                  >
                    Generate Valid ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSaId("9004125409080")}
                    className="text-red-600 underline font-semibold"
                  >
                    Test Fake ID
                  </button>
                </div>
              </div>
              <input
                type="text"
                required
                maxLength={13}
                value={newSaId}
                onChange={(e) => setNewSaId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Validated using Home Affairs Luhn checksum &amp; stored POPIA-masked.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Usual Hardware Store / Builders Hub
              </label>
              <select
                value={newHub}
                onChange={(e) => setNewHub(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
              >
                {SA_HARDWARE_HUBS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Skilled Trade
              </label>
              <select
                value={newTrade}
                onChange={(e) => setNewTrade(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
              >
                {TRADE_CATEGORIES.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={newSelfie}
                  onChange={(e) => setNewSelfie(e.target.checked)}
                />
                <span className="text-xs font-semibold text-emerald-950">
                  Live Camera Selfie Liveness Matched to ID Photo
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm"
          >
            Create Free Tier 1 Artisan Account (Browse Jobs)
          </button>
        </form>
      ) : (
        wp && (
          <div className="space-y-6">
            {/* Worker Selector */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center">
                  {activeWorker.avatarUrl || "W"}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">
                    {activeWorker.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    POPIA Masked ID: <strong>{wp.saIdMasked}</strong> •{" "}
                    {wp.nearestHardwareHub}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeWorker.id}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-semibold"
                >
                  {workerPersonas.map((w) => (
                    <option key={w.id} value={w.id}>
                      Inspect Worker: {w.name} ({w.workerProfile?.vettingTier})
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
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Tier 1
                </button>
              </div>
            </div>

            {/* 3-Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* TIER 1 */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-700">
                    Tier 1 • Free
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900">
                  SA ID + Live Selfie Verified
                </h3>
                <p className="text-xs text-slate-600">
                  Verified adult SA ID (<strong>{wp.saIdMasked}</strong>) &amp;
                  biometric selfie match. Can browse open renovation demand near
                  hardware hubs,{" "}
                  <strong>but strictly blocked from quoting or messaging</strong>.
                </p>
                <Link
                  href="/jobs"
                  className="inline-block text-xs font-bold text-emerald-700 underline"
                >
                  Browse Nearby Jobs →
                </Link>
              </div>

              {/* TIER 2: SAPS BIOMETRIC CLEARANCE */}
              <div
                className={`bg-white rounded-2xl p-5 border-2 shadow-sm space-y-3 ${
                  wp.sapsStatus === "CLEARED"
                    ? "border-emerald-500"
                    : wp.sapsStatus === "FLAGGED_RECORD"
                    ? "border-red-500"
                    : "border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-700">
                    Tier 2 • {formatZar(config.sapsVettingFeeZar)} Mandatory
                  </span>
                  {wp.sapsStatus === "CLEARED" ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  )}
                </div>

                <h3 className="font-bold text-slate-900">
                  HURU / AFISwitch SAPS Fingerprint Check
                </h3>

                {wp.sapsStatus === "CLEARED" ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="font-bold">✓ ZERO CRIMINAL RECORD</div>
                    <div>Cert: {wp.sapsCertificateRef}</div>
                    <div>Cleared to submit quotes &amp; join Crew Gate Passes!</div>
                  </div>
                ) : wp.sapsStatus === "FLAGGED_RECORD" ? (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                    <div className="font-bold">✗ CRIMINAL RECORD FLAGGED</div>
                    <div>
                      Account permanently suspended from quoting or joining any
                      crew manifest.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {!wp.huruVoucherCode ? (
                      <>
                        <label className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={popiaChecked}
                            onChange={(e) => setPopiaChecked(e.target.checked)}
                            className="mt-0.5"
                          />
                          <span>
                            <strong>POPIA Consent:</strong> I consent to biometric
                            fingerprint capture and SAPS Criminal Record enquiry
                            via HURU &amp; AFISwitch.
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateVoucher}
                          className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                        >
                          Pay {formatZar(config.sapsVettingFeeZar)} &amp; Generate
                          PostNet Barcode
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-slate-900 text-white font-mono text-center">
                          <div className="text-[10px] text-amber-300 uppercase">
                            PostNet / Builders Kiosk Biometric Voucher
                          </div>
                          <div className="text-base font-bold tracking-widest mt-0.5">
                            {wp.huruVoucherCode}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500">
                          Sandbox Webhook Simulator — Test AFISwitch SAPS Response:
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() => handleSimulateSaps("CLEAR")}
                            className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                          >
                            Simulate SAPS Result: CLEAR (0 Convictions)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateSaps("FLAGGED")}
                            className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                          >
                            Simulate SAPS Result: FLAGGED (Block Account)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TIER 3: STATUTORY TRADE COC */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-blue-700">
                    Tier 3 • Regulated Trades
                  </span>
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">
                  Statutory CoC License (PIRB / ECB / NHBRC)
                </h3>
                <p className="text-xs text-slate-600">
                  Unlocks quoting on high-value geyser, DB board, inverter, and
                  structural CoC jobs.
                </p>

                {wp.certifications.length > 0 && (
                  <div className="space-y-1.5">
                    {wp.certifications.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <span className="font-semibold">
                          {c.body}: {c.registrationNumber}
                        </span>
                        <span
                          className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                            c.status === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmitCoC} className="space-y-2 text-xs pt-1">
                  <select
                    value={cocBody}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCocBody(val);
                      if (val === "ECB_WIREMAN") setCocTrade("ELECTRICAL");
                      else if (val === "NHBRC") setCocTrade("BUILDING");
                      else setCocTrade("PLUMBING");
                    }}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                  >
                    <option value="PIRB">PIRB (Licensed Plumber)</option>
                    <option value="ECB_WIREMAN">
                      Dept. of Labour / ECB Wireman&apos;s License
                    </option>
                    <option value="NHBRC">NHBRC Home Builder</option>
                    <option value="SAQCC_GAS">SAQCC Gas Installer</option>
                  </select>
                  <input
                    type="text"
                    value={cocRegNumber}
                    onChange={(e) => setCocRegNumber(e.target.value)}
                    placeholder="License / Reg Number"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                  >
                    Submit CoC for Admin Verification
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
