import { logger } from './logger';

export class EnvValidator {
  private static requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GEMINI_API_KEY',
    'CLOUDINARY_URL',
    'REDIS_URL',
  ];

  private static optionalVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RESEND_API_KEY',
    'PORT',
  ];

  /**
   * Asserts all critical variables are defined and warns on placeholders
   */
  public static validate(): boolean {
    logger.info('[Env Validation] Checking configuration variables...');
    let isValid = true;

    for (const key of this.requiredVars) {
      const val = process.env[key];
      if (!val || val.trim() === '' || val.includes('placeholder_') || val.includes('your_')) {
        logger.error(`[Env Validation] Critical missing or default configuration: ${key}`);
        isValid = false;
      }
    }

    for (const key of this.optionalVars) {
      const val = process.env[key];
      if (!val || val.trim() === '' || val.includes('placeholder_')) {
        logger.warn(`[Env Validation] Optional feature configuration missing: ${key} (Running in mock fallback mode)`);
      }
    }

    if (isValid) {
      logger.info('[Env Validation] All critical system variables check out successfully.');
    } else {
      logger.error('[Env Validation] Environmental checks failed. Review .env values before launch.');
    }

    return isValid;
  }
}
export default EnvValidator;
export const validateEnv = EnvValidator.validate;
