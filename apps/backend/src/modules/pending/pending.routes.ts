import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../auth/auth.routes.js';
import { pendingService } from './pending.service.js';

export async function pendingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  /**
   * GET /pending-transactions — Bekleyen işlemleri listele
   * Admin: Tümünü görür
   * Partner: Sadece kendi taleplerini görür
   */
  app.get<{
    Querystring: {
      status?: string;
      transaction_type?: string;
      page?: string;
      limit?: string;
    };
  }>('/', async (request, reply) => {
    const user = request.user!;
    const { status, transaction_type, page, limit } = request.query;

    const params: any = {
      status: status || undefined,
      transaction_type: transaction_type || undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    };

    // Partner sadece kendi taleplerini görür
    if (user.role === 'PARTNER') {
      params.requested_by = user.userId;
    }

    const result = await pendingService.findAll(params);
    return { success: true, data: result };
  });

  /**
   * GET /pending-transactions/count — Bekleyen işlem sayısı
   * Partner: Sadece kendi talep sayısı
   */
  app.get('/count', async (request, reply) => {
    const user = request.user!;
    const requestedBy = user.role === 'PARTNER' ? user.userId : undefined;
    const count = await pendingService.getPendingCount(requestedBy);
    return { success: true, data: { count } };
  });

  /**
   * GET /pending-transactions/:id — Detay
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const pending = await pendingService.findById(request.params.id);

    // Partner sadece kendi taleplerini görebilir
    if (request.user!.role === 'PARTNER' && pending.requested_by !== request.user!.userId) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Bu talebe erişim yetkiniz yok' },
      });
    }

    return { success: true, data: pending };
  });

  /**
   * POST /pending-transactions/:id/approve — İşlemi onayla (sadece Admin)
   */
  app.post<{ Params: { id: string }; Body: { note?: string } }>(
    '/:id/approve',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const approved = await pendingService.approve(
        request.params.id,
        request.user!.userId,
        request.body?.note
      );
      return { success: true, data: approved };
    }
  );

  /**
   * POST /pending-transactions/:id/reject — İşlemi reddet (sadece Admin)
   */
  app.post<{ Params: { id: string }; Body: { note?: string } }>(
    '/:id/reject',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const rejected = await pendingService.reject(
        request.params.id,
        request.user!.userId,
        request.body?.note
      );
      return { success: true, data: rejected };
    }
  );
}
