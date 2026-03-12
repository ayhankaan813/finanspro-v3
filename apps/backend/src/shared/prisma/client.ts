import { PrismaClient } from '@prisma/client';
import { env, isDev } from '../../config/index.js';
import { auditLogMiddleware } from '../../modules/audit/audit.prisma-extension.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: isDev ? ['error', 'warn'] : ['error'],
  });

  // Audit log middleware — her auditLog.create çağrısına IP/UA bilgisi ekler
  client.$use(auditLogMiddleware);

  return client;
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (isDev) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
