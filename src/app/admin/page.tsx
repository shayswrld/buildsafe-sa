"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Settings,
  CheckCircle2,
  Award,
  MessageSquareWarning,
  Scale,
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

type AdminPanel = "ledger" | "compliance" | "config";

export default function AdminDashboardPage() {
  const { refreshBootstrap } = usePersona();
  const [data, setData] = useState<AdminDataDTO | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<AdminPanel>("ledger");

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center font-mono text-xs">
        Loading Admin Console...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="border-b-2 border-iron-950 pb-3">
        <h1 className="text-2xl sm:text-3xl font-black text-iron-950 uppercase tracking-tight">
          Admin &amp; Revenue Console
        </h1>
      </div>

      {notice && (
        <div
          role="alert"
          className="p-3.5 border-2 border-iron-950 bg-emerald-50 text-emerald-950 rounded-none shadow-brutal text-xs font-mono flex items-center justify-between gap-3 transition-all duration-150"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-bold uppercase underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border-2 border-iron-950 bg-iron-950 text-white rounded-none p-4 shadow-brutal flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs uppercase text-safety-400 font-bold">
              PLATFORM CUT
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono tabular-nums">
              {formatZar(data.kpis.releasedPlatformRevenueZar)}
            </div>
          </div>
          <div className="text-xs font-mono text-mortar-400 mt-2 pt-2 border-t border-iron-800">
            + <span className="text-white font-bold tabular-nums">{formatZar(data.kpis.pendingPlatformRevenueZar)}</span> pending
          </div>
        </div>

        <div className="border-2 border-iron-950 bg-white text-iron-950 rounded-none p-4 shadow-brutal flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs uppercase text-iron-600 font-bold">
              ESCROW GMV
            </div>
            <div className="text-2xl font-black text-iron-950 mt-1 font-mono tabular-nums">
              {formatZar(data.kpis.totalGmvZar)}
            </div>
          </div>
          <div className="text-xs font-mono text-iron-600 mt-2 pt-2 border-t border-iron-200">
            Held: <strong className="text-iron-950 tabular-nums">{formatZar(data.kpis.heldInEscrowZar)}</strong>
          </div>
        </div>

        <div className="border-2 border-iron-950 bg-white text-iron-950 rounded-none p-4 shadow-brutal flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs uppercase text-iron-600 font-bold">
              SAPS VETTED
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono tabular-nums">
              {data.kpis.clearedWorkersCount} Cleared
            </div>
          </div>
          <div className="text-xs font-mono text-rose-700 font-bold mt-2 pt-2 border-t border-iron-200">
            <span className="tabular-nums">{data.kpis.blockedWorkersCount}</span> Blocked
          </div>
        </div>

        <div className="border-2 border-iron-950 bg-white text-iron-950 rounded-none p-4 shadow-brutal flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs uppercase text-iron-600 font-bold">
              COMPLIANCE
            </div>
            <div className="text-2xl font-black text-brick-600 mt-1 font-mono tabular-nums">
              {data.pendingCerts.length} Pending CoC
            </div>
          </div>
          <div className="text-xs font-mono text-iron-600 mt-2 pt-2 border-t border-iron-200">
            <span className="text-iron-950 font-bold tabular-nums">{data.redactedMessages.length}</span> leaks blocked
          </div>
        </div>
      </div>

      {/* 3 Tabbed Panels */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b-2 border-iron-950 pb-2">
          <button
            type="button"
            onClick={() => setActivePanel("ledger")}
            className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 border-2 border-iron-950 ${
              activePanel === "ledger"
                ? "bg-iron-950 text-white shadow-brutal-sm font-black"
                : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            <Scale className="w-4 h-4 text-brick-400" />
            <span>01 // Ledger</span>
            <span className="px-1.5 py-0.2 border border-iron-950 bg-mortar-200 text-iron-950 text-[10px] tabular-nums">
              {data.transactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel("compliance")}
            className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 border-2 border-iron-950 ${
              activePanel === "compliance"
                ? "bg-iron-950 text-white shadow-brutal-sm font-black"
                : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            <Award className="w-4 h-4 text-brick-400" />
            <span>02 // Compliance</span>
            <span className="px-1.5 py-0.2 border border-iron-950 bg-mortar-200 text-iron-950 text-[10px] tabular-nums">
              {data.pendingCerts.length + data.safetyIncidents.length + data.redactedMessages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel("config")}
            className={`py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 border-2 border-iron-950 ${
              activePanel === "config"
                ? "bg-iron-950 text-white shadow-brutal-sm font-black"
                : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            <Settings className="w-4 h-4 text-brick-400" />
            <span>03 // Fee Config</span>
          </button>
        </div>

        {/* TAB 1: LEDGER */}
        {activePanel === "ledger" && (
          <div className="border-2 border-iron-950 bg-white rounded-none shadow-brutal p-4 overflow-x-auto transition-all duration-150">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b-2 border-iron-950 text-iron-700 bg-mortar-100">
                  <th className="py-2 px-3 uppercase font-bold">Ref</th>
                  <th className="py-2 px-3 uppercase font-bold">Job &amp; Milestone</th>
                  <th className="py-2 px-3 uppercase font-bold">Buyer Paid</th>
                  <th className="py-2 px-3 uppercase font-bold">Materials (0%)</th>
                  <th className="py-2 px-3 uppercase font-bold">Artisan Net</th>
                  <th className="py-2 px-3 uppercase font-bold text-brick-600">Platform Cut</th>
                  <th className="py-2 px-3 uppercase font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron-200">
                {data.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-mortar-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-iron-950 tabular-nums">
                      {tx.providerRef}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <Link
                        href={`/jobs/${tx.milestone.job.id}`}
                        className="font-bold text-iron-950 hover:text-brick-600"
                      >
                        {tx.milestone.job.title}
                      </Link>
                      <div className="text-[11px] text-iron-600 font-mono">
                        {tx.milestone.title}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold tabular-nums">
                      {formatZar(tx.grossBuyerPaidZar)}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-iron-700">
                      {formatZar(tx.materialsZar)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-iron-900 tabular-nums">
                      {formatZar(tx.workerNetPayoutZar)}
                    </td>
                    <td className="py-2.5 px-3 font-black text-brick-600 tabular-nums">
                      {formatZar(tx.platformTotalCutZar)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 border border-iron-950 font-bold text-[10px] uppercase ${
                            tx.status === "RELEASED"
                              ? "bg-emerald-100 text-emerald-950"
                              : tx.status === "DISPUTED"
                              ? "bg-rose-200 text-rose-950"
                              : "bg-amber-100 text-amber-950"
                          }`}
                        >
                          {tx.status}
                        </span>

                        {tx.status === "DISPUTED" && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                callAdminApi(
                                  {
                                    action: "RESOLVE_DISPUTE",
                                    transactionId: tx.id,
                                    outcome: "RELEASE_TO_WORKER",
                                  },
                                  "Released funds to Artisan."
                                )
                              }
                              className="brutal-btn bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-1 text-[10px]"
                            >
                              Pay Pro
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
                                  "Refunded Homeowner."
                                )
                              }
                              className="brutal-btn bg-iron-950 hover:bg-iron-900 text-white px-2 py-1 text-[10px]"
                            >
                              Refund Buyer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: COMPLIANCE */}
        {activePanel === "compliance" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 transition-all duration-150">
            <div className="border-2 border-iron-950 bg-white rounded-none shadow-brutal p-5 space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-iron-950 pb-2.5">
                <Award className="w-4 h-4 text-brick-600" />
                <h2 className="font-black text-sm text-iron-950 uppercase">
                  CoC Approvals ({data.pendingCerts.length})
                </h2>
              </div>

              {data.pendingCerts.length === 0 ? (
                <div className="p-4 border border-iron-300 bg-mortar-50 text-center text-xs font-mono text-iron-600">
                  All CoC licenses verified.
                </div>
              ) : (
                <div className="space-y-2.5 font-mono text-xs">
                  {data.pendingCerts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 border-2 border-iron-950 bg-mortar-50 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-iron-950">
                          {c.workerProfile.user.name} — <span className="text-brick-600">{c.body}</span> ({c.registrationNumber})
                        </div>
                        <div className="text-iron-600 text-[11px]">
                          {c.tradeCategory} • SAPS: {c.workerProfile.sapsStatus}
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
                              `Verified ${c.body} for ${c.workerProfile.user.name}.`
                            )
                          }
                          className="brutal-btn bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 text-[10px]"
                        >
                          Approve
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
                              "Rejected certificate."
                            )
                          }
                          className="brutal-btn bg-rose-700 hover:bg-rose-800 text-white px-2.5 py-1 text-[10px]"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-2 border-iron-950 bg-white rounded-none shadow-brutal p-5 space-y-3">
              <div className="flex items-center justify-between border-b-2 border-iron-950 pb-2.5">
                <div className="flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4 text-brick-600" />
                  <h2 className="font-black text-sm text-iron-950 uppercase">
                    Safety &amp; Leak Alerts ({data.safetyIncidents.length + data.redactedMessages.length})
                  </h2>
                </div>
              </div>

              {data.safetyIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 border-2 border-iron-950 bg-rose-50 text-rose-950 font-mono text-xs space-y-1"
                >
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                    Gate Alert: {inc.job.title}
                  </div>
                  <p>{inc.incidentReport}</p>
                </div>
              ))}

              {data.redactedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 border-2 border-iron-950 bg-amber-50 text-iron-950 font-mono text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {msg.sender.name} ({msg.sender.role})
                    </span>
                    <Link
                      href={`/jobs/${msg.job.id}`}
                      className="underline text-brick-600"
                    >
                      Job &rarr;
                    </Link>
                  </div>
                  <p className="border-l-2 border-brick-600 pl-2 text-iron-800 font-sans">
                    {msg.body}
                  </p>
                </div>
              ))}

              {data.safetyIncidents.length === 0 && data.redactedMessages.length === 0 && (
                <div className="p-4 border border-iron-300 bg-mortar-50 text-center text-xs font-mono text-iron-600">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  No active alerts.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FEE & BRAND CONFIG */}
        {activePanel === "config" && (
          <div className="border-2 border-iron-950 bg-white rounded-none shadow-brutal p-5 space-y-4 transition-all duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-iron-950 uppercase mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm font-bold bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-iron-950 uppercase mb-1">
                  Buyer Fee (% Labour)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={buyerPct}
                  onChange={(e) => setBuyerPct(e.target.value)}
                  className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm font-bold tabular-nums bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-iron-950 uppercase mb-1">
                  Worker Cut (% Labour)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={workerPct}
                  onChange={(e) => setWorkerPct(e.target.value)}
                  className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm font-bold tabular-nums bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-iron-950 uppercase mb-1">
                  Repeat Cut (% Labour)
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={repeatPct}
                  onChange={(e) => setRepeatPct(e.target.value)}
                  className="w-full border-2 border-iron-950 rounded-none px-3 py-2 text-sm font-bold tabular-nums bg-white focus:outline-none"
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
                  "Configuration saved."
                )
              }
              className="brutal-btn brutal-btn-primary px-5 py-2.5 text-xs"
            >
              Save Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
