# Design Documents Sitemap

| Design Document | Date | Author | Components | Description |
|---|---|---|---|---|
| [Resilient Worker Hub & Persona Switcher Runtime](./resilient_worker_hub_and_persona_switcher.md) | 2026-11-03 | shayl | API (`/api/bootstrap`, `/api/jobs`), `PersonaContext`, `WorkerDashboardPage`, Vercel Platform Envs | Fault-tolerant two-tier fallback architecture preventing UI collapses and infinite loading freezes during database outages or cold starts |
| [Client-First Landing Portal & Animated Artisan Canvas](./client_first_landing_and_artisan_canvas.md) | 2026-11-03 | shayl | Landing (`/`), `ArtisanCanvas`, `Navbar`, `middleware.ts` | Clean client-first landing portal with brutalist brand header, centered auth action stack, ambient yellow-skinned artisan animations, and de-cluttered navigation |
| [Milestone Vault & Job Guarantee Architecture](./milestone_vault_and_job_guarantee.md) | 2026-11-03 | shayl | Domain (`vault.ts`, `escrow.ts`), API (`/api/jobs/[id]/milestones`), UI (`EscrowCalculator`, `jobs/[id]`, dashboards) | Plain-English milestone holding architecture replacing alienating escrow jargon, with 0% material pass-through, 48h auto-release timers, and 72h touch-up windows |
