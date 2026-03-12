import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../auth/auth.routes.js';
import { userService, CreateUserInput, UpdateUserInput } from './user.service.js';

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireAdmin);

  /**
   * GET /users — Tüm kullanıcıları listele
   */
  app.get('/', async (request, reply) => {
    const users = await userService.findAll();
    return { success: true, data: users };
  });

  /**
   * GET /users/:id — Kullanıcı detay
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = await userService.findById(request.params.id);
    return { success: true, data: user };
  });

  /**
   * POST /users — Yeni kullanıcı oluştur
   */
  app.post<{ Body: CreateUserInput }>('/', async (request, reply) => {
    const user = await userService.create(request.body);
    return reply.status(201).send({ success: true, data: user });
  });

  /**
   * PATCH /users/:id — Kullanıcı güncelle
   */
  app.patch<{ Params: { id: string }; Body: UpdateUserInput }>(
    '/:id',
    async (request, reply) => {
      const user = await userService.update(request.params.id, request.body);
      return { success: true, data: user };
    }
  );

  /**
   * DELETE /users/:id — Kullanıcı sil (soft)
   */
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    // Kendini silemez
    if (request.user?.userId === request.params.id) {
      return reply.status(400).send({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Kendi hesabınızı silemezsiniz' },
      });
    }
    await userService.softDelete(request.params.id);
    return { success: true, message: 'Kullanıcı silindi' };
  });
}
