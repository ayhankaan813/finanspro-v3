import Fastify, { FastifyInstance } from 'fastify';
import compress from '@fastify/compress';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { env, isDev } from './config/index.js';
import { errorHandler } from './shared/middleware/index.js';
import { logger } from './shared/utils/index.js';

// Import routes
import { authRoutes } from './modules/auth/index.js';
import { siteRoutes } from './modules/site/index.js';
import { partnerRoutes } from './modules/partner/index.js';
import { financierRoutes } from './modules/financier/index.js';
import { externalPartyRoutes } from './modules/external-party/index.js';
import { settingsRoutes } from './modules/settings/index.js';
import { transactionRoutes } from './modules/transaction/index.js';
import { ledgerRoutes } from './modules/ledger/index.js';
import { organizationRoutes } from './modules/organization/index.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { approvalRoutes } from './modules/approval/approval.routes.js';
import { personnelRoutes } from './modules/personnel/index.js';
import { debtRoutes } from './modules/debt/index.js';
import { adjustmentRoutes } from './modules/adjustment/index.js';
import { reportRoutes } from './modules/report/report.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { registerAuditHook } from './modules/audit/audit.hook.js';
import { userRoutes } from './modules/user/user.routes.js';
import { pendingRoutes } from './modules/pending/pending.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // We use our own logger
    trustProxy: true,
  });

  // Response compression
  await app.register(compress, { global: true });

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: isDev ? false : undefined,
  });

  await app.register(cors, {
    origin: isDev ? true : (env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map(s => s.trim()) : true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Fingerprint'],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  });

  // Swagger documentation
  if (isDev) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'FinansPro V3 API',
          description: 'Financial Gateway System API',
          version: '3.0.0',
        },
        servers: [
          {
            url: `http://localhost:${env.PORT}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });
  }

  // Global Audit Log Hook — her mutating request'i logla
  registerAuditHook(app);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => {
    let dbStatus = 'unknown';
    try {
      const { prisma } = await import('./shared/prisma/client.js');
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '3.4.0',
      environment: env.NODE_ENV,
      database: dbStatus,
    };
  });

  // API routes
  app.register(async (api) => {
    // Auth routes
    api.register(authRoutes, { prefix: '/auth' });

    // Entity routes
    api.register(siteRoutes, { prefix: '/sites' });
    api.register(partnerRoutes, { prefix: '/partners' });
    api.register(financierRoutes, { prefix: '/financiers' });
    api.register(externalPartyRoutes, { prefix: '/external-parties' });

    // Transaction routes
    api.register(transactionRoutes, { prefix: '/transactions' });

    // Ledger routes
    api.register(ledgerRoutes, { prefix: '/ledger' });

    // Organization routes
    api.register(organizationRoutes, { prefix: '/organization' });

    // Settings routes
    api.register(settingsRoutes, { prefix: '/settings' });

    // Notification routes
    api.register(notificationRoutes, { prefix: '/notifications' });

    // Approval routes
    api.register(approvalRoutes, { prefix: '/approvals' });

    // Personnel routes
    api.register(personnelRoutes, { prefix: '/organization/personnel' });

    // Debt routes (kasalar arası borç/alacak)
    api.register(debtRoutes, { prefix: '/debts' });

    // Adjustment routes (düzeltme talepleri)
    api.register(adjustmentRoutes, { prefix: '/adjustments' });

    // Report routes
    api.register(reportRoutes, { prefix: '/reports' });

    // User Management routes
    api.register(userRoutes, { prefix: '/users' });

    // Pending Transaction routes (onay bekleyen işlemler)
    api.register(pendingRoutes, { prefix: '/pending-transactions' });

    // Audit Log routes
    api.register(auditRoutes, { prefix: '/audit-logs' });


  }, { prefix: '/api' });

  return app;
}
