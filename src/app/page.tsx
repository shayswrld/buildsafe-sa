"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LogIn,
  UserPlus,
  Wrench,
  Zap,
  Paintbrush,
  Hammer,
  Layers,
  Sparkles,
  Banknote,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Receipt,
  KeyRound,
} from "lucide-react";
import { EscrowCalculator } from "@/components/EscrowCalculator";
import { ArtisanCanvas } from "@/components/animations/ArtisanCanvas";

const SERVICE_CARDS = [
  { title: "Plumbing & Geysers", badge: "PIRB QUALIFIED", icon: Wrench, slug: "PLUMBING" },
  { title: "Electrical & Power", badge: "ECB WIREMAN", icon: Zap, slug: "ELECTRICAL" },
  { title: "Painting & Waterproofing", badge: "DAMP CERTIFIED", icon: Paintbrush, slug: "PAINTING" },
  { title: "Brickwork & Concrete", badge: "NHBRC REGISTERED", icon: Hammer, slug: "BUILDING" },
  { title: "Carpentry & Roofs", badge: "TIMBER TRUSS", icon: Layers, slug: "CARPENTRY" },
  { title: "Tiling & Flooring", badge: "PRECISION SCREED", icon: Sparkles, slug: "TILING" },
];

export default function HomePage() {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between overflow-x-hidden bg-[#F8F6F2]">
      {/* Ambient Animated Artisan Background Canvas */}
      <ArtisanCanvas />

      {/* Main Content Area: Centered Hero & Brutalist Auth Portal */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 flex-1 flex flex-col items-center">
        {/* Brand Lockup & Industrial Eyebrow */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 border-2 border-iron-950 bg-mortar-200 px-3 py-1 text-xs font-mono font-bold tracking-wider text-iron-950 shadow-brutal-sm">
            <span className="w-2 h-2 bg-brick-600 inline-block animate-pulse"></span>
            <span>// 00 · VETTED SOUTH AFRICAN ARTISANS &amp; ESCROW</span>
          </div>

          {/* Heading with on-point Brutalist Brick Emblem */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-brick-600 text-white border-3 border-iron-950 shadow-brutal flex items-center justify-center">
                {/* Brick masonry accent */}
                <svg
                  className="w-7 h-7 fill-current text-white"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect
                    x="2"
                    y="4"
                    width="20"
                    height="7"
                    stroke="#141416"
                    strokeWidth="1.5"
                    fill="#B93815"
                  />
                  <line
                    x1="12"
                    y1="4"
                    x2="12"
                    y2="11"
                    stroke="#141416"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="2"
                    y="13"
                    width="20"
                    height="7"
                    stroke="#141416"
                    strokeWidth="1.5"
                    fill="#B93815"
                  />
                  <line
                    x1="7"
                    y1="13"
                    x2="7"
                    y2="20"
                    stroke="#141416"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="17"
                    y1="13"
                    x2="17"
                    y2="20"
                    stroke="#141416"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              <div className="flex items-baseline gap-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-iron-950 uppercase">
                  BUILDSAFE SA
                </h1>
                <span className="bg-iron-950 text-mortar-100 px-2 py-0.5 text-xs sm:text-sm font-mono font-bold tracking-wider border border-iron-950">
                  ZA
                </span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-iron-800 font-medium max-w-xl mx-auto leading-relaxed">
              Where homeowners hire vetted craftspeople with complete milestone security.
              Every artisan verified with SAPS biometric clearance, verified trade qualifications,
              and 0% material slip markup.
            </p>
          </div>
        </div>

        {/* Primary Centered Brutalist Action Card */}
        <div className="mt-8 sm:mt-10 w-full max-w-md mx-auto">
          <div className="border-4 border-iron-950 bg-white p-6 sm:p-8 shadow-brutal rounded-none text-center space-y-4">
            <div className="border-b-2 border-iron-950 pb-3">
              <span className="font-mono text-xs font-black tracking-widest text-brick-600 uppercase">
                // GET STARTED · SELECT AN ACTION
              </span>
              <p className="text-xs text-iron-700 mt-1">
                Post jobs, inspect quotes, and manage milestone escrow payments.
              </p>
            </div>

            {/* Vertically Stacked Conversion Buttons */}
            <div className="space-y-3 pt-2">
              <Link
                href="/signup"
                className="brutal-btn-primary w-full py-3.5 text-sm font-black flex items-center justify-center gap-2 tracking-wider"
              >
                <UserPlus className="w-4 h-4" />
                <span>[ SIGN UP ]</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/login"
                className="brutal-btn-dark w-full py-3.5 text-sm font-black flex items-center justify-center gap-2 tracking-wider"
              >
                <LogIn className="w-4 h-4" />
                <span>[ LOG IN ]</span>
              </Link>
            </div>

            {/* Public Trades Bypass Link */}
            <div className="pt-2 border-t border-iron-200">
              <Link
                href="/jobs"
                className="text-xs font-mono font-bold text-iron-700 hover:text-brick-600 hover:underline inline-flex items-center gap-1 transition-colors"
              >
                <span>Browse Public Trades Without Signing In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Badges Strip (Brutalist Proof Anchors) */}
        <div className="mt-12 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border-2 border-iron-950 bg-white p-4 shadow-brutal rounded-none flex items-start gap-3">
            <div className="p-2 bg-emerald-100 border border-iron-950 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <div className="font-mono font-black text-xs text-brick-600 uppercase">100% SAPS BIOMETRIC CLEARED</div>
              <p className="text-xs text-iron-800 mt-1 leading-snug">
                AFISwitch 10-fingerprint criminal record check required before artisans can submit quotes.
              </p>
            </div>
          </div>

          <div className="border-2 border-iron-950 bg-white p-4 shadow-brutal rounded-none flex items-start gap-3">
            <div className="p-2 bg-amber-100 border border-iron-950 shrink-0">
              <Receipt className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="font-mono font-black text-xs text-brick-600 uppercase">0% MATERIAL SLIP MARKUP</div>
              <p className="text-xs text-iron-800 mt-1 leading-snug">
                Hardware store receipts reimbursed strictly at cost. Escrow protections apply solely to labour.
              </p>
            </div>
          </div>

          <div className="border-2 border-iron-950 bg-white p-4 shadow-brutal rounded-none flex items-start gap-3">
            <div className="p-2 bg-sky-100 border border-iron-950 shrink-0">
              <KeyRound className="w-5 h-5 text-sky-800" />
            </div>
            <div>
              <div className="font-mono font-black text-xs text-brick-600 uppercase">6-DIGIT GATE OTP &amp; PASS</div>
              <p className="text-xs text-iron-800 mt-1 leading-snug">
                Every lead artisan and assistant verified on the residential gate manifest before arrival.
              </p>
            </div>
          </div>
        </div>

        {/* Trade Category Quick-Links */}
        <div className="mt-12 w-full max-w-5xl space-y-4">
          <div className="border-b-2 border-iron-950 pb-2 flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600">
              // 01 · EXPLORE QUALIFIED SOUTH AFRICAN TRADES
            </span>
            <Link
              href="/jobs"
              className="text-xs font-mono font-bold text-iron-700 hover:text-brick-600 underline"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.slug}
                  className="border-2 border-iron-950 bg-white p-4 shadow-brutal rounded-none flex flex-col justify-between gap-3 hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-brick-600 uppercase block">
                        {card.badge}
                      </span>
                      <h3 className="font-black text-base text-iron-950 uppercase mt-0.5">{card.title}</h3>
                    </div>
                    <div className="p-2 bg-mortar-200 border border-iron-950 shrink-0">
                      <Icon className="w-4 h-4 text-iron-950" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-iron-200">
                    <Link
                      href="/signup"
                      className="brutal-btn-primary px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 flex-1 justify-center"
                    >
                      Hire Artisan <ArrowRight className="w-3 h-3" />
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
        </div>

        {/* Collapsible Escrow Calculator Drawer */}
        <div className="mt-12 w-full max-w-5xl">
          <div className="border-2 border-iron-950 bg-white shadow-brutal rounded-none overflow-hidden">
            <div className="p-4 sm:p-5 bg-mortar-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600 block">
                  // 02 · ESCROW FEE &amp; DISPUTE PROTECTIONS
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
        </div>
      </main>
    </div>
  );
}
