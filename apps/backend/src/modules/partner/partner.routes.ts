import { FastifyInstance } from 'fastify';
import { partnerService } from './partner.service.js';
import { createPartnerSchema, updatePartnerSchema, partnerQuerySchema, assignSiteSchema } from './partner.schema.js';
import type { CreatePartnerInput, UpdatePartnerInput, PartnerQueryInput, AssignSiteInput } from './partner.schema.js';
import { authenticate, requireAdmin } from '../auth/auth.routes.js';
import { commissionRateService } from '../settings/commission-rate.service.js';
import { EntityType, TransactionType } from '@prisma/client';

export async function partnerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  /**
   * GET /partners
   */
  app.get<{ Querystring: PartnerQueryInput }>(
    '/',
    async (request, reply) => {
      const query = partnerQuerySchema.parse(request.query);
      const result = await partnerService.findAll(query);

      return { success: true, data: result };
    }
  );

  /**
   * GET /partners/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const partner = await partnerService.findById(request.params.id);
      return { success: true, data: partner };
    }
  );

  /**
   * POST /partners
   */
  app.post<{ Body: CreatePartnerInput }>(
    '/',
    async (request, reply) => {
      const input = createPartnerSchema.parse(request.body);
      const partner = await partnerService.create(input, request.user!.userId);

      return reply.status(201).send({ success: true, data: partner });
    }
  );

  /**
   * PATCH /partners/:id
   */
  app.patch<{ Params: { id: string }; Body: UpdatePartnerInput }>(
    '/:id',
    async (request, reply) => {
      const input = updatePartnerSchema.parse(request.body);
      const partner = await partnerService.update(request.params.id, input, request.user!.userId);

      return { success: true, data: partner };
    }
  );

  /**
   * DELETE /partners/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      await partnerService.delete(request.params.id, request.user!.userId);
      return { success: true, data: { message: 'Partner silindi' } };
    }
  );

  /**
   * GET /partners/:id/account
   */
  app.get<{ Params: { id: string } }>(
    '/:id/account',
    async (request, reply) => {
      const partner = await partnerService.findById(request.params.id);

      return {
        success: true,
        data: {
          partner: { id: partner.id, name: partner.name, code: partner.code },
          account: partner.account,
        },
      };
    }
  );

  /**
   * GET /partners/:id/sites
   */
  app.get<{ Params: { id: string } }>(
    '/:id/sites',
    async (request, reply) => {
      const sites = await partnerService.getSites(request.params.id);
      return { success: true, data: sites };
    }
  );

  /**
   * POST /partners/:id/sites
   * Assign partner to a site
   */
  app.post<{ Params: { id: string }; Body: AssignSiteInput }>(
    '/:id/sites',
    async (request, reply) => {
      const input = assignSiteSchema.parse(request.body);
      const result = await partnerService.assignSite(request.params.id, input, request.user!.userId);

      return reply.status(201).send({ success: true, data: result });
    }
  );

  /**
   * DELETE /partners/:id/sites/:siteId
   * Remove partner from a site
   */
  app.delete<{ Params: { id: string; siteId: string } }>(
    '/:id/sites/:siteId',
    async (request, reply) => {
      await partnerService.removeSite(request.params.id, request.params.siteId, request.user!.userId);
      return { success: true, data: { message: 'Partner siteden çıkarıldı' } };
    }
  );

  /**
   * GET /partners/:id/commission-rates
   */
  app.get<{ Params: { id: string } }>(
    '/:id/commission-rates',
    async (request, reply) => {
      const rates = await partnerService.getCommissionRates(request.params.id);
      return { success: true, data: rates };
    }
  );

  /**
   * POST /partners/:id/commission-rates
   * Create a commission rate for a partner (optionally per site)
   */
  app.post<{
    Params: { id: string };
    Body: { transaction_type: TransactionType; rate: string; related_site_id?: string };
  }>(
    '/:id/commission-rates',
    {
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      // Validate partner exists
      await partnerService.findById(request.params.id);

      const rate = await commissionRateService.create(
        {
          entity_type: EntityType.PARTNER,
          entity_id: request.params.id,
          transaction_type: request.body.transaction_type,
          rate: request.body.rate,
          related_site_id: request.body.related_site_id,
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
   * PATCH /partners/:id/commission-rates/:rateId
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
      // Validate partner exists
      await partnerService.findById(request.params.id);

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

  /**
   * GET /partners/:id/statistics/:year
   * Get yearly statistics for a partner
   */
  app.get<{ Params: { id: string; year: string } }>(
    '/:id/statistics/:year',
    async (request, reply) => {
      const year = parseInt(request.params.year, 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Geçersiz yıl' },
        });
      }

      const statistics = await partnerService.getYearlyStatistics(request.params.id, year);

      return {
        success: true,
        data: statistics,
      };
    }
  );

  /**
   * GET /partners/:id/statistics/:year/:month
   * Get monthly (daily) statistics for a partner
   */
  app.get<{ Params: { id: string; year: string; month: string } }>(
    '/:id/statistics/:year/:month',
    async (request, reply) => {
      const year = parseInt(request.params.year, 10);
      const month = parseInt(request.params.month, 10);

      if (isNaN(year) || year < 2000 || year > 2100) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_YEAR', message: 'Geçersiz yıl' },
        });
      }

      if (isNaN(month) || month < 1 || month > 12) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_MONTH', message: 'Geçersiz ay' },
        });
      }

      const statistics = await partnerService.getMonthlyStatistics(request.params.id, year, month);

      return {
        success: true,
        data: statistics,
      };
    }
  );
}
