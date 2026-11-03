# Intermediate Zoom Out Architectural Audit Report (Stage 8)

* **Target Document**: `docs/designs/client_first_landing_and_artisan_canvas.md`
* **Auditor**: Skeptical Architect (`egm-zoom-out`)
* **Reference**: `zoom_out_report.md`, `comprehension_report.md`, `critic_report.md`
* **Scope**: Full File (Lines 1–273)
* **Standard**: `resources/document_standards/zoom-out-standard.md`

---

## Synthesis of Stage 5, 6, and 7 Findings

The intermediate zoom-out audit synthesizes observations across the architecture, comprehension, and critic reviews. Across all three review disciplines, a clear architectural consensus emerges:

### 1. The Core Functional Fix Is Trivial (Negative LOC)
The underlying problem preventing unauthenticated users from seeing the home page and causing redirect loops is concentrated in two locations:
* `src/middleware.ts`: Line 52 contains an explicit `pathname === "/"` redirect check. Removing that condition and adding `"/"` and `"/jobs"` to `PUBLIC_EXACT_PATHS` instantly restores public landing and trade browsing access.
* `src/components/PersonaContext.tsx`: Hardcodes default `selectedId` to `"user_homeowner_lerato"`, causing client state to think an unauthenticated visitor is logged in. Fixing `selectedId` to initialize as `null` when no session cookie is present eliminates state desynchronization.

### 2. Guarding Marketplace Discovery Against Over-Simplification
The Critic and Comprehension reviews validated the Stage 5 Zoom Out finding: reducing `src/app/page.tsx` to an auth-only splash screen with zero trade or trust content damages consumer discovery. Prospective South African homeowners require immediate visibility into trade credentials (PIRB, ECB, NHBRC), SAPS biometric clearance, and escrow mechanics before committing to sign up. The landing page must present the prominent Sign Up and Log In actions *alongside* clear value anchors and public trade discovery.

### 3. Simplifying the Animation Layer
The proposal to construct `ArtisanCanvas.tsx` with dozens of hand-plotted SVG paths and custom physics keyframes represents high implementation complexity. If animated figures are implemented, they must be tightly constrained to compact, self-contained SVG vectors that load instantly without layout shifts or battery drain, with clean fallback coordinates when `prefers-reduced-motion` is active.

### 4. Convergence Gate Status
All architectural blockers identified in Stages 5–7 are readily resolvable through concrete textual edits in `docs/designs/client_first_landing_and_artisan_canvas.md`. The design is ready to proceed through Implementation Readiness synthesis.
