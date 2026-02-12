import type { FastifyInstance } from 'fastify';
import { approvalController } from './approval.controller.js';
import { authenticate } from '../auth/auth.routes.js';

export async function approvalRoutes(fastify: FastifyInstance) {
  // All approval routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Get pending transactions
  fastify.get('/pending', approvalController.getPendingTransactions.bind(approvalController));

  // Approve transaction
  fastify.post('/transactions/:id/approve', approvalController.approveTransaction.bind(approvalController));

  // Reject transaction
  fastify.post('/transactions/:id/reject', approvalController.rejectTransaction.bind(approvalController));

  // Get stats
  fastify.get('/stats', approvalController.getStats.bind(approvalController));
}
