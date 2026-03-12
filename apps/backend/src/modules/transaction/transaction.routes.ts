import { FastifyInstance } from 'fastify';
import { transactionService } from './transaction.service.js';
import {
  createDepositSchema,
  createWithdrawalSchema,
  createSiteDeliverySchema,
  createPartnerPaymentSchema,
  createFinancierTransferSchema,
  createExternalDebtSchema,
  createExternalPaymentSchema,
  createOrgExpenseSchema,
  createOrgIncomeSchema,
  createOrgWithdrawSchema,
  createPaymentSchema,
  createTopUpSchema,
  createDeliverySchema,
  reverseTransactionSchema,
  editTransactionSchema,
  transactionQuerySchema,
  bulkImportSchema,
} from './transaction.schema.js';
import type {
  CreateDepositInput,
  CreateWithdrawalInput,
  CreateSiteDeliveryInput,
  CreatePartnerPaymentInput,
  CreateFinancierTransferInput,
  CreateExternalDebtInput,
  CreateExternalPaymentInput,
  CreateOrgExpenseInput,
  CreateOrgIncomeInput,
  CreateOrgWithdrawInput,
  CreatePaymentInput,
  CreateTopUpInput,
  CreateDeliveryInput,
  ReverseTransactionInput,
  EditTransactionInput,
  TransactionQueryInput,
  BulkImportInput,
} from './transaction.schema.js';
import { authenticate, requireAdmin, getPartnerFilter } from '../auth/auth.routes.js';
import { requiresApproval, pendingService } from '../pending/pending.service.js';

/**
 * Role-aware transaction handler wrapper
 * Admin → direkt işle
 * Operator (yatırım/çekim) → direkt işle
 * Operator (diğerleri) → onay kuyruğuna
 * Partner → onay kuyruğuna
 */
