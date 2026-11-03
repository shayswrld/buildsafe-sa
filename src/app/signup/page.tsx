"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hammer,
  Home,
  Layers,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";

export default function SignupPage() {
  const router = useRouter();
  const { signupWithCredentials } = usePersona();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<"CLIENT" | "BUILDER" | "DUAL">("CLIENT");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Please enter your South African mobile number.");
      return;
    }
    if (password.length < 10) {
      setErrorMessage("Password must be at least 10 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await signupWithCredentials({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        accountType,
      });

      // Always advance to Stage 2: Mandatory profile completion
      router.push("/profile/setup");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to register. Please check your details.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mortar-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Architectural Header */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600 mb-2">
            // 02 · NEW ACCOUNT REGISTRATION · STAGE 1 OF 2
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-iron-950">
            Create Your BuildSafe SA Account
          </h1>
          <p className="mt-2 text-sm font-mono text-iron-700">
            Join the verified South African construction marketplace. Account creation establishes your secure credentials, followed by profile location and vetting configuration.
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Role Selection */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-2">
                1. Select Account Perspective
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType("CLIENT")}
                  className={`p-3 border-2 border-iron-950 text-left transition-all duration-100 cursor-pointer ${
                    accountType === "CLIENT"
                      ? "bg-brick-600 text-white shadow-none translate-x-[1px] translate-y-[1px]"
                      : "bg-white text-iron-950 shadow-brutal-sm hover:bg-mortar-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs uppercase">
                    <Home className="w-3.5 h-3.5" />
                    <span>Client</span>
                  </div>
                  <p
                    className={`mt-1 text-[11px] font-mono leading-tight ${
                      accountType === "CLIENT" ? "text-mortar-100" : "text-iron-700"
                    }`}
                  >
                    Post renovation jobs, fund escrow &amp; review contractor quotes.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType("BUILDER")}
                  className={`p-3 border-2 border-iron-950 text-left transition-all duration-100 cursor-pointer ${
                    accountType === "BUILDER"
                      ? "bg-iron-950 text-white shadow-none translate-x-[1px] translate-y-[1px]"
                      : "bg-white text-iron-950 shadow-brutal-sm hover:bg-mortar-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs uppercase">
                    <Hammer className="w-3.5 h-3.5 text-safety-500" />
                    <span>Builder</span>
                  </div>
                  <p
                    className={`mt-1 text-[11px] font-mono leading-tight ${
                      accountType === "BUILDER" ? "text-mortar-100" : "text-iron-700"
                    }`}
                  >
                    Browse client jobs, submit quotes &amp; manage CoC licenses.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType("DUAL")}
                  className={`p-3 border-2 border-iron-950 text-left transition-all duration-100 cursor-pointer ${
                    accountType === "DUAL"
                      ? "bg-brick-800 text-white shadow-none translate-x-[1px] translate-y-[1px]"
                      : "bg-white text-iron-950 shadow-brutal-sm hover:bg-mortar-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs uppercase">
                    <Layers className="w-3.5 h-3.5 text-brick-400" />
                    <span>Dual-Role</span>
                  </div>
                  <p
                    className={`mt-1 text-[11px] font-mono leading-tight ${
                      accountType === "DUAL" ? "text-mortar-100" : "text-iron-700"
                    }`}
                  >
                    Both homeowner and artisan. Toggle perspectives anytime.
                  </p>
                </button>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4 pt-1">
              <div>
                <label
                  htmlFor="name-input"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                >
                  Full Name / Legal Entity
                </label>
                <input
                  id="name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sipho Dlamini"
                  className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="phone-reg-input"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    South African Mobile (+27)
                  </label>
                  <input
                    id="phone-reg-input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="082 123 4567"
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email-input"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    Email Address (Optional)
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.co.za"
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label
                    htmlFor="password-reg"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    Account Password (min 10 chars)
                  </label>
                  <input
                    id="password-reg"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password-confirm"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="password-confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 border-2 border-brick-600 bg-brick-50 text-brick-700 font-mono text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 border-2 border-iron-950 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating Account..." : "Create Account & Continue to Stage 2"}
            </button>
          </form>

          {/* Login Redirect */}
          <div className="pt-4 border-t-2 border-iron-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <span className="text-iron-700">
              Already have an account registered?
            </span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-brick-600 font-bold hover:underline"
            >
              <span>Sign In Here</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
