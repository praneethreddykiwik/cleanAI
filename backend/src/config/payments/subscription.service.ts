import { prisma } from '@/database';
import { logger } from '../logger';

export class SubscriptionService {
  /**
   * Subscribe customer to basic/plus/premium plan
   */
  public static async subscribe(customerId: string, planName: 'BASIC' | 'PLUS' | 'PREMIUM', months = 12): Promise<any> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + months);

      const subscription = await prisma.subscription.upsert({
        where: { customerId },
        update: {
          planName,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
        create: {
          customerId,
          planName,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });

      logger.info(`[SubscriptionService] Customer ${customerId} subscribed to ${planName} until ${endDate}`);
      return subscription;
    } catch (err: any) {
      logger.error('[SubscriptionService] Subscription activation failed:', err);
      throw err;
    }
  }

  /**
   * Get customer benefits override splits
   */
  public static async getBenefits(customerId: string): Promise<{
    hasFreeInspection: boolean;
    priorityMatching: boolean;
    feeDiscountPercentage: number;
  }> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { customerId, status: 'ACTIVE' },
      });

      if (!subscription || subscription.endDate < new Date()) {
        return {
          hasFreeInspection: false,
          priorityMatching: false,
          feeDiscountPercentage: 0,
        };
      }

      switch (subscription.planName) {
        case 'PREMIUM':
          return { hasFreeInspection: true, priorityMatching: true, feeDiscountPercentage: 25 };
        case 'PLUS':
          return { hasFreeInspection: true, priorityMatching: true, feeDiscountPercentage: 10 };
        case 'BASIC':
        default:
          return { hasFreeInspection: false, priorityMatching: false, feeDiscountPercentage: 5 };
      }
    } catch (err: any) {
      logger.error('[SubscriptionService] Failed to retrieve benefits:', err);
      return {
        hasFreeInspection: false,
        priorityMatching: false,
        feeDiscountPercentage: 0,
      };
    }
  }
}
export default SubscriptionService;
