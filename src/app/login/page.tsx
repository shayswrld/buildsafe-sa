"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Hammer,
  Home,
  ShieldCheck,
  ArrowRight,
  Layers,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { usePersona, PersonaRole } from "@/components/PersonaContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectFrom = searchParams.get("from");
  const { personas, loginWithCredentials, devQuickLogin } = usePersona();

  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanIdentifier = phoneInput.trim();
    if (!cleanIdentifier) {
      setErrorMessage("Please enter your registered South African phone number or ID.");
      return;
    }
    if (!passwordInput) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await loginWithCredentials(cleanIdentifier, passwordInput);
      if (!res.profileCompleted) {
        router.push("/profile/setup");
        return;
      }

      if (redirectFrom && redirectFrom.startsWith("/")) {
        router.push(redirectFrom);
        return;
      }

      if (res.role === "BUILDER" || res.role === "WORKER") {
        router.push("/worker/dashboard");
      } else if (res.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/client/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid phone number or password.");
      setIsSubmitting(false);
    }
  };

  const handleDevPersonaSelect = async (personaId: string, role: PersonaRole) => {
    setErrorMessage("");
    try {
      setIsSubmitting(true);
      await devQuickLogin(personaId, role);
      if (role === "CLIENT") {
        router.push("/client/dashboard");
      } else if (role === "BUILDER") {
        router.push("/worker/dashboard");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not activate persona session.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mortar-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Architectural Header */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600 mb-2">
            // 01 · AUTHENTICATION &amp; SECURE PORTAL ACCESS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-iron-950">
            Sign In to BuildSafe SA
          </h1>
          <p className="mt-2 text-sm font-mono text-iron-700">
            Secure, role-segregated marketplace protected by signed HTTP-only sessions, South African statutory escrow, and biometric SAPS vetting.
          </p>
        </div>

        {/* Primary Section: Real Credentials Sign In */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal space-y-5">
          <div className="border-b-2 border-iron-950 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-mono font-black uppercase text-iron-950">
                Secure Account Credentials
              </h2>
              <p className="text-xs font-mono text-iron-700">
                Enter your mobile number and password to access your role portal.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 border border-iron-950 bg-mortar-200 text-iron-950 text-[10px] font-mono font-bold uppercase">
              <Lock className="w-3 h-3 text-brick-600" />
              Encrypted Session
            </span>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-4 pt-1">
            <div>
              <label
                htmlFor="phone-input"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
              >
                Mobile Number or User ID
              </label>
              <div className="relative">
                <input
                  id="phone-input"
                  suppressHydrationWarning
                  type="text"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 082 555 1020 or +27825551020"
                  className="w-full px-3 py-2.5 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950"
                >
                  Password
                </label>
              </div>
              <input
                id="password-input"
                suppressHydrationWarning
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
              />
            </div>

            {errorMessage && (
              <div className="p-3 border-2 border-brick-600 bg-brick-50 text-brick-700 font-mono text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              suppressHydrationWarning
              disabled={isSubmitting}
              className="w-full py-3 px-4 border-2 border-iron-950 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Authenticating Session..." : "Sign In to Portal"}
            </button>
          </form>

          {/* Registration Redirect Banner */}
          <div className="pt-4 border-t-2 border-iron-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <span className="text-iron-700">
              New to BuildSafe SA? Register your client or artisan profile:
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

        {/* Section 2: Developer Quick Personas (Development & Testing Sandbox) */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal space-y-4">
          <div className="flex items-center justify-between border-b-2 border-iron-950 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-mono font-black uppercase text-iron-950">
                  Development Seed Personas
                </h2>
                <span className="px-1.5 py-0.5 border border-safety-600 bg-amber-100 text-iron-950 text-[9px] font-mono font-bold uppercase">
                  Dev Mode
                </span>
              </div>
              <p className="text-xs font-mono text-iron-700 mt-0.5">
                Pre-configured verified test accounts with default password <code className="bg-mortar-200 px-1 font-bold">BuildSafe2026!</code>.
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
                <div className="mt-2 text-[10px] font-mono text-iron-600">
                  Phone: <span className="font-bold text-iron-950">+27825551020</span>
                </div>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() =>
                  handleDevPersonaSelect("user_homeowner_lerato", "CLIENT")
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
                <div className="mt-2 text-[10px] font-mono text-iron-600">
                  Phone: <span className="font-bold text-iron-950">+27723104481</span>
                </div>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() =>
                  handleDevPersonaSelect("user_worker_sipho", "BUILDER")
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
                <div className="mt-2 text-[10px] font-mono text-iron-600">
                  Phone: <span className="font-bold text-iron-950">+27823334455</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() =>
                    handleDevPersonaSelect("user_dual_johan", "CLIENT")
                  }
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2 border-2 border-iron-950 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
                >
                  <Home className="w-3 h-3" />
                  <span>As Client</span>
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() =>
                    handleDevPersonaSelect("user_dual_johan", "BUILDER")
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
                <div className="mt-2 text-[10px] font-mono text-iron-600">
                  Phone: <span className="font-bold text-iron-950">+27820000001</span>
                </div>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() =>
                  handleDevPersonaSelect("user_admin_owner", "ADMIN")
                }
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border-2 border-iron-950 bg-white hover:bg-mortar-200 text-iron-950 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
              >
                <span>Enter Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
