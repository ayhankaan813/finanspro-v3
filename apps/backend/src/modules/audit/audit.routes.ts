import { FastifyInstance } from 'fastify';
import { auditService } from './audit.service.js';
import { authenticate } from '../auth/auth.routes.js';

export async function auditRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  /**
   * GET /audit-logs — Tüm audit logları (sadece ADMIN ve VIEWER)
   */
  app.get<{
    Querystring: {
      page?: string;
      limit?: string;
      user_id?: string;
      action?: string;
      entity_type?: string;
      entity_id?: string;
      ip_address?: string;
      date_from?: string;
      date_to?: string;
      search?: string;
    };
  }>('/', async (request, reply) => {
    const user = (request as any).user;
    if (user.role !== 'ADMIN' && user.role !== 'VIEWER') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Audit log erişiminiz yok' },
      });
    }

    const { page, limit, ...filters } = request.query;
    const result = await auditService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      ...filters,
    });

    return { success: true, data: result };
  });

  /**
   * GET /audit-logs/stats — Audit istatistikleri (sadece ADMIN)
   */
  app.get<{ Querystring: { days?: string } }>('/stats', async (request, reply) => {
    const user = (request as any).user;
    if (user.role !== 'ADMIN') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Sadece admin erişebilir' },
      });
    }

    const days = request.query.days ? parseInt(request.query.days) : 7;
    const stats = await auditService.getStats(days);
    return { success: true, data: stats };
  });

  /**
   * GET /audit-logs/entity/:type/:id — Belirli entity geçmişi
   */
  app.get<{ Params: { type: string; id: string } }>('/entity/:type/:id', async (request, reply) => {
    const user = (request as any).user;
    if (user.role !== 'ADMIN' && user.role !== 'VIEWER') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Erişiminiz yok' },
      });
    }

    const history = await auditService.getEntityHistory(request.params.type, request.params.id);
    return { success: true, data: history };
  });

  /**
   * GET /audit-logs/user/:id — Kullanıcı aktivitesi
   */
  app.get<{ Params: { id: string }; Querystring: { days?: string } }>('/user/:id', async (request, reply) => {
    const user = (request as any).user;
    if (user.role !== 'ADMIN') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Sadece admin erişebilir' },
      });
    }

    const days = request.query.days ? parseInt(request.query.days) : 30;
    const activity = await auditService.getUserActivity(request.params.id, days);
    return { success: true, data: activity };
  });
}
