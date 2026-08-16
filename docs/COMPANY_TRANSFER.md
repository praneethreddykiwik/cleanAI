# CleanAI — Company Transfer & Deployment Runbook

This is the single reference for moving CleanAI from personal accounts
(`praneethreddykiwik` GitHub, Neon DB, personal Vercel) to company-owned
infrastructure (company GitHub org, Supabase, company Vercel team).

---

## 1. Architecture: one Next.js app

The repo is **a single Next.js application at the repo root**. There is no
separate frontend/backend folder and no monorepo tooling.

```
app/                 UI routes + app/api/[...slug]/route.ts  ← API entrypoint
server/              the Express application (routes, services, middleware)
  app.ts             createApp() — all 81 endpoints
  http-bridge.ts     runs Express inside a Next.js Route Handler
  index.ts           caches the app across warm invocations
prisma/              schema + seed
components/ lib/ hooks/ ...   the UI
```

Every request to `/api/*` hits the catch-all Route Handler, which passes it
through the existing Express stack. Express sees the **original path**
(`/api/v1/bookings`), so all routes, middleware, auth, and error handling work
exactly as they did on the standalone server — the API was mounted, not
rewritten.

### Deploying

Vercel auto-detects Next.js. No configuration needed:

| Setting | Value |
|---|---|
| Framework Preset | Next.js (auto-detected) |
| Root Directory | `./` |
| Build Command | default (`npm run build` → `prisma generate && next build`) |

Add the environment variables from `.env.example` under
**Settings → Environment Variables**, then deploy. Verify:

- `https://<domain>/` renders the app
- `https://<domain>/api/health` → `200 {"status":"ok","database":"connected"}`
  (`"degraded"` just means no Redis — expected, not a failure)
- `https://<domain>/api/v1/version` → platform version

### Known limitations on serverless

- **Socket.IO does not run.** Vercel functions do not hold open connections.
  `lib/socket.ts` will attempt to connect and fail; real-time features are
  dark. If they become a requirement, host `server/` separately on a
  long-running platform (Render/Railway/Fly) and point
  `NEXT_PUBLIC_SOCKET_URL` at it.
- **BullMQ workers do not run.** Jobs enqueue but nothing consumes them
  without a separate worker process.
- **Redis is optional** — the cache falls back to an in-memory Map. Use a
  hosted Redis (Upstash) and set `REDIS_URL` for a real cache.
- **Rate limiting is per-instance** — counts live in memory, so each warm
  function has its own bucket. Back it with Redis for real enforcement.
- **`maxDuration` is 60s** for the API function (set in `vercel.json`).

### Region note

Functions default to `iad1` (US East). **When you move to Supabase in
`ap-south-1` (Mumbai), add `"regions": ["bom1"]` to `vercel.json`** so
functions run next to the database — otherwise every query pays ~200 ms
crossing continents.

---

## 2. GitHub → company org

`.env` files were **never** committed (verified across full history); only
`.env.example` is tracked.

**Option A — Transfer the repo (keeps history and issues):**
1. GitHub → repo → Settings → Danger Zone → **Transfer ownership** → company org.
2. An org owner accepts.
3. `git remote set-url origin git@github.com:<company-org>/cleanAI.git`

**Option B — Fresh company repo:**
```bash
git remote add company git@github.com:<company-org>/cleanAI.git
git push company main
```

Then import the repo in the company Vercel team and delete the personal project.

---

## 3. Database → Supabase (from Neon)

Only the two connection strings change — `prisma/schema.prisma` already uses
`url` (pooled) + `directUrl` (migrations).

### ⚠️ Blocker: Supabase free-project limit reached

The company Supabase org (**ANIL YERUPULA**, `douoobjulsmndbdzlfwl`) is at its
**2 active free project limit**, so a `cleanai` project could not be created:

| Project | Region | Contents | Safe to reuse? |
|---|---|---|---|
| `Runway` | ap-south-1 | Criska event platform — 11 companies, 19 events, 32 tasks, invoices, contracts | ❌ in active use |
| `kiwik` | ap-south-1 | Marketing site CMS — 58 visitor sessions, products, projects | ❌ in active use |

**Pick one to unblock:** upgrade the org to Pro (~$25/mo, disturbs nothing),
pause a project you no longer need, or create `cleanai` under a new
company-owned Supabase org. Then create it in **ap-south-1**.

### 3a. Point the app at Supabase

