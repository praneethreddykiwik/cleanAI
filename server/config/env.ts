import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// NOTE: this file targets Zod 4 (shared with the UI's form schemas). Two v3
// idioms had to change: `.default()` now takes the OUTPUT type, so PORT uses
// `z.coerce.number()`, and `error.format()` is gone in favour of `issues`.
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/cleanai?schema=public'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters — never use a default in production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),   // Real AI — Google Gemini 2.5 Flash
  GROQ_API_KEY: z.string().optional(),     // Real AI alternative — Groq Llama Vision (faster/free tier)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Validation runs on FIRST ACCESS, not on import.
 *
 * `next build` evaluates server modules while collecting page data, long
 * before any request — and on a build machine the real secrets are absent by
 * design. Validating at import time would therefore fail every deployment
 * build. Reading a value (which only happens while serving a request) is the
 * correct moment to demand that the environment is complete.
 */
function loadEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Name the offending variables in the Error itself. This message travels
    // back in the HTTP response, so whoever is configuring the deployment can
    // see what is missing without going digging through platform logs.
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    console.error(`❌ Invalid environment variables: ${details}`);
    throw new Error(`Invalid environment variables — ${details}`);
  }

  // Strict production check — only truly fatal vars
  if (parsed.data.NODE_ENV === 'production') {
    const missing: string[] = [];

    if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
    if (!process.env.JWT_SECRET)   missing.push('JWT_SECRET');
    if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');

    // At least one AI provider key is required in production
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      missing.push('GEMINI_API_KEY or GROQ_API_KEY (at least one required)');
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  cached = parsed.data;
  return cached;
}

/**
 * Behaves like a plain object (`env.JWT_SECRET`), but each read resolves
 * through the lazy loader above, so importing this module has no side effects.
 */
export const env: Env = new Proxy({} as Env, {
  get: (_target, prop: string | symbol) => loadEnv()[prop as keyof Env],
  has: (_target, prop) => prop in loadEnv(),
  ownKeys: () => Reflect.ownKeys(loadEnv()),
  getOwnPropertyDescriptor: (_target, prop) =>
    Object.getOwnPropertyDescriptor(loadEnv(), prop),
});
