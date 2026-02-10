import { buildApp } from './app.js';
import { env } from './config/index.js';
import { logger } from './shared/utils/index.js';
import { prisma } from './shared/prisma/client.js';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Build and start server
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
    logger.info(`📚 API Documentation at http://${env.HOST}:${env.PORT}/docs`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      await app.close();
      await prisma.$disconnect();

      logger.info('Server closed');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error(error, 'Failed to start server');
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
