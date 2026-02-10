import { FastifyInstance } from 'fastify';
import { commissionRateService } from './commission-rate.service.js';
import {
  createCommissionRateSchema,
  updateCommissionRateSchema,
  commissionRateQuerySchema,
} from './commission-rate.schema.js';
import type {
  CreateCommissionRateInput,
  UpdateCommissionRateInput,
  CommissionRateQueryInput,
} from './commission-rate.schema.js';
import { authenticate, requireAdmin } from '../auth/auth.routes.js';

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // ==================== COMMISSION RATES ====================

  /**
   * GET /settings/commission-rates
   */
  app.get<{ Querystring: CommissionRateQueryInput }>(
    '/commission-rates',
    async (request, reply) => {
      const query = commissionRateQuerySchema.parse(request.query);
      const result = await commissionRateService.findAll(query);

      return { success: true, data: result };
    }
  );

  /**
   * GET /settings/commission-rates/:id
   */
  app.get<{ Params: { id: string } }>(
    '/commission-rates/:id',
    async (request, reply) => {
      const rate = await commissionRateService.findById(request.params.id);
      return { success: true, data: rate };
    }
  );

  /**
   * POST /settings/commission-rates
   */
  app.post<{ Body: CreateCommissionRateInput }>(
    '/commission-rates',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      const input = createCommissionRateSchema.parse(request.body);
      const rate = await commissionRateService.create(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: rate });
    }
  );

  /**
   * PATCH /settings/commission-rates/:id
   */
  app.patch<{ Params: { id: string }; Body: UpdateCommissionRateInput }>(
    '/commission-rates/:id',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      const input = updateCommissionRateSchema.parse(request.body);
      const rate = await commissionRateService.update(request.params.id, input, request.user!.userId);

      return { success: true, data: rate };
    }
  );

  // ==================== CATEGORIES (Placeholder) ====================

  /**
   * GET /settings/categories
   */
  app.get('/categories', async (request, reply) => {
    // TODO: Implement category service
    return { success: true, data: { items: [], total: 0 } };
  });

  // ==================== DELIVERY TYPES (Placeholder) ====================

  /**
   * GET /settings/delivery-types
   */
  app.get('/delivery-types', async (request, reply) => {
    // TODO: Implement delivery type service
    return { success: true, data: { items: [], total: 0 } };
  });
}
