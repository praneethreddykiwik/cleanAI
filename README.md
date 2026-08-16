# 🏠 Clean AI — AI-Powered Home Services Platform

<p align="center">
  <img src="docs/assets/logo.png" alt="Clean AI Logo" width="120" />
</p>

<p align="center">
  <strong>Enterprise-grade AI Home Services Marketplace</strong><br />
  Connecting customers with verified home service vendors through intelligent matching.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwindcss" />
</p>

---

## 📋 Overview

Clean AI is a production-grade **AI-powered Home Services Marketplace** that connects customers with verified home service vendors. The platform operates as a marketplace:

```
Customer Books Service
         ↓
Platform Finds Vendors
         ↓
Vendor Assigns Agent
         ↓
Agent Completes Work
         ↓
Customer Pays & Reviews
```

## 🏗️ Project Structure

A **single Next.js application** — the UI and the API run in one process.

```
cleanAI/
├── app/               # UI routes (Customer, Vendor, Admin portals)
│   └── api/[...slug]/ # every /api/* request enters here
├── server/            # the Express API — routes, services, middleware
│   ├── app.ts         # createApp(): all 81 endpoints
│   └── http-bridge.ts # runs Express inside a Next.js Route Handler
├── prisma/            # schema + seed
├── components/ lib/ hooks/ contexts/ services/   # UI code
├── docs/              # documentation
├── .env.example
└── README.md
```

The API is *mounted*, not rewritten: Express receives the original path
(`/api/v1/bookings`), so every route, middleware, and error handler behaves
exactly as it did when it ran as a standalone server.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Supabase, or local Postgres 16+)

```bash
# Clone the repository
git clone https://github.com/<org>/cleanAI.git
cd cleanAI

# Configure — one file for the whole app
cp .env.example .env.local
# Set DATABASE_URL, DIRECT_URL, JWT_SECRET, JWT_REFRESH_SECRET,
# and one of GEMINI_API_KEY / GROQ_API_KEY

npm install
npm run db:push     # create the tables (this project uses db push, not migrations)
npm run db:seed     # optional: baseline services, vendors, agents

npm run dev         # UI + API together on http://localhost:3000
```

Check it came up: <http://localhost:3000/api/health> should report
`"database":"connected"`.

> **Note:** Socket.IO and BullMQ workers need a long-running server and do not
> run on Vercel. See [docs/COMPANY_TRANSFER.md](docs/COMPANY_TRANSFER.md).

> **Deploying or handing this repo over?** See
> [docs/COMPANY_TRANSFER.md](docs/COMPANY_TRANSFER.md) for the Vercel setup,
> the Supabase migration, and the secret-rotation checklist.

## 🎯 User Roles

| Role | Portal | Description |
|------|--------|-------------|
| **Customer** | `/customer` | Books home services, tracks bookings |
| **Vendor** | `/vendor` | Manages jobs, assigns agents |
| **Agent** | `/agent` | Field worker, completes jobs |
| **Admin** | `/admin` | Platform management, oversight |

## 🧰 Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with Server Components
- **TypeScript** (strict mode)
- **Tailwind CSS** with custom design tokens
- **shadcn/ui** component library
- **Framer Motion** for premium animations
- **TanStack Query** for data fetching
- **React Hook Form + Zod** for forms

### Backend
- **Node.js + Express.js** with TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT** authentication with refresh tokens
- **RBAC** role-based access control
- **Winston** logging
- **Redis** for session/cache

### Infrastructure
- **PostgreSQL 16** database
- **Redis 7** for caching
- **Docker + Docker Compose**
- **Cloudinary** for media storage

## 📚 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Coding Standards](docs/CODING_STANDARDS.md)
- [Environment Variables](docs/ENV_VARIABLES.md)

## 🎨 Design System

The UI follows a premium enterprise SaaS design system inspired by:
- **Apple** → Polish and fluidity
- **Linear** → Speed and minimal interactions
- **Stripe Dashboard** → Clean data presentation
- **Vercel** → Elegant layouts

## 📁 Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Current | UI + Architecture + Auth + DB Foundation |
| **Phase 2** | 🔜 Planned | Manual Booking Engine + Real-time |
| **Phase 3** | 🔜 Planned | AI Integration + Smart Matching |
| **Phase 4** | 🔜 Planned | Advanced AI + Analytics + ML |

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ by the Clean AI Team</p>
