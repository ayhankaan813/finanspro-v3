import type { FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from './notification.service';

export class NotificationController {
  /**
   * GET /api/notifications
   */
  async getNotifications(
    request: FastifyRequest<{
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).userId;
      const limit = request.query.limit ? parseInt(request.query.limit) : 20;
      const offset = request.query.offset ? parseInt(request.query.offset) : 0;

      const result = await notificationService.getUserNotifications(userId, limit, offset);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/notifications/unread
   */
  async getUnreadNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).userId;
      const notifications = await notificationService.getUnreadNotifications(userId);
      return reply.send({
        success: true,
        data: { items: notifications, count: notifications.length },
      });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/notifications/unread/count
   */
  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).userId;
      const count = await notificationService.getUnreadCount(userId);
      return reply.send({ success: true, data: { count } });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }

  /**
   * PUT /api/notifications/:id/read
   */
  async markAsRead(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).userId;
      const { id } = request.params;
      const notification = await notificationService.markAsRead(id, userId);
      return reply.send({ success: true, data: notification });
    } catch (error: any) {
      return reply.status(404).send({ success: false, error: { message: error.message } });
    }
  }

  /**
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).userId;
      const result = await notificationService.markAllAsRead(userId);
      return reply.send({ success: true, data: { count: result.count } });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  async deleteNotification(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).userId;
      const { id } = request.params;
      await notificationService.deleteNotification(id, userId);
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(404).send({ success: false, error: { message: error.message } });
    }
  }
}

export const notificationController = new NotificationController();
