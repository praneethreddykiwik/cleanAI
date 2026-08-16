import { prisma } from '../../database';
import { logger } from '../logger';

export class WalletService {
  /**
   * Fetch customer wallet or create if not exists
   */
  public static async getWallet(customerId: string): Promise<any> {
    return prisma.wallet.upsert({
      where: { customerId },
      update: {},
      create: { customerId, balance: 0.0 },
    });
  }

  /**
   * Credit transaction log
   */
  public static async creditWallet(
    customerId: string,
    amount: number,
    type: 'REFUND' | 'PROMOTIONAL' | 'REFERRAL' | 'PAYMENT',
    description?: string
  ): Promise<any> {
    try {
      const wallet = await this.getWallet(customerId);

      return prisma.$transaction(async (tx) => {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: amount },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type,
            description,
          },
        });

        logger.info(`[WalletService] Credited ${amount} to customer ${customerId} wallet. New balance: ${updatedWallet.balance}`);
        return updatedWallet;
      });
    } catch (err: any) {
      logger.error('[WalletService] Credit transaction failed:', err);
      throw err;
    }
  }

  /**
   * Debit transaction log
   */
  public static async debitWallet(
    customerId: string,
    amount: number,
    type: 'PAYMENT',
    description?: string
  ): Promise<any> {
    try {
      const wallet = await this.getWallet(customerId);

      if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance.');
      }

      return prisma.$transaction(async (tx) => {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: amount },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: -amount,
            type,
            description,
          },
        });

        logger.info(`[WalletService] Debited ${amount} from customer ${customerId} wallet. New balance: ${updatedWallet.balance}`);
        return updatedWallet;
      });
    } catch (err: any) {
      logger.error('[WalletService] Debit transaction failed:', err);
      throw err;
    }
  }
}
export default WalletService;
