# BuildSafe SA — Deployment Guide (Vercel + Neon)

This guide walks through deploying BuildSafe SA using **Vercel** (Hobby/Free tier) for frontend/serverless compute and **Neon** (Free tier) for serverless PostgreSQL.

---

## 1. Neon Database Setup

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project**:
   * **Project Name**: `buildsafe-sa`
   * **Region**: Choose the nearest region (e.g., `Europe (Frankfurt)` or `Europe (Ireland)` for best connectivity to South Africa).
3. On the Neon Dashboard, go to **Connection Details**:
   * Select **Pooled connection**: Copy this connection string. This is your `DATABASE_URL`.
   * Uncheck "Connection pooling" (or view **Direct connection**): Copy this connection string. This is your `DIRECT_URL`.

---

## 2. Push Schema & Seed Initial Data to Neon

In your local terminal or `.env` file, paste your Neon connection strings:

```env
DATABASE_URL="postgresql://[user]:[password]@[ep-id]-pooler.[region].aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[ep-id].[region].aws.neon.tech/neondb?sslmode=require"
```

Then run the following commands to create the database tables and populate mock test artisans & jobs:

```bash
# Push Prisma schema to Neon
npm run db:push

# (Optional) Seed realistic South African artisan & platform data
npm run db:seed
```

---

## 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** > **Project**.
3. Select and import the `ai-for-africa` (or `buildsafe-sa`) GitHub repository.
4. In the **Configure Project** screen:
   * **Framework Preset**: Next.js (automatically detected)
   * **Root Directory**: `./`
   * **Build Command**: `prisma generate && next build` (default `npm run build`)
   * **Install Command**: `npm install` (runs `postinstall: prisma generate` automatically)
5. Expand **Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...-pooler...` | Neon pooled connection string |
| `DIRECT_URL` | `postgresql://...` | Neon direct connection string |
| `NEXT_PUBLIC_APP_NAME` | `BuildSafe SA` | Branding header title |
| `HURU_API_KEY` | *(leave empty or enter test key)* | Falls back to internal sandbox simulator if empty |
| `TRADESAFE_CLIENT_ID` | *(leave empty or enter test key)* | Falls back to internal sandbox simulator if empty |
| `TRADESAFE_CLIENT_SECRET` | *(leave empty or enter test key)* | Falls back to internal sandbox simulator if empty |

6. Click **Deploy**. Vercel will build and assign your production URL (e.g., `https://buildsafe-sa.vercel.app`).

---

## 4. CI/CD Workflow Explained

The deployment workflow is fully automated via Git:

```
[Developer Branch] ──> [Pull Request] ──> [GitHub Actions CI: Test & Build]
                                       ──> [Vercel Preview Deployment URL]
                                                      │
                                                      ▼ (Merge to main)
                                         [GitHub Actions: Verification]
                                         [Vercel: Instant Production Deploy]
```

### GitHub Pull Requests:
* Every PR triggers GitHub Actions (`.github/workflows/ci.yml`) to run the 101 unit/integration tests and type checks.
* Vercel automatically spins up an isolated **Preview Deployment** and leaves a comment with the live preview link on the pull request.

### Merges to `main`:
* Vercel automatically deploys updates to the production domain.
* **Optional Automatic DB Sync**: If you want GitHub Actions to automatically run `prisma db push` on merge to `main`:
  1. Go to GitHub Repo > **Settings** > **Secrets and variables** > **Actions**.
  2. Add Secrets: `DATABASE_URL` and `DIRECT_URL`.
  3. Under Variables, add `ENABLE_AUTO_DB_SYNC = true`.
