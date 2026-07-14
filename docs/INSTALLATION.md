# 🚀 Clean AI — Installation and Setup Guide

This guide details how to install, configure, and boot the Clean AI platform for local development.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** v20.x or higher
- **PostgreSQL** v16.x or higher
- **Docker & Docker Compose** (highly recommended)

---

## 🛠️ Step-by-Step Local Setup

### 1. Repository Setup

Clone the repository and enter the directory:
```bash
git clone https://github.com/your-org/clean-ai.git
cd clean-ai
```

---

### 2. Configure Environment Variables

1. Copy the global `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and verify your PostgreSQL credentials:
   ```env
   # Database Configuration
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=cleanai
   DB_PORT=5432
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cleanai?schema=public"

   # JWT Auth Secrets
   JWT_SECRET="super-secret-jwt-key"
   JWT_REFRESH_SECRET="super-secret-jwt-refresh-key"
   ```

---

### 3. Setup with Docker (Recommended)

To start the database, caching server, and both services:
```bash
# Start containers in background
docker-compose up -d

# Verify containers are running
docker-compose ps
```

The services will be available at:
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api/v1`
- **PostgreSQL**: `localhost:5432`

---

### 4. Manual Setup (Local Processes)

If you prefer to run the Node.js apps directly on your local system:

#### A. Initialize Database
Make sure PostgreSQL is running on your machine, then run the database migrations:
```bash
cd backend
npm install
npx prisma migrate dev
```

#### B. Boot Backend Dev Server
```bash
# From clean-ai/backend directory
npm run dev
```

#### C. Boot Frontend Dev Server
Open a new terminal and run:
```bash
cd ../frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000` to preview the application portals.
