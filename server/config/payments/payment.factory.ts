import { PaymentProvider } from './payment.provider';
import { RazorpayProvider } from './razorpay.provider';
import { StripeProvider } from './stripe.provider';
import { logger } from '../logger';

export class PaymentFactory {
  private static providers: Record<string, PaymentProvider> = {
    RAZORPAY: new RazorpayProvider(),
    STRIPE: new StripeProvider(),
  };

  public static getProvider(gateway = 'RAZORPAY'): PaymentProvider {
    const resolved = this.providers[gateway.toUpperCase()];
    if (!resolved) {
      logger.warn(`[PaymentFactory] Gateway ${gateway} not recognized. Falling back to Razorpay.`);
      return this.providers['RAZORPAY'];
    }
    return resolved;
  }
}
