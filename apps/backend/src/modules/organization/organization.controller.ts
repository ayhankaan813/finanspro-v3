
import { FastifyReply, FastifyRequest } from 'fastify';
import { OrganizationService } from './organization.service';

const organizationService = new OrganizationService();

export class OrganizationController {
    async getStats(req: FastifyRequest, reply: FastifyReply) {
        const { year, month } = req.query as { year: number; month?: number };
        const stats = await organizationService.getStats({ year, month });
        return reply.send({ success: true, data: stats });
    }

    async getTransactions(req: FastifyRequest, reply: FastifyReply) {
        const { page, limit } = req.query as { page: number; limit: number };
        const transactions = await organizationService.getTransactions({ page, limit });
        return reply.send({ success: true, data: transactions });
    }

    async getAccount(req: FastifyRequest, reply: FastifyReply) {
        const account = await organizationService.getAccount();
        return reply.send({ success: true, data: account });
    }

    async getAnalytics(req: FastifyRequest, reply: FastifyReply) {
        const { year, month } = req.query as { year: number; month?: number };
        const analytics = await organizationService.getAnalytics({ year, month });
        return reply.send({ success: true, data: analytics });
    }

    async getDailyCashFlow(req: FastifyRequest, reply: FastifyReply) {
        const { days } = req.query as { days?: number };
        const data = await organizationService.getDailyCashFlow(days || 7);
        return reply.send({ success: true, data });
    }
}

export const organizationController = new OrganizationController();
