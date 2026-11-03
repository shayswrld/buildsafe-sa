"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Hammer,
  PlusCircle,
  Landmark,
  Star,
  Wallet,
  Menu,
  X,
  Info,
  Home,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";
import { formatZar } from "@/lib/config";

function tierBadgeLabel(tier?: string) {
  if (tier === "TIER_3_COC_CERTIFIED") return "Tier 3: CoC Pro";
  if (tier === "TIER_2_SAPS_CLEARED") return "Tier 2: SAPS Cleared";
  if (tier === "TIER_1_BROWSE_ONLY") return "Tier 1: Browse Only";
  if (tier === "SUSPENDED") return "Safety Blocked";
  return "";
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  jobs: "JOBS",
  new: "POST A JOB",
  worker: "WORKER HUB",
  client: "CLIENT HUB",
  dashboard: "DASHBOARD",
  onboarding: "SAPS ONBOARDING",
  about: "ABOUT US",
  admin: "ADMIN CONSOLE",
  login: "SIGN IN",
  signup: "REGISTER",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  const breadcrumbItems = (() => {
    if (!pathname || pathname === "/") return [{ label: "HOME" }];
    const parts = pathname.split("/").filter(Boolean);
    const list: BreadcrumbItem[] = [{ label: "HOME", href: "/" }];
    let acc = "";
    parts.forEach((p, idx) => {
      acc += `/${p}`;
      const isLast = idx === parts.length - 1;
      const label =
        ROUTE_LABELS[p] ??
        (parts[0] === "jobs" && idx === 1
          ? `JOB #${p.slice(0, 10)}`
          : p.replace(/-/g, " ").toUpperCase());
      list.push({ label, href: isLast ? undefined : acc });
    });
    return list;
  })();

  if (pathname === "/") return null;

  return (
    <nav
      aria-label="Breadcrumbs"
      className="text-xs font-mono uppercase tracking-widest text-iron-700 flex items-center flex-wrap gap-1.5"
    >
      {breadcrumbItems.map((item, i) => {
        const isLast = i === breadcrumbItems.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-brick-600 font-bold">/</span>}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-brick-600 hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-bold text-iron-950" : ""}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const {
    config,
    personas,
    currentUser,
    setCurrentUserId,
    activeRole,
    isDualRole,
    toggleRole,
    logout,
  } = usePersona();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isJobs =
    pathname === "/jobs" ||
    (pathname?.startsWith("/jobs/") && pathname !== "/jobs/new");
  const isPostJob = pathname === "/jobs/new";
  const isWorkerDashboard = pathname === "/worker" || pathname === "/worker/dashboard";
  const isWorkerOnboarding = pathname === "/worker/onboarding";
  const isClientDashboard = pathname === "/client" || pathname === "/client/dashboard";
  const isAdmin = pathname === "/admin";
  const isAbout = pathname === "/about";

  return (
    <header className="sticky top-0 z-40 bg-mortar-100 border-b-2 border-iron-950 shadow-sm">
      {/* Consolidated Single Brutalist Header Bar (~56px) */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: Sharp Brutalist Logo with Brick Icon Accent */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
            aria-label="BuildSafe SA Home"
          >
            <div className="w-8 h-8 bg-brick-600 text-white border-2 border-iron-950 shadow-brutal-sm flex items-center justify-center group-hover:bg-brick-700 transition-colors">
              {/* Brick masonry accent */}
              <svg
                className="w-5 h-5 fill-current text-white"
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
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-base tracking-tight text-iron-950 uppercase">
                {config.platformName || "BUILDSAFE"}
              </span>
              <span className="bg-iron-950 text-mortar-100 px-1 py-0.5 text-[10px] font-mono font-bold tracking-wider border border-iron-950">
                ZA
              </span>
            </div>
          </Link>

          {/* Perspective Indicator Badge */}
          {activeRole === "CLIENT" ? (
            <div
              className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 border-2 border-brick-600 bg-brick-50 text-brick-700 font-mono text-[11px] font-black uppercase tracking-wider shadow-brutal-sm"
              title="Operating in Client Perspective: Hire artisans and fund escrow"
            >
              <span className="w-1.5 h-1.5 bg-brick-600 inline-block"></span>
              <span>CLIENT VIEW</span>
            </div>
          ) : activeRole === "BUILDER" ? (
            <div
              className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 border-2 border-safety-600 bg-amber-50 text-iron-950 font-mono text-[11px] font-black uppercase tracking-wider shadow-brutal-sm"
              title="Operating in Builder Perspective: Find jobs, manage CoC & skills"
            >
              <span className="w-1.5 h-1.5 bg-safety-600 inline-block"></span>
              <span>BUILDER VIEW</span>
            </div>
          ) : (
            <div
              className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 border-2 border-iron-950 bg-mortar-200 text-iron-950 font-mono text-[11px] font-black uppercase tracking-wider shadow-brutal-sm"
              title="Operating in Admin Console Perspective"
            >
              <span className="w-1.5 h-1.5 bg-iron-950 inline-block"></span>
              <span>ADMIN VIEW</span>
            </div>
          )}

          {/* Tactile Dual-Role Perspective Toggle Button */}
          {isDualRole && (
            <button
              type="button"
              suppressHydrationWarning
              id="dual-role-toggle-btn"
              onClick={toggleRole}
              aria-label="Toggle between Client and Builder perspective"
              className="inline-flex items-center gap-1 px-2.5 py-1 border-2 border-iron-950 bg-white hover:bg-mortar-200 text-iron-950 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
            >
              <span className="font-bold text-brick-600">⇄</span>
              <span>
                {activeRole === "CLIENT" ? "Switch to Builder" : "Switch to Client"}
              </span>
            </button>
          )}
        </div>

        {/* Center: Desktop Role-Aware Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-2"
          aria-label="Primary Navigation"
        >
          {activeRole === "CLIENT" && (
            <>
              <Link
                href="/client/dashboard"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isClientDashboard
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Client Hub</span>
              </Link>

              <Link
                href="/jobs/new"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isPostJob
                    ? "bg-brick-700 text-white shadow-none translate-x-[1px] translate-y-[1px]"
                    : "bg-brick-600 text-white shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal hover:bg-brick-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Post a Job</span>
              </Link>

              <Link
                href="/jobs"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isJobs
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Browse Trades</span>
              </Link>
            </>
          )}

          {activeRole === "BUILDER" && (
            <>
              <Link
                href="/worker/dashboard"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isWorkerDashboard
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Worker Hub</span>
              </Link>

              <Link
                href="/jobs"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isJobs
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Browse Client Jobs</span>
              </Link>

              <Link
                href="/worker/onboarding"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isWorkerOnboarding
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vetting &amp; CoC</span>
              </Link>
            </>
          )}

          {activeRole === "ADMIN" && (
            <>
              <Link
                href="/admin"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isAdmin
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>

              <Link
                href="/client/dashboard"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isClientDashboard
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Client Hub</span>
              </Link>

              <Link
                href="/worker/dashboard"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isWorkerDashboard
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Worker Hub</span>
              </Link>

              <Link
                href="/jobs"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
                  isJobs
                    ? "bg-iron-950 text-white shadow-none"
                    : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Jobs</span>
              </Link>
            </>
          )}

          <Link
            href="/about"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
              isAbout
                ? "bg-iron-950 text-white shadow-none"
                : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us</span>
          </Link>
        </nav>

        {/* Right: Compact Demo Persona Switcher & Mobile Hamburger */}
        <div className="flex items-center gap-2">
          {/* Persona selector: compact brutalist control */}
          <div className="flex items-center border-2 border-iron-950 bg-white shadow-brutal-sm px-2 py-1 text-xs font-mono">
            <select
              id="persona-select"
              suppressHydrationWarning
              aria-label="Select Active Demo Persona"
              value={currentUser?.id ?? ""}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="bg-transparent text-iron-950 font-bold text-xs font-mono focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[190px] truncate"
            >
              {personas.map((p) => {
                const roleTag =
                  p.role === "ADMIN"
                    ? "Admin"
                    : p.role === "HOMEOWNER"
                    ? `Homeowner (${p.suburb || "General"})`
                    : p.role === "DUAL"
                    ? `Dual: Homeowner & ${tierBadgeLabel(p.workerProfile?.vettingTier)} Artisan`
                    : `${tierBadgeLabel(p.workerProfile?.vettingTier)} Artisan`;
                return (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-white text-iron-950 font-mono text-xs"
                  >
                    {p.name} — {roleTag}
                  </option>
                );
              })}
            </select>
          </div>

          {/* User details badge (rating, wallet) */}
          {currentUser && (
            <div className="hidden xl:flex items-center gap-1.5 border-2 border-iron-950 bg-mortar-200 px-2 py-1 text-xs font-mono font-bold text-iron-950 shadow-brutal-sm">
              {currentUser.ratingCount > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-iron-900"
                  title={`Rating: ${currentUser.ratingAvg.toFixed(1)} (${
                    currentUser.ratingCount
                  } reviews)`}
                >
                  <Star className="w-3 h-3 fill-safety-500 text-safety-600" />
                  <span className="tabular-nums">
                    {currentUser.ratingAvg.toFixed(1)}
                  </span>
                </span>
              )}
              {currentUser.workerProfile && (
                <span className="inline-flex items-center gap-1 text-brick-700 border-l border-iron-950 pl-1.5 font-bold tabular-nums">
                  <Wallet className="w-3 h-3" />
                  {formatZar(currentUser.workerProfile.walletBalanceZar)}
                </span>
              )}
            </div>
          )}

          {/* Auth Action: Sign In / Sign Out */}
          {currentUser ? (
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 border-2 border-iron-950 bg-white hover:bg-mortar-200 text-iron-950 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
              title="Sign Out to Login View"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1 px-2.5 py-1 border-2 border-iron-950 bg-brick-600 hover:bg-brick-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden border-2 border-iron-950 bg-white p-1 shadow-brutal-sm text-iron-950 active:translate-x-[1px] active:translate-y-[1px]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-iron-950 bg-mortar-100 p-4 shadow-brutal">
          <div className="flex flex-col gap-2">
            {/* Mobile Perspective Indicator */}
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-mortar-300">
              <span className="text-[11px] font-mono font-bold uppercase text-iron-700">
                Perspective:
              </span>
              <span className="px-2 py-0.5 border border-iron-950 bg-white font-mono text-xs font-bold uppercase">
                {activeRole} VIEW
              </span>
            </div>

            {/* Mobile Dual-Role Toggle */}
            {isDualRole && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  toggleRole();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 border-2 border-iron-950 bg-white font-mono text-xs font-bold uppercase tracking-wider text-center shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px]"
              >
                ⇄ {activeRole === "CLIENT" ? "Switch to Builder" : "Switch to Client"}
              </button>
            )}

            {/* Mobile Role-Aware Links */}
            {activeRole === "CLIENT" && (
              <>
                <Link
                  href="/client/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isClientDashboard ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Client Hub</span>
                </Link>

                <Link
                  href="/jobs/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-iron-950 bg-brick-600 text-white text-xs font-mono font-bold uppercase tracking-wider"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post a Job</span>
                </Link>

                <Link
                  href="/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isJobs ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Browse Trades</span>
                </Link>
              </>
            )}

            {activeRole === "BUILDER" && (
              <>
                <Link
                  href="/worker/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isWorkerDashboard ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <span>Worker Hub</span>
                </Link>

                <Link
                  href="/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isJobs ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Browse Client Jobs</span>
                </Link>

                <Link
                  href="/worker/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isWorkerOnboarding ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vetting &amp; CoC</span>
                </Link>
              </>
            )}

            {activeRole === "ADMIN" && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isAdmin ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>Admin Console</span>
                </Link>

                <Link
                  href="/client/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isClientDashboard ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Client Hub</span>
                </Link>

                <Link
                  href="/worker/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isWorkerDashboard ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <span>Worker Hub</span>
                </Link>

                <Link
                  href="/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                    isJobs ? "bg-iron-950 text-white" : "bg-white text-iron-950"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Jobs</span>
                </Link>
              </>
            )}

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                isAbout ? "bg-iron-950 text-white" : "bg-white text-iron-950"
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About Us</span>
            </Link>

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-iron-950 bg-mortar-200 text-iron-950 text-xs font-mono font-bold uppercase tracking-wider"
            >
              <LogIn className="w-4 h-4" />
              <span>Switch Persona / Sign In</span>
            </Link>

            {currentUser && (
              <div className="mt-2 pt-2 border-t border-mortar-300 flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-iron-700">{currentUser.name}</span>
                {currentUser.workerProfile && (
                  <span className="text-brick-600 font-bold tabular-nums">
                    {formatZar(currentUser.workerProfile.walletBalanceZar)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Breadcrumb Strip for Subpages */}
      {pathname !== "/" && (
        <div className="bg-mortar-200/90 border-t-2 border-iron-950 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Breadcrumbs />
          </div>
        </div>
      )}
    </header>
  );
}
