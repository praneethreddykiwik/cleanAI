import { prisma } from '../../database';
import crypto from 'crypto';
import { logger } from '../logger';

export class ExperimentFramework {
  /**
   * Consistently assign variant (A/B) to user using cryptographic hashing
   */
  public static async getVariant(userId: string, experimentName: string): Promise<string> {
    try {
      // Find or create experiment
      const experiment = await prisma.experiment.upsert({
        where: { name: experimentName },
        update: {},
        create: { name: experimentName },
      });

      if (experiment.status !== 'ACTIVE') {
        return 'CONTROL'; // Default control fallback
      }

      // Check existing assignment
      const existing = await prisma.experimentAssignment.findUnique({
        where: {
          experimentId_userId: {
            experimentId: experiment.id,
            userId,
          },
        },
      });

      if (existing) {
        return existing.variant;
      }

      // Cryptographically partition user consistently
      const hash = crypto.createHash('md5').update(`${userId}:${experimentName}`).digest('hex');
      const hashValue = parseInt(hash.substring(0, 8), 16);
      const variant = hashValue % 2 === 0 ? 'VARIANT_A' : 'VARIANT_B';

      // Record assignment
      await prisma.experimentAssignment.create({
        data: {
          experimentId: experiment.id,
          userId,
          variant,
        },
      });

      logger.info(`[Experiment] User ${userId} assigned to variant: ${variant} for experiment ${experimentName}`);
      return variant;
    } catch (err: any) {
      logger.error('[Experiment] Variant assignment failure:', err);
      return 'CONTROL';
    }
  }

  /**
   * Mark experiment conversion goals
   */
  public static async trackConversion(userId: string, experimentName: string): Promise<boolean> {
    try {
      const experiment = await prisma.experiment.findUnique({
        where: { name: experimentName },
      });

      if (!experiment) return false;

      await prisma.experimentAssignment.update({
        where: {
          experimentId_userId: {
            experimentId: experiment.id,
            userId,
          },
        },
        data: {
          converted: true,
        },
      });

      logger.info(`[Experiment] Registered A/B conversion for user ${userId} on experiment ${experimentName}`);
      return true;
    } catch (err: any) {
      logger.error('[Experiment] Conversion tracking failed:', err);
      return false;
    }
  }
}
export default ExperimentFramework;
