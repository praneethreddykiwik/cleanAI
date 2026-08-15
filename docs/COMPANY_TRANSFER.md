# CleanAI — Company Transfer & Deployment Runbook

This is the single reference for moving CleanAI from personal accounts
(`praneethreddykiwik` GitHub, Neon DB, personal Vercel) to company-owned
infrastructure (company GitHub org, Supabase, company Vercel team).

---

## 1. How the app deploys on Vercel (single project, two services)

The repo is a monorepo: `frontend/` (Next.js) and `backend/` (Express + Prisma).
It deploys as **ONE Vercel project** using [Vercel Services](https://vercel.com/docs/services)
(Beta, available on all plans). The root `vercel.json` defines both services and
routes traffic:

- `/api/*` → `backend` service (Express, entrypoint `src/server.ts`)
- everything else → `frontend` service (Next.js)

Both run on the same domain, so the frontend needs **no** `NEXT_PUBLIC_API_URL`
in production — it falls back to same-origin `/api/v1` (see `frontend/lib/config.ts`)
and CORS is never an issue.

### One-time Vercel dashboard setup (required — this was the build failure)

1. Project → **Settings → Build and Deployment** → set **Framework** to
   **Services** (NOT Next.js — that is why builds failed with
   "No Next.js version detected": the repo root is not a Next.js app).
   Leave Root Directory at the repo root (`./`).
2. Project → **Settings → Environment Variables** → add the backend variables
   (table in §4). Without `DATABASE_URL`/`JWT_SECRET`/one AI key, the backend
   function exits at startup in production.
3. Redeploy from `main`. Verify:
   - `https://<domain>/` renders the app
   - `https://<domain>/api/health` returns JSON (database: connected)
   - `https://<domain>/api/v1/version` returns the platform version

### Known limitations on Vercel serverless (accepted trade-offs)

- **Socket.IO server does not run** — real-time features are disabled on Vercel
  (`src/server.ts` skips it when `process.env.VERCEL` is set). If real-time is
  required later, host the backend on a long-running platform (Render/Railway/Fly)
  and set `NEXT_PUBLIC_SOCKET_URL`.
- **BullMQ queue workers do not run** in serverless functions. Jobs enqueue but
  need a separate worker process (or migrate to Vercel Queues/cron).
- **Redis** is optional — code falls back to an in-memory cache. For real
  caching on Vercel use a hosted Redis (Upstash) and set `REDIS_URL`.
- `express.static()` is ignored — static assets belong in `public/`.

### Region note

Vercel functions default to `iad1` (US East), which matches the current Neon DB
(us-east-1). **When you switch to Supabase in `ap-south-1` (Mumbai), add**
`"regions": ["bom1"]` at the top level of `vercel.json` so functions run next to
the database — otherwise every query pays ~200 ms of cross-continent latency.

---

## 2. GitHub → company org

Everything needed for deploy is committed. `.env` files were **never** committed
(verified across full git history) — only `.env.example` templates are tracked.

**Option A — Transfer the repo (recommended: keeps history, issues, stars):**
1. GitHub → `praneethreddykiwik/cleanAI` → Settings → General → Danger Zone →
   **Transfer ownership** → enter the company org name.
2. An org owner accepts the transfer.
3. Old URLs redirect, but update local remotes anyway:
   `git remote set-url origin git@github.com:<company-org>/cleanAI.git`

**Option B — Fresh company repo:**
```bash
git remote add company git@github.com:<company-org>/cleanAI.git
git push company main
```

**After either option:** in the company Vercel team, import the repo
(Add New → Project) and apply the dashboard setup from §1. Delete/pause the
personal Vercel project once the company one serves traffic.

---

## 3. Database → Supabase (from Neon)

Prisma is provider-agnostic Postgres — only the two connection strings change.
`prisma/schema.prisma` already uses `url` (pooled) + `directUrl` (migrations).

### ⚠️ Blocker: Supabase free-project limit reached

The company Supabase org (**ANIL YERUPULA**, `douoobjulsmndbdzlfwl`) is at its
**2 active free project limit**, so a `cleanai` project could not be created:

| Project | Region | Contents | Safe to reuse? |
|---|---|---|---|
| `Runway` | ap-south-1 | Criska event platform — 11 companies, 19 events, 32 tasks, invoices, contracts | ❌ in active use |
| `kiwik` | ap-south-1 | Marketing site CMS — 58 visitor sessions, products, projects | ❌ in active use |

**Pick one to unblock:**
- **Upgrade the org to Pro** (~$25/mo) → unlimited-ish projects, then create `cleanai`. Recommended: neither existing project gets disturbed.
- **Pause a project** you no longer need (Supabase → Project Settings → Pause).
- **Create `cleanai` under a new Supabase org** owned by the company.

Once a slot is free, create the project in **ap-south-1** (matches the other two,
and Razorpay/India-facing traffic) and continue with 3a below.

### Current data in Neon (as of 2026-08-15)

~530 rows, all development data — 19 users, 5 vendors, 2 agents, 2 bookings,
12 services, plus ~330 rows of logs/sessions. **Recommendation: skip the data
copy (§3c) and re-seed instead.** Nothing here looks like production records.

### 3a. Point the backend at Supabase

Supabase Dashboard → Project → Connect → get both strings:

```env
# Runtime (transaction pooler, port 6543)
DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# Migrations (session pooler, port 5432)
DIRECT_URL="postgresql://postgres.<project-ref>:<db-password>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

### 3b. Create the schema

```bash
cd backend
npx prisma db push        # creates all 42 tables on the empty Supabase DB
npm run db:seed           # optional: seed baseline data
```

(There is no `prisma/migrations/` history — the project uses `db push`.)

Alternative, if you prefer applying SQL directly (e.g. via the Supabase SQL
editor): `backend/prisma/sql/init_schema.sql` is the complete generated DDL —
all enums, tables, indexes, and foreign keys — pre-generated from the Prisma
schema so it can be run without a working Prisma CLI.

### 3c. Copy existing data from Neon (only if production data must be kept)

```bash
# 1. Dump data from Neon (data only — schema comes from prisma db push)
pg_dump "<NEON_DIRECT_URL>" --data-only --no-owner --no-privileges \
        --disable-triggers -f neon_data.sql

# 2. Restore into Supabase (direct connection, port 5432)
psql "<SUPABASE_DIRECT_URL>" -v ON_ERROR_STOP=1 \
     -c "SET session_replication_role = replica;" -f neon_data.sql
```

If the current data is only dev/test data, skip this and re-seed instead.

### 3d. Update env everywhere

- `backend/.env` (local) — swap both URLs
- Vercel → Environment Variables — swap both URLs
- Add `"regions": ["bom1"]` to `vercel.json` (see §1 region note)

Then pause/delete the Neon project so nothing keeps writing to it.

---

## 4. Environment variables on Vercel (company project)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase pooled string (port 6543, `pgbouncer=true`) |
| `DIRECT_URL` | ✅ | Supabase direct string (port 5432) |
| `JWT_SECRET` | ✅ | ≥32 chars — generate fresh, never reuse the dev value |
| `JWT_REFRESH_SECRET` | ✅ | ≥32 chars — generate fresh |
| `GEMINI_API_KEY` / `GROQ_API_KEY` | ✅ one of | Production startup is blocked if both missing |
| `NODE_ENV` | ✅ | `production` |
| `CORS_ORIGIN`, `FRONTEND_URL`, `SOCKET_CORS_ORIGIN` | recommended | Set to the production domain (`*.vercel.app` origins are also auto-allowed) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | optional | Image uploads mock-mode while empty |
| `REDIS_URL` | optional | Upstash `rediss://` URL; in-memory fallback otherwise |
| `SMTP_HOST/PORT/USER/PASS/SECURE/FROM` | optional | Emails skipped while empty |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` | optional | Payments mock-mode while empty |
| `FIREBASE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | optional | Push notifications |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional | Frontend maps |
| `NEXT_PUBLIC_API_URL` / `_SOCKET_URL` / `_APP_URL` | **leave unset** | Same-origin routing is automatic in the single-project setup |

Removed as unused (referenced nowhere in code): `RESEND_API_KEY`,
backend `GOOGLE_MAPS_API_KEY`.

---

## 5. 🔴 Secret rotation checklist (do this during the transfer)

All of these currently exist as **personal-account credentials** in local `.env`
files. When the company takes over, create **new company-owned** credentials and
revoke the old ones — do not copy the old values into company infrastructure:

- [ ] **Neon database password** — obsolete once Supabase migration completes; pause the Neon project
- [ ] **Gemini API key** — create under company Google Cloud, revoke personal key
- [ ] **Groq API key** — create under company account, revoke personal key
- [ ] **Cloudinary** cloud/key/secret — company Cloudinary account (or re-upload assets)
- [ ] **JWT_SECRET / JWT_REFRESH_SECRET** — generate fresh (`openssl rand -base64 48`); this logs out all existing sessions, which is fine at cutover
- [ ] Google Maps browser key — restrict to the production domain

---

## 6. Pre-flight verification (already automated in CI)

`.github/workflows/ci.yml` runs on every push: Prisma validate, backend lint +
`tsc` build, frontend lint + `next build`, and Docker image builds. It is fully
account-agnostic and transfers with the repo.

Local equivalents:

```bash
cd backend  && npm run build     # prisma generate + tsc
cd frontend && npm run build     # next build
```

---

## 7. Repo hygiene notes

- Root `.env` (untracked, iCloud-evicted, unreadable) is **stale** — the live
  configs are `backend/.env` and `frontend/.env.local`. If its contents are ever
  needed, recover via iCloud Drive; otherwise it can be deleted safely.
- `shared/` is referenced by nothing (vestigial types package) — candidate for
  removal in a future cleanup.
- `docker/`, `docker-compose*.yml`, `nginx.conf` support the self-hosted path
  and are unused by the Vercel deployment.
