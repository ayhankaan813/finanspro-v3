import prisma from './prisma/client.js';
import { logger } from './utils/logger.js';

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  oldData?: any;
  newData?: any;
}

export class AuditLogService {
  /**
   * Create an audit log entry
   */
  async log(params: AuditLogParams) {
    try {
      // Get user email if not provided
      let userEmail = params.userEmail;
      if (!userEmail) {
        const user = await prisma.user.findUnique({
          where: { id: params.userId },
          select: { email: true },
        });
        userEmail = user?.email || 'unknown';
      }

      const auditLog = await prisma.auditLog.create({
        data: {
          action: params.action,
          entity_type: params.entityType,
          entity_id: params.entityId,
          user_id: params.userId,
          user_email: userEmail,
          ip_address: params.ipAddress,
          old_data: params.oldData,
          new_data: params.newData,
        },
      });

      logger.info('Audit log created', {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
      });

      return auditLog;
    } catch (error) {
      logger.error('Failed to create audit log', error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Get audit logs for an entity
   */
  async getEntityLogs(entityType: string, entityId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get user's activity logs
   */
  async getUserLogs(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });
  }
}

export const auditLogService = new AuditLogService();
