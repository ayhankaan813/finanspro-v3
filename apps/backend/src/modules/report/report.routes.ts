import { FastifyInstance } from 'fastify';
import { reportController } from './report.controller.js';
import { authenticate } from '../auth/auth.routes.js';

export async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /reports/kasa-raporu
  app.get('/kasa-raporu', {
    schema: {
      querystring: {
        type: 'object',
        required: ['year', 'view'],
        properties: {
          year: { type: 'integer' },
          month: { type: 'integer' },
          view: { type: 'string', enum: ['daily', 'monthly'] },
        },
      },
    },
    handler: reportController.getKasaRaporu.bind(reportController),
  });
}
