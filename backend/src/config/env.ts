import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/cleanai?schema=public'),
  JWT_SECRET: z.string().default('super-secret-jwt-key'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('super-secret-jwt-refresh-key'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

// Strict validation of production environment variables
if (process.env.NODE_ENV === 'production') {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GEMINI_API_KEY',
    'REDIS_URL'
  ];
  const missing = requiredVars.filter(v => !process.env[v] || process.env[v] === '');
  if (missing.length > 0) {
    console.error(`❌ CRITICAL ERROR: Missing required environment variables in production: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export const env = parsed.data;
