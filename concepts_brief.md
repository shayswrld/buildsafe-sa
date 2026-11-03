# Milestone Vault & Job Guarantee Architecture

* **Author:** shayl
* **Date:** 2026-11-03

## Overview

BuildSafe SA replaces alienating "escrow" terminology with a customer-centric "Milestone Vault" and "Job Guarantee" mental model. The architecture establishes a balanced, legally grounded payment flow for South African homeowners and vetted artisans.

To eliminate counterparty risk and avoid platform disintermediation without the overhead of an unlicensed bank, the system:
1. Segregates hardware material purchases (pass-through retail slips at 0% platform fee) from skilled labour milestones.
2. Automates a 48-hour inspection countdown triggered by artisan photo proof to prevent homeowner ghosting.
3. Provides a **72-Hour Fix Window** ("Free Touch-Up"): If something is not done right, the client taps "Request a Fix" with a photo. The artisan gets 72 hours to inspect and make it right before any payment is frozen or reviewed (fulfilling the legal right to remedy under CPA Section 54 without burdening users with legal jargon).
4. Delegates custodial funds holding to an authorized South African trust/escrow partner (such as TradeSafe API backed by Nedbank trust accounts).

---

## Analysis

Synthesized from parallel Goldfish reviews (`egm-design`, `egm-codebase-details`, `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`, `egm-structural`):

### 1. Macro Economics & Market Moat
* **The Material Fee Elimination Rule**: Charging a percentage fee on hardware store materials (e.g., Cashbuild cement, Builders Warehouse tiles) drives artisans and homeowners off-platform to settle in cash. Enforcing a 0% platform commission on itemized hardware receipts keeps the transaction on-platform. The platform monetizes exclusively on labour (5% homeowner trust fee + 8% artisan commission).
* **Defensibility vs. Classifieds**: Pure directories (Kandua, Bark, inDrive models) suffer near-100% off-platform disintermediation. Intercepting the labour milestone inside a secure vault provides the safety moat that justifies the take-rate.

### 2. Legal Grounding & Dispute Mechanics
* **CPA Section 54 Statutory Cure**: Under South African consumer law, a client receiving substandard service must afford the contractor an opportunity to remedy defects before demanding a price reduction or refund. Replacing the "Dispute / Refund" button with a structured **"Request Touch-Up"** flow initiates a 72-hour cure timer and prevents frivolous payment freezes.
* ***BK Tooling* Doctrine**: Common law prohibits homeowners from withholding 100% of payment if substantial performance was rendered. If mediation occurs, disputes resolve by deducting the verified cost of repair, rather than complete forfeiture of labour.

### 3. UX, Lexicon & Mental Models
* **Language Shift**:
  * `"Escrow"` ➔ `"Milestone Vault"` (aligns with familiar digital banking products like Capitec/TymeBank savings vaults).
  * `"Escrow Funded"` ➔ `"Funds Secured in Vault"`.
  * `"Release Escrow"` ➔ `"Approve & Payout Labour"`.
  * `"Dispute"` ➔ `"Request Touch-Up (72h Window)"`.
* **Low-Bandwidth Mobile Proofs**: Artisans upload compressed (<300KB WebP) timestamped photos showing wide-angle completion and close-up detail to trigger the inspection window.
* **Multi-Channel Alerts**: Due to intermittent power outages and mobile data constraints, timer deadlines (T-24h, T-12h, T-2h) must trigger via WhatsApp Business API and SMS alongside dashboard banners.

### 4. Technical Architecture & Database FSM
* **State Machine Sequence**:
  `DRAFT` ➔ `QUOTED` ➔ `ACCEPTED` ➔ `CALL_OUT_DEPOSIT_FUNDED` ➔ `LABOUR_VAULT_FUNDED` ➔ `WORK_IN_PROGRESS` ➔ `PROOF_SUBMITTED` ➔ `INSPECTION_COUNTDOWN_ACTIVE` (48h) ➔ `AUTO_RELEASED` | `MANUALLY_RELEASED` | `CPA_CURE_WINDOW_ACTIVE` (72h) ➔ `REMEDY_SUBMITTED` ➔ `PAID_OUT` | `ESCALATED_MEDIATION`.
* **Durable Timers & Race Prevention**: 48h auto-release timers must execute via persistent database jobs with PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to eliminate double-payout race conditions between manual client approval and automated background release.

---

## Goals vs. Non-Goals

### In-Scope Goals
* **G1: Eliminate 'Escrow' Phrasing Across UI**: Replace all user-facing instances of "escrow" across client dashboards, worker hubs, job detail views, calculators, and navigation with "Milestone Vault" and "Job Guarantee".
* **G2: Separate Labour from Hardware Materials**: Store `job_milestones` (labour subject to platform commission) in distinct tables from `hardware_materials` (0% platform cut pass-through).
* **G3: 48-Hour Inspection Auto-Release Invariant**: Automatically trigger artisan payout 48 hours after photo proof submission unless the client logs a specific defect.
* **G4: 72-Hour Statutory Right-to-Cure Workflow**: Require clients flagging defects to provide minimum 1 photo and description, granting the artisan a 72-hour window to inspect and rectify before funds are frozen.
* **G5: Multi-Channel WhatsApp & SMS Notifications**: Broadcast critical timer milestones (proof submitted, 12h remaining, auto-release imminent) via SMS and WhatsApp.

### Out-of-Scope Non-Goals
* Operating an internal unlicensed bank or holding client funds directly in BuildSafe's operational checking accounts (all custodial funds route through a regulated South African escrow API like TradeSafe).
* Providing platform warranties for manufacturer material defects (e.g., cracked tiles from the supplier).
* Automating legal arbitration for unresolved disputes exceeding the milestone value (unresolved claims escalate to human mediation).

---

## Alternatives Weighed

* **Alternative 1: Pure Directory Model (inDrive-style / Off-Platform Cash)**
  * *Rejected by author*: Guarantees 100% off-platform disintermediation once contact details are exchanged. Destroys monetization and eliminates the core trust differentiator.
* **Alternative 2: 100% Upfront Project Cash Lock**
  * *Rejected by author*: Freezes excessive client capital on multi-week projects (e.g., R40,000 upfront) and starves artisans of necessary phased cash flow.
* **Alternative 3: Unilateral Client Refund Button**
  * *Rejected by author*: Violates South African Consumer Protection Act Section 54 (contractor's statutory right to remedy) and *BK Tooling* common law precedent. Facilitates contractor wage theft.

---

## Key Decisions & Staging for Next Steps

1. **Custodial Partner Strategy**:
   - For this testing phase, implement an **Abstract Sandbox Vault Adapter** (`src/lib/adapters/vault.ts` / `escrow.ts`) with zero external API dependencies. This enables full simulation of deposit funding, 48-hour auto-release countdowns, and CPA Section 54 touch-up workflows without live banking credentials.
   - Production readiness will swap this interface for a licensed South African third-party escrow API (TradeSafe/Nedbank Trust).
2. **UI Lexicon Standardization**: Centralize all copy in a shared UI dictionary to ensure zero "escrow" residue leaks into client or worker views.
3. **Database Schema Staging**: Introduce `job_milestones`, `hardware_materials`, and `cpa_cure_events` tables into Prisma/PostgreSQL to support the FSM.

