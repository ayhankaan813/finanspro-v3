import { FastifyInstance } from 'fastify';
import { financierService } from './financier.service.js';
import {
  createFinancierSchema,
  updateFinancierSchema,
  financierQuerySchema,
  createBlockSchema,
  resolveBlockSchema,
} from './financier.schema.js';
import type {
  CreateFinancierInput,
  UpdateFinancierInput,
  FinancierQueryInput,
  CreateBlockInput,
  ResolveBlockInput,
} from './financier.schema.js';
import { authenticate, requireAdmin } from '../auth/auth.routes.js';
import { commissionRateService } from '../settings/commission-rate.service.js';
import { EntityType, TransactionType } from '@prisma/client';

export async function financierRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  /**
   * GET /financiers
   */
  app.get<{ Querystring: FinancierQueryInput }>(
    '/',
    async (request, reply) => {
      const query = financierQuerySchema.parse(request.query);
      const result = await financierService.findAll(query);

      return { success: true, data: result };
    }
  );

  /**
   * GET /financiers/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const financier = await financierService.findById(request.params.id);
      return { success: true, data: financier };
    }
  );

  /**
   * POST /financiers
   */
  app.post<{ Body: CreateFinancierInput }>(
    '/',
    async (request, reply) => {
      const input = createFinancierSchema.parse(request.body);
      const financier = await financierService.create(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: financier });
    }
  );

  /**
   * PATCH /financiers/:id
   */
  app.patch<{ Params: { id: string }; Body: UpdateFinancierInput }>(
    '/:id',
    async (request, reply) => {
      const input = updateFinancierSchema.parse(request.body);
      const financier = await financierService.update(request.params.id, input, request.user!.userId);

      return { success: true, data: financier };
    }
  );

  /**
   * DELETE /financiers/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      await financierService.delete(request.params.id, request.user!.userId);
      return { success: true, data: { message: 'Finansör silindi' } };
    }
  );

  /**
   * GET /financiers/:id/account
   */
  app.get<{ Params: { id: string } }>(
    '/:id/account',
    async (request, reply) => {
      const balance = await financierService.getAvailableBalance(request.params.id);
      const financier = await financierService.findById(request.params.id);

      return {
        success: true,
        data: {
          financier: { id: financier.id, name: financier.name, code: financier.code },
          account: financier.account,
          balance,
        },
      };
    }
  );

  /**
   * GET /financiers/:id/transactions
   * Get financier's transactions
   */
  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/:id/transactions',
    async (request, reply) => {
      const query = {
        page: parseInt(request.query.page || '1', 10),
        limit: parseInt(request.query.limit || '20', 10),
      };
      const result = await financierService.getTransactions(request.params.id, query);

      return {
        success: true,
        data: result,
      };
    }
  );

  /**
   * GET /financiers/:id/blocks
   */
  app.get<{ Params: { id: string }; Querystring: { includeResolved?: string } }>(
    '/:id/blocks',
    async (request, reply) => {
      const includeResolved = request.query.includeResolved === 'true';
      const blocks = await financierService.getBlocks(request.params.id, includeResolved);

      return { success: true, data: blocks };
    }
  );

  /**
   * POST /financiers/:id/blocks
   * Create a new block
   */
  app.post<{ Params: { id: string }; Body: CreateBlockInput }>(
    '/:id/blocks',
    async (request, reply) => {
      const input = createBlockSchema.parse(request.body);
      const block = await financierService.createBlock(request.params.id, input, request.user!.userId);

      return reply.status(201).send({ success: true, data: block });
    }
  );

  /**
   * PATCH /financiers/:id/blocks/:blockId
   * Resolve a block
   */
  app.patch<{ Params: { id: string; blockId: string }; Body: ResolveBlockInput }>(
    '/:id/blocks/:blockId',
    async (request, reply) => {
      const input = resolveBlockSchema.parse(request.body);
      await financierService.resolveBlock(
        request.params.id,
        request.params.blockId,
        input,
        request.user!.userId
      );

      return { success: true, data: { message: 'Bloke çözüldü' } };
    }
  );

  // ==================== COMMISSION RATES ====================

  /**
   * GET /financiers/:id/commission-rates
   * Get financier's commission rates
   */
  app.get<{ Params: { id: string } }>(
    '/:id/commission-rates',
    async (request, reply) => {
      // Validate financier exists
      await financierService.findById(request.params.id);

      const rates = await commissionRateService.getEntityRates(EntityType.FINANCIER, request.params.id);

      return {
        success: true,
        data: rates,
      };
    }
  );

  /**
   * POST /financiers/:id/commission-rates
   * Create a commission rate for a financier
   */
  app.post<{
    Params: { id: string };
    Body: { transaction_type: TransactionType; rate: string };
  }>(
    '/:id/commission-rates',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      // Validate financier exists
      await financierService.findById(request.params.id);

      const rate = await commissionRateService.create(
        {
          entity_type: EntityType.FINANCIER,
          entity_id: request.params.id,
          transaction_type: request.body.transaction_type,
          rate: request.body.rate,
        },
        request.user!.userId
      );

      return reply.status(201).send({
        success: true,
        data: rate,
      });
    }
  );

  /**
   * PATCH /financiers/:id/commission-rates/:rateId
   * Update a commission rate
   */
  app.patch<{
    Params: { id: string; rateId: string };
    Body: { rate?: string; is_active?: boolean };
  }>(
    '/:id/commission-rates/:rateId',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      // Validate financier exists
      await financierService.findById(request.params.id);

      const rate = await commissionRateService.update(
        request.params.rateId,
        request.body,
        request.user!.userId
      );

      return {
        success: true,
        data: rate,
      };
    }
  );
}
