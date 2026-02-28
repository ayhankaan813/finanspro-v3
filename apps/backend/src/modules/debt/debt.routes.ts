import { FastifyInstance } from 'fastify';
import { debtService } from './debt.service.js';
import {
  createDebtSchema,
  createDebtPaymentSchema,
  cancelDebtSchema,
  debtQuerySchema,
} from './debt.schema.js';
import type {
  CreateDebtInput,
  CreateDebtPaymentInput,
  CancelDebtInput,
  DebtQueryInput,
} from './debt.schema.js';
import { authenticate } from '../auth/auth.routes.js';

export async function debtRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ==================== SUMMARY & ANALYTICS ====================

  /**
   * GET /debts/summary
   * Aggregate debt summary (total active debt, paid, counts)
   */
  app.get('/summary', async (request, reply) => {
    const summary = await debtService.getSummary();
    return { success: true, data: summary };
  });

  /**
   * GET /debts/financier-summary
   * Per-financier debt/receivable breakdown
   */
  app.get('/financier-summary', async (request, reply) => {
    const summary = await debtService.getFinancierSummary();
    return { success: true, data: summary };
  });

  /**
   * GET /debts/matrix
   * Cross-matrix of debts between financiers
   */
  app.get('/matrix', async (request, reply) => {
    const matrix = await debtService.getMatrix();
    return { success: true, data: matrix };
  });

  // ==================== CRUD ====================

  /**
   * GET /debts
   * List debts with optional filters
   */
  app.get<{ Querystring: DebtQueryInput }>(
    '/',
    async (request, reply) => {
      const query = debtQuerySchema.parse(request.query);
      const result = await debtService.findAll(query);
      return { success: true, data: result };
    }
  );

  /**
   * GET /debts/:id
   * Get a single debt with payments
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const debt = await debtService.findById(request.params.id);
      return { success: true, data: debt };
    }
  );

  /**
   * POST /debts
   * Create a new debt
   */
  app.post<{ Body: CreateDebtInput }>(
    '/',
    async (request, reply) => {
      const input = createDebtSchema.parse(request.body);
      const debt = await debtService.create(input, request.user!.userId);
      return reply.status(201).send({ success: true, data: debt });
    }
  );

  // ==================== ACTIONS ====================

  /**
   * POST /debts/:id/payments
   * Make a payment against a debt
   */
  app.post<{ Params: { id: string }; Body: CreateDebtPaymentInput }>(
    '/:id/payments',
    async (request, reply) => {
      const input = createDebtPaymentSchema.parse(request.body);
      const debt = await debtService.pay(request.params.id, input, request.user!.userId);
      return reply.status(201).send({ success: true, data: debt });
    }
  );

  /**
   * PATCH /debts/:id/cancel
   * Cancel a debt (only if no payments)
   */
  app.patch<{ Params: { id: string }; Body: CancelDebtInput }>(
    '/:id/cancel',
    async (request, reply) => {
      const input = cancelDebtSchema.parse(request.body);
      const debt = await debtService.cancel(request.params.id, input, request.user!.userId);
      return { success: true, data: debt };
    }
  );
}
