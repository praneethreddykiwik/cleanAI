# 🔐 Environment Variables Reference

Authoritative list of every environment variable the platform reads.
Templates: `backend/.env.example`, `frontend/.env.example`.
Validation: `backend/src/config/env.ts` (zod) + `backend/src/config/env.validation.ts`.

## Backend (`backend/.env` locally · Vercel Project Env Vars in production)

| Variable | Required | Default | Used for |
|---|---|---|---|
| `DATABASE_URL` | ✅ prod | localhost postgres | Prisma runtime (pooled, `pgbouncer=true`, port 6543 on Supabase) |
| `DIRECT_URL` | ✅ for migrations | — | `prisma db push` / migrations (direct, port 5432) |
| `JWT_SECRET` | ✅ (≥32 chars) | — | Access-token signing |
| `JWT_REFRESH_SECRET` | ✅ (≥32 chars) | — | Refresh-token signing |
| `JWT_EXPIRES_IN` | — | `15m` | Access-token TTL |
| `JWT_REFRESH_EXPIRES_IN` | — | `7d` | Refresh-token TTL |
| `NODE_ENV` | — | `development` | Mode switches |
| `PORT` | — | `4000` | Local HTTP port (ignored on Vercel) |
| `API_VERSION` | — | `v1` | Route prefix `/api/v1` |
| `CORS_ORIGIN` | — | `http://localhost:3000` | Allowed browser origin |
| `FRONTEND_URL` | — | `http://localhost:3000` | Links in emails, CORS |
| `SOCKET_CORS_ORIGIN` | — | `http://localhost:3000` | Socket.IO CORS (local only) |
| `GEMINI_API_KEY` | ✅ prod (or GROQ) | — | AI vision/chat (Gemini) |
| `GROQ_API_KEY` | ✅ prod (or GEMINI) | — | AI vision/chat (Groq, takes priority) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | optional | — | Image uploads (mock URLs while empty) |
| `REDIS_URL` | optional | — | Cache/queues; in-memory fallback while empty |
| `SMTP_HOST/PORT/USER/PASS/SECURE/FROM` | optional | gmail defaults | Nodemailer (emails skipped while empty) |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` | optional | — | Payments (mock mode while empty) |
| `FIREBASE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | optional | — | FCM push notifications |

Provided automatically by Vercel (never set manually): `VERCEL`, `VERCEL_URL`.

## Frontend (`frontend/.env.local` locally)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | local only | `http://localhost:4000/api/v1`. **Unset in production** → same-origin `/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | local only | `http://localhost:4000`. **Unset in production** → same origin |
| `NEXT_PUBLIC_APP_URL` | local only | `http://localhost:3000`. **Unset in production** → `window.location.origin` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional | Maps widgets |

## Removed (unused by any code path)

`RESEND_API_KEY`, backend `GOOGLE_MAPS_API_KEY` — deleted from env files
2026-08-15. Re-add only when a consumer exists.
