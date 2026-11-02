# Project: BuildSafe SA Brutalist-Minimalistic UI Redesign

## Architecture
- **Framework & Runtime**: Next.js 15.5.28 App Router, React 19.0.0, TypeScript 5.8.2, Node v22.14.0 (`scripts\with-node.cmd`).
- **Styling Architecture**: Tailwind CSS 3.4.17 with custom theme tokens (`brick`, `mortar`, `iron`, `safety`, `shadow-brutal`).
- **Component & State Architecture**:
  - Global Shell: `layout.tsx`, `Navbar.tsx`, `PersonaContext.tsx`
  - Client state: React context for persona switching, local component state for progressive disclosure tabs, accordions, and stepped forms.
  - Server & API: Next.js API routes (`/api/jobs`, `/api/jobs/[id]`, `/api/worker/vetting`, `/api/admin`, `/api/bootstrap`) consumed without changing schemas.
- **Brutalist Design Language**:
  - Palette: **Brick Colour Palette** representing physical building (Burnt Terracotta `#B93815`, Wrought Iron `#141416`, Mortar Chalk `#F8F6F2`, Stark White `#FFFFFF`, Construction Ochre `#D97706`).
  - Geometry: Zero border radius (`rounded-none`), sharp solid iron borders (`border-2 border-[#141416]`), directional hard shadows (`shadow-[3px_3px_0px_0px_#141416]`).
  - Typography: Raw architectural grotesque sans display headers, bold uppercase section tags (`// 01 · ...`), and tabular monospaced figures (`font-mono tabular-nums`) for currency, IDs, OTPs, and metrics.
  - Purposeful Animations: Mechanical micro-interactions (100ms button depressions, 150ms accordion disclosures, 150ms tab switches, animated escrow proportion bars, OTP verified stamps) with `motion-reduce` support.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Brick Theme Tokens & Global Styles | Configure Brick palette, iron borders, brutalist shadow tokens, and base typography in Tailwind & CSS | M1 | Survey (R1) |
| 2 | Brutalist Navigation Shell | Consolidate stacked header into clean single-tier brutalist bar, compact persona toggle, standardized breadcrumbs | M1 | Survey (R1, R2) |
| 3 | Home Page Hero & Trust Metrics | Redesign hero with bold brutalist framing, focused CTAs, and 3 high-contrast monospace trust indicators | M2 | Survey (R1, R2) |
| 4 | Collapsible Escrow Calculator | Move embedded hero calculator into a clean expandable brutalist drawer with live reactive sliders | M2 | Survey (R2, R3) |
| 5 | Tabbed Walkthrough & Competitor Grid | Convert 4 sprawling scenario cards into 4-segment tab panel and simplify competitor comparison grid | M2 | Survey (R1, R2) |
| 6 | 3-Step Job Creation Wizard | Restructure `/jobs/new` into a progressive 3-step wizard (Trade -> Scope & Problem chips -> Location/Budget/Deposit) | M2 | Survey (R2, R3) |
| 7 | Jobs Marketplace Restyle | Restyle `/jobs` with brutalist job cards, trade filter pills, and status tags | M2 | Survey (R1, R2) |
| 8 | Job Workspace Tabbed Architecture | Partition monolithic `/jobs/[id]` into 5 dedicated tabs: Escrow, Gate Pass, Quotes, Chat, Ratings | M3 | Survey (R1, R2) |
| 9 | Lifecycle-Aware Workspace Activation | Automatically default to the appropriate tab based on job stage (Quotes -> Gate Pass -> Escrow -> Ratings) | M3 | Survey (R2) |
| 10 | Mechanical Gate OTP & Verification Stamp | Add tactile 6-digit OTP input, verified stamp snap animation, and emergency panic button | M3 | Survey (R1, R3) |
| 11 | Tactile Escrow Actions & Variation Drawer | Interactive milestone release buttons with tactile press states and collapsible variation order form | M3 | Survey (R2, R3) |
| 12 | Dedicated Masked Chat & Ratings Panels | Provide focused full-width layout for anti-leakage chat and clean review submission forms | M3 | Survey (R1, R2) |
| 13 | Linear Artisan Onboarding & Dev Sandbox | Reorganize 3-tier vetting into linear tracker and tuck sandbox webhook buttons into collapsible testing drawer | M4 | Survey (R1, R2) |
| 14 | Brutalist Artisan Dashboard | Redesign `/worker/dashboard` with fast-payout wallet card, active jobs, and open quoting feed | M4 | Survey (R1, R2) |
| 15 | 3-Panel Admin Console | Partition `/admin` into 3 segmented sub-panels: Ledger, Compliance & Safety Queue, and Take-Rate Config | M4 | Survey (R1, R2) |
| 16 | Mechanical Button & Micro-Interactions | Tactile button press states, active tab transitions, and smooth accordion disclosures across all views | M1-M4 | Survey (R3) |
| 17 | E2E Testing Suite (Tiers 1-4) | Comprehensive opaque-box test suite covering all features, boundaries, interactions, and user workflows | M-E2E | Survey (AC) |
| 18 | Adversarial Coverage Hardening & Verification | White-box adversarial testing, full test suite execution, and forensic integrity audit | M5 | Survey (AC) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System, Theme Tokens & Global Shell | `tailwind.config.ts`, `globals.css`, `Navbar.tsx`, `layout.tsx` | none | DONE |
| M2 | Home Page & Job Creation Wizard | `src/app/page.tsx`, `src/app/jobs/new/page.tsx`, `src/app/jobs/page.tsx` | M1 | DONE |
| M3 | Job Workspace Command Center | `src/app/jobs/[id]/page.tsx` | M1 | DONE |
| M4 | Worker Hub & Admin Console | `src/app/worker/onboarding/page.tsx`, `src/app/worker/dashboard/page.tsx`, `src/app/admin/page.tsx` | M1 | DONE |
| M-E2E | E2E Testing Track | Design test runner, test harness, and Tiers 1-4 test cases; publish TEST_READY.md | none | DONE |
| M5 | Final Milestone: E2E Verification & Forensic Audit | Pass 100% of E2E test suite (Phase 1) + Adversarial hardening & Forensic Audit (Phase 2) | M2, M3, M4, M-E2E | DONE |

