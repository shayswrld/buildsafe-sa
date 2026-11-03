# Project: BuildSafe SA Subtractive Codebase Review & Dead Code Elimination

## Architecture
- **Framework & Runtime**: Next.js 15.5.28 App Router, React 19.0.0, TypeScript 5.8.2, Node v22.14.0 (`scripts\with-node.cmd`).
- **Subtractive Methodology**: Strict adherence to `.agents/skills/subtractive-review/SKILL.md`. Every line must pull its weight; subtract before adding; zero dead abstractions; 100% preservation of security, error handling, accessibility, and active test assertions.
- **Scope Boundaries**:
  - `src/lib/` (12 modules, utilities, adapters, security algorithms)
  - `src/components/` (`Navbar.tsx`, `PersonaContext.tsx`, `EscrowCalculator.tsx`)
  - `src/app/` (16 API route handlers, 15 pages and layouts, `globals.css`)
  - `scripts/` and `bin/` (developer scripts, CLI tools, Windows portable binaries)
  - Root configuration (`package.json`, `tailwind.config.ts`, `vitest.config.ts`, `tsconfig.json`)

## Feature Inventory (Cuts & Debloat Tasks)
| # | Cut / Item | Description | Milestone | Source |
|---|------------|-------------|-----------|--------|
| 1 | Dead Icon Imports Pruning | Prune 15 unused Lucide icon imports across 6 files (`Navbar.tsx`, `signup/page.tsx`, `profile/setup/page.tsx`, `login/page.tsx`, `jobs/new/page.tsx`, `client/dashboard/page.tsx`) | M1 | Survey (Explorers 2 & 3) |
| 2 | Dead Route Parameters & Variables | Remove uncalled `req: NextRequest` from `/api/auth/logout` and `/api/auth/me`, and unread `popiaConsent` destructuring from `/api/auth/profile-setup` | M1 | Survey (Explorers 1 & 3) |
| 3 | Unexport 25 Internal Types & Interfaces | Remove public `export` from 25 internal interfaces/types in `governance.ts`, `escrow.ts`, `vetting.ts`, `server.ts`, `session.ts`, `validation.ts`, `PersonaContext.tsx`, `Navbar.tsx` | M1 | Survey (Explorer 1) |
| 4 | Collapse `SimulatedTradeSafeAdapter` Class | Replace premature single-method class and orphan interface `EscrowProviderDepositResult` with clean object literal `escrowAdapter` in `src/lib/adapters/escrow.ts` | M1 | Survey (Explorer 1) |
| 5 | Remove Dead In-Memory Mock Registration | Remove unused mock `register` method and orphan `customLocalUsers` filter in `src/components/PersonaContext.tsx` (-65 LOC) | M1 | Survey (Explorer 2) |
| 6 | Prune Dead Navbar Flexibility & Fix Condition | Remove unused `items` & `className` props from `Breadcrumbs` and fix `{config.platformName ? "BUILDSAFE" : "BUILDSAFE"}` in `src/components/Navbar.tsx` | M1 | Survey (Explorer 2) |
| 7 | Prune 8 Dead CSS Layer Classes | Remove 8 unreferenced `.brutal-*` component classes from `src/app/globals.css` (-34 LOC) | M1 | Survey (Explorer 2) |
| 8 | Debloat Tailwind Config | Remove non-existent `./src/pages` scan glob and unused `brand` and `amberHub` backward-compatibility color maps in `tailwind.config.ts` | M1 | Survey (Explorers 2 & 3) |
| 9 | Remove Unused Package Dependency | Remove unimported `"clsx": "^2.1.1"` dependency from `package.json` | M1 | Survey (Explorer 3) |
| 10 | Delete Zombie Scripts | Safely remove unreferenced scripts `scripts/gh.cmd`, `scripts/git.cmd`, and `scripts/set-dev-passwords.ts` (-32 LOC) | M1 | Survey (Explorer 3) |
| 11 | Shrink Defensive URL Parsing in Jobs API | Replace 9-line manual `try/catch` URL parsing with native `req.nextUrl.searchParams.get("homeownerId")` in `src/app/api/jobs/route.ts` | M1 | Survey (Explorers 1 & 3) |
| 12 | Shrink Breadcrumb Resolver in Navbar | Flatten 16-line `if/else if` ladder into concise 6-line dictionary lookup in `src/components/Navbar.tsx` | M1 | Survey (Explorer 2) |
| 13 | Shrink Status Badge & Tab Resolvers | Flatten repetitive switch statements in `jobs/page.tsx`, `client/dashboard/page.tsx`, and `jobs/[id]/page.tsx` using record mappings | M1 | Survey (Explorer 2) |
| 14 | Multi-Agent Review & Challenge | Independent review (2 Reviewers) and empirical stress-testing (2 Challengers) | M2 | AC Verification |
| 15 | Forensic Integrity Audit | Forensic integrity audit (teamwork_auditor) verifying genuine deletions and zero facades | M3 | AC Gate |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Safe Deletions & Codebase Shrink | Execute Cuts 1–13 across `src/`, `scripts/`, and root configs; verify test suite and build | none | DONE |
| M2 | Review & Challenge Verification | 2 Reviewers + 2 Challengers verify zero regressions, invariant preservation, and test suite execution | M1 | DONE |
| M3 | Forensic Integrity Audit | Forensic Auditor validates integrity mode, verifies zero regressions, and confirms no facade code | M2 | DONE |

