# 🔐 Environment Variables Reference

This is one Next.js app, so there is **one** set of environment variables.
Template: [`.env.example`](../.env.example).
Validation: `server/config/env.ts` (zod) + `server/config/env.validation.ts`.

Next.js automatically loads `.env.local` and `.env` — no dotenv wiring needed.
On Vercel, add these under **Settings → Environment Variables**.

Only `NEXT_PUBLIC_*` values reach the browser. Everything else stays server-side
inside `server/`.

## Server

| Variable | Required | Default | Used for |
|---|---|---|---|
| `DATABASE_URL` | ✅ prod | localhost postgres | Prisma runtime (pooled, `pgbouncer=true`, port 6543 on Supabase) |
| `DIRECT_URL` | ✅ for schema pushes | — | `npm run db:push` / migrations (direct, port 5432) |
| `JWT_SECRET` | ✅ (≥32 chars) | — | Access-token signing |
| `JWT_REFRESH_SECRET` | ✅ (≥32 chars) | — | Refresh-token signing |
| `JWT_EXPIRES_IN` | — | `15m` | Access-token TTL |
| `JWT_REFRESH_EXPIRES_IN` | — | `7d` | Refresh-token TTL |
| `NODE_ENV` | — | `development` | Mode switches |
| `API_VERSION` | — | `v1` | Route prefix `/api/v1` |
| `CORS_ORIGIN` | — | `http://localhost:3000` | Allowed origin for external clients |
| `FRONTEND_URL` | — | `http://localhost:3000` | Links in emails |
| `SOCKET_CORS_ORIGIN` | — | `http://localhost:3000` | Socket.IO CORS (local only) |
| `GEMINI_API_KEY` | ✅ prod (or GROQ) | — | AI vision/chat (Gemini) |
| `GROQ_API_KEY` | ✅ prod (or GEMINI) | — | AI vision/chat (Groq, takes priority) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | optional | — | Image uploads (mock URLs while empty) |
| `REDIS_URL` | optional | — | Cache/queues; in-memory fallback while empty |
| `SMTP_HOST/PORT/USER/PASS/SECURE/FROM` | optional | gmail defaults | Nodemailer (emails skipped while empty) |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` | optional | — | Payments (mock mode while empty) |
| `FIREBASE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | optional | — | FCM push notifications |
| `PORT` | — | `4000` | Legacy; Next.js controls the port (`next dev -p`) |

Provided automatically by Vercel (never set manually): `VERCEL`, `VERCEL_URL`.

## Browser (`NEXT_PUBLIC_*`)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional | Maps widgets |
| `NEXT_PUBLIC_API_URL` | **leave unset** | UI calls its own origin `/api/v1` (see `lib/config.ts`). Set only to target a different host |
| `NEXT_PUBLIC_SOCKET_URL` | **leave unset** | Same-origin by default |
| `NEXT_PUBLIC_APP_URL` | **leave unset** | Falls back to `window.location.origin` |

## Removed (unused by any code path)

`RESEND_API_KEY`, `CLOUDINARY_URL`, and a server-side `GOOGLE_MAPS_API_KEY`
were deleted in August 2026 — nothing read them. Re-add only when a consumer
exists.
