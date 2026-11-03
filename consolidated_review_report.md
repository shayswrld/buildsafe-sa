# Consolidated Goldfish Review Report: Milestone Vault & Job Guarantee Architecture

**Target Document:** [`docs/designs/milestone_vault_and_job_guarantee.md`](file:///c:/Users/shayl/ai-for-africa/docs/designs/milestone_vault_and_job_guarantee.md)  
**Evaluator Swarm:** `egm-synthesizer` consolidating Stages 5, 6, 7, 8, and 9  
**Review Lenses:** `egm-zoom-out`, `egm-comprehension`, `egm-design`, `egm-structural`, `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`  
**Date:** 2026-11-03  

---

## Executive Summary & Review Verdict

* **Design Existence Verdict**: **APPROVED WITH SUBTRACTIVE SIMPLIFICATION**.
* The core value proposition—replacing alienating "escrow" terminology with a plain-English "Milestone Vault & Job Guarantee", separating 0%-fee hardware store pass-throughs from labour, automating a 48-hour inspection countdown, and protecting artisans via a 72-hour touch-up window—is validated by all review lenses as commercially and legally sound.
* However, the initial draft exhibited architectural bloat and codebase disconnects: proposing 4 redundant database tables instead of evolving existing Prisma models, defining 5 conflicting REST routes instead of modifying the existing action-based route handler, and hallucinating frontend strings.
* Applying the **Subtractive Minimal Essential Architecture** reduces planned code churn by **~68%**, eliminates phantom join tables, and guarantees implementation readiness.

---

## Reviewer Status & Stage Scorecard

| Stage | Reviewer Lens | Focus Domain | Status | Key Contributions |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 5** | `egm-zoom-out` | Simplicity, Minimalism, YAGNI, Reuse | **completed** | Flagged redundant tables; identified existing `computeEscrowSplit` reuse; recommended check-on-read auto-release. |
| **Stage 6** | `egm-comprehension` | Reader Comprehension, Paraphrase, Acronyms | **completed** | Found FSM rectification deadlock; exposed route topology clash; highlighted unstated fee formulas. |
| **Stage 7** | `egm-design`, `structural`, `style` | Antagonistic Feature Spec & Edge Cases | **completed** | Exposed idempotency key collision; flagged missing Gate OTP endpoints; bounded touch-up cycles to 1. |
| **Stage 8** | `egm-zoom-out` | Intermediate Zoom Out & Subtractive Review | **completed** | Pruned overcompensation bloat; formulated Minimal Essential Architecture; cut telecom scope creep. |
| **Stage 9** | `egm-implementation`, `codebase-details` | File Enumeration & Execution Readiness | **completed** | Added `prisma/schema.prisma`; flagged existing 246-line route overwrite hazard; audited exact frontend strings. |

---

## Prioritized Action Items (Consolidated Findings)

### 🔴 Blockers (Must Resolve Before Implementation)

#### B1: Evolve Existing Prisma Schema Instead of Creating 4 Phantom Tables
* **Lenses**: `egm-zoom-out` (Stage 5), `egm-design` (Stage 7), `egm-zoom-out` (Stage 8), `egm-codebase-details` (Stage 9)
* **Finding**: The draft proposed creating brand-new database tables (`job_milestones`, `hardware_materials`, `milestone_proofs`, `cpa_cure_events`) with raw SQL locking (`SELECT ... FOR UPDATE`), while omitting `prisma/schema.prisma` from target files. The existing schema already has `Milestone` and `EscrowTransaction`.
* **Actionable Fix**:
  1. Add `prisma/schema.prisma` (Modify) to Target Files.
  2. Evolve the existing `Milestone` model with 4 lightweight nullable fields: `proofPhotosJson String @default("[]")`, `autoReleaseDeadline DateTime?`, `cureDeadline DateTime?`, and `defectNotes String?`.
  3. Replace raw SQL locks with Prisma atomic interactive transactions (`prisma.$transaction`) with conditional status checks.
  4. Add `npx prisma db push && npx prisma generate` as step 1 in the Verification Plan.

#### B2: Reconcile Routing Architecture: Modify Existing Handler Rather Than Overwriting
* **Lenses**: `egm-comprehension` (Stage 6), `egm-design` (Stage 7), `egm-zoom-out` (Stage 8), `egm-implementation-readiness` (Stage 9)
* **Finding**: Architecture diagrams specified 5 discrete sub-routes (`/fund`, `/submit-proof`, etc.), while Target File 10 listed creating `src/app/api/jobs/[id]/milestones/route.ts`. In reality, that file already exists (246 lines) and handles `CREATE_VARIATION`, `FUND_MILESTONE`, `SUBMIT_WORK`, `RELEASE_ESCROW`, `RAISE_DISPUTE`. Overwriting it breaks variation orders.
* **Actionable Fix**:
  1. Reconcile Section 1 and Section 3 around the existing multiplexed handler `src/app/api/jobs/[id]/milestones/route.ts`.
  2. Change Target File 10 to `(Modify)`.
  3. Preserve `CREATE_VARIATION`. Map new actions cleanly: `FUND_MILESTONE`, `SUBMIT_PROOF`, `APPROVE_PAYOUT`, `REQUEST_TOUCH_UP`, `SUBMIT_RECTIFICATION`.
  4. Handle background auto-release via lazy check-on-read or a dedicated `src/app/api/cron/milestone-auto-release/route.ts`.

#### B3: Eliminate FSM Touch-Up Rectification Precondition Deadlock
* **Lenses**: `egm-comprehension` (Stage 6), `egm-design` (Stage 7)
* **Finding**: The FSM states that submitting rectification proof moves `CPA_CURE_WINDOW_ACTIVE` back to `INSPECTION_COUNTDOWN_ACTIVE`. However, Section 3.B explicitly mandated `Precondition: status must be WORK_IN_PROGRESS`. If the milestone is in the touch-up window, proof submission is rejected, creating a permanent funds freeze.
* **Actionable Fix**: Update `submit-proof` (and action `SUBMIT_RECTIFICATION`) to admit `status IN ('WORK_IN_PROGRESS', 'CPA_CURE_WINDOW_ACTIVE')`. Attaching rectification photos resets the 48-hour inspection countdown and returns status to `INSPECTION_COUNTDOWN_ACTIVE`.

#### B4: Unify Disbursement Idempotency Keys to Prevent Double Payouts
* **Lenses**: `egm-design` (Stage 7)
* **Finding**: Section 3.E specified cron key `autorelease_{milestoneId}`, while Section 4 specified `payout_{milestone_id}`. If client approval and cron execute simultaneously, the mismatched keys bypass deduplication, risking double disbursement.
* **Actionable Fix**: Enforce a single canonical idempotency key schema: `payout_milestone_${milestoneId}` across all disbursement channels.

---

### 🟡 Major Issues (Architectural & Ergonomic Refinements)

#### M1: Consolidate Financial Adapters into Single Module (`vault.ts`)
* **Lenses**: `egm-zoom-out` (Stage 5 & 8)
* **Finding**: Creating `vault.ts` while keeping `escrow.ts` (only 83 lines) with shim aliases creates duplicate maintenance overhead.
* **Actionable Fix**: Migrate `src/lib/adapters/escrow.ts` into `src/lib/adapters/vault.ts`. Export canonical functions (`computeMilestoneSplit`, `vaultAdapter`) and re-export aliases from `escrow.ts` (`export * from "./vault"`).

#### M2: Centralize UI Copy via `VAULT_LEXICON` Dictionary in `src/lib/config.ts`
* **Lenses**: `egm-zoom-out` (Stage 8), `egm-codebase-details` (Stage 9)
* **Finding**: The plan proposed hardcoding manual text replacements across 6 UI files. Some strings were hallucinated, while real strings (`// 02 · ESCROW FEE & DISPUTE PROTECTIONS`, `// STATUS: {job.status}`) were missed.
* **Actionable Fix**: Establish a single source of truth in `src/lib/config.ts`:
  ```typescript
  export const VAULT_LEXICON = {
    vaultName: "Milestone Vault",
    jobGuarantee: "Job Guarantee",
    fundedBadge: "FUNDS SECURED IN VAULT",
    approveButton: "Approve & Payout Labour",
    touchUpButton: "Request a Touch-Up",
    touchUpBanner: "72-Hour Fix Window Active",
    preBookingProtection: "Pre-Booking Protection",
  } as const;
  ```
  Audit verified line numbers in `src/app/page.tsx`, `EscrowCalculator.tsx`, `client/dashboard/page.tsx`, and `worker/dashboard/page.tsx`.

#### M3: Cap Touch-Up Cycles to Prevent Indefinite Payment Holdouts
* **Lenses**: `egm-design` (Stage 7)
* **Finding**: An unconstrained touch-up loop allows a homeowner to repeatedly request touch-ups at hour 47, freezing artisan funds indefinitely.
* **Actionable Fix**: Enforce a strict limit of 1 touch-up cycle per milestone. Subsequent rejections immediately transition to `ESCALATED_MEDIATION`.

#### M4: Explicit Gate OTP Check-In API Specifications
* **Lenses**: `egm-comprehension` (Stage 6), `egm-design` (Stage 7)
* **Finding**: The FSM requires `Artisan Checks in via Gate OTP`, but Section 3 omitted endpoint details for submitting and validating the OTP.
* **Actionable Fix**: Document `POST /api/jobs/[id]/gate` with `action: "CHECK_IN_OTP"` (validating the 6-digit code against `src/lib/security/gate-otp.ts` and transitioning status to `WORK_IN_PROGRESS`).

#### M5: Resolve Open Question 1 (Load Shedding & Connectivity Grace Period)
* **Lenses**: `egm-zoom-out` (Stage 5), `egm-design` (Stage 7), `egm-zoom-out` (Stage 8)
* **Finding**: Open Question 1 was left unanswered, risking unfair auto-releases during extended rolling blackouts.
* **Actionable Fix**: Provide a 1-tap "Request 24h Extension" button on the client dashboard inspection card (capped at one extension). Relegate external SMS/WhatsApp integrations to out-of-scope non-goals for local testing.

#### M6: Fix `anti-leakage.ts` Parameter Overloading
* **Lenses**: `egm-codebase-details` (Stage 9)
* **Finding**: `sanitizeChatMessage` currently accepts `boolean`, not an options object. Changing parameter 2 breaks existing callers.
* **Actionable Fix**: Support overloaded/polymorphic signature: `boolean | { isVaultFunded?: boolean; isEscrowFunded?: boolean }`.

#### M7: Portable Verification Plan & Real Test Path
* **Lenses**: `egm-implementation-readiness` (Stage 9)
* **Finding**: Hardcoded absolute Windows paths break on CI, and `tests/anti-leakage.test.ts` does not exist (the real path is `src/lib/__tests__/anti-leakage.test.ts`).
* **Actionable Fix**: Use portable commands: `npm run build` and `npm test -- tests/milestone-vault.test.ts src/lib/__tests__/anti-leakage.test.ts`.

---

### 🟢 Nits (Clarity, Style & Consistency)

#### N1: Unify Method & State Naming Across Adapter and FSM
* Standardize on `pauseForTouchUp` in `AbstractVaultAdapter` and use `TOUCH_UP_WINDOW_ACTIVE` (or `CPA_CURE_WINDOW_ACTIVE`) consistently.

#### N2: Annotate Commission Calculation in API Response Samples
* Explicitly annotate Section 3.C response: `payoutZar: 2760.00` = `3000.00 labour - 240.00 (8% commission)`.

#### N3: Expand Acronyms & Fix Inline Backtick Prose
* Expand CPA, SARB, and FICA on first use. Remove inline code backticks enclosing entire paragraphs under `Alternatives Considered`.

---

## Traceability Matrix

| Raw Finding Source | Consolidated ID | Scope | Resolution Action |
| :--- | :---: | :--- | :--- |
| `zoom_out_report.md` §1 | **B1** | Schema | Evolve `Milestone` model (+4 fields); drop 4 phantom tables. |
| `comprehension_report.md` §1 | **B2** | API Routes | Unify around single action-based `milestones/route.ts`. |
| `comprehension_report.md` §2 | **B3** | FSM / API | Allow `submit-proof` during `CPA_CURE_WINDOW_ACTIVE`. |
| `critic_report.md` §2 | **B4** | Concurrency | Enforce canonical `payout_milestone_${id}` key. |
| `zoom_out_report.md` §2 | **M1** | Adapters | Consolidate `escrow.ts` into `vault.ts`. |
| `critic_report.md` §3 | **M4** | API / OTP | Specify `POST /api/jobs/[id]/gate` check-in action. |
| `critic_report.md` §5 | **M3** | FSM | Cap touch-up cycles to 1 before mediation. |
| `implementation_readiness.md` §4 | **M2** | Frontend / Copy | Centralize copy in `VAULT_LEXICON` (`config.ts`). |
| `zoom_out_report.md` §7 | **M5** | Open Q1 | Add 1-tap 24h load shedding extension. |
| `implementation_readiness.md` §5 | **M6** | Security | Polymorphic second argument in `sanitizeChatMessage`. |
| `implementation_readiness.md` §6 | **M7** | Verification | Portable `npm run build` & correct vitest paths. |
| `comprehension_report.md` §9 | **N3** | Style | Expand acronyms; remove backtick paragraph wrapping. |

---

## Net Subtractive Impact

* **Pruned Complexity**:
  * ❌ 4 proposed database tables deleted in favor of 4 nullable columns on existing `Milestone`.
  * ❌ 4 redundant REST route directories collapsed into 1 existing multiplexed handler.
  * ❌ Speculative external WhatsApp/SMS gateway dependencies deferred.
  * ❌ Raw SQL locking replaced with standard Prisma `$transaction`.
* **Footprint Reduction**: Net LOC delta shrinks from **~650 LOC** to **~210 LOC** (**~68% reduction** in implementation churn).
