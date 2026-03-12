import { buildApp } from './app.js';
import { env, isProd } from './config/index.js';
import { logger } from './shared/utils/index.js';
import { prisma } from './shared/prisma/client.js';

async function connectWithRetry(maxRetries = 5): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('✅ Database connection successful');
      return;
    } catch (error) {
      logger.error(error, `❌ Database connection failed (attempt ${attempt}/${maxRetries})`);
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000;
        logger.info(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        if (isProd) {
          logger.error('❌ Database connection failed after all retries. Starting server anyway...');
        } else {
          throw error;
        }
      }
    }
  }
}

async function main() {
  try {
    // Connect to database with retries
    await connectWithRetry();

    // Build and start server
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`🚀 FinansPro V3 API running at http://${env.HOST}:${env.PORT}`);
    logger.info(`📝 Environment: ${env.NODE_ENV}`);

    if (!isProd) {
      logger.info(`📚 API Documentation at http://${env.HOST}:${env.PORT}/docs`);
    }

    // Production keep-alive: prevent Railway/Render spin-down
    if (isProd) {
      setInterval(async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          logger.debug('💓 Keep-alive: DB connection active');
        } catch (error) {
          logger.error(error, '❌ Keep-alive failed, reconnecting...');
          try {
            await prisma.$connect();
            logger.info('✅ Database reconnected');
          } catch (reconnectError) {
            logger.error(reconnectError, '❌ Database reconnection failed');
          }
        }
      }, 5 * 60 * 1000); // every 5 min
    }

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      // Give ongoing requests 10 seconds to complete
      const shutdownTimeout = setTimeout(() => {
        logger.error('Forcefully shutting down after 10 seconds');
        process.exit(1);
      }, 10000);

      try {
        await app.close();
        await prisma.$disconnect();
        logger.info('Server closed');
        clearTimeout(shutdownTimeout);
        process.exit(0);
      } catch (error) {
        logger.error(error, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    logger.info('✅ All systems operational — ready to handle financial transactions');
  } catch (error) {
    logger.error(error, 'Failed to start server');
    console.error('Environment check:');
    console.error('- NODE_ENV:', process.env.NODE_ENV);
    console.error('- PORT:', process.env.PORT);
    console.error('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
    console.error('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
