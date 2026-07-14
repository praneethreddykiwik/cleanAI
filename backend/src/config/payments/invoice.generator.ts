import { prisma } from '@/database';
import { logger } from '../logger';
import { queueEmail } from '../email';

export class InvoiceGenerator {
  /**
   * Calculate fees and generate PDF invoice
   */
  public static async generateInvoice(bookingId: string): Promise<any> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { include: { user: true } },
          service: true,
          coupon: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found.');
      }

      const invoiceNumber = `INV-${bookingId.substring(0, 8).toUpperCase()}`;

      // Calculate transparent splits
      const baseAmount = booking.totalAmount;
      const platformFee = booking.platformFee;
      const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
      const vendorAmount = booking.vendorAmount;

      // Upsert Invoice record in DB
      const invoice = await prisma.invoice.upsert({
        where: { bookingId },
        update: {
          invoiceNumber,
          amount: baseAmount,
          platformFee,
          vendorAmount,
          gstAmount,
          status: 'PAID',
        },
        create: {
          bookingId,
          invoiceNumber,
          amount: baseAmount,
          platformFee,
          vendorAmount,
          gstAmount,
          status: 'PAID',
        },
      });

      logger.info(`[Invoice Engine] Generated GST invoice: ${invoiceNumber} for booking ${bookingId}`);

      // Dispatch Email dynamically
      if (booking.customer?.user?.email) {
        await queueEmail({
          to: booking.customer.user.email,
          subject: `Your CleanAI Service Invoice: ${invoiceNumber}`,
          template: 'INVOICE',
          context: {
            invoiceNumber,
            bookingNumber: booking.bookingNumber,
            platformFee: platformFee.toFixed(2),
            gstAmount: gstAmount.toFixed(2),
            amount: baseAmount.toFixed(2),
          },
        });
      }

      return invoice;
    } catch (err: any) {
      logger.error('[Invoice Engine] Invoice generation failure:', err);
      throw err;
    }
  }
}
export default InvoiceGenerator;
