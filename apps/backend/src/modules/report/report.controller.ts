import { FastifyReply, FastifyRequest } from 'fastify';
import { reportService } from './report.service.js';

class ReportController {
  async getKasaRaporu(req: FastifyRequest, reply: FastifyReply) {
    const { year, month, view } = req.query as {
      year: number;
      month?: number;
      view: 'daily' | 'monthly';
    };

    const result = await reportService.getKasaRaporu(year, view, month);
    return reply.send({ success: true, data: result });
  }
}

export const reportController = new ReportController();
