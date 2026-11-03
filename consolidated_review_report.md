# Consolidated Goldfish Review Report

* **Target Document**: `docs/designs/client_first_landing_and_artisan_canvas.md`
* **Audit Pipeline**: Uninterrupted Full Flow (Stages 5, 6, 7, 8, 9)
* **Auditor Swarm**:
  * Stage 5: Skeptical Architect (`egm-zoom-out`)
  * Stage 6: Naive Reader (`egm-comprehension`)
  * Stage 7: Hostile Design Critic (`egm-design`), Structural Validator (`egm-structural`), Technical Copy Editor (`egm-style`)
  * Stage 8: Intermediate Zoom Out (`egm-zoom-out`)
  * Stage 9: Implementation Readiness Lead (`egm-implementation-readiness`), Codebase Quality Auditor (`egm-codebase-details`)
* **Status**: Review Complete — Actionable Tasks Identified

---

## Executive Summary

The Goldfish Review Protocol performed an end-to-end evaluation of `docs/designs/client_first_landing_and_artisan_canvas.md` across high-altitude simplicity, comprehension, antagonistic system design, structural symmetry, technical style, and implementation readiness.

The review confirmed the validity of the core user goal: **isolating the Client persona and de-cluttering the top navigation bar**. However, the review identified two blocking code-level discrepancies that would cause implementation failure if executed verbatim:
1. **Edge Middleware Redirect Deadlock**: Modifying `PUBLIC_EXACT_PATHS` alone will not open `/` to unauthenticated visitors because line 52 of `src/middleware.ts` contains an explicit hardcoded clause `if (pathname === "/" || ...)`. Line 52 must be modified directly.
2. **Test Infrastructure Incompatibility**: The plan specifies creating a React Testing Library suite in `.test.tsx`, but `package.json` and `vitest.config.ts` lack DOM dependencies and are configured strictly for Node `.test.ts` files.

Furthermore, the audit highlighted that gutting the home page into a bare auth splash screen damages consumer discovery; the landing page must present the prominent Sign Up and Log In buttons *alongside* high-conversion trade anchors and escrow trust pillars.

---

## Consolidated Action Items by Priority

### 🔴 Blockers (Must Fix Prior to Implementation)

| ID | Title | Summary & Technical Directive | Traced Stages |
|---|---|---|---|
| **ACT-01** | **Fix Middleware Route Guard Logic** | Modify `src/middleware.ts#L52` to remove the hardcoded `pathname === "/" \|\|` check, simplifying to `if (!isPublicPage && !isAuthPage)`. Merely adding `"/"` to `PUBLIC_EXACT_PATHS` is insufficient to open the route. | Stage 7, Stage 9 |
| **ACT-02** | **Correct Session Cookie Name** | Replace all references to `bs_session` with `buildsafe_session` as defined in `src/lib/auth/session.ts#L8` and enforced in `src/middleware.ts#L42`. | Stage 6, Stage 7, Stage 9 |
| **ACT-03** | **Permit Public Trade Browsing** | Add `"/jobs"` to `PUBLIC_EXACT_PATHS` in `src/middleware.ts` so unauthenticated visitors clicking `"Browse Public Trades Without Signing In →"` are not blocked with a redirect to `/login?from=/jobs`. | Stage 5, Stage 7 |
| **ACT-04** | **Reconcile Test Infrastructure** | Update the plan to target `tests/landing-page.test.ts` as a Node-safe integration test verifying middleware status codes and routing headers, OR enumerate installing `@testing-library/react` + `jsdom` and updating `vitest.config.ts`. | Stage 5, Stage 9 |
| **ACT-05** | **Structural Reorganization & Mandatory Sections** | Move `## Open Questions` after `## Technical Plan` and prune decided items (Question 1). Add mandatory sections: `## Security, Privacy & Data Protection`, `## Data Model Impact (None)`, and `## Risks & Mitigations`. | Stage 6, Stage 7 |

---

### 🟡 Majors (High-Impact Technical Revisions)

| ID | Title | Summary & Technical Directive | Traced Stages |
|---|---|---|---|
| **ACT-06** | **Synchronize `PersonaContext` State** | Update `src/components/PersonaContext.tsx#L165` so `selectedId` and `currentUser` default to `null` when no verified session cookie exists, preventing the navbar from falsely evaluating visitors as authenticated. | Stage 5, Stage 7, Stage 8 |
| **ACT-07** | **Preserve Marketplace Discovery on `/`** | Retain trade category anchors, trust badges (SAPS, 0% slip markup), and escrow calculator access on `src/app/page.tsx` beneath the prominent brand header and centered Sign Up / Log In action card. | Stage 5, Stage 8 |
| **ACT-08** | **Define Authenticated Routing on `/`** | Specify deterministic routing when an authenticated user visits `/`: automatically forward them to `/client/dashboard` (or worker/admin dashboard) via middleware, or render a dynamic `"Go to My Dashboard →"` CTA. | Stage 6, Stage 7 |
| **ACT-09** | **Standardize Navigation Items & CUJ 2** | Align client navigation links across all sections to `My Projects` (`/client/dashboard`), `Post a Job` (`/jobs/new`), and `Browse Trades` (`/jobs`). Update CUJ 2 to reference clicking `My Projects` instead of the eliminated `Client Hub`. | Stage 6 |
| **ACT-10** | **Eliminate Heading Syntax Backticks** | Remove inline backticks from all H3 and H4 section headers (`#### A. Dedicated Home Landing Page (src/app/page.tsx)` and `### Alternative C: Direct Unauthenticated Redirect to /login`). | Stage 7 |
| **ACT-11** | **Convert Backtick Prose in Alternatives** | Reformat the `Reason for Rejection` paragraphs in `## Alternatives Considered` from inline backtick code spans into standard markdown prose. | Stage 7 |
| **ACT-12** | **Define Concrete Canvas Props & CSS Classes** | Provide concrete component props (`className?: string`), viewport boundaries (`viewBox="0 0 120 120"`), container placement classes, and `.animate-*` CSS utility classes for the animation vignettes. | Stage 9 |

