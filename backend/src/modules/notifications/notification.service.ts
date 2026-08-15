import { prisma } from '../../database';
import { UserRole, NotificationType } from '@prisma/client';

export async function createNotification(params: {
  userId: string;
  role: UserRole;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: string;
  actionUrl?: string;
  metadata?: any;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        role: params.role,
        title: params.title,
        message: params.message,
        type: params.type || 'SYSTEM',
        priority: params.priority || 'MEDIUM',
        actionUrl: params.actionUrl,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
