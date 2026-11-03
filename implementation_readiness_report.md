# Implementation Readiness Review Report (Stage 9)

* **Target Document**: `docs/designs/client_first_landing_and_artisan_canvas.md`
* **Auditors**: Implementation Readiness Lead (`egm-implementation-readiness`), Codebase Quality Auditor (`egm-codebase-details`)
* **Scope**: DetailedRange (Lines 195–273)
* **Standard**: Implementation Readiness Standard (`implementation-readiness-standard.md`)

---

## Executive Summary

The Detailed Implementation Plan was audited against the active codebase files:
- `src/middleware.ts`
- `src/components/Navbar.tsx`
- `src/components/PersonaContext.tsx`
- `src/app/globals.css`
- `package.json`
- `vitest.config.ts`

While the overall execution sequence is logical, two critical blockers prevent direct execution by an engineer without making architectural guesses or encountering build/test failures:
1. **Middleware Hardcoded Logic**: Modifying `PUBLIC_EXACT_PATHS` alone fails to open the landing page due to the hardcoded `pathname === "/"` clause on line 52.
2. **Testing Infrastructure Incompatibility**: Testing Library and DOM environments are missing from `package.json` and `vitest.config.ts`.

---

## Findings

### 1. 🔴 Blocker: Incomplete Middleware Route Guard Adjustment
* **Auditors**: `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope**: Lines 203, 233–238; `src/middleware.ts#L49-L58`
* **Codebase Reality**: Line 52 contains:
  ```typescript
  if (pathname === "/" || (!isPublicPage && !isAuthPage)) {
    const loginUrl = new URL("/login", request.url);
    ...
    return NextResponse.redirect(loginUrl);
  }
  ```
  Adding `"/"` to `PUBLIC_EXACT_PATHS` sets `isPublicPage = true`, but `pathname === "/"` evaluates to `true` independently and forces a redirect to `/login`.
* **Actionable Fix**: The implementation plan must explicitly instruct modifying line 52 to remove `pathname === "/" ||`, simplifying the guard to `if (!isPublicPage && !isAuthPage)`.

### 2. 🔴 Blocker: Testing Infrastructure Mismatch for React Component Tests
* **Auditors**: `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope**: Lines 204, 249–256, 264; `vitest.config.ts#L4-L8`, `package.json#L23-L34`
* **Codebase Reality**:
  1. `vitest.config.ts` sets `include: ["src/**/*.test.ts", "tests/**/*.test.ts"]`, which ignores `.tsx` files entirely.
  2. `vitest.config.ts` sets `environment: "node"`.
  3. `package.json` contains neither `@testing-library/react` nor `jsdom`/`happy-dom`.
* **Actionable Fix**: Update the plan to create `tests/landing-page.test.ts` as a Node-safe route integration test checking middleware headers and status codes, OR enumerate modifying `package.json` and `vitest.config.ts` to add `@testing-library/react` and `jsdom`.

### 3. 🟡 Major: Actionability Gaps in `ArtisanCanvas.tsx` Specification
* **Auditor**: `egm-implementation-readiness`
* **Affected Scope**: Lines 200, 208–217
* **Codebase Reality**: Lacks concrete component props (`className?: string`), viewport boundaries (`viewBox="0 0 120 120"`), and container layout classes.
* **Actionable Fix**: Provide concrete component signatures and absolute positioning container markup for the three vignettes.

### 4. 🟡 Major: Keyframe Classes & Redundant Reduced-Motion Block
* **Auditors**: `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope**: Lines 199, 239–248; `src/app/globals.css#L69-L84`
* **Codebase Reality**:
  1. `src/app/globals.css` already contains a universal `prefers-reduced-motion` reset that sets animation durations to `0.01ms !important`.
  2. Declaring raw `@keyframes` without the corresponding utility classes (`.animate-saw-motion`, etc.) leaves elements without styling classes.
* **Actionable Fix**: Specify exact animation utility classes and note that the universal reduced-motion reset is already present.

### 5. 🟡 Major: Ambiguity in `Navbar.tsx` Unauthenticated vs Authenticated Rendering
* **Auditors**: `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope**: Lines 202, 226–232; `src/components/Navbar.tsx`
* **Codebase Reality**: Line 230 describes unauthenticated rendering based on pathname (`/`, `/login`, `/signup`). The plan needs to clarify whether this check uses `pathname` or session state, how the avatar dropdown handles state, and how mobile navigation renders in unauthenticated view.
* **Actionable Fix**: Specify that `Navbar.tsx` checks `["/", "/login", "/signup"].includes(pathname)` for unauthenticated views, define the dropdown items (`My Projects`, `Settings`, `Sign Out`), and specify mobile drawer contents.

### 6. 🟢 Nit: Omission of Secondary Browse Link in Implementation Details
* **Auditor**: `egm-implementation-readiness`
* **Affected Scope**: Lines 201, 218–225
* **Actionable Fix**: Include `"Browse Public Trades Without Signing In →"` linking to `/jobs` in the file modification details for `src/app/page.tsx`.
