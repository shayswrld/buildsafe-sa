# BuildSafe SA — Test Infrastructure & Quality Assurance Specification (TEST_INFRA.md)

## 1. Test Philosophy

The testing architecture for the BuildSafe SA brutalist-minimalistic front-end redesign adheres to an **opaque-box, requirement-driven testing philosophy**, derived strictly from `ORIGINAL_REQUEST.md` and the structural contracts in `PROJECT.md`:
- **Requirement R1 (Brutalist-Minimalistic Visual Theme)**: Verification of the **Brick Colour Palette** (Burnt Terracotta `#B93815`, Wrought Iron `#141416`, Mortar Chalk `#F8F6F2`, Stark White `#FFFFFF`, Construction Ochre `#D97706`), sharp zero-radius geometry (`rounded-none`), directional hard shadows (`3px 3px 0px 0px #141416`), and architectural monospace/grotesque typography.
- **Requirement R2 (Page Simplification & Information Hierarchy)**: Verification of progressive disclosure, reduction of initial visual overload, single-tier brutalist navigation bar, 3-step job creation wizard, 5-tab partitioned job workspace (`escrow`, `gate`, `quotes`, `chat`, `ratings`), linear 3-tier artisan vetting, and 3-panel admin console.
- **Requirement R3 (Purposeful Animations)**: Verification of mechanical micro-interactions (100ms button depression, 150ms accordion disclosures, 150ms tab switches, animated escrow proportion bars, verified OTP stamp animations) with strict accessibility guarantees (`motion-reduce:transition-none`).
- **Acceptance Criteria**: Ensuring the application builds cleanly, routes function without broken paths, and all user journeys can be verified end-to-end.

Tests assert against observable interface contracts, design system tokens, state machine transitions, and WCAG accessibility standards rather than brittle implementation details.

---

## 2. Methodology & Test Stratification

Testing is organized across four rigorous testing tiers using industry-standard quality engineering techniques:

```
+-------------------------------------------------------------------------+
| Tier 4: Real-World Workload Journeys (End-to-End User Workflows)        |
+-------------------------------------------------------------------------+
| Tier 3: Pairwise Interactions & Cross-Feature State Transitions          |
+-------------------------------------------------------------------------+
| Tier 2: Boundary Value Analysis (BVA), Viewport & Accessibility Edges   |
+-------------------------------------------------------------------------+
| Tier 1: Category-Partition Feature Coverage (Tokens, Hierarchy, Motion) |
+-------------------------------------------------------------------------+
```

### 2.1 Tier 1: Category-Partition Feature Coverage
Decomposes each feature into formal input categories and equivalence classes:
- **Theme Tokens & Geometry**: Brick palette color values, WCAG contrast compliance, zero-radius border rules, directional shadow offsets, and typography formatting.
- **Information Hierarchy**: Navbar consolidation, hero metric indicators, collapsible escrow drawers, stepped job wizard partitions, workspace tab activation contracts, and linear vetting sequences.
- **Purposeful Micro-Interactions**: Mechanical button depressions, accordion transitions, reactive financial sliders, and verified stamp mechanics.

### 2.2 Tier 2: Boundary Value Analysis (BVA) & Corner Cases
Probes limits and extreme conditions:
- **Financial & Numerical Extremes**: R0 labour with materials only, materials slip reimbursement at 0% commission, maximum financial amounts (R1,000,000+), slider ranges.
- **Timing & Motion Limits**: Strict ceiling on interaction animation durations (<= 200ms) to eliminate perceived lag; verification that `prefers-reduced-motion` suppresses all transforms.
- **Input Edge States**: Empty problem tags, maximum string lengths, special characters, whitespace handling, and undefined status fallbacks.
- **Empty States**: Unquoted jobs, zero reviews, empty crew pools, unvetted roadside profiles.

