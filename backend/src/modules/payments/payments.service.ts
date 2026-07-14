import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/database';
import { logger } from '@/config/logger';
import { eventBus } from '@/utils/event.bus';
import { PaymentStatus } from '@prisma/client';

const isRazorpayConfigured = !!(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET
);

const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  : null;

if (isRazorpayConfigured) {
  logger.info('Razorpay payment gateway initialized successfully.');
} else {
  logger.warn('Razorpay credentials missing. Operating in fallback mock payment mode.');
}

export class PaymentsService {
  /**
   * Create Razorpay / Mock payment order
   */
  public static async createOrder(bookingId: string, amount: number): Promise<any> {
    try {
      const amountInPaise = Math.round(amount * 100);
      const receiptId = `rcpt_${bookingId.substring(0, 8)}`;

      let gatewayOrderId = `order_mock_${crypto.randomBytes(4).toString('hex')}`;

      if (isRazorpayConfigured && razorpay) {
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receiptId,
        });
        gatewayOrderId = order.id;
      }

      // Persist Payment record in DB
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          gateway: isRazorpayConfigured ? 'RAZORPAY' : 'MOCK',
          gatewayOrderId,
          amount,
          currency: 'INR',
          status: PaymentStatus.PENDING,
        },
      });

      return {
        success: true,
        paymentId: payment.id,
        orderId: gatewayOrderId,
        amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
      };
    } catch (err: any) {
      logger.error('Failed to create payment order:', err);
      throw new Error(err.message || 'Payment order creation failed.');
    }
  }

  /**
   * Verify signature and capture payment
   */
  public static async verifySignature(
    bookingId: string,
    gatewayOrderId: string,
    gatewayPaymentId: string,
    signature: string
  ): Promise<boolean> {
    try {
      if (isRazorpayConfigured) {
        const text = `${gatewayOrderId}|${gatewayPaymentId}`;
        const generatedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
          .update(text)
          .digest('hex');

        if (generatedSignature !== signature) {
          logger.error('Invalid Razorpay signature verified!');
          return false;
        }
      }

      // Update payment record in database
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { gatewayOrderId },
          data: {
            gatewayPaymentId,
            status: PaymentStatus.PAID,
            rawResponse: JSON.stringify({ gatewayPaymentId, signature }),
          },
        });

        // Update corresponding booking paymentStatus
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: PaymentStatus.PAID,
          },
        });

        // Automatically generate Tax Invoice
        const baseAmount = payment.amount;
        const platformFee = 49;
        const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
        const vendorAmount = baseAmount - platformFee - gstAmount;

        const invoiceNumber = `INV-${payment.id.substring(0, 8).toUpperCase()}`;

        await tx.invoice.create({
          data: {
            bookingId,
            invoiceNumber,
            amount: baseAmount,
            platformFee,
            vendorAmount,
            gstAmount,
            status: 'PAID',
          },
        });
      });

      // Broadcast success down the event bus
      eventBus.publish('booking.status.changed', {
        bookingId,
        toState: 'VENDOR_ACCEPTED', // progress state on payment capture
        notes: 'Payment captured and tax invoice generated.',
      });

      return true;
    } catch (err: any) {
      logger.error('Payment signature verification failed:', err);
      return false;
    }
  }

  /**
   * Refund Payment
   */
  public static async refundPayment(paymentId: string, amount: number, reason: string): Promise<boolean> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || payment.status !== PaymentStatus.PAID) {
        throw new Error('Payment not found or not paid.');
      }

      let gatewayRefundId = `ref_mock_${crypto.randomBytes(4).toString('hex')}`;

      if (isRazorpayConfigured && razorpay && payment.gatewayPaymentId) {
        const refund = await razorpay.payments.refund(payment.gatewayPaymentId, {
          amount: Math.round(amount * 100),
          notes: { reason },
        });
        gatewayRefundId = refund.id;
      }

      await prisma.$transaction(async (tx) => {
        // Record Refund log
        await tx.refund.create({
          data: {
            paymentId,
            gatewayRefundId,
            amount,
            status: 'PROCESSED',
            reason,
          },
        });

        // Update Payment status
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.REFUNDED,
          },
        });

        // Update corresponding booking paymentStatus
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });
      });

      return true;
    } catch (err: any) {
      logger.error('Refund initiation failed:', err);
      return false;
    }
  }

  /**
   * Settlement payouts aggregator
   */
  public static async preparePayout(vendorId: string, amount: number): Promise<any> {
    try {
      const settlement = await prisma.settlement.create({
        data: {
          vendorId,
          amount,
          status: 'PENDING',
        },
      });
      logger.info(`Settlement generated for vendor ${vendorId}: ₹${amount}`);
      return settlement;
    } catch (err: any) {
      logger.error('Settlement payouts log failed:', err);
      throw err;
    }
  }
}
export default PaymentsService;
