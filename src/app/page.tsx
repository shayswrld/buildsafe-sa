"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  HardHat,
  Banknote,
  ChevronDown,
  ChevronUp,
  KeyRound,
  MessageSquareLock,
  Wrench,
  Zap,
  Paintbrush,
  Hammer,
  Layers,
  Sparkles,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { EscrowCalculator } from "@/components/EscrowCalculator";

const SERVICE_CARDS = [
  { title: "Plumbing & Geysers", badge: "PIRB", icon: Wrench, slug: "PLUMBING" },
  { title: "Electrical & Power", badge: "ECB WIREMAN", icon: Zap, slug: "ELECTRICAL" },
  { title: "Painting & Damp", badge: "WATERPROOFING", icon: Paintbrush, slug: "PAINTING" },
  { title: "Brickwork & Walls", badge: "NHBRC", icon: Hammer, slug: "BUILDING" },
  { title: "Carpentry & Roofs", badge: "TIMBER", icon: Layers, slug: "CARPENTRY" },
  { title: "Tiling & Flooring", badge: "SCREED & TILE", icon: Sparkles, slug: "TILING" },
];

export default function HomePage() {
  const { setCurrentUserId } = usePersona();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"gate" | "vetting" | "chat" | "founder">("gate");

  return (
    <div className="space-y-10 pb-12">
      {/* Brutalist Hero Section */}
      <section className="border-b-4 border-iron-950 bg-mortar-100 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-iron-950 uppercase">
              Where Creatives Meet <span className="text-brick-600">Craftspeople.</span>
            </h1>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/jobs/new"
                className="brutal-btn-primary px-5 py-3.5 text-sm font-black inline-flex items-center gap-2"
              >
                [ POST A JOB ]
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/jobs"
                className="brutal-btn-outline px-5 py-3.5 text-sm font-black inline-flex items-center gap-2"
              >
                [ BROWSE JOBS ]
              </Link>

              <Link
                href="/worker/onboarding"
                className="brutal-btn-dark px-4 py-3.5 text-xs font-bold inline-flex items-center gap-2"
              >
                <HardHat className="w-4 h-4 text-safety-500" />
                ARTISAN VETTING
              </Link>
            </div>
          </div>

          {/* 3 Compact Trust Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="border-2 border-iron-950 bg-white p-3.5 shadow-brutal rounded-none">
              <div className="font-mono font-black text-xs text-brick-600">100% SAPS BIOMETRIC CLEARED</div>
              <p className="text-xs text-iron-800 mt-0.5">AFISwitch 10-fingerprint check required before quoting.</p>
            </div>

            <div className="border-2 border-iron-950 bg-white p-3.5 shadow-brutal rounded-none">
              <div className="font-mono font-black text-xs text-brick-600">0% MATERIAL SLIP MARKUP</div>
              <p className="text-xs text-iron-800 mt-0.5">Hardware receipts reimbursed at cost; fees apply to labour only.</p>
            </div>

            <div className="border-2 border-iron-950 bg-white p-3.5 shadow-brutal rounded-none">
              <div className="font-mono font-black text-xs text-brick-600">6-DIGIT GATE OTP &amp; CREW PASS</div>
              <p className="text-xs text-iron-800 mt-0.5">Every lead artisan and helper is verified on the gate manifest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Trade Selector */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        <div className="border-b-2 border-iron-950 pb-1.5 flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600">
            // 01 · SELECT A TRADE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SERVICE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.slug}
                className="border-2 border-iron-950 bg-white p-4 shadow-brutal rounded-none flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-brick-600 uppercase block">
                      {card.badge}
                    </span>
                    <h3 className="font-black text-base text-iron-950 uppercase">{card.title}</h3>
                  </div>
                  <Icon className="w-5 h-5 text-iron-950 shrink-0" />
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-iron-200">
                  <Link
                    href="/jobs/new"
                    className="brutal-btn-primary px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 flex-1 justify-center"
                  >
                    Post Job <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href={`/jobs?trade=${card.slug}`}
                    className="brutal-btn-outline px-3 py-1.5 text-xs font-bold inline-flex items-center justify-center"
                  >
                    Browse
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4-Segment Live Role Scenarios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        <div className="border-b-2 border-iron-950 pb-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600">
            // 02 · LIVE ROLE WORKFLOWS
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("gate")}
            className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-iron-950 transition-all duration-150 rounded-none text-left flex items-center justify-between ${
              activeTab === "gate" ? "bg-brick-600 text-white shadow-brutal" : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            <span>[1. GATE OTP]</span>
            <KeyRound className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vetting")}
            className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-iron-950 transition-all duration-150 rounded-none text-left flex items-center justify-between ${
              activeTab === "vetting" ? "bg-brick-600 text-white shadow-brutal" : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            <span>[2. VETTING]</span>
            <HardHat className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-iron-950 transition-all duration-150 rounded-none text-left flex items-center justify-between ${
              activeTab === "chat" ? "bg-brick-600 text-white shadow-brutal" : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            <span>[3. MASKED CHAT]</span>
            <MessageSquareLock className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("founder")}
            className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-iron-950 transition-all duration-150 rounded-none text-left flex items-center justify-between ${
              activeTab === "founder" ? "bg-brick-600 text-white shadow-brutal" : "bg-white text-iron-950 hover:bg-mortar-200"
            }`}
          >
            <span>[4. ADMIN LEDGER]</span>
            <Banknote className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border-2 border-iron-950 bg-white p-5 shadow-brutal rounded-none transition-all duration-150 ease-out">
          {activeTab === "gate" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] font-bold text-brick-600 uppercase">HOMEOWNER VIEW</span>
                <h3 className="text-lg font-black text-iron-950 uppercase">
                  Verify Gate OTP (482915) &amp; Release Milestone Escrow
                </h3>
              </div>
              <Link
                href="/jobs/job_bathroom_reno"
                onClick={() => setCurrentUserId("user_homeowner_lerato")}
                className="brutal-btn-primary px-4 py-2.5 text-xs font-bold shrink-0"
              >
                [ OPEN GATE WORKSPACE → ]
              </Link>
            </div>
          )}

          {activeTab === "vetting" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] font-bold text-safety-600 uppercase">WORKER VIEW</span>
                <h3 className="text-lg font-black text-iron-950 uppercase">
                  Generate HURU Voucher &amp; Complete SAPS Clearance
                </h3>
              </div>
              <Link
                href="/worker/onboarding"
                onClick={() => setCurrentUserId("user_worker_thabo")}
                className="brutal-btn-primary px-4 py-2.5 text-xs font-bold shrink-0"
              >
                [ TEST ARTISAN VETTING → ]
              </Link>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] font-bold text-iron-700 uppercase">HOMEOWNER VIEW</span>
                <h3 className="text-lg font-black text-iron-950 uppercase">
                  Compare Quotes &amp; Test Pre-Escrow Phone Redaction
                </h3>
              </div>
              <Link
                href="/jobs/job_exterior_paint"
                onClick={() => setCurrentUserId("user_homeowner_lerato")}
                className="brutal-btn-primary px-4 py-2.5 text-xs font-bold shrink-0"
              >
                [ TEST MASKED CHAT → ]
              </Link>
            </div>
          )}

          {activeTab === "founder" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] font-bold text-brick-600 uppercase">ADMIN VIEW</span>
                <h3 className="text-lg font-black text-iron-950 uppercase">
                  Audit Platform Revenue, Disputes &amp; CoC Approvals
                </h3>
              </div>
              <Link
                href="/admin"
                onClick={() => setCurrentUserId("user_admin_owner")}
                className="brutal-btn-primary px-4 py-2.5 text-xs font-bold shrink-0"
              >
                [ OPEN ADMIN CONSOLE → ]
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Collapsible Escrow Calculator Drawer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-2 border-iron-950 bg-white shadow-brutal rounded-none overflow-hidden">
          <div className="p-4 sm:p-5 bg-mortar-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600 block">
                // 03 · ESCROW FEE CALCULATOR
              </span>
              <span className="font-mono text-xs font-bold text-iron-800">
                5% Buyer Fee • 8% Labour Commission • 0% Materials Markup
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCalculatorOpen((prev) => !prev)}
              className="brutal-btn-dark px-4 py-2 text-xs font-mono font-bold tracking-wider inline-flex items-center justify-center gap-2 shrink-0"
              aria-expanded={isCalculatorOpen}
            >
              <Banknote className="w-4 h-4 text-safety-400" />
              <span>{isCalculatorOpen ? "[- HIDE CALCULATOR]" : "[+ OPEN CALCULATOR]"}</span>
              {isCalculatorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isCalculatorOpen && (
            <div className="p-6 bg-white border-t-2 border-iron-950 transition-all duration-150 ease-in-out">
              <EscrowCalculator />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
