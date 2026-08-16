import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentProvider } from './payment.provider';
import { logger } from '../logger';

export class RazorpayProvider implements PaymentProvider {
  private razorpay: Razorpay | null = null;
  private isConfigured = false;

  constructor() {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      this.isConfigured = true;
    } else {
      logger.warn('[RazorpayProvider] Missing credentials. Operating in sandbox fallback.');
    }
  }

  public async createOrder(receiptId: string, amount: number): Promise<{ orderId: string; rawResponse: any }> {
    const amountInPaise = Math.round(amount * 100);

    if (!this.isConfigured || !this.razorpay) {
      const mockOrderId = `order_mock_${crypto.randomBytes(4).toString('hex')}`;
      logger.info(`[Razorpay Sandbox] Created mock order: ${mockOrderId} for receipt: ${receiptId}`);
      return {
        orderId: mockOrderId,
        rawResponse: { mock: true, amount, receiptId },
      };
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
      });
      return {
        orderId: order.id,
        rawResponse: order,
      };
    } catch (err: any) {
      logger.error('[RazorpayProvider] Order creation failed:', err);
      throw new Error(err.message || 'Razorpay order creation failed.');
    }
  }

  public async verifySignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    if (!this.isConfigured) {
      logger.info(`[Razorpay Sandbox] Verifying mock signature for order ${orderId}`);
      return true;
    }

    try {
      const text = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');

      return generatedSignature === signature;
    } catch (err: any) {
      logger.error('[RazorpayProvider] Signature verification error:', err);
      return false;
    }
  }

  public async refund(gatewayPaymentId: string, amount: number, reason?: string): Promise<{ refundId: string; rawResponse: any }> {
    if (!this.isConfigured || !this.razorpay) {
      const mockRefundId = `ref_mock_${crypto.randomBytes(4).toString('hex')}`;
      logger.info(`[Razorpay Sandbox] Initiated mock refund: ${mockRefundId} for payment: ${gatewayPaymentId}`);
      return {
        refundId: mockRefundId,
        rawResponse: { mock: true, amount, gatewayPaymentId, reason },
      };
    }

    try {
      const refund = await this.razorpay.payments.refund(gatewayPaymentId, {
        amount: Math.round(amount * 100),
        notes: { reason: reason || 'Customer request' },
      });
      return {
        refundId: refund.id,
        rawResponse: refund,
      };
    } catch (err: any) {
      logger.error('[RazorpayProvider] Refund initiation failed:', err);
      throw new Error(err.message || 'Razorpay refund failed.');
    }
  }
}
