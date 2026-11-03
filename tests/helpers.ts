import { computeEscrowSplit } from "@/lib/adapters/escrow";

/**
 * W3C WCAG 2.1 Relative Luminance and Contrast Ratio Calculation
 */
export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Brutalist Design Tokens Contract Specification (Requirement R1)
 */
export const BRICK_THEME_TOKENS = {
  palette: {
    brick: {
      50: "#FDF4F2",
      100: "#FBE6E2",
      600: "#B93815", // Primary Terracotta / Burnt Clay
      700: "#9C2A10", // Active / Hover Pressed Brick
      800: "#7E220C",
    },
    iron: {
      950: "#141416", // Wrought Iron / Structural Obsidian
      900: "#1F2024",
      800: "#2B2D33",
      700: "#4B4E59",
    },
    mortar: {
      50: "#FAF9F6",
      100: "#F8F6F2", // Mortar Chalk / Raw Concrete Canvas
      200: "#EFECE6",
      300: "#E5E1D8",
    },
    pureWhite: "#FFFFFF",
    safetyOchre: "#D97706", // Construction Warning Accent
  },
  geometry: {
    borderRadius: "0px",
    roundedClass: "rounded-none",
    borderWidth: "2px",
    borderColor: "#141416",
  },
  shadows: {
    brutal: "3px 3px 0px 0px #141416",
    brutalSm: "2px 2px 0px 0px #141416",
    brutalBrick: "3px 3px 0px 0px #B93815",
    activeShadow: "0px 0px 0px 0px transparent",
    activeTranslate: "translate(2px, 2px)",
  },
  typography: {
    headerWeight: "900",
    headerTracking: "-0.025em",
    sectionTagPattern: /^\/\/\s\d{2}\s·\s[A-Z0-9\s—]+$/,
    tabularFiguresClass: "tabular-nums",
    monoFontClass: "font-mono",
  },
};

/**
 * Geometric Rule Validator for Brutalist Elements
 */
