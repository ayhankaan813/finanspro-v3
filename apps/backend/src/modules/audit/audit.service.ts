import { getRequestContext } from './audit.context.js';
import prisma from '../../shared/prisma/client.js';

export interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id?: string;
  description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id: string;
  user_email: string;
  user_role?: string;
  ip_address?: string;
  user_agent?: string;
  fingerprint?: string;
  session_id?: string;
  request_method?: string;
  request_path?: string;
  status_code?: number;
  duration_ms?: number;
}

class AuditService {
  /**
   * Tek bir audit log kaydı oluştur
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Anonymous user veya geçersiz user_id — loglama atla
      if (!entry.user_id || entry.user_id === 'anonymous') return;

      // AsyncLocalStorage'dan request context al (IP, UA, fingerprint)
      const reqCtx = getRequestContext();

      await prisma.auditLog.create({
        data: {
          action: entry.action,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id || null,
          description: entry.description || null,
          old_values: entry.old_values || undefined,
          new_values: entry.new_values || undefined,
          user_id: entry.user_id,
          user_email: entry.user_email,
          user_role: entry.user_role || reqCtx?.user_role || null,
          ip_address: entry.ip_address || reqCtx?.ip_address || null,
          user_agent: entry.user_agent || reqCtx?.user_agent || null,
          fingerprint: entry.fingerprint || reqCtx?.fingerprint || null,
          session_id: entry.session_id || null,
          request_method: entry.request_method || reqCtx?.request_method || null,
          request_path: entry.request_path || reqCtx?.request_path || null,
          status_code: entry.status_code || null,
          duration_ms: entry.duration_ms || null,
        },
      });
    } catch (error: any) {
      // Audit log hatası ana işlemi engellemez — sadece konsola yaz
      console.error('[AUDIT] Log yazma hatası:', error?.message || error);
    }
  }

  /**
   * Audit logları listele (admin panel için)
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    user_id?: string;
    action?: string;
    entity_type?: string;
    entity_id?: string;
    ip_address?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.user_id) where.user_id = params.user_id;
    if (params.action) where.action = params.action;
    if (params.entity_type) where.entity_type = params.entity_type;
    if (params.entity_id) where.entity_id = params.entity_id;
    if (params.ip_address) where.ip_address = { contains: params.ip_address };

    if (params.date_from || params.date_to) {
      where.created_at = {};
      if (params.date_from) where.created_at.gte = new Date(params.date_from);
      if (params.date_to) {
        const to = new Date(params.date_to);
        to.setDate(to.getDate() + 1);
        where.created_at.lte = to;
      }
    }

    if (params.search) {
      where.OR = [
        { description: { contains: params.search, mode: 'insensitive' } },
        { user_email: { contains: params.search, mode: 'insensitive' } },
        { request_path: { contains: params.search, mode: 'insensitive' } },
        { ip_address: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Belirli bir entity'nin audit geçmişi
   */
  async getEntityHistory(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  /**
   * Belirli bir kullanıcının aktivite özeti
   */
  async getUserActivity(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [logs, summary] = await Promise.all([
      prisma.auditLog.findMany({
        where: { user_id: userId, created_at: { gte: since } },
        orderBy: { created_at: 'desc' },
        take: 200,
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { user_id: userId, created_at: { gte: since } },
        _count: { id: true },
      }),
    ]);

    return {
      logs,
      summary: summary.map(s => ({ action: s.action, count: s._count.id })),
    };
  }

  /**
   * Audit istatistikleri (dashboard)
   */
  async getStats(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalLogs, byAction, byUser, recentLogins] = await Promise.all([
      prisma.auditLog.count({ where: { created_at: { gte: since } } }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { created_at: { gte: since } },
        _count: { id: true },
      }),
      prisma.auditLog.groupBy({
        by: ['user_email'],
        where: { created_at: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.findMany({
        where: { action: 'LOGIN', created_at: { gte: since } },
        select: { user_email: true, ip_address: true, user_agent: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
    ]);

    return {
      totalLogs,
      byAction: byAction.map(a => ({ action: a.action, count: a._count.id })),
      byUser: byUser.map(u => ({ email: u.user_email, count: u._count.id })),
      recentLogins,
    };
  }
}

export const auditService = new AuditService();
