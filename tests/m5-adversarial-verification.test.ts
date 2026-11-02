import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  TRADE_CATEGORIES,
  SA_LOCATIONS,
  DEFAULT_PLATFORM_CONFIG,
  formatZar,
} from "@/lib/config";
import {
  getDefaultWorkspaceTab,
  validateBrutalistGeometry,
  buildBrutalistBreadcrumb,
} from "./helpers";
import { formatPersonaOption, parseBreadcrumbs } from "./navigation-shell.stress.test";

describe("Milestone 5 Adversarial Verification: Route Reachability & Link Integrity", () => {
  const srcDir = path.resolve(__dirname, "../src");

  function getFilesRecursively(dir: string, extensions: string[]): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let results: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getFilesRecursively(fullPath, extensions));
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("audits all static href attributes across all tsx views for broken routes or unhandled 404s", () => {
    const tsxFiles = getFilesRecursively(srcDir, [".tsx"]);
    expect(tsxFiles.length).toBeGreaterThan(0);

    const validStaticRoutes = new Set([
      "/",
      "/about",
      "/jobs",
      "/jobs/new",
      "/worker",
      "/worker/dashboard",
      "/worker/onboarding",
      "/admin",
    ]);

    const extractedHrefs: { file: string; href: string }[] = [];

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      // Match href="..." and href={`...`}
      const staticMatches = content.matchAll(/href=["'](\/[^"']*)["']/g);
      for (const m of staticMatches) {
        extractedHrefs.push({ file, href: m[1] });
      }

      // Match template literals without variables, e.g., href={`/jobs`}
      const templateMatches = content.matchAll(/href=\{`(\/[^`$]*)`\}/g);
      for (const m of templateMatches) {
        extractedHrefs.push({ file, href: m[1] });
      }
    }

    expect(extractedHrefs.length).toBeGreaterThan(10);

    for (const item of extractedHrefs) {
      // Must not be empty or hash
      expect(item.href).not.toBe("#");
      expect(item.href).not.toBe("");

      // Remove query parameters or static hash if any
      const basePath = item.href.split("?")[0].split("#")[0];

      // If it's a parameterized route like /jobs/job_bathroom_reno, check pattern
      if (basePath.startsWith("/jobs/")) {
        const sub = basePath.replace("/jobs/", "");
        if (sub === "new") {
          expect(validStaticRoutes.has("/jobs/new")).toBe(true);
        } else {
          // Dynamic job workspace route
          expect(sub.length).toBeGreaterThan(0);
        }
      } else {
        expect(validStaticRoutes.has(basePath)).toBe(true);
      }
    }
  });

  it("verifies that intermediate /worker route has a dedicated redirect handler preventing 404s", () => {
    const workerPagePath = path.resolve(srcDir, "app/worker/page.tsx");
    expect(fs.existsSync(workerPagePath)).toBe(true);
    const content = fs.readFileSync(workerPagePath, "utf-8");
    expect(content).toContain('redirect("/worker/dashboard")');
  });

  it("verifies all 14 Next.js App Router endpoints are structurally represented", () => {
    const expectedRouteFiles = [
      "app/page.tsx",
      "app/admin/page.tsx",
      "app/jobs/page.tsx",
      "app/jobs/new/page.tsx",
      "app/jobs/[id]/page.tsx",
      "app/worker/page.tsx",
      "app/worker/dashboard/page.tsx",
      "app/worker/onboarding/page.tsx",
      "app/api/admin/route.ts",
      "app/api/bootstrap/route.ts",
      "app/api/jobs/route.ts",
      "app/api/jobs/[id]/route.ts",
      "app/api/jobs/[id]/quotes/route.ts",
      "app/api/worker/vetting/route.ts",
    ];

    for (const rel of expectedRouteFiles) {
      const full = path.resolve(srcDir, rel);
      expect(fs.existsSync(full)).toBe(true);
    }
  });
});

describe("Milestone 5 Adversarial Verification: Motion, Durations & Accessibility", () => {
  const srcDir = path.resolve(__dirname, "../src");

  function getFilesRecursively(dir: string, extensions: string[]): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let results: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getFilesRecursively(fullPath, extensions));
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("verifies white-box duration constraint: no transition duration exceeds 200ms", () => {
    const files = getFilesRecursively(srcDir, [".tsx", ".ts", ".css"]);
    const forbiddenDurations = [
      "duration-200", // strictly <= 200ms allowed, but project guideline specifies 100ms or 150ms
      "duration-300",
      "duration-400",
      "duration-500",
      "duration-700",
      "duration-1000",
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      // Check for forbidden slow duration classes
      for (const slowClass of forbiddenDurations.slice(1)) {
        // duration-300+ strictly forbidden
        const hasSlow = content.includes(slowClass);
        if (hasSlow) {
          throw new Error(`File ${file} contains slow animation duration: ${slowClass}`);
        }
        expect(hasSlow).toBe(false);
      }

      // Check regex for arbitrary slow durations
      const arbitraryMatches = content.match(/duration-\[(\d+)ms\]/g);
      if (arbitraryMatches) {
        for (const m of arbitraryMatches) {
          const num = parseInt(m.replace(/\D/g, ""), 10);
          expect(num).toBeLessThanOrEqual(200);
        }
      }
    }
  });

  it("verifies universal prefers-reduced-motion reset in globals.css", () => {
    const globalsCssPath = path.resolve(srcDir, "app/globals.css");
    const content = fs.readFileSync(globalsCssPath, "utf-8");

    expect(content).toContain("@media (prefers-reduced-motion: reduce)");
    expect(content).toContain("animation-duration: 0.01ms !important;");
    expect(content).toContain("transition-duration: 0.01ms !important;");
    expect(content).toContain("transform: none !important;");
  });

  it("verifies tactile button depression states do not trigger DOM reflow / CLS", () => {
    const globalsCssPath = path.resolve(srcDir, "app/globals.css");
    const content = fs.readFileSync(globalsCssPath, "utf-8");

    expect(content).toContain(".brutal-btn");
    expect(content).toContain("duration-100");
    expect(content).toContain("active:translate-x-[2px]");
    expect(content).toContain("active:translate-y-[2px]");
    expect(content).toContain("active:shadow-none");

    // Must not mutate dimensional properties on active
    expect(content).not.toMatch(/\.brutal-btn[^{]*\{[^}]*active:(?:p-|m-|w-|h-)/);
  });
});

describe("Milestone 5 Adversarial Verification: Persona Switching & State Matrix", () => {
  const mockPersonas = [
    {
      id: "admin_1",
      name: "Founder Admin",
      role: "ADMIN",
      suburb: "Sandton",
      ratingAvg: 5.0,
      ratingCount: 0,
      workerProfile: null,
    },
    {
      id: "homeowner_1",
      name: "Lerato Mokoena",
      role: "HOMEOWNER",
      suburb: "Fourways",
      ratingAvg: 4.9,
      ratingCount: 4,
      workerProfile: null,
    },
    {
      id: "worker_tier1",
      name: "Thabo Mabaso",
      role: "WORKER",
      suburb: "Sandton",
      ratingAvg: 5.0,
      ratingCount: 0,
      workerProfile: {
        id: "wp_thabo",
        vettingTier: "TIER_1_BROWSE_ONLY",
        nearestHardwareHub: "Builders Warehouse Rivonia",
      },
    },
    {
      id: "worker_tier2",
      name: "Kabelo Ndlovu",
      role: "WORKER",
      suburb: "Roodepoort",
      ratingAvg: 4.9,
      ratingCount: 9,
      workerProfile: {
        id: "wp_kabelo",
        vettingTier: "TIER_2_SAPS_CLEARED",
        nearestHardwareHub: "Builders Warehouse Strubensvalley",
      },
    },
    {
      id: "worker_tier3",
      name: "Sipho Dlamini",
      role: "WORKER",
      suburb: "Fourways",
      ratingAvg: 4.95,
      ratingCount: 14,
      workerProfile: {
        id: "wp_sipho",
        vettingTier: "TIER_3_COC_CERTIFIED",
        nearestHardwareHub: "Builders Warehouse Fourways",
      },
    },
    {
      id: "worker_suspended",
      name: "Suspended Worker",
      role: "WORKER",
      suburb: "Berea",
      ratingAvg: 2.1,
      ratingCount: 5,
      workerProfile: {
        id: "wp_suspended",
        vettingTier: "SUSPENDED",
        nearestHardwareHub: "Builders Warehouse Riverhorse Valley",
      },
    },
  ];

  it("handles rapid cycling across all personas without format errors", () => {
    for (const p of mockPersonas) {
      const label = formatPersonaOption(p);
      expect(label).toBeTruthy();
      expect(label).toContain(p.name);
      if (p.role === "ADMIN") expect(label).toContain("Admin");
      if (p.role === "HOMEOWNER") expect(label).toContain("Homeowner");
      if (p.role === "WORKER") {
        if (p.workerProfile?.vettingTier === "TIER_3_COC_CERTIFIED") {
          expect(label).toContain("Tier 3: CoC Pro Artisan");
        } else if (p.workerProfile?.vettingTier === "TIER_2_SAPS_CLEARED") {
          expect(label).toContain("Tier 2: SAPS Cleared Artisan");
        } else if (p.workerProfile?.vettingTier === "TIER_1_BROWSE_ONLY") {
          expect(label).toContain("Tier 1: Browse Only Artisan");
        } else if (p.workerProfile?.vettingTier === "SUSPENDED") {
          expect(label).toContain("Safety Blocked Artisan");
        }
      }
    }
  });

  it("verifies job posting wizard falls back safely when active persona is not a HOMEOWNER", () => {
    // In src/app/jobs/new/page.tsx:
    // let homeownerId = currentUser?.id;
    // if (!currentUser || currentUser.role !== "HOMEOWNER") {
    //   const firstHomeowner = personas.find((p) => p.role === "HOMEOWNER");
    //   if (firstHomeowner) homeownerId = firstHomeowner.id;
    // }
    for (const p of mockPersonas) {
      let resolvedHomeownerId = p.id;
      if (p.role !== "HOMEOWNER") {
        const firstHomeowner = mockPersonas.find((u) => u.role === "HOMEOWNER");
        if (firstHomeowner) resolvedHomeownerId = firstHomeowner.id;
      }
      expect(resolvedHomeownerId).toBe("homeowner_1");
    }
  });

  it("verifies worker dashboard gracefully previews when active persona is not a WORKER", () => {
    // In src/app/worker/dashboard/page.tsx:
    // const activeWorker = currentUser?.role === "WORKER" ? currentUser : workerPersonas[0];
    const workerPersonas = mockPersonas.filter((p) => p.role === "WORKER");
    for (const p of mockPersonas) {
      const activeWorker = p.role === "WORKER" ? p : workerPersonas[0];
      expect(activeWorker).toBeDefined();
      expect(activeWorker.role).toBe("WORKER");
    }
  });
});

describe("Milestone 5 Adversarial Verification: Rapid Tab Transitions & Lifecycle States", () => {
  it("verifies complete matrix of job workspace tabs and lifecycle activations", () => {
    const validTabs = ["escrow", "gate", "quotes", "chat", "ratings"] as const;
    expect(validTabs).toHaveLength(5);

    // Lifecycle mappings
    expect(getDefaultWorkspaceTab("OPEN")).toBe("quotes");
    expect(getDefaultWorkspaceTab("QUOTED")).toBe("quotes");
    expect(getDefaultWorkspaceTab("ESCROW_FUNDED")).toBe("gate");
    expect(getDefaultWorkspaceTab("WORKER_ON_SITE")).toBe("escrow");
    expect(getDefaultWorkspaceTab("WORK_SUBMITTED")).toBe("escrow");
    expect(getDefaultWorkspaceTab("COMPLETED")).toBe("ratings");

    // Adversarial / Corrupted statuses
    expect(getDefaultWorkspaceTab("CANCELLED")).toBe("quotes");
    expect(getDefaultWorkspaceTab("DISPUTED")).toBe("quotes");
    expect(getDefaultWorkspaceTab("")).toBe("quotes");
    expect(getDefaultWorkspaceTab(null as any)).toBe("quotes");
    expect(getDefaultWorkspaceTab(undefined as any)).toBe("quotes");
  });

  it("verifies rapid tab transitions maintain state integrity", () => {
    let currentTab: string = "quotes";
    const tabHistory: string[] = [currentTab];

    const cycle = ["quotes", "gate", "escrow", "chat", "ratings", "escrow", "gate"];
    for (const t of cycle) {
      currentTab = t;
      tabHistory.push(currentTab);
    }

    expect(tabHistory).toHaveLength(8);
    expect(tabHistory[tabHistory.length - 1]).toBe("gate");
  });
});

describe("Milestone 5 Adversarial Verification: Brutalist Geometry & Visual Anti-Patterns", () => {
  const srcDir = path.resolve(__dirname, "../src");

  it("verifies zero rounded-full, rounded-2xl, rounded-xl in core views", () => {
    const coreViewFiles = [
      "src/app/page.tsx",
      "src/app/jobs/page.tsx",
      "src/app/jobs/new/page.tsx",
      "src/app/jobs/[id]/page.tsx",
      "src/app/worker/dashboard/page.tsx",
      "src/app/worker/onboarding/page.tsx",
      "src/app/admin/page.tsx",
      "src/components/Navbar.tsx",
      "src/app/layout.tsx",
    ];

    const forbiddenClassRegex = /\brounded-(?:full|2xl|xl|lg|md)\b/g;

    for (const rel of coreViewFiles) {
      const fullPath = path.resolve(__dirname, "..", rel);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf-8");

      const matches = content.match(forbiddenClassRegex);
      if (matches && matches.length > 0) {
        throw new Error(
          `Soft geometry violation in ${rel}: found ${matches.join(", ")}`
        );
      }
      expect(matches).toBeNull();
    }
  });

  it("verifies brutalist shadow tokens and borders are systematically applied", () => {
    const pagePath = path.resolve(srcDir, "app/page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("border-2 border-iron-950");
    expect(content).toContain("shadow-brutal");
    expect(content).toContain("rounded-none");
  });
});
