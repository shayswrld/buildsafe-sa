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

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className = "",
}: {
  items?: BreadcrumbItem[];
  className?: string;
}) {
  const pathname = usePathname();

  const breadcrumbItems =
    items ||
    (() => {
      if (!pathname || pathname === "/") return [{ label: "HOME" }];
      const parts = pathname.split("/").filter(Boolean);
      const list: BreadcrumbItem[] = [{ label: "HOME", href: "/" }];
      let acc = "";
      parts.forEach((p, idx) => {
        acc += `/${p}`;
        const isLast = idx === parts.length - 1;
        let label = p.replace(/-/g, " ").toUpperCase();
        if (p === "jobs") label = "JOBS";
        else if (p === "new") label = "POST A JOB";
        else if (p === "worker") label = "WORKER HUB";
        else if (p === "dashboard") label = "DASHBOARD";
        else if (p === "onboarding") label = "SAPS ONBOARDING";
        else if (p === "about") label = "ABOUT US";
        else if (p === "admin") label = "ADMIN CONSOLE";
        else if (parts[0] === "jobs" && idx === 1) {
          label = `JOB #${p.slice(0, 10)}`;
        }
        list.push({ label, href: isLast ? undefined : acc });
      });
      return list;
    })();

  if (pathname === "/" && !items) return null;

  return (
    <nav
      aria-label="Breadcrumbs"
      className={`text-xs font-mono uppercase tracking-widest text-iron-700 flex items-center flex-wrap gap-1.5 ${className}`}
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
  const { config, personas, currentUser, setCurrentUserId } = usePersona();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isJobs =
    pathname === "/jobs" ||
    (pathname?.startsWith("/jobs/") && pathname !== "/jobs/new");
  const isPostJob = pathname === "/jobs/new";
  const isWorker = pathname?.startsWith("/worker");
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
                {config.platformName ? "BUILDSAFE" : "BUILDSAFE"}
              </span>
              <span className="bg-iron-950 text-mortar-100 px-1 py-0.5 text-[10px] font-mono font-bold tracking-wider border border-iron-950">
                ZA
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links with Brutalist Borders & Active Indicators */}
        <nav
          className="hidden md:flex items-center gap-2"
          aria-label="Primary Navigation"
        >
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
            href="/worker/dashboard"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
              isWorker
                ? "bg-iron-950 text-white shadow-none"
                : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Worker Hub</span>
          </Link>

          <Link
            href="/admin"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 ${
              isAdmin
                ? "bg-iron-950 text-white shadow-none"
                : "bg-white text-iron-950 shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

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
                    ? `Homeowner (${p.suburb})`
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

          {/* Mobile Menu Button */}
          <button
            type="button"
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

            <Link
              href="/jobs/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 border-2 border-iron-950 bg-brick-600 text-white text-xs font-mono font-bold uppercase tracking-wider"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Job</span>
            </Link>

            <Link
              href="/worker/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                isWorker ? "bg-iron-950 text-white" : "bg-white text-iron-950"
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>Worker Hub</span>
            </Link>

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-iron-950 text-xs font-mono font-bold uppercase tracking-wider ${
                isAdmin ? "bg-iron-950 text-white" : "bg-white text-iron-950"
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Admin</span>
            </Link>

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
