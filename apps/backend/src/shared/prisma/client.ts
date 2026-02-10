import { PrismaClient } from '@prisma/client';
import { env, isDev } from '../../config/index.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
