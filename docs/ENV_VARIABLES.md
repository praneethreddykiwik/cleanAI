# 🔐 Environment Variables Configuration

This file outlines the parameters required in the local `.env` and `.env.example` configurations to run both Next.js and Express services.

---

## 🌎 Global Environment Options

```env
# ==============================================================================
# Database Configuration
# ==============================================================================
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=cleanai
DB_PORT=5432
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cleanai?schema=public"

# ==============================================================================
# Backend Configuration
# ==============================================================================
PORT=5000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000

# ==============================================================================
# JWT Authentication Secrets
# ==============================================================================
JWT_SECRET="super-secret-jwt-key"
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET="super-secret-jwt-refresh-key"
JWT_REFRESH_EXPIRES_IN=7d

# ==============================================================================
# Cloudinary Configuration (Placeholder)
# ==============================================================================
CLOUDINARY_CLOUD_NAME=cleanai-mock
CLOUDINARY_API_KEY=1234567890
CLOUDINARY_API_SECRET=mock-secret-key
```

---

## 📡 Frontend Environment Configuration

The frontend client expects configurations inside `frontend/.env.local` for communication with backend services:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
