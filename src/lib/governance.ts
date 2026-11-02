export interface WorkerGovernanceSnapshot {
  id: string;
  vettingTier: string;
  sapsStatus: string;
  certifications?: {
    tradeCategory: string;
    status: string;
    body: string;
  }[];
  user?: {
    name: string;
  };
}

export interface JobGovernanceSnapshot {
  id: string;
  category: string;
  requiresCoC: boolean;
  status: string;
  homeownerId: string;
  selectedWorkerUserId?: string | null;
}

export interface GovernanceCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Enforces the 3-Tier South African security & statutory CoC rules before any worker
 * (and any accompanying site crew/assistants) can submit a quote or accept a job.
 */
export function validateQuoteEligibility(
  leadWorker: WorkerGovernanceSnapshot,
  job: JobGovernanceSnapshot,
  crewWorkers: WorkerGovernanceSnapshot[] = []
): GovernanceCheckResult {
  if (leadWorker.vettingTier === "SUSPENDED" || leadWorker.sapsStatus === "FLAGGED_RECORD") {
    return {
      allowed: false,
      reason:
        "Safety Block: Accounts with flagged criminal records or safety suspensions cannot quote or message homeowners.",
    };
  }

  if (
    leadWorker.vettingTier === "TIER_1_BROWSE_ONLY" ||
    leadWorker.sapsStatus !== "CLEARED"
  ) {
    return {
      allowed: false,
      reason:
        "Tier 2 SAPS Biometric Clearance Required: Tier 1 profiles can browse local jobs for free, but you must complete your R200 HURU/AFISwitch SAPS criminal record check before quoting or accepting work.",
    };
  }

  if (job.requiresCoC) {
    const hasMatchingCoC =
      leadWorker.vettingTier === "TIER_3_COC_CERTIFIED" &&
      (leadWorker.certifications ?? []).some(
        (c) => c.status === "VERIFIED" && c.tradeCategory === job.category
      );

    if (!hasMatchingCoC) {
      return {
        allowed: false,
        reason: `Statutory CoC Required: This ${job.category.toLowerCase()} job requires a verified Tier 3 Certified Trade Pro (e.g. PIRB / ECB Wireman / NHBRC) to issue a legal Certificate of Compliance.`,
      };
    }
  }

  // Subcontractor / Helper Bait-and-Switch Prevention:
  // Every assistant on the crew manifest MUST also hold an active SAPS criminal clearance!
  for (const crewMember of crewWorkers) {
    if (
      crewMember.vettingTier === "TIER_1_BROWSE_ONLY" ||
      crewMember.vettingTier === "SUSPENDED" ||
      crewMember.sapsStatus !== "CLEARED"
    ) {
      const label = crewMember.user?.name ?? crewMember.id;
      return {
        allowed: false,
        reason: `Crew Safety Block: Accompanying assistant "${label}" has not passed SAPS biometric criminal clearance. Every person entering a homeowner's gate must be SAPS-cleared.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Ensures bidirectional reviews can ONLY be submitted by the actual Homeowner or
 * the booked Worker after verified on-site / completed job progress.
 */
export function validateReviewEligibility(
  job: JobGovernanceSnapshot,
  reviewerUserId: string
): GovernanceCheckResult {
  const isHomeowner = reviewerUserId === job.homeownerId;
  const isAssignedWorker =
    Boolean(job.selectedWorkerUserId) &&
    reviewerUserId === job.selectedWorkerUserId;

  if (!isHomeowner && !isAssignedWorker) {
    return {
      allowed: false,
      reason: "Only the verified homeowner and booked artisan on this job can leave a rating.",
    };
  }

  const eligibleStatuses = ["WORKER_ON_SITE", "WORK_SUBMITTED", "COMPLETED"];
  if (!eligibleStatuses.includes(job.status)) {
    return {
      allowed: false,
      reason:
        "Verified ratings unlock only after an Escrow-backed Gate Check-In or completed milestone.",
    };
  }

  return { allowed: true };
}
