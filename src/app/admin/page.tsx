"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  Settings,
  CheckCircle2,
  Award,
  MessageSquareWarning,
} from "lucide-react";
import { formatZar } from "@/lib/config";
import { usePersona } from "@/components/PersonaContext";

interface AdminDataDTO {
  config: {
    platformName: string;
    buyerTrustFeePct: number;
    workerLabourCommissionPct: number;
    repeatClientCommissionPct: number;
    defaultCallOutZar: number;
  };
  kpis: {
    totalGmvZar: number;
    heldInEscrowZar: number;
    releasedPlatformRevenueZar: number;
    pendingPlatformRevenueZar: number;
    clearedWorkersCount: number;
    blockedWorkersCount: number;
  };
  transactions: {
    id: string;
    providerRef: string;
    paymentMethod: string;
    labourZar: number;
    materialsZar: number;
    buyerTrustFeeZar: number;
    grossBuyerPaidZar: number;
    workerCommissionZar: number;
    platformTotalCutZar: number;
    workerNetPayoutZar: number;
    status: string;
    disputeReason?: string | null;
    milestone: {
      title: string;
      job: {
        id: string;
        title: string;
        homeowner: { name: string };
        selectedWorkerProfile?: { user: { name: string } } | null;
      };
    };
  }[];
  pendingCerts: {
    id: string;
    body: string;
    registrationNumber: string;
    tradeCategory: string;
    workerProfile: {
      sapsStatus: string;
      sapsCertificateRef?: string | null;
      user: { name: string };
    };
  }[];
  redactedMessages: {
    id: string;
    body: string;
    redactionReasonsJson: string;
    createdAt: string;
    sender: { name: string; role: string };
    job: { id: string; title: string };
  }[];
  safetyIncidents: {
    id: string;
    incidentReport?: string | null;
    job: { id: string; title: string; homeowner: { name: string } };
    leadWorkerProfile: { user: { name: string } };
  }[];
}

