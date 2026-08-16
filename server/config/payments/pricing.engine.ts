import { prisma } from '../../database';
import { logger } from '../logger';

export interface PriceBreakdown {
  basePrice: number;
  aiComplexitySurcharge: number;
  laborSurcharge: number;
  travelFee: number;
  weekendSurcharge: number;
  nightSurcharge: number;
  gstAmount: number;
  couponDiscount: number;
  platformFee: number;
  vendorAmount: number;
  finalTotal: number;
}

export class PricingEngine {
  /**
   * Calculate exact cost splits for checkout bookings
   */
  public static async calculatePrice(params: {
    serviceId: string;
    city?: string;
    couponCode?: string;
    complexityScore?: number; // e.g. from vision agent severity
    isWeekend?: boolean;
    isNight?: boolean;
  }): Promise<PriceBreakdown> {
    try {
      const service = await prisma.service.findUnique({
        where: { id: params.serviceId },
      });

      if (!service) {
        throw new Error('Service not found.');
      }

      // Base price defaults
      const basePrice = service.basePrice || 1500;
      
      // AI vision complexity scale
      const aiComplexitySurcharge = params.complexityScore
        ? Math.round(basePrice * params.complexityScore * 0.15)
        : 0;

      const laborSurcharge = 350;
      const travelFee = 150;

      // Surcharges
      const weekendSurcharge = params.isWeekend ? 250 : 0;
      const nightSurcharge = params.isNight ? 400 : 0;

      // Subtotal before coupon
      let subtotal = basePrice + aiComplexitySurcharge + laborSurcharge + travelFee + weekendSurcharge + nightSurcharge;

      // Coupon discount
      let couponDiscount = 0;
      if (params.couponCode) {
        const coupon = await prisma.coupon.findUnique({
          where: { code: params.couponCode, isActive: true },
        });

        if (coupon && coupon.expiryDate > new Date() && subtotal >= coupon.minOrderValue) {
          if (coupon.discountType === 'PERCENTAGE') {
            const rawDiscount = subtotal * (coupon.value / 100);
            couponDiscount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
          } else {
            couponDiscount = coupon.value;
          }
          // Cap coupon discount to subtotal
          couponDiscount = Math.min(couponDiscount, subtotal);
          subtotal -= couponDiscount;
        }
      }

      // GST and platform fees
      const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
      const finalTotal = subtotal + gstAmount;

      const platformFee = Math.round(subtotal * 0.15 * 100) / 100; // 15% platform commission
      const vendorAmount = subtotal - platformFee;

      return {
        basePrice,
        aiComplexitySurcharge,
        laborSurcharge,
        travelFee,
        weekendSurcharge,
        nightSurcharge,
        gstAmount,
        couponDiscount,
        platformFee,
        vendorAmount,
        finalTotal,
      };
    } catch (err: any) {
      logger.error('[PricingEngine] Price calculations failed:', err);
      throw err;
    }
  }
}
export default PricingEngine;
