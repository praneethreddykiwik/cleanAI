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

```
clean-ai/
├── frontend/          # Next.js 15 App (Customer, Vendor, Admin portals)
├── backend/           # Express.js API with Prisma
├── shared/            # Shared TypeScript types
├── docs/              # Documentation
├── docker/            # Docker configurations
├── scripts/           # Utility scripts
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (recommended)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/<org>/cleanAI.git
cd cleanAI

# Copy environment variables (there is no root .env — each app has its own)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit both with your values

# Start all services
docker-compose up -d

# The app will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api/v1
```

### Option 2: Manual Setup

```bash
# 1. Setup Database
# Make sure PostgreSQL is running locally

# 2. Backend Setup
cd backend
cp .env.example .env          # set DATABASE_URL + DIRECT_URL first
npm install
npm run db:push               # this project uses db push, not migrations
npm run db:seed               # optional: baseline services, vendors, agents
npm run dev                   # http://localhost:4000

# 3. Frontend Setup (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

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
