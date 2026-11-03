"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  PlusCircle,
  Menu,
  X,
  Info,
  Home,
  LogOut,
  LogIn,
  User,
  ShieldCheck,
  Hammer,
} from "lucide-react";
import { usePersona } from "@/components/PersonaContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  jobs: "TRADES",
  new: "POST A JOB",
  worker: "WORKER HUB",
  client: "CLIENT HUB",
  dashboard: "DASHBOARD",
  onboarding: "SAPS ONBOARDING",
  about: "ABOUT US",
  admin: "ADMIN CONSOLE",
  login: "SIGN IN",
  signup: "REGISTER",
  profile: "PROFILE SETUP",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  const breadcrumbItems = (() => {
    if (!pathname || pathname === "/" || pathname === "/login" || pathname === "/signup") return [];
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

  if (breadcrumbItems.length === 0) return null;

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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAuthOrLandingPage =
    pathname === "/" || pathname === "/login" || pathname === "/signup";

  const isClientDashboard = pathname === "/client" || pathname === "/client/dashboard";
  const isPostJob = pathname === "/jobs/new";
  const isJobs =
    pathname === "/jobs" || (pathname?.startsWith("/jobs/") && pathname !== "/jobs/new");
  const isAbout = pathname === "/about";

  return (
    <header className="sticky top-0 z-40 bg-mortar-100 border-b-2 border-iron-950 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Identity Lockup */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="BuildSafe SA Home"
          >
            <div className="w-8 h-8 bg-brick-600 text-white border-2 border-iron-950 shadow-brutal-sm flex items-center justify-center group-hover:bg-brick-700 transition-colors">
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
                {config.platformName || "BUILDSAFE SA"}
              </span>
              <span className="bg-iron-950 text-mortar-100 px-1 py-0.5 text-[10px] font-mono font-bold tracking-wider border border-iron-950">
                ZA
              </span>
            </div>
          </Link>

          {/* Perspective Indicator Badge (Only shown when authenticated) */}
          {currentUser && (
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 border border-iron-950 bg-white text-iron-950 font-mono text-[10px] font-bold uppercase tracking-wider">
              <span
                className={`w-1.5 h-1.5 inline-block ${
                  activeRole === "CLIENT"
                    ? "bg-brick-600"
                    : activeRole === "BUILDER"
                    ? "bg-amber-500"
                    : "bg-iron-950"
                }`}
              />
              <span>{activeRole === "CLIENT" ? "CLIENT VIEW" : `${activeRole} VIEW`}</span>
            </div>
          )}

          {/* Optional Dual Role Quick Switcher */}
          {currentUser && isDualRole && (
            <button
              type="button"
              onClick={toggleRole}
              aria-label="Toggle between Client and Builder perspective"
              className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 border border-iron-800 text-xs font-mono font-bold text-iron-800 hover:bg-mortar-200 transition-colors"
            >
              <span className="text-brick-600 font-bold">⇄</span>
              <span>{activeRole === "CLIENT" ? "Switch to Builder" : "Switch to Client"}</span>
            </button>
          )}
        </div>

        {/* Center: Clean Desktop Navigation Links (Clean typography, no 2px boxed button soup) */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
          {currentUser ? (
            /* Authenticated Links (Client-First Persona Focus) */
            <>
              {activeRole === "CLIENT" ? (
                <>
                  <Link
                    href="/client/dashboard"
                    className={`font-mono text-xs font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 py-1 ${
                      isClientDashboard
                        ? "text-brick-600 border-b-2 border-brick-600 font-black"
                        : "text-iron-800 hover:text-brick-600 hover:underline"
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>My Projects</span>
                  </Link>

                  <Link
                    href="/jobs/new"
                    className={`font-mono text-xs font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 py-1 ${
                      isPostJob
                        ? "text-brick-600 border-b-2 border-brick-600 font-black"
                        : "text-iron-800 hover:text-brick-600 hover:underline"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Post a Job</span>
                  </Link>

                  <Link
                    href="/jobs"
                    className={`font-mono text-xs font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 py-1 ${
                      isJobs
                        ? "text-brick-600 border-b-2 border-brick-600 font-black"
                        : "text-iron-800 hover:text-brick-600 hover:underline"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Browse Trades</span>
                  </Link>
                </>
              ) : activeRole === "BUILDER" ? (
                <>
                  <Link
                    href="/worker/dashboard"
                    className="font-mono text-xs font-bold tracking-wider uppercase text-iron-800 hover:text-brick-600 hover:underline inline-flex items-center gap-1.5 py-1"
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>Worker Hub</span>
                  </Link>
                  <Link
                    href="/jobs"
                    className="font-mono text-xs font-bold tracking-wider uppercase text-iron-800 hover:text-brick-600 hover:underline inline-flex items-center gap-1.5 py-1"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Browse Jobs</span>
                  </Link>
                  <Link
                    href="/worker/onboarding"
                    className="font-mono text-xs font-bold tracking-wider uppercase text-iron-800 hover:text-brick-600 hover:underline inline-flex items-center gap-1.5 py-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Vetting &amp; CoC</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/admin"
                  className="font-mono text-xs font-bold tracking-wider uppercase text-iron-800 hover:text-brick-600 hover:underline py-1"
                >
                  Admin Console
                </Link>
              )}

              <Link
                href="/about"
                className={`font-mono text-xs font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1 py-1 ${
                  isAbout
                    ? "text-brick-600 border-b-2 border-brick-600 font-black"
                    : "text-iron-700 hover:text-brick-600 hover:underline"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>About Us</span>
              </Link>
            </>
          ) : (
            /* Unauthenticated Visitor Links: Clean, informative, minimal */
            <>
              <Link
                href="/jobs"
                className={`font-mono text-xs font-bold tracking-wider uppercase transition-colors py-1 ${
                  isJobs
                    ? "text-brick-600 border-b-2 border-brick-600 font-black"
                    : "text-iron-800 hover:text-brick-600 hover:underline"
                }`}
              >
                Browse Trades
              </Link>

              <Link
                href="/about"
                className={`font-mono text-xs font-bold tracking-wider uppercase transition-colors py-1 ${
                  isAbout
                    ? "text-brick-600 border-b-2 border-brick-600 font-black"
                    : "text-iron-800 hover:text-brick-600 hover:underline"
                }`}
              >
                About Us &amp; Guarantees
              </Link>
            </>
          )}
        </nav>

        {/* Right: Authenticated User Dropdown or Clean Auth Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            /* User profile & actions */
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="inline-flex items-center gap-2 border-2 border-iron-950 bg-white px-3 py-1 text-xs font-mono font-bold text-iron-950 shadow-brutal-sm hover:bg-mortar-200 transition-colors"
                aria-expanded={userDropdownOpen}
                aria-label="User Account Menu"
              >
                <User className="w-3.5 h-3.5 text-brick-600" />
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
                <span className="text-[10px] text-iron-600 font-normal">▼</span>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-1 w-52 bg-white border-2 border-iron-950 shadow-brutal py-1.5 z-50 text-xs font-mono"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-iron-200">
                    <p className="font-bold text-iron-950 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-iron-600 uppercase tracking-wider">{currentUser.role} Account</p>
                  </div>

                  {activeRole === "CLIENT" && (
                    <Link
                      href="/client/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-3 py-2 hover:bg-mortar-200 text-iron-900"
                    >
                      Client Hub
                    </Link>
                  )}

                  {/* Persona selector for developer switching */}
                  <div className="px-3 py-1.5 border-t border-iron-200">
                    <span className="text-[10px] text-iron-600 uppercase block mb-1">Switch Persona</span>
                    <select
                      id="persona-select"
                      suppressHydrationWarning
                      aria-label="Select Active Demo Persona"
                      value={currentUser?.id ?? ""}
                      onChange={(e) => setCurrentUserId(e.target.value)}
                      className="w-full bg-mortar-100 border border-iron-400 text-xs font-mono p-1 cursor-pointer"
                    >
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-mortar-200 text-brick-600 font-bold flex items-center gap-2 border-t border-iron-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Quick Navigation CTA */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="brutal-btn-outline px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>

              <Link
                href="/signup"
                className="brutal-btn-primary px-3 py-1.5 text-xs font-bold hidden sm:inline-flex items-center gap-1.5"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}

          {/* Mobile Navigation Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden border-2 border-iron-950 bg-white p-1.5 shadow-brutal-sm text-iron-950 active:translate-x-[1px] active:translate-y-[1px]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-iron-950 bg-mortar-100 p-4 shadow-brutal space-y-3">
          {currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-iron-300">
                <span className="font-mono text-xs font-bold text-iron-950">{currentUser.name}</span>
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-iron-950 bg-white">
                  {activeRole}
                </span>
              </div>

              {activeRole === "CLIENT" && (
                <>
                  <Link
                    href="/client/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-iron-950 bg-white font-mono text-xs font-bold uppercase"
                  >
                    <Home className="w-4 h-4" />
                    <span>My Projects</span>
                  </Link>
                  <Link
                    href="/jobs/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-iron-950 bg-brick-600 text-white font-mono text-xs font-bold uppercase"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post a Job</span>
                  </Link>
                </>
              )}

              <Link
                href="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 border-2 border-iron-950 bg-white font-mono text-xs font-bold uppercase"
              >
                <Briefcase className="w-4 h-4" />
                <span>Browse Trades</span>
              </Link>

              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 border-2 border-iron-950 bg-white font-mono text-xs font-bold uppercase"
              >
                <Info className="w-4 h-4" />
                <span>About Us</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-iron-950 bg-iron-950 text-white font-mono text-xs font-bold uppercase mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-iron-950 bg-brick-600 text-white font-mono text-xs font-bold uppercase"
              >
                <span>[ Sign Up ]</span>
              </Link>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-iron-950 bg-white text-iron-950 font-mono text-xs font-bold uppercase"
              >
                <LogIn className="w-4 h-4" />
                <span>[ Log In ]</span>
              </Link>

              <Link
                href="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 border-2 border-iron-950 bg-mortar-200 font-mono text-xs font-bold uppercase"
              >
                <Briefcase className="w-4 h-4" />
                <span>Browse Public Trades</span>
              </Link>

              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 border-2 border-iron-950 bg-mortar-200 font-mono text-xs font-bold uppercase"
              >
                <Info className="w-4 h-4" />
                <span>About Us</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Global Breadcrumb Strip for Subpages (Never shown on landing / auth pages) */}
      {!isAuthOrLandingPage && (
        <div className="bg-mortar-200/90 border-t-2 border-iron-950 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Breadcrumbs />
          </div>
        </div>
      )}
    </header>
  );
}
export default Navbar;
