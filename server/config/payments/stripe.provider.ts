import crypto from 'crypto';
import { PaymentProvider } from './payment.provider';
import { logger } from '../logger';

export class StripeProvider implements PaymentProvider {
  constructor() {
    logger.info('[StripeProvider] Stripe gateway initialized in sandbox/future-ready mode.');
  }

  public async createOrder(receiptId: string, amount: number): Promise<{ orderId: string; rawResponse: any }> {
    const mockOrderId = `stripe_order_mock_${crypto.randomBytes(4).toString('hex')}`;
    logger.info(`[Stripe Sandbox] Created mock order: ${mockOrderId} for receipt: ${receiptId}`);
    return {
      orderId: mockOrderId,
      rawResponse: { gateway: 'STRIPE', amount, receiptId },
    };
  }

  public async verifySignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    logger.info(`[Stripe Sandbox] Verifying signature ${signature} for order ${orderId}`);
    return true;
  }

  public async refund(gatewayPaymentId: string, amount: number, reason?: string): Promise<{ refundId: string; rawResponse: any }> {
    const mockRefundId = `stripe_ref_mock_${crypto.randomBytes(4).toString('hex')}`;
    logger.info(`[Stripe Sandbox] Initiated mock refund: ${mockRefundId} for payment: ${gatewayPaymentId}`);
    return {
      refundId: mockRefundId,
      rawResponse: { gateway: 'STRIPE', amount, gatewayPaymentId, reason },
    };
  }
}
