import { FastifyInstance } from 'fastify';
import { personnelService } from './personnel.service.js';
import {
  createPersonnelSchema,
  updatePersonnelSchema,
  addPaymentSchema,
} from './personnel.schema.js';
import type {
  CreatePersonnelInput,
  UpdatePersonnelInput,
  AddPaymentInput,
} from './personnel.schema.js';
import { authenticate } from '../auth/auth.routes.js';

export async function personnelRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  /**
   * GET /personnel
   */
  app.get('/', async (request, reply) => {
    const result = await personnelService.list();
    return { success: true, data: result };
  });

  /**
   * POST /personnel
   */
  app.post<{ Body: CreatePersonnelInput }>('/', async (request, reply) => {
    const input = createPersonnelSchema.parse(request.body);
    const personnel = await personnelService.create(input);
    return reply.status(201).send({ success: true, data: personnel });
  });

  /**
   * GET /personnel/summary - MUST be before /:id
   */
  app.get('/summary', async (request, reply) => {
    const summary = await personnelService.getSummary();
    return { success: true, data: summary };
  });

  /**
   * GET /personnel/:id
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const personnel = await personnelService.getById(request.params.id);
    return { success: true, data: personnel };
  });

  /**
   * PUT /personnel/:id
   */
  app.put<{ Params: { id: string }; Body: UpdatePersonnelInput }>(
    '/:id',
    async (request, reply) => {
      const input = updatePersonnelSchema.parse(request.body);
      const personnel = await personnelService.update(request.params.id, input);
      return { success: true, data: personnel };
    }
  );

  /**
   * DELETE /personnel/:id
   */
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await personnelService.softDelete(request.params.id);
    return { success: true, data: { message: 'Personel silindi' } };
  });

  /**
   * GET /personnel/:id/payments
   */
  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/:id/payments',
    async (request, reply) => {
      const page = Math.max(1, parseInt(request.query.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '20', 10) || 20));
      const result = await personnelService.getPayments(request.params.id, page, limit);
      return { success: true, data: result };
    }
  );

  /**
   * POST /personnel/:id/payments
   */
  app.post<{ Params: { id: string }; Body: AddPaymentInput }>(
    '/:id/payments',
    async (request, reply) => {
      const input = addPaymentSchema.parse(request.body);
      const payment = await personnelService.addPayment(request.params.id, input);
      return reply.status(201).send({ success: true, data: payment });
    }
  );
}
