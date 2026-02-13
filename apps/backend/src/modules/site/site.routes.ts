import { FastifyInstance } from 'fastify';
import { siteService } from './site.service.js';
import { createSiteSchema, updateSiteSchema, siteQuerySchema } from './site.schema.js';
import type { CreateSiteInput, UpdateSiteInput, SiteQueryInput } from './site.schema.js';
import { authenticate, requireAdmin } from '../auth/auth.routes.js';
import { commissionRateService } from '../settings/commission-rate.service.js';
import { EntityType, TransactionType } from '@prisma/client';

export async function siteRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  /**
   * GET /sites
   * List all sites with pagination
   */
  app.get<{ Querystring: SiteQueryInput }>(
    '/',
    async (request, reply) => {
      const query = siteQuerySchema.parse(request.query);
      const result = await siteService.findAll(query);

      return {
        success: true,
        data: result,
      };
    }
  );

  /**
   * GET /sites/stats
   * Get aggregated transaction stats for all sites within a date range
   */
  app.get<{ Querystring: { from?: string; to?: string } }>(
    '/stats',
    async (request, reply) => {
      const now = new Date();
      const from = request.query.from
        ? new Date(request.query.from)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const to = request.query.to
        ? new Date(request.query.to + 'T23:59:59.999Z')
        : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const stats = await siteService.getAllSiteStats(from, to);

      return {
        success: true,
        data: stats,
      };
    }
  );

  /**
   * GET /sites/:id
   * Get site by ID
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const site = await siteService.findById(request.params.id);

      return {
        success: true,
        data: site,
      };
    }
  );

  /**
   * POST /sites
   * Create new site
   */
  app.post<{ Body: CreateSiteInput }>(
    '/',
    async (request, reply) => {
      const input = createSiteSchema.parse(request.body);
      const site = await siteService.create(input, request.user!.userId);

      return reply.status(201).send({
        success: true,
        data: site,
      });
    }
  );

  /**
   * PATCH /sites/:id
   * Update site
   */
  app.patch<{ Params: { id: string }; Body: UpdateSiteInput }>(
    '/:id',
    async (request, reply) => {
      const input = updateSiteSchema.parse(request.body);
      const site = await siteService.update(request.params.id, input, request.user!.userId);

      return {
        success: true,
        data: site,
      };
    }
  );

  /**
   * DELETE /sites/:id
   * Soft delete site
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      await siteService.delete(request.params.id, request.user!.userId);

      return {
        success: true,
        data: { message: 'Site silindi' },
      };
    }
  );

  /**
   * GET /sites/:id/account
   * Get site's account details
   */
  app.get<{ Params: { id: string } }>(
    '/:id/account',
    async (request, reply) => {
      const site = await siteService.findById(request.params.id);

      return {
        success: true,
        data: {
          site: {
            id: site.id,
            name: site.name,
            code: site.code,
          },
          account: site.account,
        },
      };
    }
  );

  /**
   * GET /sites/:id/partners
   * Get site's partners
   */
  app.get<{ Params: { id: string } }>(
    '/:id/partners',
    async (request, reply) => {
      const partners = await siteService.getPartners(request.params.id);

      return {
        success: true,
        data: partners,
      };
    }
  );

  /**
   * GET /sites/:id/transactions
   * Get site's transactions
   */
  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/:id/transactions',
    async (request, reply) => {
      const query = {
        page: parseInt(request.query.page || '1', 10),
        limit: parseInt(request.query.limit || '20', 10),
      };
      const result = await siteService.getTransactions(request.params.id, query);

      return {
        success: true,
        data: result,
      };
    }
  );

  /**
   * GET /sites/:id/ledger
   * Get site's ledger entries
   */
  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/:id/ledger',
    async (request, reply) => {
      const query = {
        page: parseInt(request.query.page || '1', 10),
        limit: parseInt(request.query.limit || '20', 10),
      };
      const result = await siteService.getLedgerEntries(request.params.id, query);

      return {
        success: true,
        data: result,
      };
    }
  );

  // ==================== COMMISSION RATES ====================

  /**
   * GET /sites/:id/commission-rates
   * Get site's commission rates
   */
  app.get<{ Params: { id: string } }>(
    '/:id/commission-rates',
    async (request, reply) => {
      // Validate site exists
      await siteService.findById(request.params.id);

      const rates = await commissionRateService.getEntityRates(EntityType.SITE, request.params.id);

      return {
        success: true,
        data: rates,
      };
    }
  );

  /**
   * POST /sites/:id/commission-rates
   * Create or update a commission rate for a site
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
      // Validate site exists
      await siteService.findById(request.params.id);

      const rate = await commissionRateService.create(
        {
          entity_type: EntityType.SITE,
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
   * PATCH /sites/:id/commission-rates/:rateId
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
      // Validate site exists
      await siteService.findById(request.params.id);

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
   * GET /sites/:id/statistics/:year
   * Get yearly statistics for a site
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

      const statistics = await siteService.getYearlyStatistics(request.params.id, year);

      return {
        success: true,
        data: statistics,
      };
    }
  );

  /**
   * GET /sites/:id/statistics/:year/:month
   * Get monthly (daily) statistics for a site
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
          error: { code: 'INVALID_MONTH', message: 'Geçersiz ay (1-12 arası olmalı)' },
        });
      }

      const statistics = await siteService.getMonthlyStatistics(request.params.id, year, month);

      return {
        success: true,
        data: statistics,
      };
    }
  );
}
