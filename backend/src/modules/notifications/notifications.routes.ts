import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/database';
import { NotificationType } from '@prisma/client';

export const notificationRoutes = Router();

// User notifications feed (with filters, pagination, search)
notificationRoutes.get('/', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status, type, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const whereClause: any = {
      userId,
      deletedAt: null, // Exclude soft deleted notifications
    };

    if (status === 'UNREAD') {
      whereClause.isRead = false;
    } else if (status === 'READ') {
      whereClause.isRead = true;
    }

    if (type && type !== 'ALL') {
      whereClause.type = type as NotificationType;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch notifications' });
  }
});

// Get unread count
notificationRoutes.get('/unread-count', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch unread count' });
  }
});

// Get single notification
notificationRoutes.get('/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch notification' });
  }
});

// Mark single notification as read
notificationRoutes.patch('/:id/read', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'Notification status updated to read.',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update notification' });
  }
});

// Mark all notifications for user as read
notificationRoutes.patch('/read-all', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update all notifications' });
  }
});

// Create manual notification (e.g. for testing)
notificationRoutes.post('/', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, role, title, message, type, priority, actionUrl, metadata } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, message: 'userId, title and message are required' });
    }

    const newNotification = await prisma.notification.create({
      data: {
        userId,
        role: role || 'CUSTOMER',
        title,
        message,
        type: type || 'SYSTEM',
        priority: priority || 'MEDIUM',
        actionUrl,
        metadata: metadata || {},
      },
    });

    res.status(201).json({
      success: true,
      data: newNotification,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create notification' });
  }
});

// Soft delete notification
notificationRoutes.delete('/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const deleted = await prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Notification soft deleted.',
      data: deleted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete notification' });
  }
});
