# Design Documents Sitemap

| Design Document | Date | Author | Components | Description |
|---|---|---|---|---|
| [Resilient Worker Hub & Persona Switcher Runtime](./resilient_worker_hub_and_persona_switcher.md) | 2026-11-03 | shayl | API (`/api/bootstrap`, `/api/jobs`), `PersonaContext`, `WorkerDashboardPage`, Vercel Platform Envs | Fault-tolerant two-tier fallback architecture preventing UI collapses and infinite loading freezes during database outages or cold starts |