Supabase Dashboard → Connect → copy both strings into `DATABASE_URL` (port
6543, `pgbouncer=true`) and `DIRECT_URL` (port 5432).

### 3b. Create the schema

```bash
npm run db:push     # creates all 42 tables
npm run db:seed     # optional: baseline services, vendors, agents
```

There is no `prisma/migrations/` history — this project uses `db push`. If you
prefer raw SQL (e.g. the Supabase SQL editor), `prisma/sql/init_schema.sql` is
the complete pre-generated DDL.

### 3c. Copy existing data (only if it must be kept)

Current Neon contents: **~530 rows, all development data** — 19 users, 5
vendors, 2 agents, 2 bookings, 12 services, and ~330 rows of logs.
**Recommendation: skip the copy and re-seed.** If you do need it:

```bash
pg_dump "<NEON_DIRECT_URL>" --data-only --no-owner --no-privileges \
        --disable-triggers -f neon_data.sql
psql "<SUPABASE_DIRECT_URL>" -v ON_ERROR_STOP=1 \
     -c "SET session_replication_role = replica;" -f neon_data.sql
```

Then pause the Neon project so nothing keeps writing to it.

---

## 4. Environment variables

All keys live in one place now — see `.env.example` for the annotated list.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase pooled string (6543, `pgbouncer=true`) |
| `DIRECT_URL` | ✅ | Supabase direct string (5432) |
| `JWT_SECRET` | ✅ | ≥32 chars — generate fresh |
| `JWT_REFRESH_SECRET` | ✅ | ≥32 chars — generate fresh |
| `GEMINI_API_KEY` / `GROQ_API_KEY` | ✅ one of | Production startup blocked if both missing |
| `NODE_ENV` | ✅ | `production` |
| `CORS_ORIGIN`, `FRONTEND_URL`, `SOCKET_CORS_ORIGIN` | recommended | Production domain |
| `CLOUDINARY_*` | optional | Uploads mock-mode while empty |
| `REDIS_URL` | optional | In-memory fallback otherwise |
| `SMTP_*` | optional | Emails skipped while empty |
| `RAZORPAY_*` | optional | Payments mock-mode while empty |
| `FIREBASE_*` | optional | Push notifications |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional | Maps widgets |
| `NEXT_PUBLIC_API_URL` / `_SOCKET_URL` / `_APP_URL` | **leave unset** | Same-origin is automatic |

---

## 5. 🔴 Secret rotation checklist (do this during the transfer)

All of these are **personal-account credentials** currently in the local `.env`.
Create new company-owned credentials and revoke the old ones — do not copy the
existing values into company infrastructure:

- [ ] **Neon database password** — obsolete after the Supabase move; pause the project
- [ ] **Gemini API key** — recreate under company Google Cloud
- [ ] **Groq API key** — recreate under company account
- [ ] **Cloudinary** cloud name / key / secret — company account
- [ ] **JWT_SECRET / JWT_REFRESH_SECRET** — `openssl rand -base64 48`; this logs out existing sessions, which is fine at cutover
- [ ] Google Maps browser key — restrict to the production domain

---

## 6. Verification

CI (`.github/workflows/ci.yml`) runs on every push: Prisma validate, lint, and
a full `next build` (which type-checks the UI, `server/`, and the bridge).

Verified locally on 2026-08-16 against this branch:

- `npm run build` → exit 0, 34 UI routes + `ƒ /api/[...slug]`
- Live requests through the bridge against the real database:
  - `/api/v1/version` → 200 JSON
  - `/api/health` → 200 `database: connected`
  - `/api/v1/services` → 200 with real rows from Postgres
  - `POST /api/v1/auth/login` → 401 `Invalid credentials` (body parsing + bcrypt + DB all exercised)
  - `/api/v1/users/me` without a token → 401
  - unknown `/api/v1/*` path → 404 **JSON** from Express, not Next's HTML page
- Response headers pass through intact: helmet CSP, CORS, `ratelimit-*`
  (confirming `req.ip` resolves correctly behind the proxy)

## 7. Removed during consolidation

- `docker-compose.yml`, `docker-compose.prod.yml`, `nginx.conf`, `docker/` —
  these built separate `./frontend` and `./backend` images, which no longer
  exist. Re-add a single root `Dockerfile` if container deploys are needed.
- `shared/` — a types package imported by nothing.
- `server/server.ts` — the standalone Express bootstrap; Next.js is the server now.
- `scratch/` is kept but excluded from the build (ad-hoc debug scripts).
