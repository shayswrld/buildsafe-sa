# BuildSafe SA — Trusted South African Skilled-Trades Marketplace

A mobile-first, low-data Progressive Web App (PWA) connecting South African homeowners and businesses with SAPS biometric-cleared builders, plumbers, electricians, painters, tilers, and carpenters—protected by **Regulated Milestone Escrow**, **Masked Anti-Leakage Chat**, **6-Digit Gate Check-In OTPs + Vetted Crew Manifests**, and **Verified Two-Way Ratings**.

## Quick Start (Windows)

Double-click or run `start-dev.cmd` in the project root:

```bat
.\start-dev.cmd
```

Then open **http://localhost:3000** in your browser.

## Key Governance & Monetization Features

1. **Labour-Only Milestone Escrow Split (`src/lib/adapters/escrow.ts`)**
   - Default `5%` Buyer Trust Fee + `8%` Worker Labour Commission (`4%` on repeat bookings).
   - **0% fee on hardware-store material slips** (Builders Warehouse / Cashbuild receipts reimbursed at exact cost so builders never lose margin on tiles, cement, or paint).
   - **Credited Call-Out Deposit** (`R200–R300`) locks commitment on-platform before phone numbers or street addresses are revealed.
   - **1-Tap Scope Variation Mini-Milestones** solve mid-job hidden damage without awkward cash arguments.

2. **3-Tier POPIA + AFISwitch/HURU SAPS Vetting (`src/lib/security/sa-id.ts`, `src/lib/adapters/vetting.ts`)**
   - **Tier 1 (Free Browse Only):** Official 13-digit SA ID Home Affairs Luhn checksum + POPIA masking + Live Selfie match. Lets roadside artisans see real local jobs nearby.
   - **Tier 2 (Mandatory to Quote):** POPIA biometric consent + `R200` HURU/PostNet fingerprint clearance against SAPS Criminal Record Centre.
   - **Tier 3 (Statutory CoC Specialist):** Verified **PIRB**, **ECB Wireman's License**, **NHBRC**, and **SAQCC Gas** licenses enforced automatically on regulated jobs.

3. **Gate Check-In OTP + Vetted On-Site Crew Manifest (`src/lib/security/gate-otp.ts`, `src/lib/governance.ts`)**
   - Eliminates the industry-wide *"Subcontractor Bait-and-Switch"* loophole: every helper/assistant accompanying a lead builder must also be SAPS-cleared and displayed on the homeowner's Gate Pass.

4. **Pre-Escrow Anti-Leakage Masked Chat (`src/lib/security/anti-leakage.ts`)**
   - Automatically redacts `+27` / `082` numbers, spelled-out digits, emails, links, and `"pay cash"` / `"eWallet"` bypass attempts before Escrow is funded.

5. **Verified Two-Way Ratings**
   - Both Homeowners and Artisans earn verified composite trust ratings after Escrow-backed jobs.

## Running Automated Tests

```bat
cmd.exe /c scripts\with-node.cmd npm.cmd run test
```

## DevOps & Deployment

### CI/CD Workflow
- GitHub Actions pipeline configured in `.github/workflows/ci.yml`.
- Automatically executes linting, Prisma client generation, Vitest test suites, and Next.js production builds on all pushes and pull requests to `main`.

### Docker Deployment
Run containerized locally or in production:

```bash
docker compose up --build -d
```
The application will be served at `http://localhost:3000`.