---

### 🟢 Nits (Quality & Polish)

| ID | Title | Summary & Technical Directive | Traced Stages |
|---|---|---|---|
| **ACT-13** | **Strip Fluff, Jargon & Promotional Copy** | Replace subjective marketing terms ("intuitive", "lively", "delightful", "signature", "button soup", "Lego yellow") with objective engineering terminology. | Stage 7 |
| **ACT-14** | **Replace `border-3` with Valid Tailwind Class** | Update `border-3 border-iron-950` to standard Tailwind `border-2`, `border-4`, or `border-[3px]`. | Stage 6, Stage 7 |
| **ACT-15** | **Add Conversion Observability Metrics** | Define telemetry events under NFRs: `landing_cta_click { target: 'signup' \| 'login' \| 'public_trades' }`. | Stage 7 |

---

## Traceability Matrix

| Raw Finding Source | Reviewer Persona | Raw Severity | Mapped Action Item | Consolidated Status |
|---|---|---|---|---|
| `zoom_out_report.md` §1 | `egm-zoom-out` | 🔴 Blocker | **ACT-07** | Consolidated as Major |
| `zoom_out_report.md` §2 | `egm-zoom-out` | 🔴 Blocker | **ACT-12** | Consolidated as Major |
| `zoom_out_report.md` §3 | `egm-zoom-out` | 🟡 Major | **ACT-06** | Consolidated as Major |
| `zoom_out_report.md` §4 | `egm-zoom-out` | 🟡 Major | **ACT-07** | Consolidated as Major |
| `zoom_out_report.md` §5 | `egm-zoom-out` | 🟡 Major | **ACT-04** | Consolidated as Blocker |
| `comprehension_report.md` §1 | `egm-comprehension` | 🟡 Major | **ACT-05** | Consolidated as Blocker |
| `comprehension_report.md` §2 | `egm-comprehension` | 🟡 Major | **ACT-08** | Consolidated as Major |
| `comprehension_report.md` §3 | `egm-comprehension` | 🟡 Major | **ACT-09** | Consolidated as Major |
| `comprehension_report.md` §4 | `egm-comprehension` | 🟡 Major | **ACT-08** | Consolidated as Major |
| `comprehension_report.md` §5 | `egm-comprehension` | 🟡 Major | **ACT-01** | Consolidated as Blocker |
| `comprehension_report.md` §6 | `egm-comprehension` | 🟡 Major | **ACT-05** | Consolidated as Blocker |
| `comprehension_report.md` §7 | `egm-comprehension` | 🟢 Nit | **ACT-02** | Consolidated as Blocker |
| `comprehension_report.md` §8 | `egm-comprehension` | 🟢 Nit | **ACT-14** | Consolidated as Nit |
| `critic_report.md` §1 | `egm-design` | 🔴 Blocker | **ACT-01**, **ACT-02** | Consolidated as Blocker |
| `critic_report.md` §2 | `egm-design` | 🔴 Blocker | **ACT-03** | Consolidated as Blocker |
| `critic_report.md` §3 | `egm-structural` | 🔴 Blocker | **ACT-05** | Consolidated as Blocker |
| `critic_report.md` §4 | `egm-structural` | 🔴 Blocker | **ACT-05** | Consolidated as Blocker |
| `critic_report.md` §5 | `egm-design` | 🟡 Major | **ACT-08** | Consolidated as Major |
| `critic_report.md` §6 | `egm-structural` | 🟡 Major | **ACT-10** | Consolidated as Major |
| `critic_report.md` §7 | `egm-style` | 🟡 Major | **ACT-13** | Consolidated as Nit |
| `critic_report.md` §8 | `egm-structural` | 🟡 Major | **ACT-01** | Consolidated as Blocker |
| `critic_report.md` §9 | `egm-structural` | 🟡 Major | **ACT-11** | Consolidated as Major |
| `critic_report.md` §10 | `egm-design` | 🟢 Nit | **ACT-12** | Consolidated as Major |
| `implementation_readiness_report.md` §1 | `egm-implementation-readiness` | 🔴 Blocker | **ACT-01** | Consolidated as Blocker |
| `implementation_readiness_report.md` §2 | `egm-implementation-readiness` | 🔴 Blocker | **ACT-04** | Consolidated as Blocker |
| `implementation_readiness_report.md` §3 | `egm-implementation-readiness` | 🟡 Major | **ACT-12** | Consolidated as Major |
| `implementation_readiness_report.md` §4 | `egm-implementation-readiness` | 🟡 Major | **ACT-12** | Consolidated as Major |
| `implementation_readiness_report.md` §5 | `egm-implementation-readiness` | 🟡 Major | **ACT-09** | Consolidated as Major |
| `implementation_readiness_report.md` §6 | `egm-implementation-readiness` | 🟢 Nit | **ACT-03** | Consolidated as Blocker |
