"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Hammer,
  AlertTriangle,
} from "lucide-react";
import { TRADE_CATEGORIES } from "@/lib/config";
import { usePersona } from "@/components/PersonaContext";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { currentUser, refreshBootstrap } = usePersona();

  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("Johannesburg");
  const [trade, setTrade] = useState("PLUMBING");
  const [saId, setSaId] = useState("");
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isBuilder =
    currentUser?.role === "WORKER" || currentUser?.role === "DUAL";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!suburb.trim()) {
      setError("Please specify your primary suburb.");
      return;
    }
    if (!popiaConsent) {
      setError("You must accept the POPIA data protection consent to proceed.");
      return;
    }
    if (isBuilder && (!saId.trim() || saId.trim().length !== 13)) {
      setError("13-digit South African ID is required for artisan registration.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/profile-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suburb: suburb.trim(),
          city: city.trim(),
          popiaConsent: true,
          trade: isBuilder ? trade : undefined,
          saId: isBuilder ? saId.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete profile setup.");
      }

      await refreshBootstrap();

      if (isBuilder) {
        router.push("/worker/dashboard");
      } else {
        router.push("/client/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mortar-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Block */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-brick-600">
              // STAGE 02 · MANDATORY PROFILE COMPLETION
            </span>
            <span className="px-2 py-0.5 border border-iron-950 bg-mortar-200 text-iron-950 font-mono text-[10px] font-bold uppercase">
              Action Required
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-iron-950">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-sm font-mono text-iron-700">
            Before accessing the marketplace or managing escrow funds, South African regulations require location confirmation and statutory POPIA consent.
          </p>
        </div>

        {/* Setup Form */}
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-iron-950 pb-2">
                <MapPin className="w-4 h-4 text-brick-600" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-iron-950">
                  1. Operating Suburb &amp; Metropolitan
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="suburb-field"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    Suburb / District
                  </label>
                  <input
                    id="suburb-field"
                    type="text"
                    required
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    placeholder="e.g. Fourways, Sandton, Centurion"
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city-field"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    City / Metro
                  </label>
                  <input
                    id="city-field"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Johannesburg"
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                </div>
              </div>
            </div>

            {/* Builder Requirements if Artisan/Dual */}
            {isBuilder && (
              <div className="p-4 border-2 border-iron-950 bg-mortar-50 space-y-4">
                <div className="flex items-center gap-2 border-b border-iron-950 pb-2">
                  <Hammer className="w-4 h-4 text-safety-600" />
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-iron-950">
                    2. Builder Trade &amp; Statutory ID
                  </h2>
                </div>

                <div>
                  <label
                    htmlFor="trade-select-field"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    Primary Trade / Specialty
                  </label>
                  <select
                    id="trade-select-field"
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
                </div>

                <div>
                  <label
                    htmlFor="sa-id-field"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-iron-950 mb-1"
                  >
                    13-Digit South African ID Number
                  </label>
                  <input
                    id="sa-id-field"
                    type="text"
                    required
                    maxLength={13}
                    value={saId}
                    onChange={(e) => setSaId(e.target.value.replace(/\D/g, ""))}
                    placeholder="YYMMDDSSSSCAZ (e.g. 860414...)"
                    className="w-full px-3 py-2 border-2 border-iron-950 bg-white font-mono text-sm text-iron-950 placeholder:text-iron-500 focus:outline-none focus:ring-1 focus:ring-brick-600 rounded-none shadow-brutal-sm"
                  />
                  <p className="text-[11px] font-mono text-iron-700 mt-1">
                    Used strictly to prevent fraud, duplicate profiles, and prepare your SAPS criminal record clearance.
                  </p>
                </div>
              </div>
            )}

            {/* POPIA Consent Checklist */}
            <div className="border-2 border-iron-950 p-4 bg-mortar-50 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={popiaConsent}
                  onChange={(e) => setPopiaConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-none border-2 border-iron-950 text-brick-600 focus:ring-0 cursor-pointer"
                />
                <div className="text-xs font-mono text-iron-950 leading-relaxed">
                  <span className="font-bold">Statutory POPIA &amp; Trust Compliance Agreement:</span>
                  <p className="text-iron-700 mt-1 text-[11px]">
                    I confirm that the submitted identity information is accurate. I consent to BuildSafe SA processing my contact and vetting records strictly in compliance with the Protection of Personal Information Act (Act 4 of 2013) and applicable South African consumer escrow statutes.
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="p-3 border-2 border-brick-600 bg-brick-50 text-brick-700 font-mono text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 border-2 border-iron-950 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Finalizing Profile..." : "Complete Setup & Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
