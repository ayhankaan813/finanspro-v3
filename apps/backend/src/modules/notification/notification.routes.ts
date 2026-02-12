import type { FastifyInstance } from 'fastify';
import { notificationController } from './notification.controller.js';
import { authenticate } from '../auth/auth.routes.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  // All notification routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Get user's notifications (paginated)
  fastify.get('/', notificationController.getNotifications.bind(notificationController));

  // Get unread notifications
  fastify.get('/unread', notificationController.getUnreadNotifications.bind(notificationController));

  // Get unread count
  fastify.get('/unread/count', notificationController.getUnreadCount.bind(notificationController));

  // Mark notification as read
  fastify.put('/:id/read', notificationController.markAsRead.bind(notificationController));

  // Mark all as read
  fastify.put('/read-all', notificationController.markAllAsRead.bind(notificationController));

  // Delete notification
  fastify.delete('/:id', notificationController.deleteNotification.bind(notificationController));
}
