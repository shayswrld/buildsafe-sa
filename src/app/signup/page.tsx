"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Hammer,
  Home,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { TRADE_CATEGORIES } from "@/lib/config";

export default function SignupPage() {
  const router = useRouter();
  const { register } = usePersona();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("Johannesburg");
  const [rolePreference, setRolePreference] = useState<
    "CLIENT" | "BUILDER" | "DUAL"
  >("CLIENT");
  const [trade, setTrade] = useState("PLUMBING");
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
      setErrorMessage("Please enter your contact phone number.");
      return;
    }
    if (!suburb.trim()) {
      setErrorMessage("Please enter your suburb.");
      return;
    }

    try {
      setSubmitting(true);
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        suburb: suburb.trim(),
        city: city.trim(),
        rolePreference,
        trade:
          rolePreference === "BUILDER" || rolePreference === "DUAL"
            ? trade
            : undefined,
      });

      if (rolePreference === "BUILDER") {
        router.push("/worker/dashboard");
      } else {
        router.push("/client/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to register. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mortar-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Architectural Header */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600 mb-2">
            // 02 · NEW ACCOUNT REGISTRATION
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-iron-950">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm font-mono text-iron-700">
            Select your platform role to configure segregated navigation, escrow protection, and artisan verifications.
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Preference Selection */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-2">
                1. Select Account Perspective
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRolePreference("CLIENT")}
                  className={`p-3 border-2 border-iron-950 text-left transition-all duration-100 cursor-pointer ${
                    rolePreference === "CLIENT"
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
                      rolePreference === "CLIENT" ? "text-mortar-100" : "text-iron-700"
                    }`}
                  >
                    Post renovation jobs, fund escrow &amp; review contractor quotes.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRolePreference("BUILDER")}
                  className={`p-3 border-2 border-iron-950 text-left transition-all duration-100 cursor-pointer ${
                    rolePreference === "BUILDER"
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
                      rolePreference === "BUILDER" ? "text-mortar-100" : "text-iron-700"
                    }`}
                  >
                    Browse client jobs, submit quotes &amp; manage CoC licenses.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRolePreference("DUAL")}
                  className={`p-3 border-2 border-iron-950 text-left transition-all duration-100 cursor-pointer ${
                    rolePreference === "DUAL"
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
                      rolePreference === "DUAL" ? "text-mortar-100" : "text-iron-700"
                    }`}
                  >
                    Both homeowner and artisan. Toggle perspectives anytime.
                  </p>
                </button>
              </div>
            </div>

            {/* If Builder or Dual: Trade Selection */}
            {(rolePreference === "BUILDER" || rolePreference === "DUAL") && (
              <div className="p-3 border-2 border-iron-950 bg-mortar-50 space-y-2">
                <label
                  htmlFor="trade-select"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950"
                >
                  Primary Trade / Skill
                </label>
                <select
                  id="trade-select"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-xs font-bold text-iron-950 focus:outline-none rounded-none shadow-brutal-sm"
                >
                  {TRADE_CATEGORIES.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.label} ({t.shortDesc})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] font-mono text-iron-700">
                  You can add more certifications and verified CoC licenses after onboarding.
                </p>
              </div>
            )}

            {/* Profile Information */}
            <div className="space-y-4 pt-1">
              <div>
                <label
                  htmlFor="name-input"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                >
                  Full Name / Business Name
                </label>
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Johan Nel"
                  required
                  className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="phone-reg-input"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    Phone (+27)
                  </label>
                  <input
                    id="phone-reg-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27821234567"
                    required
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email-input"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    Email (Optional)
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="suburb-input"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    Suburb
                  </label>
                  <input
                    id="suburb-input"
                    type="text"
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    placeholder="e.g. Randburg"
                    required
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city-input"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    City / Metropolitan
                  </label>
                  <input
                    id="city-input"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Johannesburg"
                    required
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2 border-2 border-brick-600 bg-brick-50 text-brick-700 font-mono text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 border-2 border-iron-950 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Registering Session..." : "Create Account & Enter Portal"}
            </button>
          </form>

          {/* Login Redirect */}
          <div className="pt-4 border-t-2 border-iron-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <span className="text-iron-700">
              Already have an account or looking for demo personas?
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
