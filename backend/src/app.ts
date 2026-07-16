import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import 'express-async-errors';

import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { globalErrorHandler, requestInitializer } from '@/middleware/error.middleware';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { prisma } from '@/database';

// Route imports
import { authRoutes } from '@/modules/auth/auth.routes';
import { userRoutes } from '@/modules/users/users.routes';
import { vendorRoutes } from '@/modules/vendors/vendors.routes';
import { agentRoutes } from '@/modules/agents/agents.routes';
import { locationRoutes } from '@/modules/agents/location.routes';
import { bookingRoutes } from '@/modules/bookings/bookings.routes';
import { serviceRoutes } from '@/modules/services/services.routes';
import { notificationRoutes } from '@/modules/notifications/notifications.routes';
import { adminRoutes } from '@/modules/admin/admin.routes';
import { aiRoutes } from '@/modules/agents/ai.routes';
import { paymentsRoutes } from '@/modules/payments/payments.routes';

export function createApp(): Application {
  const app = express();

  // ==================
  // Security Middleware
  // ==================
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }));

  const allowedOrigins = [env.CORS_ORIGIN, env.FRONTEND_URL, env.SOCKET_CORS_ORIGIN].filter(Boolean);
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => o && origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // ==================
  // General Middleware
  // ==================
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestInitializer);

  // ==================
  // Logging
  // ==================
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));

  // ==================
  // Rate Limiting
  // ==================
  app.use('/api', rateLimiter);

  // ==================
  // Health Check
  // ==================
  // ==================
  // Observability & Health Checks
  // ==================
  app.get('/api/health', async (_, res) => {
    try {
      let databaseStatus = 'connected';
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (err) {
        databaseStatus = 'disconnected';
      }

      let redisStatus = 'connected';
      try {
        const { redisService } = await import('@/config/redis');
        const isRedisConnected = await redisService.ping();
        if (!isRedisConnected) redisStatus = 'disconnected';
      } catch (err) {
        redisStatus = 'disconnected';
      }

      const geminiStatus = env.GEMINI_API_KEY ? 'available' : 'unavailable';
      const cloudinaryStatus = (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) ? 'available' : 'unavailable';

      const isHealthy = databaseStatus === 'connected' && redisStatus === 'connected';

      res.status(isHealthy ? 200 : 500).json({
        status: isHealthy ? 'ok' : 'error',
        database: databaseStatus,
        redis: redisStatus,
        socket: 'running',
        gemini: geminiStatus,
        cloudinary: cloudinaryStatus,
        version: '1.0.0',
        uptime: Math.round(process.uptime())
      });
    } catch (error: any) {
      logger.error('System health check failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'System health error',
        uptime: Math.round(process.uptime())
      });
    }
  });

  app.get('/api/ready', async (_, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const { redisService } = await import('@/config/redis');
      const isRedisConnected = await redisService.ping();

      if (!isRedisConnected) {
        return res.status(503).json({ success: false, message: 'Redis Cache offline.' });
      }

      res.status(200).json({ success: true, message: 'CleanAI platform services fully ready.' });
    } catch {
      res.status(503).json({ success: false, message: 'Database services offline.' });
    }
  });

  app.get('/api/metrics', async (_, res) => {
    try {
      const bookingsCount = await prisma.booking.count();
      const paymentsTotal = await prisma.payment.aggregate({
        _sum: { amount: true },
      });
      const memoryUsage = process.memoryUsage();

      res.status(200).json({
        success: true,
        metrics: {
          totalBookings: bookingsCount,
          totalRevenue: paymentsTotal._sum.amount || 0,
          heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          uptimeSeconds: Math.round(process.uptime()),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/v1/version', (_, res) => {
    res.status(200).json({
      success: true,
      data: {
        version: '1.0.0',
        apiVersion: env.API_VERSION,
        platform: 'Clean AI Platform',
        phase: 'Phase 1 — Foundation',
      },
    });
  });

  // ==================
  // API Routes
  // ==================
  const API_PREFIX = `/api/${env.API_VERSION}`;

  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/vendors`, vendorRoutes);
  app.use(`${API_PREFIX}/agents`, agentRoutes);
  app.use(`${API_PREFIX}/agents/location`, locationRoutes);
  app.use(`${API_PREFIX}/bookings`, bookingRoutes);
  app.use(`${API_PREFIX}/services`, serviceRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);
  app.use(`${API_PREFIX}/admin`, adminRoutes);
  app.use(`${API_PREFIX}/ai`, aiRoutes);
  app.use(`${API_PREFIX}/payments`, paymentsRoutes);

  // ==================
  // Error Handling
  // ==================
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
