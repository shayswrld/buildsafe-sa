# Comprehension Test Report (Stage 6)

* **Target Document**: `docs/designs/client_first_landing_and_artisan_canvas.md`
* **Auditor**: Naive Reader (`egm-comprehension`)
* **Scope**: FeatureRange (1..194) & DetailedRange (195..273)
* **Standard**: Comprehension Self-Containment Standard

---

## Paraphrase: Proposed Design
The document proposes transforming BuildSafe SA's home route (`/`) into a dedicated client-first landing portal featuring an industrial brutalist brand header, centered vertical Sign Up and Log In actions, and an ambient vector SVG background canvas of animated craftspeople performing carpentry, bricklaying, and tiling. It strips visual clutter from the global navigation bar by eliminating 2px black box borders around links, hiding persona selectors and rating badges from public views, and organizing authenticated client actions into a streamlined header with an avatar dropdown. Additionally, it updates Edge middleware rules so unauthenticated visitors can access `/` publicly, while client navigation requests route cleanly to `/client/dashboard` without falling into worker redirects.

## Paraphrase: Existing System & Context
As described in the document, BuildSafe SA is an escrow-backed South African artisan marketplace currently exposing homeowner, builder, and admin interfaces simultaneously via an overloaded, heavy-bordered top bar dubbed "button soup." The current root route (`/`) attempts to present marketplace listings, trust pillars, trade cards, and escrow calculators on a single screen. Because client and worker views are conflated and session synchronization is fragile, unauthenticated or misconfigured client navigation frequently causes redirect loops or routes clients inadvertently into the worker dashboard (`/worker/dashboard`).

---

## Findings

### 1. 🟡 Major: Contradiction Between Open Question 1 and Decided Architecture
* **Affected Scope**: Lines 48, 116–117, 164–167, 199–202
* **Description**: Line 48 asks whether animations should be inline CSS/SVG or canvas/Lottie, while Section 2.B explicitly mandates pure SVG + CSS keyframes and Alternative A explicitly rejects Canvas/Lottie. Retaining this as an open question creates false ambiguity.
* **Remediation**: Remove Question 1 from Open Questions.

### 2. 🟡 Major: Unhandled Authenticated State on Root Route (`/`)
* **Affected Scope**: Lines 71–78, 141–150, 153
* **Description**: The document defines adding `/` to `PUBLIC_EXACT_PATHS` for unauthenticated visitors, but omits specifying behavior when an authenticated homeowner or worker visits `/`. Does it redirect to their dashboard, or render dynamic CTAs?
* **Remediation**: Specify that authenticated users landing on `/` are either automatically forwarded to their dashboard by middleware or presented with a dynamic "Go to Dashboard" button.

### 3. 🟡 Major: Inconsistent Streamlined Navigation Items
* **Affected Scope**: Lines 60, 88–91, 148, 231
* **Description**: The navigation links differ across sections: System Flow lists `My Projects` and `Post a Job`; Section 2.C adds `Artisan Directory`; Section 4 lists `Browse Trades`. Furthermore, CUJ 2 references clicking "Client Hub", which has been removed from the navigation specification.
* **Remediation**: Standardize authenticated client navigation links to: `My Projects` (`/client/dashboard`), `Post a Job` (`/jobs/new`), and `Browse Trades` (`/jobs`). Update CUJ 2 accordingly.

### 4. 🟡 Major: Undefined Role `DUAL` and Session Claim Contract
* **Affected Scope**: Lines 156, 237
* **Description**: The document references `session.role === "DUAL"` without defining what privileges a dual role has or how dual-role switching functions once the persona switcher is removed.
* **Remediation**: Define dual-role semantics inline or cite existing session models in `src/lib/auth/session.ts`.

### 5. 🟡 Major: Vague Fallback Removal and Authorization Failure Handling in Middleware
* **Affected Scope**: Lines 24, 158, 237
* **Description**: Instructs to remove arbitrary worker dashboard fallbacks, but does not state what happens when an authenticated `WORKER` attempts to access `/client/dashboard`.
* **Remediation**: Explicitly specify that workers attempting to access `/client/dashboard` are redirected to `/worker/dashboard` with an informational notice, or receive HTTP 403.

### 6. 🟡 Major: Unresolved Persona Switcher Migration for QA/Testing (Open Question 2)
* **Affected Scope**: Lines 49, 145, 230
* **Description**: Leaving open where the demo persona switcher lives risks breaking local testing and demonstration workflows once removed from the top bar.
* **Remediation**: Resolve Open Question 2 by defining a discrete bottom-right floating developer drawer or footer toggle enabled only in non-production environments.

### 7. 🟢 Nit: Inaccurate Session Cookie Name (`bs_session` vs `buildsafe_session`)
* **Affected Scope**: Line 82
* **Description**: The architecture diagram labels the cookie `bs_session`, whereas the codebase defines `SESSION_COOKIE = "buildsafe_session"`.
* **Remediation**: Update cookie name to `buildsafe_session`.

### 8. 🟢 Nit: Non-Standard Tailwind Class `border-3`
* **Affected Scope**: Lines 103, 222
* **Description**: Specifies `border-3 border-iron-950`, but Tailwind CSS does not provide `border-3` by default.
* **Remediation**: Use `border-2`, `border-4`, or arbitrary value `border-[3px]`.

### 9. 🟢 Nit: Unclear Disposition of Existing Homepage Components
* **Affected Scope**: Lines 27, 221
* **Description**: Does not state whether `EscrowCalculator` and trade listings on `/` are deprecated, deleted, or relocated.
* **Remediation**: Clarify that public trade browsing is accessible at `/jobs` and the escrow calculator is accessible in project creation.
