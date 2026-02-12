import type { FastifyRequest, FastifyReply } from 'fastify';
import { approvalService } from './approval.service';
import { z } from 'zod';

const ApproveSchema = z.object({
  reviewNote: z.string().optional(),
});

const RejectSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
});

export class ApprovalController {
  /**
   * GET /api/approvals/pending
   * Get all pending transactions
   */
  async getPendingTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const transactions = await approvalService.getPendingTransactions();

      return reply.send({ items: transactions, count: transactions.length });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * POST /api/approvals/transactions/:id/approve
   * Approve a pending transaction
   */
  async approveTransaction(
    request: FastifyRequest<{
      Params: { id: string };
      Body: z.infer<typeof ApproveSchema>;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const reviewerId = (request.user as any).userId;
      const body = ApproveSchema.parse(request.body);

      const transaction = await approvalService.approveTransaction(
        id,
        reviewerId,
        body.reviewNote
      );

      return reply.send(transaction);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message.includes('not pending')) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * POST /api/approvals/transactions/:id/reject
   * Reject a pending transaction
   */
  async rejectTransaction(
    request: FastifyRequest<{
      Params: { id: string };
      Body: z.infer<typeof RejectSchema>;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const reviewerId = (request.user as any).userId;
      const body = RejectSchema.parse(request.body);

      const transaction = await approvalService.rejectTransaction(
        id,
        reviewerId,
        body.rejectionReason
      );

      return reply.send(transaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      if (error.message.includes('not found')) {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message.includes('not pending') || error.message.includes('required')) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * GET /api/approvals/stats
   * Get approval statistics
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await approvalService.getApprovalStats();

      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}

export const approvalController = new ApprovalController();
