import { eventBus } from './event.bus';
import { prisma } from '@/database';
import { logger } from '@/config/logger';

export function initEventBusListeners() {
  logger.info('Initializing Enterprise Event Bus Subscribers...');

  // 1. AI Memory Listener: Feed completed bookings context into Customer Memory
  eventBus.subscribe('booking.status.changed', async (data: any) => {
    const { bookingId, toState } = data;
    if (toState === 'COMPLETED') {
      logger.info(`[AI Memory Listener] Booking Completed event captured for ${bookingId}. Persisting preferences.`);
      try {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { customer: true, service: true, vendor: true, agent: { include: { user: true } } },
        });

        if (booking && booking.customerId) {
          // Store/update favorite service memory
          await prisma.customerMemory.upsert({
            where: { id: `favorite_service:${booking.customerId}` }, // hypothetical unique key mapping or generic create
            create: {
              customerId: booking.customerId,
              key: 'favorite_service',
              value: booking.service.name,
            },
            update: {
              value: booking.service.name,
              updatedAt: new Date(),
            },
          }).catch(() => {
            // Fallback to simple create if custom where constraint fails
            prisma.customerMemory.create({
              data: {
                customerId: booking.customerId!,
                key: 'favorite_service',
                value: booking.service.name,
              }
            });
          });

          // Store/update favorite technician memory (assigned Agent user name)
          if (booking.agent?.user) {
            const techName = `${booking.agent.user.firstName} ${booking.agent.user.lastName}`;
            await prisma.customerMemory.create({
              data: {
                customerId: booking.customerId,
                key: 'favorite_technician',
                value: techName,
              },
            }).catch(() => {});
          }

          // Record preferred booking slot time
          await prisma.customerMemory.create({
            data: {
              customerId: booking.customerId,
              key: 'preferred_time',
              value: booking.scheduledTime,
            },
          }).catch(() => {});
        }
      } catch (err) {
        logger.error('Failed to log AI memory event update:', err);
      }
    }
  });

  // 2. Notification Delivery Pipeline: Record notification deliveries across Socket & DB channels
  eventBus.subscribe('booking.status.changed', async (data: any) => {
    const { bookingId, toState } = data;
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });
      if (booking) {
        // Log notification record in DB
        const notification = await prisma.notification.create({
          data: {
            userId: booking.customerId,
            title: 'Booking Status Update',
            message: `Booking #${booking.bookingNumber} has been updated to ${toState}.`,
            type: 'BOOKING',
            priority: 'HIGH',
          },
        });

        // Track delivery metrics for the socket delivery
        await prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel: 'SOCKET',
            status: 'DELIVERED',
          },
        });
      }
    } catch (err) {
      logger.error('Failed to log notification delivery metrics:', err);
    }
  });
}
