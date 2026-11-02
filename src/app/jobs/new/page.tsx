"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Lock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  SA_LOCATIONS,
  TRADE_CATEGORIES,
  TradeCategoryMeta,
  formatZar,
} from "@/lib/config";
import { usePersona } from "@/components/PersonaContext";

export default function NewJobWizardPage() {
  const router = useRouter();
  const { currentUser, personas, setCurrentUserId } = usePersona();

  const [selectedTrade, setSelectedTrade] = useState<TradeCategoryMeta>(
    TRADE_CATEGORIES[0]
  );
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [locationIndex, setLocationIndex] = useState<number>(0);
  const [streetAddress, setStreetAddress] = useState<string>(
    "14 Acacia Estate, Uranium Rd"
  );
  const [urgency, setUrgency] = useState<string>("THIS_WEEK");
  const [requiresCoC, setRequiresCoC] = useState<boolean>(false);
  const [budgetEstimateZar, setBudgetEstimateZar] = useState<string>("2500");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTrade = (trade: TradeCategoryMeta) => {
    setSelectedTrade(trade);
    setSelectedChips([]);
    setRequiresCoC(false);
    setTitle("");
  };

  const toggleChip = (chipLabel: string, chipCoC?: boolean) => {
    const exists = selectedChips.includes(chipLabel);
    const updated = exists
      ? selectedChips.filter((c) => c !== chipLabel)
      : [...selectedChips, chipLabel];
    setSelectedChips(updated);

    if (!title || selectedChips.length === 0) {
      setTitle(updated[0] ?? "");
    }

    // Auto-enable statutory CoC toggle if any selected task legally requires a CoC
    const needsStatutoryCoC = updated.some((lbl) => {
      const found = selectedTrade.commonProblems.find((p) => p.label === lbl);
      return Boolean(found?.requiresCoC);
    });
    setRequiresCoC(needsStatutoryCoC);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Ensure a Homeowner persona is posting (or fallback to Lerato if currently viewing as Worker/Admin)
    let homeownerId = currentUser?.id;
    if (!currentUser || currentUser.role !== "HOMEOWNER") {
      const firstHomeowner = personas.find((p) => p.role === "HOMEOWNER");
      if (firstHomeowner) {
        homeownerId = firstHomeowner.id;
        setCurrentUserId(firstHomeowner.id);
      }
    }

    const loc = SA_LOCATIONS[locationIndex] ?? SA_LOCATIONS[0];
    const finalTitle =
      title.trim() ||
      selectedChips[0] ||
      `${selectedTrade.label} Request in ${loc.suburb}`;
    const finalDesc =
      description.trim() ||
      `Looking for a SAPS-cleared ${selectedTrade.label.toLowerCase()} artisan for: ${
        selectedChips.join(", ") || finalTitle
      }.`;

    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeownerId,
          title: finalTitle,
          category: selectedTrade.slug,
          problemTags: selectedChips,
          description: finalDesc,
          suburb: loc.suburb,
          city: loc.city,
          streetAddress,
          urgency,
          requiresCoC,
          callOutDepositZar: selectedTrade.defaultCallOutZar,
          budgetEstimateZar: budgetEstimateZar ? Number(budgetEstimateZar) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post job.");
        setSubmitting(false);
        return;
      }
      router.push(`/jobs/${data.job.id}`);
    } catch {
      setError("Network error while logging job.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          60-Second Guided Job Logger
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          What do you need built, fixed, or renovated?
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          No phone spam—your street number and mobile stay masked until you pick a
          SAPS-cleared artisan and lock the Call-Out Deposit in Escrow.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Trade */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">
              1. Tap the Skilled Trade Needed
            </h2>
            <span className="text-xs text-slate-500">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {TRADE_CATEGORIES.map((trade) => {
              const active = selectedTrade.slug === trade.slug;
              return (
                <button
                  key={trade.slug}
                  type="button"
                  onClick={() => handleSelectTrade(trade)}
                  className={`text-left p-3.5 rounded-xl border transition ${
                    active
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                    <span>{trade.label}</span>
                    {active && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {trade.shortDesc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Quick Problem Chips & Scope */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">
              2. Tap Common Tasks &amp; Describe Scope
            </h2>
            <span className="text-xs text-slate-500">Step 2 of 3</span>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Quick-select common {selectedTrade.label.toLowerCase()} tasks:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedTrade.commonProblems.map((prob) => {
                const chosen = selectedChips.includes(prob.label);
                return (
                  <button
                    key={prob.label}
                    type="button"
                    onClick={() => toggleChip(prob.label, prob.requiresCoC)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      chosen
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {prob.label}
                    {prob.requiresCoC ? " • CoC" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Job Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. ${selectedTrade.commonProblems[0]?.label}`}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Extra Details (Rooms, approx size, or materials you already bought at Builders)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Have already bought paint & primer at Builders Fourways, need damp wall scraped, filled, and 2 neat coats applied."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Statutory CoC Compliance Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresCoC}
              onChange={(e) => setRequiresCoC(e.target.checked)}
              className="mt-1 rounded text-amber-600"
            />
            <div className="text-xs">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Require Tier 3 Statutory Certificate of Compliance (CoC) Specialist
              </div>
              <p className="text-amber-800 mt-0.5">
                Restricts quotes strictly to licensed{" "}
                {selectedTrade.cocLabel || "PIRB / ECB Wireman / NHBRC"} pros for
                regulated geyser, electrical DB board, or structural work. Leave
                unchecked for general skilled painting, tiling, carpentry, or minor
                repairs.
              </p>
            </div>
          </label>
        </div>

        {/* Step 3: Location, Privacy & Escrow Call-Out Preview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">
              3. Suburb, Timing &amp; Protected Call-Out
            </h2>
            <span className="text-xs text-slate-500">Step 3 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Suburb &amp; Metro Area
              </label>
              <div className="relative">
                <select
                  value={locationIndex}
                  onChange={(e) => setLocationIndex(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SA_LOCATIONS.map((loc, idx) => (
                    <option key={`${loc.suburb}-${loc.city}`} value={idx}>
                      {loc.suburb}, {loc.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                When do you need it done?
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="EMERGENCY_TODAY">Urgent — Today / Tomorrow</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="FLEXIBLE_RENOVATION">
                  Flexible — Comparing Renovation Quotes
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Exact Street / Complex Address (Encrypted)
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Workers only see <strong>{SA_LOCATIONS[locationIndex]?.suburb}</strong>{" "}
                until you accept a quote &amp; fund Escrow.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rough Labour + Material Budget (Optional ZAR)
              </label>
              <input
                type="number"
                min={200}
                step={100}
                value={budgetEstimateZar}
                onChange={(e) => setBudgetEstimateZar(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-emerald-950 space-y-0.5">
              <div className="font-bold text-sm">
                Posting is 100% Free • Credited Call-Out Deposit:{" "}
                {formatZar(selectedTrade.defaultCallOutZar)}
              </div>
              <p className="text-emerald-800">
                You pay nothing right now. When you choose a SAPS-cleared artisan,
                locking {formatZar(selectedTrade.defaultCallOutZar)} (or the full
                quote) in Escrow unlocks your Gate Check-In OTP and credits toward
                their labour.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm shrink-0 disabled:opacity-50 transition"
            >
              {submitting ? "Broadcasting Job..." : "Broadcast Job to Vetted Pros"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
