import type { FastifyInstance } from 'fastify';
import { adjustmentService } from './adjustment.service.js';
import { authenticate } from '../auth/auth.routes.js';
import { z } from 'zod';

export async function adjustmentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /adjustments/pending — all pending adjustments
  fastify.get('/pending', async (request, reply) => {
    try {
      const items = await adjustmentService.getPendingAdjustments();
      return { success: true, data: { items, count: items.length } };
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  });

  // GET /adjustments/stats
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await adjustmentService.getStats();
      return { success: true, data: stats };
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { message: error.message } });
    }
  });

  // GET /adjustments/:id
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const adjustment = await adjustmentService.getById(request.params.id);
      return { success: true, data: adjustment };
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 500;
      return reply.status(status).send({ success: false, error: { message: error.message } });
    }
  });

  // POST /adjustments/transaction/:id/amount — request amount change
  fastify.post<{
    Params: { id: string };
    Body: { amount: string; reason: string };
  }>('/transaction/:id/amount', async (request, reply) => {
    try {
      const schema = z.object({
        amount: z.string().min(1, 'Tutar gerekli'),
        reason: z.string().min(5, 'Sebep en az 5 karakter olmalı'),
      });
      const body = schema.parse(request.body);
      const userId = (request.user as any).userId;

      const adjustment = await adjustmentService.requestAmountChange(
        request.params.id, body.amount, body.reason, userId
      );
      return { success: true, data: adjustment };
    } catch (error: any) {
      const status = error.name === 'ZodError' ? 400 : error.message.includes('not found') ? 404 : 500;
      return reply.status(status).send({ success: false, error: { message: error.message } });
    }
  });

  // POST /adjustments/transaction/:id/date — request date change
  fastify.post<{
    Params: { id: string };
    Body: { date: string; reason: string };
  }>('/transaction/:id/date', async (request, reply) => {
    try {
      const schema = z.object({
        date: z.string().min(1, 'Tarih gerekli'),
        reason: z.string().min(5, 'Sebep en az 5 karakter olmalı'),
      });
      const body = schema.parse(request.body);
      const userId = (request.user as any).userId;

      const adjustment = await adjustmentService.requestDateChange(
        request.params.id, body.date, body.reason, userId
      );
      return { success: true, data: adjustment };
    } catch (error: any) {
      const status = error.name === 'ZodError' ? 400 : error.message.includes('not found') ? 404 : 500;
      return reply.status(status).send({ success: false, error: { message: error.message } });
    }
  });

  // POST /adjustments/transaction/:id/delete — request deletion
  fastify.post<{
    Params: { id: string };
    Body: { reason: string };
  }>('/transaction/:id/delete', async (request, reply) => {
    try {
      const schema = z.object({
        reason: z.string().min(5, 'Sebep en az 5 karakter olmalı'),
      });
      const body = schema.parse(request.body);
      const userId = (request.user as any).userId;

      const adjustment = await adjustmentService.requestDelete(
        request.params.id, body.reason, userId
      );
      return { success: true, data: adjustment };
    } catch (error: any) {
      const status = error.name === 'ZodError' ? 400 : error.message.includes('not found') ? 404 : 500;
      return reply.status(status).send({ success: false, error: { message: error.message } });
    }
  });

  // POST /adjustments/:id/approve
  fastify.post<{
    Params: { id: string };
    Body: { note?: string };
  }>('/:id/approve', async (request, reply) => {
    try {
      const reviewerId = (request.user as any).userId;
      const note = (request.body as any)?.note;
      const result = await adjustmentService.approveAdjustment(request.params.id, reviewerId, note);
      return { success: true, data: result };
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : error.message.includes('NOT_PENDING') ? 400 : 500;
      return reply.status(status).send({ success: false, error: { message: error.message } });
    }
  });

  // POST /adjustments/:id/reject
  fastify.post<{
    Params: { id: string };
    Body: { reason: string };
  }>('/:id/reject', async (request, reply) => {
    try {
      const schema = z.object({
        reason: z.string().min(1, 'Red sebebi gerekli'),
      });
      const body = schema.parse(request.body);
      const reviewerId = (request.user as any).userId;

      const result = await adjustmentService.rejectAdjustment(request.params.id, reviewerId, body.reason);
      return { success: true, data: result };
    } catch (error: any) {
      const status = error.name === 'ZodError' ? 400 : error.message.includes('not found') ? 404 : 500;
      return reply.status(status).send({ success: false, error: { message: error.message } });
    }
  });
}