### 2.3 Tier 3: Pairwise Interactions & Cross-Feature Integration
Applies combinatorial testing across key orthogonal dimensions:
- **Persona × Route Permissions**: `HOMEOWNER`, `WORKER`, `ADMIN` accessing respective views and actions with appropriate access control and state persistence.
- **Job Status × Workspace Tab Defaulting**: `OPEN` / `QUOTED` -> `'quotes'`, `ESCROW_FUNDED` -> `'gate'`, `WORKER_ON_SITE` -> `'escrow'`, `COMPLETED` -> `'ratings'`.
- **Pre-Escrow vs Post-Escrow Anti-Leakage Communication**: Intercepting off-platform bypass attempts before funding, unlocking direct site coordination upon escrow lock.
- **Gate OTP Verification into Escrow Milestone Release**: Tactile 6-digit OTP verification triggering status change to `WORKER_ON_SITE`, enabling milestone sign-off.

### 2.4 Tier 4: Real-World Workload Testing (End-to-End Scenarios)
Simulates end-to-end user journeys that mimic production usage in South Africa:
1. **Scenario 1 — Homeowner Bathroom Renovation Journey**: Multi-step job posting -> Artisan quote submission -> Escrow lock -> Gate arrival verification -> Milestone payout release -> Mutual 5-star ratings.
2. **Scenario 2 — High-Risk Statutory Electrical Emergency Journey**: DB board fault requiring statutory ECB Wireman CoC -> Vetting gate blocks Tier 1/2 workers -> Tier 3 artisan quotes -> Escrow funded -> Gate OTP verified -> Zero commission on hardware materials.
3. **Scenario 3 — Chat Leakage Bypass Attempt & Admin Intervention Journey**: Artisan shares 082 phone number and requests eWallet/cash at the gate -> Anti-leakage filter redacts message -> Admin console displays intercepted alert -> User funds platform escrow safely.
4. **Scenario 4 — Scope Variation Order & Milestone Dispute Resolution Journey**: Additional water damage encountered -> Variation drawer submitted with extra labour and materials -> Financial ledger recalculates -> Homeowner disputes -> Admin mediates -> Partial release executed.
5. **Scenario 5 — Roadside Artisan Onboarding & Fast Payout Journey**: New artisan signs up with 13-digit SA ID -> Luhn validation passes -> PostNet biometric voucher generated -> Webhook simulates clearance -> Artisan quotes, completes job, and triggers instant wallet payout.

---

## 3. Feature Inventory & Coverage Targets

| Feature Area | Tier 1 Target | Tier 2 Target | Tier 3 Target | Tier 4 Target | Suite Location |
|---|---|---|---|---|---|
| **Brutalist-Minimalistic Theme (R1)** | >= 5 tests | >= 5 tests | Covered in T3 | Covered in T4 | `tests/brutalist-theme.test.ts` |
| **Information Hierarchy & Navigation (R2)** | >= 5 tests | >= 5 tests | Covered in T3 | Covered in T4 | `tests/information-hierarchy.test.ts` |
| **Purposeful Micro-Interactions (R3)** | >= 5 tests | >= 5 tests | Covered in T3 | Covered in T4 | `tests/purposeful-animations.test.ts` |
| **Cross-Feature & E2E Workloads (AC)** | Covered in T1 | Covered in T2 | >= 5 tests | >= 5 tests | `tests/e2e-scenarios.test.ts` |
| **Existing Security & Governance Engine** | 4 unit suites | In baseline | In baseline | In baseline | `src/lib/__tests__/*.test.ts` |

**Total Target**: >= 40 new automated tests spanning Tiers 1–4, plus 16 existing baseline tests, achieving >= 56 passing tests across the entire test suite.

---

## 4. Test Runner & Verification Instructions

### 4.1 Test Command
The test suite is executed using the project-standard Node runtime wrapper:
```powershell
cmd.exe /c scripts\with-node.cmd npm.cmd run test
```

### 4.2 Configuration Details
- **Test Runner**: Vitest 3.0+ configured in `vitest.config.ts`.
- **Environment**: Node.js environment with path aliasing (`@/* -> ./src/*`).
- **Inclusion Globs**: `src/**/*.test.ts` (unit/security tests) and `tests/**/*.test.ts` (E2E, theme, hierarchy, animation test suites).
- **Execution Mode**: Isolated in-memory execution with deterministic fixtures and zero external network dependencies.