async function handleWithApproval(
  request: any,
  reply: any,
  type: string,
  input: any,
  directProcessor: () => Promise<any>
) {
  const role = request.user?.role || 'USER';

  if (requiresApproval(role, type)) {
    // Onay kuyruğuna ekle
    const pending = await pendingService.create({
      transaction_type: type,
      payload: input,
      requested_by: request.user!.userId,
      requester_role: role,
    });

    return reply.status(202).send({
      success: true,
      data: pending,
      message: 'İşlem talebi oluşturuldu, admin onayı bekleniyor',
      pending: true,
    });
  }

  // Direkt işle
  const transaction = await directProcessor();
  return reply.status(201).send({ success: true, data: transaction });
}

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  /**
   * GET /transactions
   * List transactions with filtering
   */
  app.get<{ Querystring: TransactionQueryInput }>(
    '/',
    async (request, reply) => {
      const query = transactionQuerySchema.parse(request.query);
      
      // PARTNER: Sadece kendi sitelerindeki işlemleri görsün
      const partnerFilter = getPartnerFilter(request);
      if (partnerFilter.siteIds && partnerFilter.siteIds.length > 0) {
        query.site_id = query.site_id || undefined;
        // Service'e partner site filtresi gönder
        (query as any).partner_site_ids = partnerFilter.siteIds;
      }
      if (partnerFilter.partnerId) {
        (query as any).partner_filter_id = partnerFilter.partnerId;
      }
      
      const result = await transactionService.findAll(query);

      return { success: true, data: result };
    }
  );

  /**
   * GET /transactions/:id
   * Get transaction by ID
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const transaction = await transactionService.findById(request.params.id);
      return { success: true, data: transaction };
    }
  );

  // ==================== YATIRIM ====================
  app.post<{ Body: CreateDepositInput }>(
    '/deposit',
    async (request, reply) => {
      const input = createDepositSchema.parse(request.body);
      return handleWithApproval(request, reply, 'deposit', input,
        () => transactionService.processDeposit(input, request.user!.userId));
    }
  );

  // ==================== ÇEKİM ====================
  app.post<{ Body: CreateWithdrawalInput }>(
    '/withdrawal',
    async (request, reply) => {
      const input = createWithdrawalSchema.parse(request.body);
      return handleWithApproval(request, reply, 'withdrawal', input,
        () => transactionService.processWithdrawal(input, request.user!.userId));
    }
  );

  // ==================== SİTE TESLİM ====================
  app.post<{ Body: CreateSiteDeliveryInput }>(
    '/site-delivery',
    async (request, reply) => {
      const input = createSiteDeliverySchema.parse(request.body);
      return handleWithApproval(request, reply, 'site-delivery', input,
        () => transactionService.processSiteDelivery(input, request.user!.userId));
    }
  );

  // ==================== PARTNER ÖDEME ====================
  app.post<{ Body: CreatePartnerPaymentInput }>(
    '/partner-payment',
    async (request, reply) => {
      const input = createPartnerPaymentSchema.parse(request.body);
      return handleWithApproval(request, reply, 'partner-payment', input,
        () => transactionService.processPartnerPayment(input, request.user!.userId));
    }
  );

  // ==================== FİNANSÖR TRANSFER ====================
  app.post<{ Body: CreateFinancierTransferInput }>(
    '/financier-transfer',
    async (request, reply) => {
      const input = createFinancierTransferSchema.parse(request.body);
      return handleWithApproval(request, reply, 'financier-transfer', input,
        () => transactionService.processFinancierTransfer(input, request.user!.userId));
    }
  );

  // ==================== DIŞ BORÇ ====================
  app.post<{ Body: CreateExternalDebtInput }>(
    '/external-debt',
    async (request, reply) => {
      const input = createExternalDebtSchema.parse(request.body);
      return handleWithApproval(request, reply, 'external-debt', input, async () => {
        if (input.direction === 'in') {
          const { direction, ...rest } = input;
          return transactionService.processExternalDebtIn(rest, request.user!.userId);
        } else {
          const { direction, ...rest } = input;
          return transactionService.processExternalDebtOut(rest, request.user!.userId);
        }
      });
    }
  );

  // ==================== DIŞ ÖDEME ====================
  app.post<{ Body: CreateExternalPaymentInput }>(
    '/external-payment',
    async (request, reply) => {
      const input = createExternalPaymentSchema.parse(request.body);
      return handleWithApproval(request, reply, 'external-payment', input,
        () => transactionService.processExternalPayment(input, request.user!.userId));
    }
  );

  // ==================== ORG GİDER ====================
  app.post<{ Body: CreateOrgExpenseInput }>(
    '/org-expense',
    async (request, reply) => {
      const input = createOrgExpenseSchema.parse(request.body);
      return handleWithApproval(request, reply, 'org-expense', input,
        () => transactionService.processOrgExpense(input, request.user!.userId));
    }
  );

  // ==================== ORG GELİR ====================
  app.post<{ Body: CreateOrgIncomeInput }>(
    '/org-income',
    async (request, reply) => {
      const input = createOrgIncomeSchema.parse(request.body);
      return handleWithApproval(request, reply, 'org-income', input,
        () => transactionService.processOrgIncome(input, request.user!.userId));
    }
  );

  // ==================== ORG ÇEKİM ====================
  app.post<{ Body: CreateOrgWithdrawInput }>(
    '/org-withdraw',
    async (request, reply) => {
      const input = createOrgWithdrawSchema.parse(request.body);
      return handleWithApproval(request, reply, 'org-withdraw', input,
        () => transactionService.processOrgWithdraw(input, request.user!.userId));
    }
  );

  // ==================== ÖDEME ====================
  app.post<{ Body: CreatePaymentInput }>(
    '/payment',
    async (request, reply) => {
      const input = createPaymentSchema.parse(request.body);
      return handleWithApproval(request, reply, 'payment', input,
        () => transactionService.processPayment(input, request.user!.userId));
    }
  );

  // ==================== TAKVİYE ====================
  app.post<{ Body: CreateTopUpInput }>(
    '/top-up',
    async (request, reply) => {
      const input = createTopUpSchema.parse(request.body);
      return handleWithApproval(request, reply, 'top-up', input,
        () => transactionService.processTopUp(input, request.user!.userId));
    }
  );

  // ==================== TESLİM ====================
  app.post<{ Body: CreateDeliveryInput }>(
    '/delivery',
    async (request, reply) => {
      const input = createDeliverySchema.parse(request.body);
      return handleWithApproval(request, reply, 'delivery', input,
        () => transactionService.processDelivery(input, request.user!.userId));
    }
  );

  /**
   * POST /transactions/:id/reverse
   * Reverse a transaction (requires admin)
   */
  app.post<{ Params: { id: string }; Body: ReverseTransactionInput }>(
    '/:id/reverse',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      const input = reverseTransactionSchema.parse(request.body);
      const reversal = await transactionService.reverseTransaction(
        request.params.id,
        input,
        request.user!.userId
      );

      return { success: true, data: reversal };
    }
  );

  /**
   * PUT /transactions/:id/edit
   * Edit a completed transaction (requires admin)
   * Uses Undo & Recreate strategy for ledger consistency
   */
  app.put<{ Params: { id: string }; Body: EditTransactionInput }>(
    '/:id/edit',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      const input = editTransactionSchema.parse(request.body);
      const updated = await transactionService.editTransaction(
        request.params.id,
        input,
        request.user!.userId
      );

      return { success: true, data: updated };
    }
  );

  /**
   * GET /transactions/:id/edit-history
   * Get edit history for a transaction from audit logs
   */
  app.get<{ Params: { id: string } }>(
    '/:id/edit-history',
    async (request, reply) => {
      const history = await transactionService.getEditHistory(request.params.id);
      return { success: true, data: history };
    }
  );

  /**
   * POST /transactions/bulk
   * Bulk import transactions
   */
  app.post<{ Body: BulkImportInput }>(
    '/bulk',
    async (request, reply) => {
      const input = bulkImportSchema.parse(request.body);
      const result = await transactionService.processBulkImport(input, request.user!.userId);
      return reply.status(201).send({ success: true, data: result });
    }
  );
}
