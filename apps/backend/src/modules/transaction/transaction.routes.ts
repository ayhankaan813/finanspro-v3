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
  transactionQuerySchema,
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
  TransactionQueryInput,
} from './transaction.schema.js';
import { authenticate, requireAdmin } from '../auth/auth.routes.js';

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

  /**
   * POST /transactions/deposit
   * Create a deposit transaction
   */
  app.post<{ Body: CreateDepositInput }>(
    '/deposit',
    async (request, reply) => {
      const input = createDepositSchema.parse(request.body);
      const transaction = await transactionService.processDeposit(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/withdrawal
   * Create a withdrawal transaction
   */
  app.post<{ Body: CreateWithdrawalInput }>(
    '/withdrawal',
    async (request, reply) => {
      const input = createWithdrawalSchema.parse(request.body);
      const transaction = await transactionService.processWithdrawal(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/site-delivery
   * Create a site delivery transaction
   */
  app.post<{ Body: CreateSiteDeliveryInput }>(
    '/site-delivery',
    async (request, reply) => {
      const input = createSiteDeliverySchema.parse(request.body);
      const transaction = await transactionService.processSiteDelivery(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/partner-payment
   * Create a partner payment transaction
   */
  app.post<{ Body: CreatePartnerPaymentInput }>(
    '/partner-payment',
    async (request, reply) => {
      const input = createPartnerPaymentSchema.parse(request.body);
      const transaction = await transactionService.processPartnerPayment(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/financier-transfer
   * Transfer between two financiers
   */
  app.post<{ Body: CreateFinancierTransferInput }>(
    '/financier-transfer',
    async (request, reply) => {
      const input = createFinancierTransferSchema.parse(request.body);
      const transaction = await transactionService.processFinancierTransfer(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/external-debt
   * Create external debt transaction (in or out)
   */
  app.post<{ Body: CreateExternalDebtInput }>(
    '/external-debt',
    async (request, reply) => {
      const input = createExternalDebtSchema.parse(request.body);

      let transaction;
      if (input.direction === 'in') {
        const { direction, ...rest } = input;
        transaction = await transactionService.processExternalDebtIn(rest, request.user!.userId);
      } else {
        const { direction, ...rest } = input;
        transaction = await transactionService.processExternalDebtOut(rest, request.user!.userId);
      }

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/external-payment
   * Pay to external party
   */
  app.post<{ Body: CreateExternalPaymentInput }>(
    '/external-payment',
    async (request, reply) => {
      const input = createExternalPaymentSchema.parse(request.body);
      const transaction = await transactionService.processExternalPayment(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/org-expense
   * Organization expense
   */
  app.post<{ Body: CreateOrgExpenseInput }>(
    '/org-expense',
    async (request, reply) => {
      const input = createOrgExpenseSchema.parse(request.body);
      const transaction = await transactionService.processOrgExpense(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/org-income
   * Organization income
   */
  app.post<{ Body: CreateOrgIncomeInput }>(
    '/org-income',
    async (request, reply) => {
      const input = createOrgIncomeSchema.parse(request.body);
      const transaction = await transactionService.processOrgIncome(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  /**
   * POST /transactions/org-withdraw
   * Organization owner withdraws profit
   */
  app.post<{ Body: CreateOrgWithdrawInput }>(
    '/org-withdraw',
    async (request, reply) => {
      const input = createOrgWithdrawSchema.parse(request.body);
      const transaction = await transactionService.processOrgWithdraw(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  // ==================== YENİ: ÖDEME (Payment) ====================
  /**
   * POST /transactions/payment
   * Create a payment transaction (to anyone - no commission)
   * Source types: SITE, PARTNER, EXTERNAL_PARTY, ORGANIZATION
   */
  app.post<{ Body: CreatePaymentInput }>(
    '/payment',
    async (request, reply) => {
      const input = createPaymentSchema.parse(request.body);
      const transaction = await transactionService.processPayment(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  // ==================== YENİ: TAKVİYE (Top-up) ====================
  /**
   * POST /transactions/top-up
   * Create a top-up transaction (cash injection to financier)
   * Source types: PARTNER, ORGANIZATION, EXTERNAL
   */
  app.post<{ Body: CreateTopUpInput }>(
    '/top-up',
    async (request, reply) => {
      const input = createTopUpSchema.parse(request.body);
      const transaction = await transactionService.processTopUp(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
    }
  );

  // ==================== YENİ: TESLİM (Delivery) ====================
  /**
   * POST /transactions/delivery
   * Create a delivery transaction (site receives money - WITH commission)
   * Commission based on: site + delivery type + partner (if applicable)
   */
  app.post<{ Body: CreateDeliveryInput }>(
    '/delivery',
    async (request, reply) => {
      const input = createDeliverySchema.parse(request.body);
      const transaction = await transactionService.processDelivery(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: transaction });
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
}
