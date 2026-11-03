# Antagonistic Critic Review Report (Stage 7)

* **Target Document**: `docs/designs/client_first_landing_and_artisan_canvas.md`
* **Auditors**: Hostile Design Critic (`egm-design`), Structural Validator (`egm-structural`), Technical Copy Editor (`egm-style`)
* **Scope**: FeatureRange (Lines 1–194)
* **Standard**: Feature Specification Standard (`feature-spec-standard.md`)

---

## Findings

### 1. 🔴 Blocker: Cookie Identifier Mismatch & Middleware Hardcoded Redirect Deadlock
* **Auditor**: `egm-design`
* **Affected Scope**: Lines 81–84, 151–159
* **Description**:
  1. The diagram defines issuing `bs_session`, but `src/lib/auth/session.ts#L8` strictly enforces `SESSION_COOKIE = "buildsafe_session"`. Downstream route handlers will reject sessions issued under the wrong cookie name.
  2. Section 2.D instructs adding `/` to `PUBLIC_EXACT_PATHS`. However, `src/middleware.ts#L52` contains an explicit hardcoded clause: `if (pathname === "/" || (!isPublicPage && !isAuthPage))`. Because `pathname === "/"` evaluates to true independently, unauthenticated visitors will still be blocked and redirected to `/login`.
* **Remediation**: Standardize cookie name to `buildsafe_session` and instruct removing `pathname === "/"` from `src/middleware.ts#L52`.

### 2. 🔴 Blocker: Public Trade Browsing Route Guard Contradiction
* **Auditor**: `egm-design`
* **Affected Scope**: Lines 111–112, 151–159
* **Description**: The landing page provides a link `"Browse Public Trades Without Signing In →"` targeting `/jobs`. However, `/jobs` is not included in `PUBLIC_EXACT_PATHS` in `src/middleware.ts`. Unauthenticated visitors clicking this link will immediately encounter a redirect to `/login?from=/jobs`.
* **Remediation**: Add `/jobs` to `PUBLIC_EXACT_PATHS` to allow public read-only marketplace browsing.

### 3. 🔴 Blocker: Missing Mandatory Standard Sections (Security, Data Model, Risks)
* **Auditor**: `egm-structural`
* **Affected Scope**: Lines 65–160
* **Description**: The feature specification lacks required standard sections:
  1. Security, Privacy & Data Protection (POPIA): Cookie flags, session validation, and CSRF/redirect defenses.
  2. Data Model Impact: Explicit declaration of schema changes or zero-impact status.
  3. Risks & Mitigations: Technical failure modes (e.g., mobile SVG frame drops, stale sessions).
* **Remediation**: Add dedicated sections for Security & Privacy, Data Model Impact (None), and Risks & Mitigations.

### 4. 🔴 Blocker: Open Questions Section Placement and Lifecycle Violation
* **Auditor**: `egm-structural`
* **Affected Scope**: Lines 46–50
* **Description**: `## Open Questions` is placed prematurely before CUJs, and both questions listed (animation runtime and persona switcher removal) have already been decided in the Technical Plan and Alternatives.
* **Remediation**: Move unresolved trade-offs to the end of the specification and prune resolved items.

### 5. 🟡 Major: Missing Authenticated Routing Invariant on `/`
* **Auditors**: `egm-design`, `egm-comprehension`
* **Affected Scope**: Lines 70–93, 97–114, 151–159
* **Description**: If an authenticated client or artisan visits `/`, behavior is undefined. The page will render Sign Up / Log In buttons to an already logged-in user, and the navbar will render the unauthenticated layout.
* **Remediation**: Add a route rule in `src/middleware.ts` redirecting logged-in users to their role dashboard, or render a dynamic "Go to Dashboard" CTA on `/`.

### 6. 🟡 Major: Heading Syntax Pollution with Inline Code Spans
* **Auditor**: `egm-structural`
* **Affected Scope**: Lines 97, 115, 137, 151, 174
* **Description**: H3 and H4 headings embed backticks (e.g., `#### A. Dedicated Home Landing Page (`src/app/page.tsx`)`), breaking automated TOC generators, anchor linking, and markdown linters.
* **Remediation**: Remove backticks from all markdown section headings.

### 7. 🟡 Major: Promotional Copy and Marketing Buzzwords
* **Auditor**: `egm-style`
* **Affected Scope**: Lines 13, 17, 28, 32–34, 56, 138
* **Description**: Uses ungrounded promotional adjectives ("intuitive", "lively", "delightful", "signature") and colloquialisms ("button soup", "smallish figures").
* **Remediation**: Replace with objective technical terms: "landing portal", "vector animation layer", "homogeneous button borders", "compact figures bounded to 120x120px".

### 8. 🟡 Major: Incomplete Control Flow in Mermaid Architecture Diagram
* **Auditor**: `egm-structural`
* **Affected Scope**: Lines 69–93
* **Description**: The diagram models only the positive resolution path (`Role: HOMEOWNER --> ClientDash`), omitting unauthenticated redirects, missing session cookies, and artisan role handling.
* **Remediation**: Expand the Mermaid diagram to illustrate both failure and alternate branches.

### 9. 🟡 Major: Prose Enclosed in Inline Backticks in Alternatives
* **Auditor**: `egm-structural`
* **Affected Scope**: Lines 167, 172, 177
* **Description**: Entire 40-word paragraphs under `Reason for Rejection` are wrapped in backticks, disrupting typography flow and line-wrapping.
* **Remediation**: Convert backtick prose into normal markdown text with bold labels.

### 10. 🟢 Nit: Viewport Height Contrast & Static Pose Deformation
* **Auditor**: `egm-design`
* **Affected Scope**: Lines 115–136, 183–192
* **Description**: On displays with constrained height (<700px), floating SVGs could collide behind text. Furthermore, disabling CSS keyframes via `prefers-reduced-motion` without designed resting SVG coords risks deformed poses.
* **Remediation**: Add media query hiding vignettes below 700px viewport height and define balanced base SVG coordinates.
