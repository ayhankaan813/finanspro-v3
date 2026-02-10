import { FastifyInstance } from 'fastify';
import { ledgerService } from './ledger.service.js';
import { authenticate, requireAdmin } from '../auth/auth.routes.js';

export async function ledgerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  /**
   * GET /ledger/transaction/:transactionId
   * Get ledger entries for a transaction
   */
  app.get<{ Params: { transactionId: string } }>(
    '/transaction/:transactionId',
    async (request, reply) => {
      const entries = await ledgerService.getEntriesByTransaction(request.params.transactionId);
      return { success: true, data: entries };
    }
  );

  /**
   * GET /ledger/account/:entityId
   * Get ledger entries for an account
   */
  app.get<{ Params: { entityId: string }; Querystring: { page?: string; limit?: string } }>(
    '/account/:entityId',
    async (request, reply) => {
      const query = {
        page: parseInt(request.query.page || '1', 10),
        limit: parseInt(request.query.limit || '20', 10),
      };
      const result = await ledgerService.getEntriesByAccount(request.params.entityId, query);
      return { success: true, data: result };
    }
  );

  /**
   * GET /ledger/balance-check
   * Verify system-wide ledger balance (Admin only)
   */
  app.get(
    '/balance-check',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      const result = await ledgerService.verifySystemBalance();
      return {
        success: true,
        data: {
          ...result,
          status: result.isBalanced ? 'OK' : 'IMBALANCED',
          message: result.isBalanced
            ? 'Sistem bakiyesi dengeli ✅'
            : '⚠️ KRİTİK: Sistem bakiyesi dengesiz!',
        },
      };
    }
  );

  /**
   * GET /ledger/reconcile/:entityId
   * Reconcile account balance (Admin only)
   */
  app.get<{ Params: { entityId: string } }>(
    '/reconcile/:entityId',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      const result = await ledgerService.reconcileAccountBalance(request.params.entityId);
      return {
        success: true,
        data: {
          ...result,
          status: result.isReconciled ? 'OK' : 'MISMATCH',
          message: result.isReconciled
            ? 'Hesap bakiyesi tutarlı ✅'
            : '⚠️ Hesap bakiyesi uyuşmazlığı tespit edildi!',
        },
      };
    }
  );
}
