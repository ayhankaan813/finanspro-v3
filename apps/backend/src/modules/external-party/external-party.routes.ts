import { FastifyInstance } from 'fastify';
import { externalPartyService } from './external-party.service.js';
import {
  createExternalPartySchema,
  updateExternalPartySchema,
  externalPartyQuerySchema,
} from './external-party.schema.js';
import type {
  CreateExternalPartyInput,
  UpdateExternalPartyInput,
  ExternalPartyQueryInput,
} from './external-party.schema.js';
import { authenticate } from '../auth/auth.routes.js';

export async function externalPartyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  /**
   * GET /external-parties
   */
  app.get<{ Querystring: ExternalPartyQueryInput }>(
    '/',
    async (request, reply) => {
      const query = externalPartyQuerySchema.parse(request.query);
      const result = await externalPartyService.findAll(query);

      return { success: true, data: result };
    }
  );

  /**
   * GET /external-parties/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const party = await externalPartyService.findById(request.params.id);
      return { success: true, data: party };
    }
  );

  /**
   * POST /external-parties
   */
  app.post<{ Body: CreateExternalPartyInput }>(
    '/',
    async (request, reply) => {
      const input = createExternalPartySchema.parse(request.body);
      const party = await externalPartyService.create(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: party });
    }
  );

  /**
   * PATCH /external-parties/:id
   */
  app.patch<{ Params: { id: string }; Body: UpdateExternalPartyInput }>(
    '/:id',
    async (request, reply) => {
      const input = updateExternalPartySchema.parse(request.body);
      const party = await externalPartyService.update(request.params.id, input, request.user!.userId);

      return { success: true, data: party };
    }
  );

  /**
   * DELETE /external-parties/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      await externalPartyService.delete(request.params.id, request.user!.userId);
      return { success: true, data: { message: 'Dış kişi silindi' } };
    }
  );

  /**
   * GET /external-parties/:id/account
   */
  app.get<{ Params: { id: string } }>(
    '/:id/account',
    async (request, reply) => {
      const party = await externalPartyService.findById(request.params.id);

      return {
        success: true,
        data: {
          external_party: { id: party.id, name: party.name },
          account: party.account,
        },
      };
    }
  );

  /**
   * GET /external-parties/:id/transactions
   */
  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/:id/transactions',
    async (request, reply) => {
      const query = {
        page: parseInt(request.query.page || '1', 10),
        limit: parseInt(request.query.limit || '20', 10),
      };
      const result = await externalPartyService.getTransactions(request.params.id, query);

      return { success: true, data: result };
    }
  );

  // ==================== STATISTICS ====================

  /**
   * GET /external-parties/:id/statistics/:year
   */
  app.get<{ Params: { id: string; year: string } }>(
    '/:id/statistics/:year',
    async (request, reply) => {
      const year = parseInt(request.params.year, 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Gecersiz yil' },
        });
      }
      const statistics = await externalPartyService.getYearlyStatistics(request.params.id, year);
      return { success: true, data: statistics };
    }
  );

  /**
   * GET /external-parties/:id/statistics/:year/:month
   */
  app.get<{ Params: { id: string; year: string; month: string } }>(
    '/:id/statistics/:year/:month',
    async (request, reply) => {
      const year = parseInt(request.params.year, 10);
      const month = parseInt(request.params.month, 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Gecersiz yil' },
        });
      }
      if (isNaN(month) || month < 1 || month > 12) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_MONTH', message: 'Gecersiz ay (1-12 arasi olmali)' },
        });
      }
      const statistics = await externalPartyService.getMonthlyStatistics(request.params.id, year, month);
      return { success: true, data: statistics };
    }
  );
}
