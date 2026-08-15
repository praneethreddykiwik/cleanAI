import { prisma } from '../../database';
import { logger } from '../logger';

export class ComplianceService {
  /**
   * Export all user data for GDPR portability compliance
   */
  public static async exportCustomerData(customerId: string): Promise<any> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: true,
          addresses: true,
          bookings: {
            include: {
              reviews: true,
              payments: true,
              invoice: true,
            },
          },
          wallet: {
            include: {
              transactions: true,
            },
          },
          subscription: true,
          memories: true,
        },
      });

      if (!customer) {
        throw new Error('Customer profile not found.');
      }

      logger.info(`[GDPR Compliance] Completed data export for customer ${customerId}`);
      return customer;
    } catch (err: any) {
      logger.error('[GDPR Compliance] Export workflow failed:', err);
      throw err;
    }
  }

  /**
   * Complete deletion (Right to be Forgotten)
   */
  public static async purgeCustomerProfile(customerId: string): Promise<boolean> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) return false;

      // GDPR anonymization or hard delete
      await prisma.user.delete({
        where: { id: customer.userId },
      });

      logger.info(`[GDPR Compliance] Permanently purged data for customer ${customerId}`);
      return true;
    } catch (err: any) {
      logger.error('[GDPR Compliance] Purge workflow failed:', err);
      return false;
    }
  }
}
export default ComplianceService;
