# BuildSafe SA — Test Infrastructure & Quality Assurance Specification (TEST_INFRA.md)

## 1. Test Philosophy & Execution Architecture

The testing architecture for the BuildSafe SA platform adheres to an **opaque-box, contract-driven, requirement-verified testing philosophy**, derived strictly from `ORIGINAL_REQUEST.md` (Approved Task Prompt — 2026-11-02T14:08:36Z) and the interface contracts in `PROJECT.md`:
- **Requirement R1 (Login, Sign-Up & Persona Routing)**: Verification of lightweight mock session authentication, dedicated CLIENT vs BUILDER vs DUAL_ROLE registration, active perspective routing, and persistent session storage.
- **Requirement R2 (Segregation of Needs & Dual-Role Support)**: Verification of dual-role perspective switching without context loss, strict isolation between client draft jobs and builder quotes/wallets, and visual indicator compliance in the navigation shell.
- **Requirement R3 (Client Persona Experience)**: Verification of dedicated client dashboard views, 3-step job creation wizard, real-time budget affordability calculator (5% buyer fee, credited call-out deposit, 0% markup hardware guarantee), client job status filtering, quote inspection, and quote acceptance into Escrow.
- **Requirement R4 (Builder Persona Experience & Vetting)**: Verification of 3-pillar builder vetting (Identity: 13-digit SA ID Luhn & live selfie match; Verifiability: POPIA consent & R200 HURU/AFISwitch biometric voucher with 12-month expiry; Security: Estate Gate Pass OTP), skills and trade profile management (`UPDATE_SKILLS`), client job browsing with privacy address masking, and statutory CoC quoting eligibility gates.

### Runtime Environment & Zero-Flakiness Guarantee
- **Runner**: Vitest v3.2.7 configured with `environment: "node"`.
- **Zero DOM Flakiness**: Tests run entirely in pure Node.js in-memory processes without brittle DOM emulation (`jsdom`, `@testing-library/react`), asserting directly on state machines, API contracts, governance rules, and AST tokens.
- **Deterministic Windows Execution**: All tests execute via the project's dedicated Node wrapper script (`scripts\with-node.cmd`).

---

## 2. 4-Tier Test Stratification Methodology

Testing is stratified into four rigorous testing tiers across all functional domains:

```
+-------------------------------------------------------------------------------------------------+
| Tier 4: Real-World Multi-Role Workflows (End-to-End User Workflows)                             |
| - E2E-P1: Dual-Role Lifecycle (Client Post -> Toggle Builder -> Skills/Browse -> Toggle Client) |
| - E2E-P2: Client Experience (Register -> Job Creation -> Affordability -> Quote -> Milestone)  |
| - E2E-P3: Builder Progression (Register -> Identity Proof -> Biometric HURU -> CoC -> Job Bid)  |
+-------------------------------------------------------------------------------------------------+
| Tier 3: Pairwise Interactions & State Segregation                                               |
| - Dual-Role Perspective Toggle with Context Segregation (zero leakage between roles)            |
| - Statutory CoC Trade Quoting Gates (PIRB / ECB Wireman / NHBRC compliance)                     |
| - Quote Acceptance shifting state to ESCROW_FUNDED & generating Gate Check-In OTP Pair          |
| - Gate OTP Check-In shifting state to WORKER_ON_SITE and auto-activating Escrow ledger          |
+-------------------------------------------------------------------------------------------------+
| Tier 2: Boundary Value Analysis (BVA), Limits & Corner Cases                                    |
| - Financial Extremes: R0 budget, R1,000,000 maximum commitment, NaN/empty string handling      |
| - Identity Extremes: Corrupted Luhn digits, missing selfies, suspended/banned ID evasion gates   |
| - High-Frequency Stress: Rapid 50-cycle perspective toggling maintaining account invariants     |
| - Empty States: Client zero posted jobs rendering brutalist call-to-action                     |
+-------------------------------------------------------------------------------------------------+
| Tier 1: Feature Coverage (Happy Paths & Isolation)                                              |
| - Mock Session Authentication, Logout, and Persona Rehydration from Storage                     |
| - Dedicated Role Sign-Up (CLIENT, BUILDER, DUAL_ROLE)                                           |
| - 3-Step Wizard Step Transition Rules & Automatic CoC Flagging                                  |
| - 3-Pillar Vetting Engine & HURU Biometric Voucher Generation                                    |
| - Professional Skills Update (`UPDATE_SKILLS`) & Trade-Matched Job Browsing                     |
+-------------------------------------------------------------------------------------------------+
```

---

## 3. Test Suites Inventory & Coverage Matrix

The automated test suite consists of **15 test files and 142 automated tests**, achieving a 100% pass rate:

| Test Suite File | Tier Focus | Tests | Status | Target Contracts & Feature Areas |
|---|---|---|---|---|
| `tests/auth-persona-roles.test.ts` | **Tier 1, 2, 3** | 10 | **PASS** | Lightweight mock session auth, client registration, builder registration, dual-role registration, perspective toggling, perspective switch guards, context segregation, `localStorage` contract persistence, navigation shell visual indicators, and rapid 50-cycle toggle stress test. |
| `tests/client-experience.test.ts` | **Tier 1, 2, 3** | 10 | **PASS** | Dedicated client portal dashboard, interactive budget affordability calculator (5% buyer fee, credited deposit, 0% markup), 3-step wizard validation, statutory CoC auto-flagging, client author ID association, client job tracking feed, quote inspection & comparison, quote acceptance into Escrow, budget boundary analysis, and client zero-state. |
| `tests/builder-vetting-browsing.test.ts` | **Tier 1, 2, 3** | 10 | **PASS** | 3-pillar vetting section overview (Identity, Verifiability, Security), Tier 1 SA ID Luhn & selfie liveness adapter, Tier 1 ban evasion gate, Tier 2 POPIA consent & R200 HURU barcode voucher generator, Tier 2 SAPS clearance webhook adapter, Tier 3 statutory registry validation (PIRB, ECB Wireman, NHBRC), skills update validator (`UPDATE_SKILLS`), builder job feed browsing with privacy address masking, Tier 1 unvetted quoting block, and Tier 3 statutory CoC compliance gate. |
| `tests/e2e-persona-journeys.test.ts` | **Tier 4** | 3 | **PASS** | Full real-world multi-role workflows:<br>1. *Dual-Role Lifecycle Journey* (Client Post -> Toggle Builder -> Skills & Feed -> Toggle Client with Zero Context Loss)<br>2. *Dedicated Client Journey* (Register -> Job Creation -> Affordability -> Quote Review -> Gate OTP -> Milestone Release -> 5-Star Verified Review)<br>3. *Full Builder Progression Journey* (Register -> Identity Luhn -> Biometric Voucher -> SAPS Clearance -> Trade CoC -> Job Bid) |
| `tests/navigation-shell.stress.test.ts` | **Tier 2** | 15 | **PASS** | High-frequency navigation and shell interaction stress tests. |
| `tests/brutalist-theme.test.ts` | **Tier 1, 2** | 11 | **PASS** | Brick palette tokens (`#B93815`, `#141416`, `#F8F6F2`), WCAG AA/AAA contrast ratios, zero-radius geometry (`rounded-none`), hard shadows, and typography contracts. |
| `tests/information-hierarchy.test.ts` | **Tier 1, 2** | 11 | **PASS** | Progressive disclosure, wizard step transitions, and lifecycle-aware workspace tabs. |
| `tests/purposeful-animations.test.ts` | **Tier 1, 2** | 10 | **PASS** | Mechanical micro-interactions (<= 200ms) and `motion-reduce:transition-none` accessibility. |
| `tests/e2e-scenarios.test.ts` | **Tier 3, 4** | 10 | **PASS** | Core platform scenarios: bathroom renovation, electrical emergency, anti-leakage redaction, scope variations, and roadside onboarding. |
| `tests/m5-adversarial-verification.test.ts` | **Security / AST** | 28 | **PASS** | Static route reachability audit (including `/login`, `/signup`, `/client`, `/client/dashboard`), soft border ban, and transition duration ceiling. |
| `src/lib/__tests__/governance.test.ts` | **Unit** | 8 | **PASS** | Quote eligibility, headcount verification, ban evasion, and review permission logic. |
| `src/lib/__tests__/vetting-adapters.test.ts` | **Unit** | 5 | **PASS** | DHA identity provider, AFISwitch criminal screener, and statutory trade registry adapters. |
| `src/lib/__tests__/sa-id.test.ts` | **Unit** | 4 | **PASS** | 13-digit SA ID Luhn algorithm, date extraction, and POPIA masking. |
| `src/lib/__tests__/escrow.test.ts` | **Unit** | 3 | **PASS** | Escrow splits, buyer fees, worker commissions, repeat loyalty rates, and 0% materials markup. |
| `src/lib/__tests__/anti-leakage.test.ts` | **Unit** | 4 | **PASS** | Pre-escrow contact redaction and off-platform bypass interception. |

**Grand Total**: **15 Test Files · 142 Automated Tests · 142 Passed · 0 Failed · 0 Flaky**

---

## 4. Test Execution & Build Verification

All tests and compilation checks run deterministically on Windows using the repo wrapper scripts:

### 4.1 Run Complete Test Suite
```powershell
cmd.exe /c scripts\with-node.cmd npm.cmd run test
```

### 4.2 Run Specific Persona & Authentication Suites
```powershell
cmd.exe /c scripts\with-node.cmd npx.cmd vitest run tests/auth-persona-roles.test.ts
cmd.exe /c scripts\with-node.cmd npx.cmd vitest run tests/client-experience.test.ts
cmd.exe /c scripts\with-node.cmd npx.cmd vitest run tests/builder-vetting-browsing.test.ts
cmd.exe /c scripts\with-node.cmd npx.cmd vitest run tests/e2e-persona-journeys.test.ts
```

### 4.3 Verify Production Next.js Build
```powershell
cmd.exe /c scripts\with-node.cmd npm.cmd run build
```
Generates Prisma client, compiles all 17 static and dynamic App Router routes, checks TypeScript types, and produces optimized production bundles with exit code 0.
