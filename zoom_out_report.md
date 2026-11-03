# Zoom Out Architectural Audit Report (Stage 5)

* **Target Document**: `docs/designs/client_first_landing_and_artisan_canvas.md`
* **Auditor**: Skeptical Architect (`egm-zoom-out`)
* **Scope**: Full File (Lines 1–273)
* **Standard**: `resources/document_standards/zoom-out-standard.md`
* **Status**: Rejection / Overhaul Recommended

---

## Executive Summary

The proposed design addresses two valid user complaints: **(1)** top navigation visual clutter ("button soup") and **(2)** confusing client/worker redirects.

However, the proposal introduces a significant **altitude collapse** and **speculative feature creep**:
1. **Destruction of Marketplace Discovery**: Replaces the rich marketplace homepage (`src/app/page.tsx`) with an uninformative auth splash card (only Sign Up and Log In). Homeowners visiting BuildSafe SA need to see trade categories, trust pillars, and escrow calculators prior to registering.
2. **Extreme YAGNI Bloat**: Proposes a complex, hand-drawn vector animation canvas (`ArtisanCanvas.tsx`) with three multi-character trade vignettes and four custom CSS physics keyframes. This adds unnecessary maintenance burden, bundle weight, and layout risk over existing Lucide trade icons.
3. **Misdiagnosed Root Cause**: The redirect loops and persona confusion stem from `PersonaContext.tsx` hardcoding fallback to `user_homeowner_lerato` when unauthenticated, coupled with `src/middleware.ts#L52` hardcoding a redirect for `pathname === "/"`.
4. **Duplication of Brand Lockup**: The proposed brand header inside `src/app/page.tsx` directly duplicates the global header already rendered in `Navbar.tsx` on every page via `layout.tsx`.

---

## Findings

### 1. 🔴 Blocker: Root Problem Misdiagnosis & Conversion Destruction (Replacing Marketplace `/` with an Auth Splash Screen)
* **Affected Scope**: Lines 13–14, 26–29, 33, 97–114, 218–225 (`Overview`, `The Problem §3`, `Goals §G2`, `Component Design §A`, `Target Files §2`)
* **Rationale**: BuildSafe SA is a two-sided construction escrow marketplace. Prospective homeowners visiting the domain need to see trade categories (Plumbing, Electrical, Carpentry), trust anchors (100% SAPS Biometric clearance, 0% slip markups), and the escrow fee calculator before committing to sign up. Replacing `src/app/page.tsx` with a centered card containing only `[ SIGN UP ]` and `[ LOG IN ]` buttons degrades the root route into a duplicate of `src/app/login/page.tsx`.
* **Remediation**: Retain marketplace discovery elements on `/` while positioning the clear Sign Up / Log In CTAs prominently. Remove `pathname === "/"` from `src/middleware.ts#L52` and add `"/"` to `PUBLIC_EXACT_PATHS`.

### 2. 🔴 Blocker: YAGNI & Complexity Bloat (Bespoke Animated Artisan Canvas)
* **Affected Scope**: Lines 34–37, 48, 115–136, 199–200, 208–217, 240–248 (`Goals §G3`, `Open Questions §1`, `Component Design §B`, `Implementation Plan §1–2`, `Target Files §1, §5`)
* **Rationale**: Handcrafting hundreds of lines of bespoke SVG geometry, multi-breakpoint positioning math, and custom CSS translation keyframes in `globals.css` introduces high layout break risk across viewports (320px–1440px) and battery consumption on mobile devices.
* **Remediation**: Evaluate whether to simplify the ambient art into lightweight SVG badge illustrations or leverage existing Lucide iconography with subtle CSS pulse/fade animations.

### 3. 🟡 Major: Omission of Client State Desynchronization in `PersonaContext`
* **Affected Scope**: Lines 22–25, 80–84, 151–159, 233–238 (`The Problem §2`, `Architecture §1`, `Component Design §D`, `Target Files §4`)
* **Rationale**: In `src/components/PersonaContext.tsx#L165`, `selectedId` defaults to `"user_homeowner_lerato"`. Even when unauthenticated, `currentUser` is populated in client memory, causing `Navbar.tsx` to assume the user is logged in. When clicking "Client Hub", the browser makes an unauthenticated request without a cookie, causing middleware to bounce back to `/login?from=/client/dashboard`.
* **Remediation**: Allow `currentUser` in `PersonaContext.tsx` to be `null` when no verified session cookie exists.

### 4. 🟡 Major: Duplication of Global Brand Header Lockup
* **Affected Scope**: Lines 99–106, 222–224 (`Component Design §A`, `Target Files §2`)
* **Rationale**: The proposed brick masonry emblem, monospace `BUILDSAFE SA` logotype, and `ZA` badge are already mounted globally in `Navbar.tsx#L137-L195` via `src/app/layout.tsx`. Rendering the exact same lockup in the page body beneath the navbar creates redundant clutter.
* **Remediation**: Clarify that the top navbar provides the persistent global header; the page hero should feature an action-oriented headline and value proposition rather than duplicating the logo lockup.

### 5. 🟡 Major: Incompatible Test Runner Environment in Plan
* **Affected Scope**: Lines 249–256, 263–264 (`Target Files §6`, `Verification Plan`)
* **Rationale**: The plan specifies writing `tests/landing-page.test.tsx` using Vitest and Testing Library. However, `package.json` lacks `@testing-library/react` and `jsdom`, and `vitest.config.ts` sets `environment: "node"` and excludes `.tsx` files.
* **Remediation**: Update test plan to target Node-safe route/middleware integration tests in `.test.ts`, or explicitly enumerate installing `@testing-library/react` + `jsdom`.

### 6. 🟢 Nit: Low-Level CSS Keyframe Weeds in Architecture Section
* **Affected Scope**: Lines 100–111, 118–131, 242–247
* **Rationale**: Architectural specs should define interfaces and data flow rather than concrete CSS hex codes and physics steps.
