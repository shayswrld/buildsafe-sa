export interface WorkerGovernanceSnapshot {
  id: string;
  vettingTier: string;
  sapsStatus: string;
  sapsExpiresAt?: Date | string | null;
  companyId?: string | null;
  roleInCompany?: string;
  certifications?: {
    tradeCategory: string;
    status: string;
    body: string;
    expiresAt?: Date | string | null;
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

export interface ExistingWorkerIdentitySnapshot {
  id: string;
  saIdHash: string;
  vettingTier: string;
  sapsStatus: string;
  user?: {
    name: string;
  };
}

interface GateArrivalManifestCheckInput {
  faceMatchConfirmed: boolean;
  expectedCrewProfileIds: string[];
  verifiedCrewProfileIds?: string[];
  arrivingHeadcount?: number;
  unannouncedPersonnelPresent?: boolean;
}

/**
 * Checks whether a timestamp (Date or ISO string) is expired relative to `referenceDate`.
 */
function isClearanceExpired(
  expiresAt?: Date | string | null,
  referenceDate: Date = new Date()
): boolean {
  if (!expiresAt) return false;
  const parsed = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < referenceDate.getTime();
}

/**
 * Prevents banned/flagged builders from evading suspension by creating a new account,
 * registering a renovations company, or being added as a crew member under a new phone number.
 */
export function checkSaIdBanEvasion(
  candidateSaIdHash: string,
  existingProfiles: ExistingWorkerIdentitySnapshot[]
): GovernanceCheckResult {
  for (const existing of existingProfiles) {
    if (existing.saIdHash === candidateSaIdHash) {
      if (
        existing.vettingTier === "SUSPENDED" ||
        existing.sapsStatus === "FLAGGED_RECORD"
      ) {
        return {
          allowed: false,
          reason:
            "Permanent Safety Ban: This 13-digit South African ID is linked to a flagged SAPS criminal record or safety suspension and cannot be re-registered or added to any company crew.",
        };
      }

      return {
        allowed: false,
        reason:
          "Duplicate SA ID Blocked: An artisan or crew profile with this 13-digit South African ID is already registered on BuildSafe SA.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Enforces the 3-Tier South African security, expiry & statutory CoC rules before any worker
 * or renovation company (and every accompanying site crew member) can submit a quote or accept a job.
 */
export function validateQuoteEligibility(
  leadWorker: WorkerGovernanceSnapshot,
  job: JobGovernanceSnapshot,
  crewWorkers: WorkerGovernanceSnapshot[] = [],
  referenceDate: Date = new Date()
): GovernanceCheckResult {
  if (
    leadWorker.vettingTier === "SUSPENDED" ||
    leadWorker.sapsStatus === "FLAGGED_RECORD"
  ) {
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

  if (isClearanceExpired(leadWorker.sapsExpiresAt, referenceDate)) {
    return {
      allowed: false,
      reason:
        "SAPS Clearance Expired: Annual AFISwitch biometric criminal re-vetting is required before quoting on new client jobs.",
    };
  }

  if (job.requiresCoC) {
    const matchingCerts = (leadWorker.certifications ?? []).filter(
      (c) => c.status === "VERIFIED" && c.tradeCategory === job.category
    );

    const hasValidCoC =
      leadWorker.vettingTier === "TIER_3_COC_CERTIFIED" &&
      matchingCerts.some((c) => !isClearanceExpired(c.expiresAt, referenceDate));

    if (!hasValidCoC) {
      const hasExpiredOnly =
        matchingCerts.length > 0 &&
        matchingCerts.every((c) => isClearanceExpired(c.expiresAt, referenceDate));

      if (hasExpiredOnly) {
        return {
          allowed: false,
          reason: `Statutory CoC Expired: Your ${job.category.toLowerCase()} trade license has passed its annual expiry date and must be renewed before quoting on CoC jobs.`,
        };
      }

      return {
        allowed: false,
        reason: `Statutory CoC Required: This ${job.category.toLowerCase()} job requires a verified Tier 3 Certified Trade Pro (e.g. PIRB / ECB Wireman / NHBRC) to issue a legal Certificate of Compliance.`,
      };
    }
  }

  // Subcontractor / Renovations Company Bait-and-Switch Prevention:
  // Every single person on the crew manifest MUST individually hold an active, non-expired SAPS clearance!
  for (const crewMember of crewWorkers) {
    const label = crewMember.user?.name ?? crewMember.id;

    if (
      crewMember.vettingTier === "TIER_1_BROWSE_ONLY" ||
      crewMember.vettingTier === "SUSPENDED" ||
      crewMember.sapsStatus !== "CLEARED"
    ) {
      return {
        allowed: false,
        reason: `Crew Safety Block: Accompanying assistant "${label}" has not passed SAPS biometric criminal clearance. Every person entering a homeowner's gate must be individually SAPS-cleared.`,
      };
    }

    if (isClearanceExpired(crewMember.sapsExpiresAt, referenceDate)) {
      return {
        allowed: false,
        reason: `Crew Safety Block: Accompanying assistant "${label}" has an expired SAPS criminal clearance and must complete annual biometric re-vetting before entering a client property.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Enforces that when a builder or renovations company arrives at a client's property:
 * 1. The lead builder's face matches their SAPS badge.
 * 2. Zero unannounced or extra people are present (arriving headcount must equal 1 + expected crew).
 * 3. Every individual crew member arriving is on the pre-vetted Gate Pass manifest.
 */
export function validateGateArrivalManifest(
  input: GateArrivalManifestCheckInput
): GovernanceCheckResult {
  if (!input.faceMatchConfirmed) {
    return {
      allowed: false,
      reason:
        "Please visually confirm that the person at your gate matches the SAPS-cleared photo badge (and registered crew manifest).",
    };
  }

  if (input.unannouncedPersonnelPresent) {
    return {
      allowed: false,
      reason:
        "Gate Safety Block: Unannounced or unvetted personnel detected at gate. Do not open your gate—only pre-registered, SAPS-cleared individuals on your Gate Pass may enter.",
    };
  }

  const expectedTotalHeadcount = 1 + input.expectedCrewProfileIds.length;

  if (
    input.arrivingHeadcount !== undefined &&
    Number(input.arrivingHeadcount) !== expectedTotalHeadcount
  ) {
    return {
      allowed: false,
      reason: `Gate Headcount Mismatch: Expected exactly ${expectedTotalHeadcount} vetted person(s) (1 Lead Builder + ${input.expectedCrewProfileIds.length} Vetted Crew), but ${input.arrivingHeadcount} arrived. Refuse entry to any unvetted or extra personnel.`,
    };
  }

  if (input.verifiedCrewProfileIds !== undefined) {
    const expectedSet = new Set(input.expectedCrewProfileIds);
    const verifiedSet = new Set(input.verifiedCrewProfileIds);

    for (const candidateId of verifiedSet) {
      if (!expectedSet.has(candidateId)) {
        return {
          allowed: false,
          reason: `Gate Crew Substitution Block: Person "${candidateId}" is not on the locked SAPS-cleared Gate Pass manifest for this job.`,
        };
      }
    }

    if (verifiedSet.size !== expectedSet.size) {
      return {
        allowed: false,
        reason:
          "Gate Crew Verification Incomplete: Please confirm the photo and SAPS badge of every accompanying crew member listed on the Gate Pass.",
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
      reason:
        "Only the verified homeowner and booked artisan on this job can leave a rating.",
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
