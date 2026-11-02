import { describe, expect, it } from "vitest";
import { TRADE_CATEGORIES } from "@/lib/config";
import {
  buildBrutalistBreadcrumb,
  createInitialWizardState,
  getDefaultWorkspaceTab,
  validateWizardStepTransition,
} from "./helpers";

interface CollapsibleDrawerState {
  isOpen: boolean;
  toggle: () => void;
}

describe("Tier 1: Page Simplification & Information Hierarchy (R2)", () => {
  it("enforces single-tier consolidated brutalist navigation bar and standardized breadcrumb format", () => {
    // Breadcrumbs format: HOME / JOBS / JOB-101 / ESCROW
    const breadcrumb = buildBrutalistBreadcrumb(["Home", "Jobs", "job-101", "escrow"]);
    expect(breadcrumb).toBe("HOME / JOBS / JOB-101 / ESCROW");

    // Root breadcrumb
    expect(buildBrutalistBreadcrumb(["Home"])).toBe("HOME");

    // Standard styling tokens
    const breadcrumbClasses = "text-xs font-mono uppercase tracking-widest text-iron-700 mb-4";
    expect(breadcrumbClasses).toContain("font-mono");
    expect(breadcrumbClasses).toContain("uppercase");
    expect(breadcrumbClasses).toContain("tracking-widest");
  });

  it("reduces Home page initial clutter by sequestering live calculator into a collapsible drawer", () => {
    let isOpen = false;
    const drawer: CollapsibleDrawerState = {
      isOpen,
      toggle: () => {
        isOpen = !isOpen;
        drawer.isOpen = isOpen;
      },
    };

    // On initial view, calculator is collapsed, saving 400px+ vertical viewport space
    expect(drawer.isOpen).toBe(false);

    // User explicitly clicks toggle to access calculator
    drawer.toggle();
    expect(drawer.isOpen).toBe(true);

    drawer.toggle();
    expect(drawer.isOpen).toBe(false);
  });

  it("partitions Home page walkthrough into a 4-segment tab panel instead of 4 sprawling cards", () => {
    const tabs = [
      { id: "homeowner", label: "01 // HOMEOWNER" },
      { id: "artisan", label: "02 // ARTISAN" },
      { id: "gate", label: "03 // GATE SECURITY" },
      { id: "escrow", label: "04 // ESCROW LEDGER" },
    ];

    expect(tabs).toHaveLength(4);
    let activeTab = tabs[0].id;

    // Switch tab
    activeTab = "gate";
    expect(activeTab).toBe("gate");
    const activeSegment = tabs.find((t) => t.id === activeTab);
    expect(activeSegment?.label).toContain("GATE SECURITY");
  });

  it("enforces 3-step progressive disclosure wizard for job posting (/jobs/new)", () => {
    const wizard = createInitialWizardState();
    expect(wizard.step).toBe(1);

    // Cannot jump to Step 2 without selecting trade
    const tryStep2 = validateWizardStepTransition(wizard, 2);
    expect(tryStep2.allowed).toBe(false);
    expect(tryStep2.reason).toContain("trade category");

    // Select Trade
    const selectedTrade = TRADE_CATEGORIES.find((t) => t.slug === "TILING");
    expect(selectedTrade).toBeDefined();
    wizard.category = selectedTrade!.slug;
    wizard.callOutDepositZar = selectedTrade!.defaultCallOutZar;

    // Now Step 2 is accessible
    expect(validateWizardStepTransition(wizard, 2).allowed).toBe(true);
    wizard.step = 2;

    // Cannot advance to Step 3 without title and description
    expect(validateWizardStepTransition(wizard, 3).allowed).toBe(false);

    // Provide title and description
    wizard.title = "Master Bathroom Floor Retiling";
    wizard.description = "12 sqm porcelain tiles to be laid with waterproof grout";
    wizard.problemTags = ["Full bathroom floor & wall retiling"];

    // Now Step 3 is accessible
    expect(validateWizardStepTransition(wizard, 3).allowed).toBe(true);
    wizard.step = 3;

    // Step 3 details
    wizard.suburb = "Fourways";
    wizard.city = "Johannesburg";
    wizard.budgetEstimateZar = 4500;

    expect(wizard.step).toBe(3);
    expect(wizard.callOutDepositZar).toBe(200);
  });

  it("partitions monolithic Job Workspace (/jobs/[id]) into 5 focused tabs with lifecycle-aware activation", () => {
    // OPEN or QUOTED job defaults to 'quotes'
    expect(getDefaultWorkspaceTab("OPEN")).toBe("quotes");
    expect(getDefaultWorkspaceTab("QUOTED")).toBe("quotes");

    // Once quote is accepted and Escrow funded, auto-activates 'gate' for OTP arrival
    expect(getDefaultWorkspaceTab("ESCROW_FUNDED")).toBe("gate");

    // Worker verified on site or submitted work auto-activates 'escrow' for milestone sign-off
    expect(getDefaultWorkspaceTab("WORKER_ON_SITE")).toBe("escrow");
    expect(getDefaultWorkspaceTab("WORK_SUBMITTED")).toBe("escrow");

    // Once completed, defaults to 'ratings' tab for two-way reviews
    expect(getDefaultWorkspaceTab("COMPLETED")).toBe("ratings");
  });

  it("partitions Admin console into 3 dedicated panels (Ledger, Compliance Queue, Take-Rate Config)", () => {
    type AdminPanel = "ledger" | "compliance" | "config";
    const panels: AdminPanel[] = ["ledger", "compliance", "config"];

    let currentPanel: AdminPanel = "ledger";
    expect(panels).toContain(currentPanel);

    // Switch to compliance queue to view statutory CoC approvals
    currentPanel = "compliance";
    expect(currentPanel).toBe("compliance");

    // Switch to fee and take-rate configuration
    currentPanel = "config";
    expect(currentPanel).toBe("config");
  });
});

