import type { FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from './notification.service';
import { z } from 'zod';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get user's notifications (paginated)
   */
  async getNotifications(
    request: FastifyRequest<{
      Querystring: {
        limit?: string;
        offset?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).userId;
      const limit = request.query.limit ? parseInt(request.query.limit) : 20;
      const offset = request.query.offset ? parseInt(request.query.offset) : 0;

      const result = await notificationService.getUserNotifications(userId, limit, offset);

      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /api/notifications/unread
   * Get unread notifications
   */
  async getUnreadNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).userId;

      const notifications = await notificationService.getUnreadNotifications(userId);

      return reply.send({ items: notifications, count: notifications.length });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /api/notifications/unread/count
   * Get unread count
   */
  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).userId;

      const count = await notificationService.getUnreadCount(userId);

      return reply.send({ count });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * PUT /api/notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).userId;
      const { id } = request.params;

      const notification = await notificationService.markAsRead(id, userId);

      return reply.send(notification);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  }

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).userId;

      const result = await notificationService.markAllAsRead(userId);

      return reply.send({ count: result.count });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete notification
   */
  async deleteNotification(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).userId;
      const { id } = request.params;

      await notificationService.deleteNotification(id, userId);

      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  }
}

export const notificationController = new NotificationController();
