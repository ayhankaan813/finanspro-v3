import Fastify, { FastifyInstance } from 'fastify';
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

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // We use our own logger
    trustProxy: true,
  });

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: isDev ? false : undefined,
  });

  await app.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
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

    // Report routes (will be added in Phase 6)
    // api.register(reportRoutes, { prefix: '/reports' });

    // Approval routes (will be added in Phase 4)
    // api.register(approvalRoutes, { prefix: '/approvals' });
  }, { prefix: '/api' });

  return app;
}
