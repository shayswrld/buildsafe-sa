"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Hammer,
  Home,
  ShieldCheck,
  ArrowRight,
  Layers,
  Lock,
  Phone,
  UserCheck,
} from "lucide-react";
import { usePersona, PersonaRole } from "@/components/PersonaContext";

export default function LoginPage() {
  const router = useRouter();
  const { personas, login } = usePersona();

  const [phoneInput, setPhoneInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<PersonaRole>("CLIENT");
  const [manualError, setManualError] = useState("");

  const handleSelectPersona = (userId: string, role: PersonaRole) => {
    login(userId, role);
    if (role === "CLIENT") {
      router.push("/client/dashboard");
    } else if (role === "BUILDER") {
      router.push("/worker/dashboard");
    } else {
      router.push("/admin");
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");

    const cleanInput = phoneInput.trim();
    if (!cleanInput) {
      setManualError("Please enter a phone number or SA ID.");
      return;
    }

    // Attempt to match an existing persona by phone or ID
    const matched = personas.find(
      (p) =>
        p.phone.includes(cleanInput) ||
        p.id === cleanInput ||
        p.workerProfile?.saIdMasked.includes(cleanInput)
    );

    if (matched) {
      handleSelectPersona(matched.id, selectedRole);
      return;
    }

    // If not matched, use first role-compatible persona or default
    if (selectedRole === "BUILDER") {
      const defaultWorker =
        personas.find((p) => p.role === "WORKER" || p.role === "DUAL") ||
        personas[0];
      if (defaultWorker) {
        handleSelectPersona(defaultWorker.id, "BUILDER");
        return;
      }
    } else {
      const defaultClient =
        personas.find((p) => p.role === "HOMEOWNER" || p.role === "DUAL") ||
        personas[0];
      if (defaultClient) {
        handleSelectPersona(defaultClient.id, "CLIENT");
        return;
      }
    }

    handleSelectPersona("user_homeowner_lerato", selectedRole);
  };

  return (
    <div className="min-h-screen bg-mortar-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Architectural Header */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600 mb-2">
            // 01 · AUTHENTICATION &amp; PERSONA SELECTOR
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-iron-950">
            Sign In to BuildSafe SA
          </h1>
          <p className="mt-2 text-sm font-mono text-iron-700">
            Access role-segregated portals with verified escrow protection, statutory CoC licensing, and dual-role switching.
          </p>
        </div>

        {/* Section 1: One-Click Demo Personas */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal space-y-4">
          <div className="flex items-center justify-between border-b-2 border-iron-950 pb-3">
            <div>
              <h2 className="text-base font-mono font-black uppercase text-iron-950">
                Fast One-Click Demo Personas
              </h2>
              <p className="text-xs font-mono text-iron-700">
                Select an authentic persona to inspect role-specific affordances immediately.
              </p>
            </div>
            <span className="hidden sm:inline-block px-2 py-1 bg-mortar-200 border-2 border-iron-950 text-[10px] font-mono font-bold uppercase">
              Instant Session
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Card 1: Homeowner / Client */}
            <div className="border-2 border-iron-950 bg-mortar-50 p-4 shadow-brutal-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-brick-600 bg-brick-100 text-brick-700 font-mono text-[10px] font-bold uppercase">
                    <Home className="w-3 h-3" />
                    Client Persona
                  </span>
                  <span className="text-[11px] font-mono text-iron-700 font-bold">
                    Fourways, JHB
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-mono font-black text-iron-950">
                  Lerato Mokoena
                </h3>
                <p className="text-xs font-mono text-iron-700 mt-1">
                  Homeowner managing residential renovation projects, funding escrow milestones, and generating estate gate OTPs.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSelectPersona("user_homeowner_lerato", "CLIENT")
                }
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border-2 border-iron-950 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
              >
                <span>Enter as Client</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Artisan / Builder */}
            <div className="border-2 border-iron-950 bg-mortar-50 p-4 shadow-brutal-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-safety-600 bg-amber-100 text-iron-950 font-mono text-[10px] font-bold uppercase">
                    <Hammer className="w-3 h-3 text-safety-600" />
                    Builder Persona
                  </span>
                  <span className="text-[11px] font-mono text-iron-700 font-bold">
                    Tier 3: CoC Pro
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-mono font-black text-iron-950">
                  Sipho Dlamini
                </h3>
                <p className="text-xs font-mono text-iron-700 mt-1">
                  PIRB-licensed master plumber &amp; tiler. Cleared criminal record, verifiable CoC licenses, and trade job quotes.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSelectPersona("user_worker_sipho", "BUILDER")
                }
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border-2 border-iron-950 bg-iron-950 hover:bg-iron-900 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
              >
                <span>Enter as Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Dual-Role Persona */}
            <div className="border-2 border-iron-950 bg-mortar-50 p-4 shadow-brutal-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-iron-950 bg-iron-200 text-iron-950 font-mono text-[10px] font-bold uppercase">
                    <Layers className="w-3 h-3 text-brick-600" />
                    Dual-Role Persona
                  </span>
                  <span className="text-[11px] font-mono text-iron-700 font-bold">
                    Homeowner + Artisan
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-mono font-black text-iron-950">
                  Johan Nel
                </h3>
                <p className="text-xs font-mono text-iron-700 mt-1">
                  Master Electrician (ECB Wireman) and active homeowner. Operates dual roles seamlessly with perspective toggling.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectPersona("user_dual_johan", "CLIENT")
                  }
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2 border-2 border-iron-950 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
                >
                  <Home className="w-3 h-3" />
                  <span>As Client</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSelectPersona("user_dual_johan", "BUILDER")
                  }
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2 border-2 border-iron-950 bg-iron-950 hover:bg-iron-900 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
                >
                  <Hammer className="w-3 h-3" />
                  <span>As Builder</span>
                </button>
              </div>
            </div>

            {/* Card 4: Admin Founder */}
            <div className="border-2 border-iron-950 bg-mortar-50 p-4 shadow-brutal-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-iron-950 bg-white text-iron-950 font-mono text-[10px] font-bold uppercase">
                    <ShieldCheck className="w-3 h-3" />
                    Admin Console
                  </span>
                  <span className="text-[11px] font-mono text-iron-700 font-bold">
                    Platform Owner
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-mono font-black text-iron-950">
                  Platform Founder
                </h3>
                <p className="text-xs font-mono text-iron-700 mt-1">
                  Full administrative oversight, fee configuration, platform audits, and artisan vetting verification dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSelectPersona("user_admin_owner", "ADMIN")
                }
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border-2 border-iron-950 bg-white hover:bg-mortar-200 text-iron-950 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
              >
                <span>Enter Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Mock Manual Credentials Sign In */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal space-y-4">
          <div className="border-b-2 border-iron-950 pb-3">
            <h2 className="text-base font-mono font-black uppercase text-iron-950">
              Manual Mock Sign In
            </h2>
            <p className="text-xs font-mono text-iron-700">
              Sign in with your registered South African phone number or SA ID and select your active perspective.
            </p>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-4 pt-2">
            <div>
              <label
                htmlFor="phone-input"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
              >
                Phone Number / SA ID
              </label>
              <div className="relative">
                <input
                  id="phone-input"
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+27825551020 or 860414..."
                  className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1">
                Active Perspective on Entry
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("CLIENT")}
                  className={`py-2 px-3 border-2 border-iron-950 font-mono text-xs font-bold uppercase tracking-wider text-center transition-all duration-100 cursor-pointer ${
                    selectedRole === "CLIENT"
                      ? "bg-brick-600 text-white shadow-none translate-x-[1px] translate-y-[1px]"
                      : "bg-white text-iron-950 shadow-brutal-sm hover:bg-mortar-200"
                  }`}
                >
                  Client (Hire Builders)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("BUILDER")}
                  className={`py-2 px-3 border-2 border-iron-950 font-mono text-xs font-bold uppercase tracking-wider text-center transition-all duration-100 cursor-pointer ${
                    selectedRole === "BUILDER"
                      ? "bg-iron-950 text-white shadow-none translate-x-[1px] translate-y-[1px]"
                      : "bg-white text-iron-950 shadow-brutal-sm hover:bg-mortar-200"
                  }`}
                >
                  Builder (Find Jobs)
                </button>
              </div>
            </div>

            {manualError && (
              <div className="p-2 border-2 border-brick-600 bg-brick-50 text-brick-700 font-mono text-xs font-bold">
                {manualError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 border-2 border-iron-950 bg-iron-950 hover:bg-iron-900 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
            >
              Sign In to Session
            </button>
          </form>

          {/* Registration Redirect Banner */}
          <div className="mt-4 pt-4 border-t-2 border-iron-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <span className="text-iron-700">
              Need to create a new profile with custom role preferences?
            </span>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 text-brick-600 font-bold hover:underline"
            >
              <span>Create an Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
