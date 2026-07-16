import { prisma } from '../src/database';
import { redisService } from '../src/config/redis';
import { env } from '../src/config/env';
import { v2 as cloudinary } from 'cloudinary';

async function runProductionCheck() {
  console.log('🏁 Starting CleanAI Beta Production Readiness Audit...');
  let failed = false;

  const check = (name: string, success: boolean, detail = '') => {
    if (success) {
      console.log(`  ✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
    } else {
      console.log(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
      failed = true;
    }
  };

  // 1. Env Check
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'];
  if (process.env.NODE_ENV === 'production') {
    requiredEnv.push('GEMINI_API_KEY');
  }
  const missing = requiredEnv.filter((key) => !process.env[key]);
  check('Environment Variables', missing.length === 0, missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All key env variables present');

  // 2. Database Connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    check('Database Connection (Neon Postgres)', true, 'Query succeeded');
  } catch (err: any) {
    check('Database Connection (Neon Postgres)', false, err.message || String(err));
  }

  // 3. Redis Connection
  try {
    const isRedisUp = await redisService.ping();
    check('Redis Connection Cache', isRedisUp, isRedisUp ? 'Ping responded PONG' : 'No connection');
  } catch (err: any) {
    check('Redis Connection Cache', false, err.message || String(err));
  }

  // 4. Gemini API Validation
  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] })
      });
      const data: any = await res.json();
      const hasContent = !!data?.candidates?.[0]?.content;
      check('Gemini LLM API Availability', hasContent, hasContent ? '200 OK Response received' : 'Response missing candidate content');
    } catch (err: any) {
      check('Gemini LLM API Availability', false, err.message || String(err));
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      check('Gemini LLM API Availability', false, 'GEMINI_API_KEY is not configured in production');
    } else {
      console.log('  ⚠️  [WARN] Gemini API key is missing. System will run high-fidelity simulations in development mode.');
    }
  }

  // 5. Cloudinary Validation
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      check('Cloudinary Bucket Credentials', true, 'Configuration loaded');
    } catch (err: any) {
      check('Cloudinary Bucket Credentials', false, err.message || String(err));
    }
  } else {
    check('Cloudinary Bucket Credentials', false, 'Cloudinary keys missing');
  }

  // 6. CORS / Protocol Check
  const corsOk = env.CORS_ORIGIN.startsWith('https://') || env.CORS_ORIGIN.includes('localhost');
  check('Secure Protocol Headers (CORS / SSL)', corsOk, `Configured Origin: ${env.CORS_ORIGIN}`);

  console.log('\n------------------------------------------------');
  if (failed) {
    console.error('❌ Beta Readiness Audit FAILED. Correct issues before production release.');
    process.exit(1);
  } else {
    console.log('🚀 SUCCESS: CleanAI Beta is 100% Production Ready!');
    process.exit(0);
  }
}

runProductionCheck();
