import { prisma } from '../../database';
import { redisService } from '../redis';
import { logger } from '../logger';

export interface CustomerFeatures {
  bookingFrequency: number;
  averageSpend: number;
  preferredTimeSlot: string | null;
  preferredService: string | null;
  preferredTechnician: string | null;
  cancellationRate: number;
  customerValue: number; // CLV
  lastInteraction: string;
}

export class FeatureStoreService {
  /**
   * Fetch customer features from Redis cache (or Database fallback)
   */
  public static async getFeatures(customerId: string): Promise<CustomerFeatures> {
    const cacheKey = `features:customer:${customerId}`;

    try {
      const cached = await redisService.get<CustomerFeatures>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err: any) {
      logger.warn(`[Feature Store] Cache lookup failed: ${err.message}`);
    }

    // Database Fallback
    const store = await prisma.featureStore.upsert({
      where: { customerId },
      update: {},
      create: { customerId },
    });

    const features: CustomerFeatures = {
      bookingFrequency: store.bookingFrequency,
      averageSpend: store.averageSpend,
      preferredTimeSlot: store.preferredTimeSlot,
      preferredService: store.preferredService,
      preferredTechnician: store.preferredTechnician,
      cancellationRate: store.cancellationRate,
      customerValue: store.customerValue,
      lastInteraction: store.lastInteraction.toISOString(),
    };

    try {
      await redisService.set(cacheKey, JSON.stringify(features), 3600); // 1hr cache TTL
    } catch (err: any) {
      logger.warn(`[Feature Store] Cache write failed: ${err.message}`);
    }

    return features;
  }

  /**
   * Update and invalidate cached customer feature records
   */
  public static async updateFeatures(customerId: string, updates: Partial<CustomerFeatures>): Promise<CustomerFeatures> {
    try {
      const formattedUpdates: any = { ...updates };
      if (updates.lastInteraction) {
        formattedUpdates.lastInteraction = new Date(updates.lastInteraction);
      }

      const updated = await prisma.featureStore.update({
        where: { customerId },
        data: formattedUpdates,
      });

      const features: CustomerFeatures = {
        bookingFrequency: updated.bookingFrequency,
        averageSpend: updated.averageSpend,
        preferredTimeSlot: updated.preferredTimeSlot,
        preferredService: updated.preferredService,
        preferredTechnician: updated.preferredTechnician,
        cancellationRate: updated.cancellationRate,
        customerValue: updated.customerValue,
        lastInteraction: updated.lastInteraction.toISOString(),
      };

      const cacheKey = `features:customer:${customerId}`;
      await redisService.set(cacheKey, JSON.stringify(features), 3600);

      return features;
    } catch (err: any) {
      logger.error(`[Feature Store] Update failed:`, err);
      throw err;
    }
  }
}
export default FeatureStoreService;
