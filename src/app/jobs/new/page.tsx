"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Users,
  Calculator,
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

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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
  const [budgetFlexibility, setBudgetFlexibility] = useState<
    "TARGET" | "MAXIMUM" | "FLEXIBLE"
  >("TARGET");
  const [budgetEstimateZar, setBudgetEstimateZar] = useState<string>("2500");
  const [labourEstimateZar, setLabourEstimateZar] = useState<string>("1600");
  const [materialsEstimateZar, setMaterialsEstimateZar] = useState<string>("900");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeClient =
    currentUser ||
    personas.find((p) => p.role === "HOMEOWNER" || p.role === "DUAL") ||
    personas[0];

  const handleBudgetChange = (val: string) => {
    setBudgetEstimateZar(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const labour = Math.round(num * 0.65);
      const materials = Math.round(num * 0.35);
      setLabourEstimateZar(String(labour));
      setMaterialsEstimateZar(String(materials));
    } else if (val === "" || num === 0) {
      setLabourEstimateZar("0");
      setMaterialsEstimateZar("0");
    }
  };

  const handleLabourChange = (val: string) => {
    setLabourEstimateZar(val);
    const l = parseFloat(val) || 0;
    const m = parseFloat(materialsEstimateZar) || 0;
    setBudgetEstimateZar(String(l + m));
  };

  const handleMaterialsChange = (val: string) => {
    setMaterialsEstimateZar(val);
    const l = parseFloat(labourEstimateZar) || 0;
    const m = parseFloat(val) || 0;
    setBudgetEstimateZar(String(l + m));
  };

  const parsedLabour = Math.max(0, parseFloat(labourEstimateZar) || 0);
  const parsedMaterials = Math.max(0, parseFloat(materialsEstimateZar) || 0);
  const callOutDepositZar = selectedTrade.defaultCallOutZar || 250;
  const buyerTrustFeeZar = Math.round(parsedLabour * 0.05 * 100) / 100;
  const grossClientCommitmentZar =
    Math.round((parsedLabour + parsedMaterials + buyerTrustFeeZar) * 100) / 100;
  const remainingLabourEscrowZar = Math.max(0, parsedLabour - callOutDepositZar);

  const handleSelectTrade = (trade: TradeCategoryMeta) => {
    setSelectedTrade(trade);
    setSelectedChips([]);
    setRequiresCoC(false);
    setTitle("");
    setDescription("");
  };

  const toggleChip = (chipLabel: string) => {
    const exists = selectedChips.includes(chipLabel);
    const updated = exists
      ? selectedChips.filter((c) => c !== chipLabel)
      : [...selectedChips, chipLabel];
    setSelectedChips(updated);

    if (!title || selectedChips.length === 0) {
      setTitle(updated[0] ?? "");
    }
    if (!description && updated.length > 0) {
      setDescription(`Need assistance with: ${updated.join(", ")}.`);
    }

    const needsStatutoryCoC = updated.some((lbl) => {
      const found = selectedTrade.commonProblems.find((p) => p.label === lbl);
      return Boolean(found?.requiresCoC);
    });
    setRequiresCoC(needsStatutoryCoC);
  };

  const proceedToStep2 = () => {
    if (!selectedTrade) {
      setError("Please select a trade category.");
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const proceedToStep3 = () => {
    if (!title.trim()) {
      setError("Please enter a job headline.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe the work needed.");
      return;
    }
    setError(null);
    setCurrentStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let homeownerId = currentUser?.id;
    if (!homeownerId) {
      const firstHomeowner =
        personas.find((p) => p.role === "HOMEOWNER" || p.role === "DUAL") ||
        personas[0];
      if (firstHomeowner) {
        homeownerId = firstHomeowner.id;
      }
    }

    const loc = SA_LOCATIONS[locationIndex] ?? SA_LOCATIONS[0];
    const finalTitle =
      title.trim() ||
      selectedChips[0] ||
      `${selectedTrade.label} in ${loc.suburb}`;
    const finalDesc =
      description.trim() ||
      `${selectedTrade.label}: ${selectedChips.join(", ") || finalTitle}.`;

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Compact Header */}
      <div className="border-b-2 border-iron-950 pb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-black text-iron-950 uppercase tracking-tight">
          Post a Job
        </h1>
        <span className="border-2 border-iron-950 bg-white px-2.5 py-1 font-mono text-xs font-bold text-iron-950 uppercase shadow-brutal-sm">
          STEP {currentStep} OF 3
        </span>
      </div>

      {/* 3-Step Stepper Bar */}
      <div className="grid grid-cols-3 gap-2 border-2 border-iron-950 bg-mortar-200 p-2 shadow-brutal-sm rounded-none">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider text-left border-2 border-iron-950 transition-all duration-150 rounded-none flex items-center justify-between ${
            currentStep === 1
              ? "bg-brick-600 text-white shadow-brutal-sm"
              : "bg-white text-iron-950 hover:bg-mortar-100"
          }`}
        >
          <span className="truncate">01 // TRADE</span>
          {currentStep > 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedTrade) setCurrentStep(2);
          }}
          disabled={!selectedTrade}
          className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider text-left border-2 border-iron-950 transition-all duration-150 rounded-none flex items-center justify-between disabled:opacity-50 ${
            currentStep === 2
              ? "bg-brick-600 text-white shadow-brutal-sm"
              : "bg-white text-iron-950 hover:bg-mortar-100"
          }`}
        >
          <span className="truncate">02 // SCOPE</span>
          {currentStep > 2 && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedTrade && title.trim() && description.trim()) {
              setCurrentStep(3);
            }
          }}
          disabled={!selectedTrade || !title.trim() || !description.trim()}
          className={`p-2.5 font-mono text-xs font-bold uppercase tracking-wider text-left border-2 border-iron-950 transition-all duration-150 rounded-none flex items-center justify-between disabled:opacity-50 ${
            currentStep === 3
              ? "bg-brick-600 text-white shadow-brutal-sm"
              : "bg-white text-iron-950 hover:bg-mortar-100"
          }`}
        >
          <span className="truncate">03 // LOCATION</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 border-2 border-iron-950 bg-rose-50 text-rose-900 text-xs font-bold font-mono flex items-center gap-2 shadow-brutal-sm rounded-none">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Select Trade */}
      {currentStep === 1 && (
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal rounded-none space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {TRADE_CATEGORIES.map((trade) => {
              const active = selectedTrade.slug === trade.slug;
              return (
                <button
                  key={trade.slug}
                  type="button"
                  onClick={() => handleSelectTrade(trade)}
                  className={`text-left p-4 border-2 border-iron-950 transition-all duration-100 rounded-none flex flex-col justify-between gap-2 ${
                    active
                      ? "bg-brick-50 border-brick-600 shadow-brutal ring-2 ring-brick-600"
                      : "bg-white hover:bg-mortar-100 shadow-brutal-sm"
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-sm text-iron-950 uppercase">
                    <span>{trade.label}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-brick-600 shrink-0" />}
                  </div>

                  <div className="pt-2 border-t border-iron-200 flex items-center justify-between font-mono text-[11px] text-iron-800">
                    <span>CALL-OUT:</span>
                    <span className="font-bold tabular-nums text-brick-600">
                      {formatZar(trade.defaultCallOutZar)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t-2 border-iron-950 flex justify-end">
            <button
              type="button"
              onClick={proceedToStep2}
              className="brutal-btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2"
            >
              <span>NEXT: SCOPE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Scope */}
      {currentStep === 2 && (
        <div className="border-2 border-iron-950 bg-white p-6 shadow-brutal rounded-none space-y-5">
          <div className="p-2.5 bg-mortar-100 border-2 border-iron-950 flex items-center justify-between font-mono text-xs">
            <span>
              <strong>{selectedTrade.label.toUpperCase()}</strong> • Call-Out:{" "}
              <strong className="tabular-nums">{formatZar(selectedTrade.defaultCallOutZar)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-brick-600 font-bold underline uppercase"
            >
              [CHANGE]
            </button>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-xs font-bold uppercase text-iron-950">
              Quick-Select Common Tasks:
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTrade.commonProblems.map((prob) => {
                const chosen = selectedChips.includes(prob.label);
                return (
                  <button
                    key={prob.label}
                    type="button"
                    onClick={() => toggleChip(prob.label)}
                    className={`px-3 py-1.5 font-mono text-xs font-bold border-2 border-iron-950 transition-all duration-100 rounded-none ${
                      chosen
                        ? "bg-iron-950 text-white shadow-brutal-sm"
                        : "bg-white text-iron-950 hover:bg-mortar-200"
                    }`}
                  >
                    <span>{prob.label}</span>
                    {prob.requiresCoC && (
                      <span className="ml-1 text-[10px] text-safety-400 font-black">• CoC</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-iron-950 mb-1">
                Job Headline *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedTrade.commonProblems[0]?.label || "Job summary"}
                className="w-full border-2 border-iron-950 bg-white px-3.5 py-2 font-sans text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-brick-600 shadow-brutal-sm"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-iron-950 mb-1">
                Scope &amp; Details *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dimensions, rooms, or materials already on site..."
                className="w-full border-2 border-iron-950 bg-white px-3.5 py-2 font-sans text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-brick-600 shadow-brutal-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-3.5 border-2 border-iron-950 bg-safety-50 shadow-brutal-sm rounded-none cursor-pointer">
            <input
              type="checkbox"
              checked={requiresCoC}
              onChange={(e) => setRequiresCoC(e.target.checked)}
              className="rounded-none accent-[#B93815] w-4 h-4 border-2 border-iron-950"
            />
            <span className="font-mono text-xs font-bold text-iron-950 uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-safety-600 shrink-0" />
              Require Tier 3 Statutory CoC ({selectedTrade.cocLabel || "PIRB / ECB / NHBRC"})
            </span>
          </label>

          <div className="pt-3 border-t-2 border-iron-950 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="brutal-btn-outline px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK</span>
            </button>

            <button
              type="button"
              onClick={proceedToStep3}
              className="brutal-btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <span>NEXT: LOCATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Location & Submit */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="border-2 border-iron-950 bg-white p-6 shadow-brutal rounded-none space-y-5">
          <div className="p-2.5 bg-mortar-100 border-2 border-iron-950 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span>
              <strong>{selectedTrade.label.toUpperCase()}:</strong> {title}
            </span>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="text-brick-600 font-bold underline uppercase"
            >
              [EDIT SCOPE]
            </button>
          </div>

          {/* Explicit active persona confirmation */}
          <div className="p-3 border-2 border-iron-950 bg-mortar-100 flex flex-wrap items-center justify-between gap-2 font-mono text-xs shadow-brutal-sm rounded-none">
            <span className="font-bold text-iron-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brick-600 shrink-0" />
              Posting as: <strong className="text-brick-600">{activeClient?.name || "Client"}</strong> • <span>{activeClient?.suburb || SA_LOCATIONS[locationIndex]?.suburb || "Fourways"}</span>
            </span>
            <span className="border border-iron-950 bg-white px-2 py-0.5 text-[10px] font-bold uppercase">
              {currentUser?.isDualRole ? "DUAL ACCOUNT" : "AUTHENTICATED CLIENT"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-iron-950 mb-1">
                Suburb &amp; City
              </label>
              <select
                value={locationIndex}
                onChange={(e) => setLocationIndex(Number(e.target.value))}
                className="w-full border-2 border-iron-950 bg-white px-3.5 py-2 font-sans text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-brick-600 shadow-brutal-sm"
              >
                {SA_LOCATIONS.map((loc, idx) => (
                  <option key={`${loc.suburb}-${loc.city}`} value={idx}>
                    {loc.suburb}, {loc.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-iron-950 mb-1">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full border-2 border-iron-950 bg-white px-3.5 py-2 font-sans text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-brick-600 shadow-brutal-sm"
              >
                <option value="EMERGENCY_TODAY">Emergency — Today</option>
                <option value="THIS_WEEK">Standard — This Week</option>
                <option value="FLEXIBLE_RENOVATION">Flexible — Comparing Quotes</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-iron-950 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brick-600" />
                Street Address (Hidden Until Escrow)
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full border-2 border-iron-950 bg-white px-3.5 py-2 font-sans text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-brick-600 shadow-brutal-sm"
              />
              <p className="font-mono text-[11px] text-iron-600 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brick-600 shrink-0" />
                Only <strong>{SA_LOCATIONS[locationIndex]?.suburb}</strong> is shown publicly.
              </p>
            </div>
          </div>

          {/* Interactive Affordability Breakdown Card */}
          <div className="border-2 border-iron-950 bg-mortar-50 p-5 shadow-brutal-sm rounded-none space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-iron-950 pb-2">
              <span className="font-mono text-xs font-bold text-iron-950 uppercase flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-brick-600" />
                Interactive Affordability Breakdown &amp; Escrow Estimator
              </span>
              <span className="font-mono text-[11px] font-bold bg-white border border-iron-950 px-2 py-0.5 text-iron-950">
                TRADE: {selectedTrade.label.toUpperCase()}
              </span>
            </div>

            {/* Budget Flexibility Selector */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold uppercase text-iron-950">
                Budget Flexibility Profile:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBudgetFlexibility("TARGET")}
                  className={`py-2 px-3 font-mono text-xs font-bold uppercase border-2 border-iron-950 rounded-none transition-all duration-100 ${
                    budgetFlexibility === "TARGET"
                      ? "bg-brick-600 text-white shadow-brutal-sm"
                      : "bg-white text-iron-950 hover:bg-mortar-200"
                  }`}
                >
                  Target Budget
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetFlexibility("MAXIMUM")}
                  className={`py-2 px-3 font-mono text-xs font-bold uppercase border-2 border-iron-950 rounded-none transition-all duration-100 ${
                    budgetFlexibility === "MAXIMUM"
                      ? "bg-brick-600 text-white shadow-brutal-sm"
                      : "bg-white text-iron-950 hover:bg-mortar-200"
                  }`}
                >
                  Maximum Ceiling
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetFlexibility("FLEXIBLE")}
                  className={`py-2 px-3 font-mono text-xs font-bold uppercase border-2 border-iron-950 rounded-none transition-all duration-100 ${
                    budgetFlexibility === "FLEXIBLE"
                      ? "bg-brick-600 text-white shadow-brutal-sm"
                      : "bg-white text-iron-950 hover:bg-mortar-200"
                  }`}
                >
                  Flexible / Estimating
                </button>
              </div>
            </div>

            {/* Numeric Inputs: Total Budget, Labour Estimate, Materials Estimate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-iron-950 mb-1">
                  Estimated Total Budget (ZAR)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={budgetEstimateZar}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  placeholder="2500"
                  className="w-full border-2 border-iron-950 bg-white px-3.5 py-2 font-mono text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-brick-600 shadow-brutal-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase text-iron-950 mb-1">
                  Estimated Labour (ZAR)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={labourEstimateZar}
                  onChange={(e) => handleLabourChange(e.target.value)}
                  placeholder="1600"
                  className="w-full border-2 border-iron-950 bg-white px-3.5 py-2 font-mono text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-brick-600 shadow-brutal-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase text-iron-950 mb-1">
                  Estimated Materials (ZAR)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={materialsEstimateZar}
                  onChange={(e) => handleMaterialsChange(e.target.value)}
                  placeholder="900"
                  className="w-full border-2 border-iron-950 bg-white px-3.5 py-2 font-mono text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-brick-600 shadow-brutal-sm tabular-nums"
                />
              </div>
            </div>

            {/* Calculations and Live Preview Grid */}
            <div className="border-2 border-iron-950 bg-white p-4 space-y-3 rounded-none">
              <div className="font-mono text-xs font-bold uppercase text-iron-950 tracking-wider">
                Live Affordability &amp; Escrow Calculations:
              </div>

              {/* Proportional Split Bar */}
              {parsedLabour + parsedMaterials > 0 && (
                <div className="space-y-1">
                  <div className="h-4 border-2 border-iron-950 flex overflow-hidden rounded-none">
                    <div
                      style={{
                        width: `${Math.round(
                          (parsedLabour / (parsedLabour + parsedMaterials)) * 100
                        )}%`,
                      }}
                      className="bg-brick-600 transition-all duration-150"
                      title="Labour Proportion"
                    />
                    <div
                      style={{
                        width: `${Math.round(
                          (parsedMaterials / (parsedLabour + parsedMaterials)) * 100
                        )}%`,
                      }}
                      className="bg-iron-700 transition-all duration-150"
                      title="Materials Proportion"
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-iron-700">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-brick-600 inline-block" />
                      Labour: {formatZar(parsedLabour)} (
                      {Math.round(
                        (parsedLabour / (parsedLabour + parsedMaterials)) * 100
                      )}
                      %)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-iron-700 inline-block" />
                      Materials: {formatZar(parsedMaterials)} (
                      {Math.round(
                        (parsedMaterials / (parsedLabour + parsedMaterials)) * 100
                      )}
                      %)
                    </span>
                  </div>
                </div>
              )}

              {/* Breakdown Metric Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs">
                <div className="p-2 border border-iron-300 bg-mortar-50">
                  <span className="text-[10px] text-iron-600 block uppercase font-bold">
                    Call-Out Deposit
                  </span>
                  <span className="font-bold text-brick-600 tabular-nums">
                    {formatZar(callOutDepositZar)}
                  </span>
                  <span className="text-[10px] text-iron-500 block">
                    100% credited on hiring
                  </span>
                </div>

                <div className="p-2 border border-iron-300 bg-mortar-50">
                  <span className="text-[10px] text-iron-600 block uppercase font-bold">
                    Remaining Labour Escrow
                  </span>
                  <span className="font-bold text-iron-950 tabular-nums">
                    {formatZar(remainingLabourEscrowZar)}
                  </span>
                  <span className="text-[10px] text-iron-500 block">
                    Held until sign-off
                  </span>
                </div>

                <div className="p-2 border border-iron-300 bg-mortar-50">
                  <span className="text-[10px] text-iron-600 block uppercase font-bold">
                    Buyer Trust Fee (5%)
                  </span>
                  <span className="font-bold text-iron-950 tabular-nums">
                    {formatZar(buyerTrustFeeZar)}
                  </span>
                  <span className="text-[10px] text-iron-500 block">
                    5% of labour (R0 on materials)
                  </span>
                </div>

                <div className="p-2 border border-iron-300 bg-mortar-50">
                  <span className="text-[10px] text-iron-600 block uppercase font-bold">
                    Total Estimated Escrow
                  </span>
                  <span className="font-bold text-brick-600 tabular-nums">
                    {formatZar(grossClientCommitmentZar)}
                  </span>
                  <span className="text-[10px] text-iron-500 block">
                    Gross commitment
                  </span>
                </div>
              </div>

              {/* Anti-Markup Hardware Guarantee Card */}
              <div className="p-3 border-2 border-emerald-800 bg-emerald-50 text-emerald-950 font-mono text-xs space-y-1 rounded-none shadow-brutal-sm">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  Anti-Markup Guarantee: 0% markup on hardware receipts
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  R{callOutDepositZar} call-out deposit credited in full toward labour upon hiring.
                  Zero commission or markup on hardware store receipts (Builders Warehouse, Cashbuild).
                  What the artisan pays at checkout is what you pay.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-iron-950 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="brutal-btn-outline px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="brutal-btn-primary px-6 py-3 text-xs font-black inline-flex items-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? "POSTING..." : "POST JOB"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