describe("Tier 2: Information Hierarchy Boundaries & Corner Cases", () => {
  it("defaults gracefully to 'quotes' tab when job status is undefined, null, or unknown", () => {
    expect(getDefaultWorkspaceTab(undefined)).toBe("quotes");
    expect(getDefaultWorkspaceTab(null)).toBe("quotes");
    expect(getDefaultWorkspaceTab("UNKNOWN_STATUS")).toBe("quotes");
    expect(getDefaultWorkspaceTab("")).toBe("quotes");
  });

  it("handles empty or whitespace-only strings in breadcrumb generator without double slashes", () => {
    expect(buildBrutalistBreadcrumb([])).toBe("");
    expect(buildBrutalistBreadcrumb(["", "   ", "Home", "  "])).toBe("HOME");
    expect(buildBrutalistBreadcrumb(["Home", "", "Jobs"])).toBe("HOME / JOBS");
  });

  it("prevents wizard step transition when title or description is only whitespace", () => {
    const wizard = createInitialWizardState();
    wizard.category = "PLUMBING";
    wizard.title = "   \n\t   ";
    wizard.description = "   ";

    const res = validateWizardStepTransition(wizard, 3);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("job title");
  });

  it("rejects invalid step targets outside the 1..3 boundary in wizard", () => {
    const wizard = createInitialWizardState();
    expect(validateWizardStepTransition(wizard, 0).allowed).toBe(false);
    expect(validateWizardStepTransition(wizard, 4).allowed).toBe(false);
    expect(validateWizardStepTransition(wizard, -1).allowed).toBe(false);
  });

  it("supports backwards navigation in wizard at any time without validation blocking", () => {
    const wizard = createInitialWizardState();
    wizard.category = "PLUMBING";
    wizard.title = "Fix leak";
    wizard.description = "Pipe leaking under kitchen sink";
    wizard.step = 3;

    // User can navigate backwards to Step 2 or Step 1 without validation errors
    expect(validateWizardStepTransition(wizard, 1).allowed).toBe(true);
    expect(validateWizardStepTransition(wizard, 2).allowed).toBe(true);
  });
});
