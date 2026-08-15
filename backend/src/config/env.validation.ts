import { logger } from './logger';

/**
 * Critical = server CANNOT function without these. Missing = process.exit(1) in production.
 * Optional = graceful fallback exists (mock mode / in-memory cache / simulation).
 */
export class EnvValidator {
  // Server is completely broken without these two
  private static criticalVars = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  // Features degrade gracefully without these — warn, never block startup
  private static optionalVars: Array<{ key: string; fallback: string }> = [
    { key: 'GEMINI_API_KEY',    fallback: 'AI analysis disabled — /ai/analyze-job returns 503 until a key is set' },
    { key: 'GROQ_API_KEY',      fallback: 'AI analysis disabled — set this OR GEMINI_API_KEY (Groq takes priority)' },
    { key: 'CLOUDINARY_CLOUD_NAME', fallback: 'Image uploads return mock URLs' },
    { key: 'REDIS_URL',         fallback: 'Caching uses in-memory Map fallback' },
    { key: 'RAZORPAY_KEY_ID',   fallback: 'Payments run in mock mode' },
    { key: 'RAZORPAY_KEY_SECRET', fallback: 'Payments run in mock mode' },
    { key: 'SMTP_USER',         fallback: 'Emails are skipped (logged only)' },
  ];

  private static isPlaceholder(val: string): boolean {
    return (
      val.includes('your_') ||
      val.includes('placeholder_') ||
      val.includes('change_in_production') ||
      val === 'undefined'
    );
  }

  public static validate(): boolean {
    logger.info('[Env Validation] Checking configuration variables...');
    let isValid = true;

    for (const key of this.criticalVars) {
      const val = process.env[key];
      if (!val || val.trim() === '' || this.isPlaceholder(val)) {
        logger.error(`[Env Validation] CRITICAL — "${key}" is missing or uses a default placeholder. Server cannot start safely.`);
        isValid = false;
      }
    }

    // Warn on optional missing vars — never fail
    const missingAI: string[] = [];
    for (const { key, fallback } of this.optionalVars) {
      const val = process.env[key];
      if (!val || val.trim() === '' || this.isPlaceholder(val)) {
        if (key === 'GEMINI_API_KEY' || key === 'GROQ_API_KEY') {
          missingAI.push(key);
        } else {
          logger.warn(`[Env Validation] "${key}" not set — ${fallback}`);
        }
      }
    }

    // Special combined warning for AI keys
    if (missingAI.length === 2) {
      logger.warn('[Env Validation] Neither GEMINI_API_KEY nor GROQ_API_KEY is set — AI vision/chat will run in KEYWORD SIMULATION MODE. Add one to .env for real AI responses.');
    }

    if (isValid) {
      logger.info('[Env Validation] Critical variables OK. Server starting.');
    } else {
      logger.error('[Env Validation] Critical variable check failed. Fix .env before launching in production.');
    }

    return isValid;
  }
}

export default EnvValidator;
export const validateEnv = EnvValidator.validate;
