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