## Interface Contracts & Preserved Invariants
- **Security & Cryptography**:
  - Home Affairs Luhn 13-digit checksum algorithm (`src/lib/security/sa-id.ts`) is strictly preserved.
  - Crypto scrypt dummy hash timing-attack mitigation (`src/lib/auth/password.ts`) is strictly preserved.
  - 3-tier worker security vetting rules and clearance checks (`src/lib/governance.ts`) are strictly preserved.
  - Pre-escrow chat anti-leakage sanitization and phone/email masking (`src/lib/security/anti-leakage.ts`) are strictly preserved.
  - Gate OTP 6-digit verification and emergency panic triggers (`src/lib/security/gate-otp.ts`) are strictly preserved.
- **Accessibility & UX**:
  - All ARIA attributes (`aria-label="Breadcrumbs"`, `aria-label="Select Active Demo Persona"`, `aria-label="Primary Navigation"`, etc.), focus states, and semantic HTML elements remain 100% intact.
- **External I/O & Error Handling**:
  - All try/catch blocks handling external database, network, or filesystem operations remain 100% intact.
- **Active Test Assertions**:
  - All 17 existing test suites (164 tests) and route accessibility checks in `tests/` remain 100% passing without modification.
- **Execution Environment**:
  - `bin/` binaries (`node`, `git`) and `scripts/with-node.cmd` are critical local execution dependencies and must NOT be removed.

## Code Layout & Ownership
- Worker `teamwork_worker_subtractive`: Exclusive write ownership of:
  - `src/lib/governance.ts`, `src/lib/adapters/escrow.ts`, `src/lib/adapters/vetting.ts`, `src/lib/auth/server.ts`, `src/lib/auth/session.ts`, `src/lib/auth/validation.ts`
  - `src/components/PersonaContext.tsx`, `src/components/Navbar.tsx`
  - `src/app/globals.css`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`, `src/app/api/auth/profile-setup/route.ts`, `src/app/api/jobs/route.ts`
  - `src/app/signup/page.tsx`, `src/app/profile/setup/page.tsx`, `src/app/login/page.tsx`, `src/app/jobs/new/page.tsx`, `src/app/client/dashboard/page.tsx`, `src/app/jobs/page.tsx`, `src/app/jobs/[id]/page.tsx`
  - `scripts/gh.cmd`, `scripts/git.cmd`, `scripts/set-dev-passwords.ts`
  - `tailwind.config.ts`, `package.json`
