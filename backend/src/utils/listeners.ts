import { eventBus } from './event.bus';
import { prisma } from '@/database';
import { logger } from '@/config/logger';

/**
 * Upsert a CustomerMemory entry by (customerId + key) — the only
 * correct compound unique lookup. `CustomerMemory.id` is a UUID and
 * cannot be used as a predictable composite key string.
 */
async function upsertMemory(customerId: string, key: string, value: string): Promise<void> {
  const existing = await prisma.customerMemory.findFirst({ where: { customerId, key } });
  if (existing) {
    await prisma.customerMemory.update({
      where: { id: existing.id },
      data: { value, updatedAt: new Date() },
    });
  } else {
    await prisma.customerMemory.create({ data: { customerId, key, value } });
  }
}

export function initEventBusListeners() {
  logger.info('Initializing Enterprise Event Bus Subscribers...');

  // 1. AI Memory Listener: Feed completed bookings context into Customer Memory
  eventBus.subscribe('booking.status.changed', async (data: any) => {
    const { bookingId, toState } = data;
    if (toState !== 'COMPLETED') return;

    logger.info(`[AI Memory] Booking ${bookingId} completed — persisting customer preferences.`);
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          service: true,
          vendor: true,
          agent: { include: { user: true } },
        },
      });

      if (!booking?.customerId) return;

      const cid = booking.customerId;

      // Favorite service — update with latest completed service
      await upsertMemory(cid, 'favorite_service', booking.service.name);

      // Favorite technician — store actual agent name from DB
      if (booking.agent?.user) {
        const techName = `${booking.agent.user.firstName} ${booking.agent.user.lastName}`;
        await upsertMemory(cid, 'favorite_technician', techName);
      }

      // Preferred booking time
      await upsertMemory(cid, 'preferred_time', booking.scheduledTime);

      // Preferred vendor
      if (booking.vendor?.businessName) {
        await upsertMemory(cid, 'preferred_vendor', booking.vendor.businessName);
      }

      logger.info(`[AI Memory] Preferences saved for customer ${cid}`);
    } catch (err) {
      logger.error('[AI Memory] Failed to persist customer memory:', err);
    }
  });

  // 2. Notification Delivery Pipeline
  eventBus.subscribe('booking.status.changed', async (data: any) => {
    const { bookingId, toState } = data;
    try {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return;

      // Resolve actual userId from customer profile
      const customer = await prisma.customer.findUnique({
        where: { id: booking.customerId },
        select: { userId: true },
      });
      if (!customer) return;

      const notification = await prisma.notification.create({
        data: {
          userId: customer.userId,
          title: 'Booking Status Update',
          message: `Booking #${booking.bookingNumber} status updated to ${toState}.`,
          type: 'BOOKING',
          priority: 'HIGH',
        },
      });

      await prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel: 'SOCKET',
          status: 'DELIVERED',
        },
      });
    } catch (err) {
      logger.error('[Notification Delivery] Failed to record delivery metrics:', err);
    }
  });
}