## Interface Contracts

### Design Tokens & Theme Contract (`M1` -> `M2`, `M3`, `M4`)
- **Colors**:
  - `bg-mortar-100` (`#F8F6F2`) for global body canvas background.
  - `bg-white` for stark content blocks and modular cards.
  - `text-iron-950` (`#141416`) for primary high-contrast headings and body text.
  - `bg-brick-600` (`#B93815`) and `hover:bg-brick-700` (`#9C2A10`) for primary action buttons and structural highlights.
  - `border-iron-950` (`#141416`) for all primary container and element borders (`border-2`).
  - `text-safety-600` / `bg-safety-50` for warning states and alerts.
- **Shadows**:
  - `shadow-brutal`: `3px 3px 0px 0px #141416`
  - `shadow-brutal-sm`: `2px 2px 0px 0px #141416`
  - `shadow-brutal-brick`: `3px 3px 0px 0px #B93815`
  - Active press: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`
- **Borders & Corners**:
  - Always `rounded-none`. Zero pill buttons, zero rounded cards.
- **Typography**:
  - Headers: `font-black tracking-tight text-iron-950`
  - Monospace Data: `font-mono tabular-nums` for currency (`R5,050.00`), OTPs (`482915`), IDs, dates, and status codes.

### Navigation & Breadcrumb Contract (`M1` -> `M2`, `M3`, `M4`)
- Breadcrumbs component or markup:
  - Format: `<nav className="text-xs font-mono uppercase tracking-widest text-iron-700 mb-4">HOME / JOBS / ...</nav>`
- Persona Switcher in `Navbar.tsx`:
  - Retains all state in `PersonaContext.tsx` (`currentPersona`, `switchPersona`, `config`, `clearedCrewPool`).
  - Compact trigger button displaying current persona with dropdown/dialog.

### Job Detail Tab State Contract (`M3`)
- Active tab values: `'escrow' | 'gate' | 'quotes' | 'chat' | 'ratings'`
- Default initialization:
  - If `job.status === 'OPEN' || job.status === 'QUOTED'` -> `'quotes'`
  - If `job.status === 'ESCROW_FUNDED'` -> `'gate'`
  - If `job.status === 'WORKER_ON_SITE' || job.status === 'WORK_SUBMITTED'` -> `'escrow'`
  - If `job.status === 'COMPLETED'` -> `'ratings'`

## Code Layout
```
c:\Users\shayl\ai-for-africa\
├── src/
│   ├── app/
│   │   ├── globals.css                # Global styles, fonts, base reset [Owned by M1]
│   │   ├── layout.tsx                 # Root layout, persona provider, global footer [Owned by M1]
│   │   ├── page.tsx                   # Home landing page [Owned by M2]
│   │   ├── jobs/
│   │   │   ├── page.tsx               # Jobs marketplace [Owned by M2]
│   │   │   ├── new/page.tsx           # 3-step job creation wizard [Owned by M2]
│   │   │   └── [id]/page.tsx          # 5-tab job workspace command center [Owned by M3]
│   │   ├── worker/
│   │   │   ├── onboarding/page.tsx    # Linear 3-tier artisan vetting [Owned by M4]
│   │   │   └── dashboard/page.tsx     # Artisan dashboard & wallet [Owned by M4]
│   │   └── admin/
│   │       └── page.tsx               # 3-panel admin & revenue console [Owned by M4]
│   └── components/
│       ├── Navbar.tsx                 # Compact brutalist navigation & persona switcher [Owned by M1]
│       └── PersonaContext.tsx         # Persona state & persistence [Preserved]
├── tailwind.config.ts                 # Theme tokens, colors, shadows [Owned by M1]
├── tests/                             # E2E & integration test suites [Owned by M-E2E]
└── scripts/with-node.cmd              # Node runtime wrapper for Windows commands
```
