import prisma from '../../shared/prisma/client.js';
import { logger } from '../../shared/utils/logger.js';
import type { NotificationType, NotificationPriority, User } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  actionText?: string;
  priority?: NotificationPriority;
  expiresAt?: Date;
}

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          entity_type: params.entityType,
          entity_id: params.entityId,
          action_url: params.actionUrl,
          action_text: params.actionText,
          priority: params.priority || 'NORMAL',
          expires_at: params.expiresAt,
        },
      });

      logger.info('Notification created', { notificationId: notification.id, userId: params.userId });
      return notification;
    } catch (error) {
      logger.error('Failed to create notification', error);
      throw error;
    }
  }

  /**
   * Send notification to all ADMIN users
   */
  async notifyAdmins(params: Omit<CreateNotificationParams, 'userId'>) {
    try {
      // Get all active admin users
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          is_active: true,
          deleted_at: null,
        },
        select: {
          id: true,
        },
      });

      if (admins.length === 0) {
        logger.warn('No active admin users found for notification');
        return [];
      }

      // Create notification for each admin
      const notifications = await Promise.all(
        admins.map((admin) =>
          this.createNotification({
            ...params,
            userId: admin.id,
          })
        )
      );

      logger.info('Notifications sent to admins', { count: notifications.length });
      return notifications;
    } catch (error) {
      logger.error('Failed to notify admins', error);
      throw error;
    }
  }

  /**
   * Get user's unread notifications
   */
  async getUnreadNotifications(userId: string) {
    return prisma.notification.findMany({
      where: {
        user_id: userId,
        is_read: false,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  /**
   * Get all notifications for a user (paginated)
   */
  async getUserNotifications(userId: string, limit = 20, offset = 0) {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          user_id: userId,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } },
          ],
        },
        orderBy: [
          { is_read: 'asc' }, // Unread first
          { created_at: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: {
          user_id: userId,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } },
          ],
        },
      }),
    ]);

    return {
      items: notifications,
      total,
      unread: notifications.filter((n) => !n.is_read).length,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete expired notifications (cleanup task)
   */
  async deleteExpiredNotifications() {
    const result = await prisma.notification.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    logger.info('Deleted expired notifications', { count: result.count });
    return result;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
    });
  }
}

export const notificationService = new NotificationService();
