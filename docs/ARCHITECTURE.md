# 🏗️ Architecture Overview

Clean AI is built as a production-grade monorepo to ensure clean separation of concerns, high scalability, and robust typing between the frontend client and the backend services.

---

## 🗂️ Project Structure Layout

```
clean-ai/
├── frontend/               # Next.js 15 App (React 19, Tailwind, shadcn/ui)
│   ├── app/                # Next.js App Router (Layouts & Pages)
│   ├── components/         # Reusable UI library (shadcn/ui wraps)
│   ├── contexts/           # React Context Providers (AuthContext)
│   ├── lib/                # Animations variants, utilities, theme tokens
│   ├── services/           # Api client service layers
│   └── types/              # Frontend TypeScript definitions
├── backend/                # Express.js REST API Server
│   ├── src/
│   │   ├── config/         # Environment, Logger configs
│   │   ├── database/       # Prisma database Client initializers
│   │   ├── middleware/     # Rate limiting, Error, Auth, RequestId checks
│   │   └── modules/        # Domain-based route router files (Stubs)
│   └── prisma/             # Prisma Schema definitions & migrations
├── shared/                 # Shared TypeScript models (Types package)
├── docs/                   # Platform manuals
└── docker/                 # Container Dockerfiles
```

---

## 🎨 Frontend Design Principles

1. **Premium Motion**: Framer Motion is configured globally with ease-in-out spring mechanics, micro-interactions, and staggered entry cascades for stats and grid layouts.
2. **Glassmorphism Theme**: Uses standard tailwind utility variables with custom backdrop filters and gradients for modern authorization components.
3. **TypeScript Strictly Typed**: All entities, options, and response objects are strictly defined to guarantee compiler safety.

---

## ⚙️ Backend Foundation

1. **SOLID & Clean Architecture**: Domain routes are isolated under individual folders inside `src/modules`.
2. **Robust Middleware Stack**:
   - `helmet` for security headers.
   - `cors` with restricted origins.
   - `rateLimiter` to secure endpoints against DDoS.
   - `requestId` injects correlation tracing into log traces.
   - `authMiddleware` and `authorizeRoles` for fine-grained Role-Based Access Control (RBAC).
3. **Database Schema**: Unified database schema in `prisma/schema.prisma` consisting of 14 entities defining relationships between Users, Roles, Vendors, Agents, Bookings, Payments, and Audits.
