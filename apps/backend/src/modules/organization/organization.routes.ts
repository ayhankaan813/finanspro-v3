
import { FastifyInstance } from 'fastify';
import { OrganizationController } from './organization.controller';

const organizationController = new OrganizationController();

export async function organizationRoutes(app: FastifyInstance) {
    // Stats
    app.get('/stats', {
        schema: {
            querystring: {
                year: { type: 'integer' },
                month: { type: 'integer', nullable: true },
            },
        },
        handler: organizationController.getStats.bind(organizationController),
    });

    // Analytics
    app.get('/analytics', {
        schema: {
            querystring: {
                year: { type: 'integer' },
                month: { type: 'integer', nullable: true },
            },
        },
        handler: organizationController.getAnalytics.bind(organizationController),
    });

    // Transactions
    app.get('/transactions', {
        schema: {
            querystring: {
                page: { type: 'integer', default: 1 },
                limit: { type: 'integer', default: 20 },
            },
        },
        handler: organizationController.getTransactions.bind(organizationController),
    });

    // Account
    app.get('/account', {
        handler: organizationController.getAccount.bind(organizationController),
    });
}
