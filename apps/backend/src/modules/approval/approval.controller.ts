import type { FastifyRequest, FastifyReply } from 'fastify';
import { approvalService } from './approval.service';
import { z } from 'zod';

const ApproveSchema = z.object({
  reviewNote: z.string().optional(),
  note: z.string().optional(),
}).transform(data => ({
  reviewNote: data.reviewNote || data.note,
}));

const RejectSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required').optional(),
  reason: z.string().min(1, 'Rejection reason is required').optional(),
}).transform(data => ({
  rejectionReason: data.rejectionReason || data.reason || '',
})).refine(data => data.rejectionReason && data.rejectionReason.length > 0, {
  message: 'Rejection reason is required',
});

export class ApprovalController {
  /**
   * GET /api/approvals/pending
   */
  async getPendingTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const transactions = await approvalService.getPendingTransactions();
      return reply.send({
        success: true,
        data: { items: transactions, count: transactions.length },
      });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }

  /**
   * POST /api/approvals/transactions/:id/approve
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

      return reply.send({ success: true, data: transaction });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return reply.status(404).send({ success: false, error: { message: error.message } });
      }
      if (error.message.includes('not pending')) {
        return reply.status(400).send({ success: false, error: { message: error.message } });
      }
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }

  /**
   * POST /api/approvals/transactions/:id/reject
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

      return reply.send({ success: true, data: transaction });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: { message: error.errors[0]?.message || 'Validation error' } });
      }
      if (error.message.includes('not found')) {
        return reply.status(404).send({ success: false, error: { message: error.message } });
      }
      if (error.message.includes('not pending') || error.message.includes('required')) {
        return reply.status(400).send({ success: false, error: { message: error.message } });
      }
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/approvals/stats
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await approvalService.getApprovalStats();
      return reply.send({ success: true, data: stats });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }
}

export const approvalController = new ApprovalController();
