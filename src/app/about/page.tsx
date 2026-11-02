"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Users,
  ArrowRight,
  HardHat,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { EscrowCalculator } from "@/components/EscrowCalculator";

export default function AboutPage() {
  const { config } = usePersona();

  return (
    <div className="space-y-10 pb-12">
      {/* Concise Mission Header */}
      <section className="border-b-4 border-iron-950 bg-mortar-100 pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-3">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600">
            // ABOUT {config.platformName.toUpperCase()}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-iron-950 uppercase">
            Vetted Artisans &amp; Protected Renovations
          </h1>
          <p className="text-sm sm:text-base text-iron-800 leading-relaxed max-w-2xl">
            {config.platformName} replaces risky cash deposits and unvetted roadside hires with biometric SAPS clearance,
            whole-crew Gate OTPs, and regulated milestone escrow.
          </p>
        </div>
      </section>

      {/* 3 Core Governance Pillars (Deduplicated) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-2 border-iron-950 bg-white p-5 shadow-brutal rounded-none space-y-3">
            <div className="flex items-center justify-between border-b-2 border-iron-950 pb-2">
              <span className="font-mono text-xs font-bold text-brick-600 uppercase">// 01 · 3-TIER VETTING</span>
              <ShieldCheck className="w-5 h-5 text-iron-950" />
            </div>
            <ul className="space-y-2 text-xs text-iron-800 font-sans">
              <li><strong>Tier 1 (Browse):</strong> 13-digit SA ID + Live Selfie.</li>
              <li><strong>Tier 2 (Quote):</strong> R200 HURU / AFISwitch SAPS fingerprint clearance.</li>
              <li><strong>Tier 3 (CoC):</strong> Verified PIRB, ECB Wireman &amp; NHBRC licenses.</li>
            </ul>
          </div>

          <div className="border-2 border-iron-950 bg-white p-5 shadow-brutal rounded-none space-y-3">
            <div className="flex items-center justify-between border-b-2 border-iron-950 pb-2">
              <span className="font-mono text-xs font-bold text-brick-600 uppercase">// 02 · GATE MANIFEST</span>
              <Users className="w-5 h-5 text-iron-950" />
            </div>
            <p className="text-xs text-iron-800 leading-relaxed">
              Every lead artisan and helper is registered on the site Gate Pass. Verify photos, masked SA IDs, and the 6-digit OTP before opening your gate—or trigger an instant Panic Freeze.
            </p>
          </div>

          <div className="border-2 border-iron-950 bg-white p-5 shadow-brutal rounded-none space-y-3">
            <div className="flex items-center justify-between border-b-2 border-iron-950 pb-2">
              <span className="font-mono text-xs font-bold text-brick-600 uppercase">// 03 · MILESTONE ESCROW</span>
              <Lock className="w-5 h-5 text-iron-950" />
            </div>
            <p className="text-xs text-iron-800 leading-relaxed">
              Contact details stay masked until the Call-Out Deposit is funded. Hardware slips carry 0% markup, and funds release only on homeowner approval.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing & Calculator */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="border-b-2 border-iron-950 pb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600">
            // FEE CALCULATOR
          </span>
          <span className="font-mono text-xs font-bold text-iron-800">
            5% Buyer Fee • 8% Labour Commission • 0% Materials Fee
          </span>
        </div>
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal rounded-none">
          <EscrowCalculator />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-2 border-iron-950 bg-iron-950 text-mortar-100 p-6 shadow-brutal rounded-none flex flex-wrap items-center justify-between gap-4">
          <p className="text-lg font-black uppercase tracking-tight">Ready to start?</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs/new" className="brutal-btn-primary px-5 py-2.5 text-xs font-black inline-flex items-center gap-2">
              Post a Job <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/worker/onboarding" className="brutal-btn-outline px-5 py-2.5 text-xs font-black inline-flex items-center gap-2">
              <HardHat className="w-4 h-4" /> Get Verified
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