export function validateBrutalistGeometry(classList: string): {
  compliant: boolean;
  violations: string[];
} {
  const softClasses = [
    "rounded-full",
    "rounded-3xl",
    "rounded-2xl",
    "rounded-xl",
    "rounded-lg",
    "rounded-md",
    "rounded-sm",
  ];
  const softShadows = [
    "shadow-2xl",
    "shadow-xl",
    "shadow-lg",
    "shadow-md",
    "shadow-sm",
  ];

  const tokens = classList.split(/\s+/).filter(Boolean);
  const violations: string[] = [];

  for (const t of tokens) {
    if (softClasses.includes(t)) {
      violations.push(`Forbidden soft rounded class: '${t}' (use 'rounded-none')`);
    }
    if (softShadows.includes(t)) {
      violations.push(`Forbidden diffuse soft shadow: '${t}' (use hard shadow 'shadow-brutal')`);
    }
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * 5-Tab Job Workspace Lifecycle State Machine Contract (Requirement R2 & PROJECT.md)
 */
export type JobWorkspaceTab = "escrow" | "gate" | "quotes" | "chat" | "ratings";

export function getDefaultWorkspaceTab(jobStatus: string | undefined | null): JobWorkspaceTab {
  switch (jobStatus) {
    case "OPEN":
    case "QUOTED":
      return "quotes";
    case "ESCROW_FUNDED":
      return "gate";
    case "WORKER_ON_SITE":
    case "WORK_SUBMITTED":
      return "escrow";
    case "COMPLETED":
      return "ratings";
    default:
      return "quotes";
  }
}

/**
 * 3-Step Job Creation Wizard State Machine Contract
 */
export interface JobWizardState {
  step: 1 | 2 | 3;
  category: string;
  title: string;
  problemTags: string[];
  description: string;
  requiresCoC: boolean;
  suburb: string;
  city: string;
  streetAddress: string;
  urgency: string;
  budgetEstimateZar: number | null;
  callOutDepositZar: number;
}

export function createInitialWizardState(): JobWizardState {
  return {
    step: 1,
    category: "",
    title: "",
    problemTags: [],
    description: "",
    requiresCoC: false,
    suburb: "",
    city: "",
    streetAddress: "",
    urgency: "THIS_WEEK",
    budgetEstimateZar: null,
    callOutDepositZar: 250,
  };
}

export function validateWizardStepTransition(
  state: JobWizardState,
  targetStep: number
): { allowed: boolean; reason?: string } {
  if (targetStep < 1 || targetStep > 3) {
    return { allowed: false, reason: "Step index out of range (1-3)" };
  }
  // Backwards navigation is always permitted
  if (targetStep < state.step) {
    return { allowed: true };
  }
  // Step 1 -> Step 2 requires category selection
  if (targetStep >= 2 && !state.category) {
    return { allowed: false, reason: "Must select a trade category in Step 1" };
  }
  // Step 2 -> Step 3 requires title and description
  if (targetStep === 3) {
    if (!state.title.trim()) {
      return { allowed: false, reason: "Must provide a job title in Step 2" };
    }
    if (!state.description.trim()) {
      return { allowed: false, reason: "Must describe the scope in Step 2" };
    }
  }
  return { allowed: true };
}

/**
 * Standardized Brutalist Breadcrumb Generator Contract
 */
export function buildBrutalistBreadcrumb(segments: string[]): string {
  const normalized = segments.map((s) => s.trim().toUpperCase()).filter(Boolean);
  return normalized.join(" / ");
}

/**
 * Purposeful Animations & Mechanical Micro-Interactions Contract (Requirement R3)
 */
export const ANIMATION_TOKENS = {
  buttonPress: {
    durationMs: 100,
    durationClass: "duration-100",
    easing: "ease-out",
    activeTranslate: "active:translate-x-[2px] active:translate-y-[2px]",
    activeShadow: "active:shadow-none",
  },
  accordionDisclosure: {
    durationMs: 150,
    durationClass: "duration-150",
    easing: "ease-in-out",
  },
  tabSwitch: {
    durationMs: 150,
    durationClass: "duration-150",
    easing: "ease-out",
  },
  proportionalBar: {
    durationMs: 150,
    transitionClass: "transition-all duration-150 ease-out",
  },
  verifiedStamp: {
    durationMs: 150,
    rotationDeg: -12,
    stampClasses: "transform -rotate-12 scale-100 transition-transform duration-150 ease-out",
  },
  accessibility: {
    reducedMotionClasses: "motion-reduce:transition-none motion-reduce:transform-none",
    maxAllowedDurationMs: 200, // Brutalist constraint: no sluggish animations >200ms
  },
};

/**
 * Escrow Proportional Visual Bar Segment Calculator
 */
export function calculateEscrowProportions(labourZar: number, materialsZar: number) {
  const safeLabour = Math.max(0, isNaN(labourZar) ? 0 : labourZar);
  const safeMaterials = Math.max(0, isNaN(materialsZar) ? 0 : materialsZar);

  const split = computeEscrowSplit({
    labourZar: safeLabour,
    materialsZar: safeMaterials,
  });

  const total = split.grossBuyerPaidZar;
  if (total <= 0) {
    return {
      labourPct: 0,
      materialsPct: 0,
      feePct: 0,
      totalZar: 0,
      split,
    };
  }

  const labourPct = Number(((safeLabour / total) * 100).toFixed(1));
  const materialsPct = Number(((safeMaterials / total) * 100).toFixed(1));
  const feePct = Number(((split.buyerTrustFeeZar / total) * 100).toFixed(1));

  return {
    labourPct,
    materialsPct,
    feePct,
    totalZar: total,
    split,
  };
}

import {
  PersonaRole,
  PersonaUserDTO,
  WorkerProfileDTO,
} from "@/components/PersonaContext";
import { DEFAULT_PLATFORM_CONFIG, TRADE_CATEGORIES } from "@/lib/config";

/**
 * Lightweight Mock Session & Persona State Machine Implementation
 * Adheres strictly to PersonaContext Contract in PROJECT.md
 */
export interface RegisterUserData {
  name: string;
  phone: string;
  email?: string;
  role: "CLIENT" | "BUILDER" | "DUAL_ROLE";
  suburb: string;
  city: string;
  saIdNumber?: string;
  selfieConfirmed?: boolean;
  trades?: string[];
}

export class MockPersonaSessionManager {
  private storage: Map<string, string> = new Map();
  public personas: PersonaUserDTO[] = [];
  public currentUser: PersonaUserDTO | null = null;
  public activeRole: PersonaRole = "CLIENT";
  public availableRoles: PersonaRole[] = ["CLIENT"];
  public isDualRole: boolean = false;

  // Storage key contracts from PROJECT.md
  public static readonly STORAGE_PERSONA_ID_KEY = "buildsafe_active_persona_id";
  public static readonly STORAGE_ACTIVE_ROLE_KEY = "buildsafe_active_role";

  constructor(initialPersonas?: PersonaUserDTO[]) {
    if (initialPersonas) {
      this.personas = [...initialPersonas];
    } else {
      this.personas = this.createDefaultSeedPersonas();
    }
  }

  private createDefaultSeedPersonas(): PersonaUserDTO[] {
    const builderProfile: WorkerProfileDTO = {
      id: "worker_sipho_profile",
      userId: "user_worker_sipho",
      vettingTier: "TIER_2_SAPS_CLEARED",
      saIdMasked: "850101 **** 088",
      citizenshipStatus: "SA_CITIZEN",
      selfieVerified: true,
      popiaConsentSigned: true,
      huruFeePaid: true,
      sapsStatus: "CLEARED",
      tradesJson: JSON.stringify(["PLUMBING", "TILING"]),
      nearestHardwareHub: "Builders Warehouse Fourways",
      yearsExperience: 8,
      bio: "Certified plumber and master tiler.",
      walletBalanceZar: 4200,
      totalPaidOutZar: 18500,
      completedJobsCount: 14,
      certifications: [],
    };

    const dualProfile: WorkerProfileDTO = {
      id: "worker_dual_thabo_profile",
      userId: "user_dual_thabo",
      vettingTier: "TIER_3_COC_CERTIFIED",
      saIdMasked: "880512 **** 081",
      citizenshipStatus: "SA_CITIZEN",
      selfieVerified: true,
      popiaConsentSigned: true,
      huruFeePaid: true,
      sapsStatus: "CLEARED",
      tradesJson: JSON.stringify(["ELECTRICAL", "BUILDING"]),
      nearestHardwareHub: "Builders Express Midrand",
      yearsExperience: 10,
      bio: "Registered contractor & electrical artisan.",
      walletBalanceZar: 9500,
      totalPaidOutZar: 45000,
      completedJobsCount: 22,
      certifications: [
        {
          id: "cert_wireman_1",
          body: "ECB_WIREMAN",
          registrationNumber: "DoEL-IE-98214",
          tradeCategory: "ELECTRICAL",
          status: "VERIFIED",
        },
      ],
    };

    return [
      {
        id: "user_homeowner_lerato",
        name: "Lerato Khumalo",
        phone: "082 123 4567",
        role: "HOMEOWNER",
        suburb: "Fourways",
        city: "Johannesburg",
        ratingAvg: 4.9,
        ratingCount: 18,
        workerProfile: null,
        isDualRole: false,
      },
      {
        id: "user_worker_sipho",
        name: "Sipho Dlamini",
        phone: "072 987 6543",
        role: "WORKER",
        suburb: "Diepsloot West",
        city: "Johannesburg",
        ratingAvg: 4.85,
        ratingCount: 32,
        workerProfile: builderProfile,
        isDualRole: false,
      },
      {
        id: "user_dual_thabo",
        name: "Thabo Molefe",
        phone: "083 456 7890",
        role: "DUAL",
        suburb: "Midrand",
        city: "Johannesburg",
        ratingAvg: 5.0,
        ratingCount: 12,
        workerProfile: dualProfile,
        isDualRole: true,
      },
      {
        id: "user_admin_kgosi",
        name: "Kgosi Modise",
        phone: "011 555 0199",
        role: "ADMIN",
        suburb: "Sandton",
        city: "Johannesburg",
        ratingAvg: 5.0,
        ratingCount: 100,
        workerProfile: null,
        isDualRole: false,
      },
    ];
  }

  // Session storage simulation
  public setStorageItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  public getStorageItem(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  public removeStorageItem(key: string): void {
    this.storage.delete(key);
  }

  public hydrateFromStorage(): void {
    const savedUserId = this.getStorageItem(MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY);
    const savedRole = this.getStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY) as PersonaRole | null;

    if (savedUserId) {
      const matched = this.personas.find((p) => p.id === savedUserId);
      if (matched) {
        this.login(matched.id, savedRole ?? undefined);
        return;
      }
    }

    if (this.personas.length > 0 && !this.currentUser) {
      this.login(this.personas[0].id);
    }
  }

  public login(userId: string, targetRole?: PersonaRole): { success: boolean; user?: PersonaUserDTO; error?: string } {
    const user = this.personas.find((p) => p.id === userId || p.phone === userId);
    if (!user) {
      return { success: false, error: "User not found in persona registry" };
    }

    this.currentUser = user;
    this.isDualRole = user.role === "DUAL" || Boolean(user.isDualRole);

    if (this.isDualRole) {
      this.availableRoles = ["CLIENT", "BUILDER"];
    } else if (user.role === "WORKER" || Boolean(user.workerProfile)) {
      this.availableRoles = ["BUILDER"];
    } else if (user.role === "ADMIN") {
      this.availableRoles = ["ADMIN"];
    } else {
      this.availableRoles = ["CLIENT"];
    }

    if (targetRole && this.availableRoles.includes(targetRole)) {
      this.activeRole = targetRole;
    } else if (this.availableRoles.includes("CLIENT")) {
      this.activeRole = "CLIENT";
    } else if (this.availableRoles.includes("BUILDER")) {
      this.activeRole = "BUILDER";
    } else {
      this.activeRole = this.availableRoles[0] || "CLIENT";
    }

    this.setStorageItem(MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY, user.id);
    this.setStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY, this.activeRole);

    return { success: true, user: this.currentUser };
  }

  public logout(): void {
    this.currentUser = null;
    this.activeRole = "CLIENT";
    this.availableRoles = ["CLIENT"];
    this.isDualRole = false;
    this.removeStorageItem(MockPersonaSessionManager.STORAGE_PERSONA_ID_KEY);
    this.removeStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY);
  }

  public register(data: RegisterUserData): { user: PersonaUserDTO; redirectRoute: string } {
    const isDual = data.role === "DUAL_ROLE";
    const isBuilder = data.role === "BUILDER" || isDual;

    let workerProfile: WorkerProfileDTO | null = null;
    if (isBuilder) {
      workerProfile = {
        id: `worker_${Date.now()}`,
        userId: `user_${Date.now()}`,
        vettingTier: "TIER_1_BROWSE_ONLY",
        saIdMasked: data.saIdNumber
          ? `${data.saIdNumber.slice(0, 6)} **** ${data.saIdNumber.slice(-3)}`
          : "890101 **** 080",
        citizenshipStatus: "SA_CITIZEN",
        selfieVerified: Boolean(data.selfieConfirmed),
        popiaConsentSigned: false,
        huruFeePaid: false,
        sapsStatus: "UNSTARTED",
        tradesJson: JSON.stringify(data.trades && data.trades.length > 0 ? data.trades : ["PAINTING"]),
        nearestHardwareHub: "Builders Warehouse Fourways",
        yearsExperience: 3,
        bio: `${data.name} professional profile.`,
        walletBalanceZar: 0,
        totalPaidOutZar: 0,
        completedJobsCount: 0,
        certifications: [],
      };
    }

    const newUser: PersonaUserDTO = {
      id: `user_${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      role: isDual ? "DUAL" : isBuilder ? "WORKER" : "HOMEOWNER",
      suburb: data.suburb.trim(),
      city: data.city.trim(),
      ratingAvg: 5.0,
      ratingCount: 0,
      workerProfile,
      isDualRole: isDual,
    };

    this.personas.push(newUser);
    const initialRole: PersonaRole = isDual ? "CLIENT" : isBuilder ? "BUILDER" : "CLIENT";
    this.login(newUser.id, initialRole);

    const redirectRoute = isDual
      ? "/client/dashboard"
      : isBuilder
      ? "/worker/dashboard"
      : "/client/dashboard";

    return { user: newUser, redirectRoute };
  }

  public toggleRole(): { success: boolean; newRole?: PersonaRole; error?: string } {
    if (!this.currentUser) {
      return { success: false, error: "No active user session" };
    }

    if (!this.isDualRole) {
      if (this.activeRole === "CLIENT" && !this.currentUser.workerProfile) {
        return {
          success: false,
          error: "Single-role client cannot switch to builder perspective without completing builder registration",
        };
      }
      return {
        success: false,
        error: "Single-role account cannot toggle perspective",
      };
    }

    this.activeRole = this.activeRole === "CLIENT" ? "BUILDER" : "CLIENT";
    this.setStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY, this.activeRole);
    return { success: true, newRole: this.activeRole };
  }

  public setActiveRole(targetRole: PersonaRole): { success: boolean; error?: string } {
    if (!this.availableRoles.includes(targetRole)) {
      return {
        success: false,
        error: `Role '${targetRole}' is not permitted for current user profile`,
      };
    }
    this.activeRole = targetRole;
    this.setStorageItem(MockPersonaSessionManager.STORAGE_ACTIVE_ROLE_KEY, targetRole);
    return { success: true };
  }

  public getNavigationShellBadge(): {
    badgeLabel: string;
    toggleButtonLabel: string | null;
    roleColorClass: string;
  } {
    if (this.activeRole === "CLIENT") {
      return {
        badgeLabel: "[ CLIENT VIEW ]",
        toggleButtonLabel: this.isDualRole ? "[ ⇄ Switch to Builder ]" : null,
        roleColorClass: "bg-brick-600 text-white",
      };
    }
    if (this.activeRole === "BUILDER") {
      return {
        badgeLabel: "[ BUILDER VIEW ]",
        toggleButtonLabel: this.isDualRole ? "[ ⇄ Switch to Client ]" : null,
        roleColorClass: "bg-iron-950 text-white",
      };
    }
    return {
      badgeLabel: "[ ADMIN CONSOLE ]",
      toggleButtonLabel: null,
      roleColorClass: "bg-safety text-iron-950",
    };
  }
}

/**
 * Client Portal Dashboard Model & Filtering State Machine
 */
export type ClientJobStatusFilter = "ALL" | "NEEDS_ATTENTION" | "ACTIVE_ON_SITE" | "COMPLETED";

export interface ClientJobSummaryDTO {
  id: string;
  homeownerId: string;
  title: string;
  category: string;
  status: "OPEN" | "QUOTED" | "ESCROW_FUNDED" | "WORKER_ON_SITE" | "WORK_SUBMITTED" | "COMPLETED";
  urgency: string;
  requiresCoC: boolean;
  budgetEstimateZar: number | null;
  callOutDepositZar: number;
  quotesCount: number;
  quotes?: Array<{
    id: string;
    workerProfileId: string;
    artisanName: string;
    vettingTier: string;
    labourAmountZar: number;
    materialsEstimateZar: number;
    ratingAvg: number;
    completedJobsCount: number;
  }>;
  createdAt: string;
}

export function filterClientJobs(
  jobs: ClientJobSummaryDTO[],
  filter: ClientJobStatusFilter,
  homeownerId: string
): ClientJobSummaryDTO[] {
  const clientJobs = jobs.filter((j) => j.homeownerId === homeownerId);

  switch (filter) {
    case "NEEDS_ATTENTION":
      return clientJobs.filter((j) => j.status === "QUOTED" || j.status === "WORK_SUBMITTED");
    case "ACTIVE_ON_SITE":
      return clientJobs.filter((j) => j.status === "ESCROW_FUNDED" || j.status === "WORKER_ON_SITE");
    case "COMPLETED":
      return clientJobs.filter((j) => j.status === "COMPLETED");
    case "ALL":
    default:
      return clientJobs;
  }
}

/**
 * Client Job Creation Budget Affordability Engine
 */
export function calculateJobAffordability(params: {
  tradeCategorySlug: string;
  labourEstimateZar: number;
  materialsEstimateZar?: number;
}) {
  const trade = TRADE_CATEGORIES.find((t) => t.slug === params.tradeCategorySlug) ?? TRADE_CATEGORIES[0];
  const safeLabour = Math.max(0, isNaN(params.labourEstimateZar) ? 0 : params.labourEstimateZar);
  const safeMaterials = Math.max(0, isNaN(params.materialsEstimateZar ?? 0) ? 0 : (params.materialsEstimateZar ?? 0));

  const split = computeEscrowSplit({
    labourZar: safeLabour,
    materialsZar: safeMaterials,
    config: DEFAULT_PLATFORM_CONFIG,
  });

  const callOutDepositZar = trade.defaultCallOutZar;
  const remainingLabourEscrowZar = Math.max(0, safeLabour - callOutDepositZar);

  return {
    tradeCategory: trade.label,
    callOutDepositZar,
    labourEstimateZar: safeLabour,
    materialsEstimateZar: safeMaterials,
    buyerTrustFeeZar: split.buyerTrustFeeZar,
    grossClientCommitmentZar: split.grossBuyerPaidZar,
    remainingLabourEscrowZar,
    materialsMarkupPercent: 0,
    summaryNotes: `R${callOutDepositZar} call-out deposit credited in full toward labour upon hiring. 0% markup on hardware receipts.`,
  };
}

/**
 * Skills & Professional Profile Update Validator
 */
export interface UpdateSkillsPayload {
  workerProfileId: string;
  trades: string[];
  yearsExperience: number;
  bio: string;
  nearestHardwareHub: string;
}

export function validateSkillsUpdate(payload: UpdateSkillsPayload): {
  valid: boolean;
  sanitized?: UpdateSkillsPayload;
  error?: string;
} {
  if (!payload.workerProfileId) {
    return { valid: false, error: "Worker profile ID is required" };
  }
  if (!Array.isArray(payload.trades) || payload.trades.length === 0) {
    return { valid: false, error: "At least one trade category is required" };
  }
  if (typeof payload.yearsExperience !== "number" || payload.yearsExperience < 0) {
    return { valid: false, error: "Years of experience must be a non-negative number" };
  }
  if (!payload.bio || payload.bio.trim().length < 10) {
    return { valid: false, error: "Professional bio must be at least 10 characters long" };
  }
  if (!payload.nearestHardwareHub || payload.nearestHardwareHub.trim().length === 0) {
    return { valid: false, error: "Nearest hardware store / trade hub is required" };
  }

  return {
    valid: true,
    sanitized: {
      workerProfileId: payload.workerProfileId,
      trades: payload.trades.map((t) => t.toUpperCase().trim()),
      yearsExperience: Math.floor(payload.yearsExperience),
      bio: payload.bio.trim(),
      nearestHardwareHub: payload.nearestHardwareHub.trim(),
    },
  };
}

/**
 * Builder Job Browsing Feed Simulator
 */
export interface JobFeedItem {
  id: string;
  category: string;
  title: string;
  suburb: string;
  city: string;
  streetAddressEncrypted?: string;
  urgency: "EMERGENCY_24H" | "THIS_WEEK" | "FLEXIBLE";
  requiresCoC: boolean;
  callOutDepositZar: number;
  budgetEstimateZar: number | null;
  status: "OPEN" | "QUOTED";
}

export function browseJobsForBuilder(
  jobs: JobFeedItem[],
  options: {
    builderTrades?: string[];
    urgencyFilter?: string;
    tradeFilter?: string;
    matchMyTradesOnly?: boolean;
  }
): Array<Omit<JobFeedItem, "streetAddressEncrypted">> {
  let filtered = jobs.filter((j) => j.status === "OPEN" || j.status === "QUOTED");

  if (options.matchMyTradesOnly && options.builderTrades && options.builderTrades.length > 0) {
    filtered = filtered.filter((j) => options.builderTrades!.includes(j.category));
  } else if (options.tradeFilter && options.tradeFilter !== "ALL") {
    filtered = filtered.filter((j) => j.category === options.tradeFilter);
  }

  if (options.urgencyFilter && options.urgencyFilter !== "ALL") {
    filtered = filtered.filter((j) => j.urgency === options.urgencyFilter);
  }

  return filtered.map(({ streetAddressEncrypted, ...safeProps }) => safeProps);
}
