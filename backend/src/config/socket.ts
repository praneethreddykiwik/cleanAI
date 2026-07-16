import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { prisma } from '@/database';
import { eventBus } from '@/utils/event.bus';

interface DecodedToken {
  id: string;
  role: string;
  email: string;
}

export class SocketService {
  private static io: SocketIOServer | null = null;
  private static userSockets: Map<string, string> = new Map(); // userId -> socketId

  /**
   * Initializes Socket.IO server and binds event listeners
   */
  static init(server: HttpServer): SocketIOServer {
    const allowedOrigins = [env.CORS_ORIGIN, env.FRONTEND_URL, env.SOCKET_CORS_ORIGIN].filter(Boolean);
    this.io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 30000,
      pingInterval: 15000,
    });

    logger.info('Initializing Socket.IO Server...');

    // Middleware to authenticate socket connections
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (!token) {
          return next(new Error('Authentication failed: Missing token.'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        socket.data = {
          userId: decoded.sub || decoded.id,
          role: decoded.role,
          email: decoded.email || '',
        };
        next();
      } catch (err) {
        logger.error('Socket authentication error:', err);
        next(new Error('Authentication failed: Invalid token.'));
      }
    });

    this.io.on('connection', async (socket: Socket) => {
      const { userId, role } = socket.data;
      logger.info(`[Socket Connected] User: ${userId}, Role: ${role}, SocketId: ${socket.id}`);

      this.userSockets.set(userId, socket.id);

      // Join standard role-based rooms
      socket.join(`${role.toLowerCase()}:${userId}`);
      if (role === 'ADMIN') {
        socket.join('admin');
      }

      // Update Presence session state to ONLINE in Neon database
      try {
        await prisma.liveSession.upsert({
          where: { userId },
          create: { userId, socketId: socket.id, status: 'ONLINE' },
          update: { socketId: socket.id, status: 'ONLINE', lastSeen: new Date() },
        });

        // Broadcast to admins that a user has come online
        this.io?.to('admin').emit('presence.changed', { userId, role, status: 'ONLINE' });
      } catch (err) {
        logger.error('Failed to log presence on connect:', err);
      }

      // Listen for booking room joins
      socket.on('join.booking', (bookingId: string) => {
        socket.join(`booking:${bookingId}`);
        logger.info(`Socket ${socket.id} joined room booking:${bookingId}`);
      });

      // Listen to disconnect event
      socket.on('disconnect', async () => {
        logger.info(`[Socket Disconnected] User: ${userId}, SocketId: ${socket.id}`);
        this.userSockets.delete(userId);

        try {
          await prisma.liveSession.update({
            where: { userId },
            data: { status: 'OFFLINE', lastSeen: new Date() },
          });

          this.io?.to('admin').emit('presence.changed', { userId, role, status: 'OFFLINE', lastSeen: new Date() });
        } catch (err) {
          logger.error('Failed to log presence on disconnect:', err);
        }
      });
    });

    // Register Event Bus Subscriber for Sockets
    this.registerEventBusListeners();

    return this.io;
  }

  /**
   * Subscribes to the Event Bus and forwards operational events to WebSockets
   */
  private static registerEventBusListeners(): void {
    // 1. Listen for booking state changes and broadcast down to the customer, vendor, and booking rooms
    eventBus.subscribe('booking.status.changed', async (data: any) => {
      const { bookingId, toState, notes } = data;
      logger.info(`[Event Bus Listener - Sockets] Propagating booking status update to socket rooms. State: ${toState}`);

      if (!this.io) return;

      // Broadcast to specific booking detail listeners
      this.io.to(`booking:${bookingId}`).emit('booking.updated', { bookingId, status: toState, notes });

      // Load booking details to dispatch to respective actors
      try {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { customer: true, vendor: true },
        });

        if (booking) {
          // Push notifications to customer and vendor rooms
          if (booking.customerId) {
            this.io.to(`customer:${booking.customerId}`).emit('notification.created', {
              title: 'Booking Status Update',
              message: `Your booking status has changed to ${toState}.`,
              type: 'BOOKING',
            });
          }
          if (booking.vendorId) {
            this.io.to(`vendor:${booking.vendorId}`).emit('notification.created', {
              title: 'Booking Status Update',
              message: `Booking #${booking.bookingNumber} is now ${toState}.`,
              type: 'BOOKING',
            });
          }
        }
      } catch (err) {
        logger.error('Failed to resolve booking details for socket broadcast:', err);
      }
    });

    // 2. Listen for support chat messages and dispatch
    eventBus.subscribe('support.message.sent', (data: any) => {
      const { conversationId, message } = data;
      if (this.io) {
        this.io.to(`support:${conversationId}`).emit('support.message.received', message);
      }
    });
  }

  /**
   * Helper to dispatch generic events to specific connected clients
   */
  static emitToRoom(room: string, event: string, payload: any): void {
    if (this.io) {
      this.io.to(room).emit(event, payload);
    }
  }
}
export default SocketService;