export default function AdminDashboardPage() {
  const { refreshBootstrap } = usePersona();
  const [data, setData] = useState<AdminDataDTO | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [buyerPct, setBuyerPct] = useState<string>("5");
  const [workerPct, setWorkerPct] = useState<string>("8");
  const [repeatPct, setRepeatPct] = useState<string>("4");
  const [brandName, setBrandName] = useState<string>("BuildSafe SA");

  const loadAdmin = useCallback(async () => {
    const res = await fetch("/api/admin", { cache: "no-store" });
    if (res.ok) {
      const json: AdminDataDTO = await res.json();
      setData(json);
      if (json.config) {
        setBuyerPct(String(Math.round(json.config.buyerTrustFeePct * 100)));
        setWorkerPct(
          String(Math.round(json.config.workerLabourCommissionPct * 100))
        );
        setRepeatPct(
          String(Math.round(json.config.repeatClientCommissionPct * 100))
        );
        setBrandName(json.config.platformName);
      }
    }
  }, []);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const callAdminApi = async (
    payload: Record<string, unknown>,
    successMsg: string
  ) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setNotice(successMsg);
      await refreshBootstrap();
      await loadAdmin();
    }
  };

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Loading Platform Founder Revenue &amp; Governance Console...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900 text-emerald-400">
            <Landmark className="w-3.5 h-3.5" />
            Platform Founder Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Your Revenue Cut, Escrow Ledger &amp; SAPS Governance
          </h1>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {notice}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs uppercase text-emerald-300 font-bold">
            Your Earned Platform Cut (Released)
          </div>
          <div className="text-3xl font-extrabold mt-1">
            {formatZar(data.kpis.releasedPlatformRevenueZar)}
          </div>
          <div className="text-xs text-emerald-200/80 mt-1">
            + {formatZar(data.kpis.pendingPlatformRevenueZar)} pending in active Escrow
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs uppercase text-slate-500 font-bold">
            Gross Escrow Volume (GMV)
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatZar(data.kpis.totalGmvZar)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Currently Held in Trust: {formatZar(data.kpis.heldInEscrowZar)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs uppercase text-slate-500 font-bold">
            SAPS Criminal-Cleared Pros
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {data.kpis.clearedWorkersCount} Cleared
          </div>
          <div className="text-xs text-red-600 font-medium mt-1">
            {data.kpis.blockedWorkersCount} Flagged / Safety-Blocked
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs uppercase text-slate-500 font-bold">
            Anti-Leakage &amp; CoC Queue
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            {data.pendingCerts.length} Pending CoC
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {data.redactedMessages.length} off-platform bypasses intercepted
          </div>
        </div>
      </div>

      {/* Live Pricing & Commission Configurator */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <h2 className="font-bold text-lg text-slate-900">
            Live Platform Take-Rate &amp; Brand Configurator
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Buyer Trust Fee (% on Labour)
            </label>
            <input
              type="number"
              min={0}
              max={25}
              value={buyerPct}
              onChange={(e) => setBuyerPct(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Worker Commission (% on Labour)
            </label>
            <input
              type="number"
              min={0}
              max={25}
              value={workerPct}
              onChange={(e) => setWorkerPct(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Repeat-Booking Loyalty (% Worker)
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={repeatPct}
              onChange={(e) => setRepeatPct(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            callAdminApi(
              {
                action: "UPDATE_FEE_CONFIG",
                platformName: brandName,
                buyerTrustFeePct: Number(buyerPct) / 100,
                workerLabourCommissionPct: Number(workerPct) / 100,
                repeatClientCommissionPct: Number(repeatPct) / 100,
              },
              "Updated platform fee model & branding across all calculators and new quotes!"
            )
          }
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
        >
          Save Fee &amp; Brand Configuration
        </button>
      </div>

      {/* Escrow Transaction & Revenue Split Ledger */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 overflow-x-auto">
        <h2 className="font-bold text-lg text-slate-900">
          Milestone Escrow &amp; Platform Cut Ledger
        </h2>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2.5 pr-3">TradeSafe Ref</th>
              <th className="py-2.5 pr-3">Job &amp; Milestone</th>
              <th className="py-2.5 pr-3">Buyer Paid</th>
              <th className="py-2.5 pr-3">Materials (0% Fee)</th>
              <th className="py-2.5 pr-3">Artisan Net</th>
              <th className="py-2.5 pr-3 text-emerald-700">Your Cut</th>
              <th className="py-2.5 pr-3">Status / Mediation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="py-3 pr-3 font-mono font-semibold text-slate-700">
                  {tx.providerRef}
                </td>
                <td className="py-3 pr-3">
                  <Link
                    href={`/jobs/${tx.milestone.job.id}`}
                    className="font-bold text-slate-900 hover:text-emerald-700"
                  >
                    {tx.milestone.job.title}
                  </Link>
                  <div className="text-slate-500">{tx.milestone.title}</div>
                </td>
                <td className="py-3 pr-3 font-bold">
                  {formatZar(tx.grossBuyerPaidZar)}
                </td>
                <td className="py-3 pr-3">{formatZar(tx.materialsZar)}</td>
                <td className="py-3 pr-3 font-semibold text-slate-800">
                  {formatZar(tx.workerNetPayoutZar)}
                </td>
                <td className="py-3 pr-3 font-extrabold text-emerald-700">
                  {formatZar(tx.platformTotalCutZar)}
                </td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        tx.status === "RELEASED"
                          ? "bg-emerald-100 text-emerald-900"
                          : tx.status === "DISPUTED"
                          ? "bg-red-100 text-red-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {tx.status}
                    </span>

                    {tx.status === "DISPUTED" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminApi(
                              {
                                action: "RESOLVE_DISPUTE",
                                transactionId: tx.id,
                                outcome: "RELEASE_TO_WORKER",
                              },
                              "Dispute resolved: Released funds to Artisan."
                            )
                          }
                          className="px-2 py-1 rounded bg-emerald-700 text-white font-bold"
                        >
                          Release to Pro
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminApi(
                              {
                                action: "RESOLVE_DISPUTE",
                                transactionId: tx.id,
                                outcome: "REFUND_TO_HOMEOWNER",
                              },
                              "Dispute resolved: Refunded Homeowner."
                            )
                          }
                          className="px-2 py-1 rounded bg-slate-800 text-white font-bold"
                        >
                          Refund Buyer
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Governance Grid: Pending CoC Certs + Anti-Leakage & Gate Safety Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-base text-slate-900">
              Tier 3 Statutory CoC Approval Queue ({data.pendingCerts.length})
            </h2>
          </div>

          {data.pendingCerts.length === 0 ? (
            <p className="text-xs text-slate-500">
              All submitted PIRB / ECB / NHBRC certificates have been reviewed.
            </p>
          ) : (
            data.pendingCerts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {c.workerProfile.user.name} — {c.body} ({c.registrationNumber})
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    SAPS Status: {c.workerProfile.sapsStatus} (
                    {c.workerProfile.sapsCertificateRef || "Pending"})
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      callAdminApi(
                        {
                          action: "REVIEW_CERTIFICATION",
                          certificationId: c.id,
                          decision: "VERIFIED",
                        },
                        `Verified ${c.body} license and upgraded ${c.workerProfile.user.name} to Tier 3!`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold"
                  >
                    Approve CoC
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      callAdminApi(
                        {
                          action: "REVIEW_CERTIFICATION",
                          certificationId: c.id,
                          decision: "REJECTED",
                        },
                        "Rejected unverified trade certificate."
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-red-100 text-red-800 font-bold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-base text-slate-900">
              Intercepted Cash-Bypass &amp; Gate Safety Alerts
            </h2>
          </div>

          {data.safetyIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-3 rounded-xl bg-red-50 border border-red-300 text-xs text-red-950 space-y-1"
            >
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Gate Security Incident on {inc.job.title}
              </div>
              <p>{inc.incidentReport}</p>
            </div>
          ))}

          {data.redactedMessages.map((msg) => (
            <div
              key={msg.id}
              className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1"
            >
              <div className="flex items-center justify-between font-bold text-amber-950">
                <span>
                  {msg.sender.name} ({msg.sender.role})
                </span>
                <Link
                  href={`/jobs/${msg.job.id}`}
                  className="underline text-emerald-800"
                >
                  Inspect Job
                </Link>
              </div>
              <p className="text-slate-700">{msg.body}</p>
            </div>
          ))}

          {data.safetyIncidents.length === 0 &&
            data.redactedMessages.length === 0 && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero unmitigated safety alerts.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
