import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from './audit.service.js';
import { auditStorage, AuditRequestContext, hasInlineAuditLogs } from './audit.context.js';

/**
 * IP adresini güvenilir şekilde al
 */
function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  const realIp = request.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp;
  return request.ip || 'unknown';
}

/**
 * Request path'den entity type ve action çıkar
 */
function parseRequestContext(method: string, path: string): { entityType: string; action: string } | null {
  // /api/auth/login → LOGIN
  if (path.includes('/auth/login')) return { entityType: 'auth', action: 'LOGIN' };
  if (path.includes('/auth/logout')) return { entityType: 'auth', action: 'LOGOUT' };

  // Sadece mutating request'leri logla (POST, PUT, PATCH, DELETE)
  if (method === 'GET') return null;

  // /api/transactions/deposit → CREATE transaction
  if (path.includes('/transactions')) {
    if (path.includes('/reverse')) return { entityType: 'transaction', action: 'REVERSE' };
    if (path.includes('/bulk')) return { entityType: 'transaction', action: 'BULK_CREATE' };
    if (method === 'POST') return { entityType: 'transaction', action: 'CREATE' };
    if (method === 'PUT' || method === 'PATCH') return { entityType: 'transaction', action: 'UPDATE' };
    if (method === 'DELETE') return { entityType: 'transaction', action: 'DELETE' };
  }

  // /api/adjustments → CREATE/APPROVE/REJECT adjustment
  if (path.includes('/adjustments')) {
    if (path.includes('/approve')) return { entityType: 'adjustment', action: 'APPROVE' };
    if (path.includes('/reject')) return { entityType: 'adjustment', action: 'REJECT' };
    if (method === 'POST') return { entityType: 'adjustment', action: 'CREATE' };
  }

  // /api/debts → debt operations
  if (path.includes('/debts')) {
    if (path.includes('/pay')) return { entityType: 'debt', action: 'PAY' };
    if (path.includes('/cancel')) return { entityType: 'debt', action: 'CANCEL' };
    if (method === 'POST') return { entityType: 'debt', action: 'CREATE' };
  }

  // Entity CRUD
  const entityMap: Record<string, string> = {
    '/sites': 'site',
    '/partners': 'partner',
    '/financiers': 'financier',
    '/external-parties': 'external_party',
    '/users': 'user',
    '/settings': 'settings',
    '/personnel': 'personnel',
  };

  for (const [prefix, entityType] of Object.entries(entityMap)) {
    if (path.includes(prefix)) {
      const action = method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE';
      return { entityType, action };
    }
  }

  return null;
}

/**
 * Response body'den entity_id çıkarmaya çalış
 */
function extractEntityId(responseBody: any): string | undefined {
  if (!responseBody) return undefined;
  if (typeof responseBody === 'string') {
    try { responseBody = JSON.parse(responseBody); } catch { return undefined; }
  }
  // { success: true, data: { id: '...' } }
  return responseBody?.data?.id || responseBody?.id || undefined;
}

/**
 * İnsan-okunur açıklama oluştur
 */
function buildDescription(action: string, entityType: string, method: string, path: string, body: any): string {
  const typeLabels: Record<string, string> = {
    transaction: 'İşlem', site: 'Site', partner: 'Partner',
    financier: 'Finansör', external_party: 'Dış Kişi', debt: 'Borç',
    adjustment: 'Düzeltme', user: 'Kullanıcı', settings: 'Ayar',
    auth: 'Oturum', personnel: 'Personel',
  };
  const label = typeLabels[entityType] || entityType;

  // Transaction specific
  if (entityType === 'transaction' && action === 'CREATE') {
    const subType = path.split('/').pop() || '';
    const amount = body?.amount || body?.gross_amount || '';
    return `${subType.toUpperCase()} işlemi oluşturuldu${amount ? ` (${amount} TL)` : ''}`;
  }

  const actionLabels: Record<string, string> = {
    CREATE: `${label} oluşturuldu`,
    UPDATE: `${label} güncellendi`,
    DELETE: `${label} silindi`,
    APPROVE: `${label} onaylandı`,
    REJECT: `${label} reddedildi`,
    REVERSE: `${label} ters işlemi`,
    BULK_CREATE: `Toplu ${label} oluşturuldu`,
    LOGIN: 'Sisteme giriş yapıldı',
    LOGOUT: 'Sistemden çıkış yapıldı',
    PAY: `${label} ödemesi yapıldı`,
    CANCEL: `${label} iptal edildi`,
  };

  return actionLabels[action] || `${action} — ${label}`;
}

/**
 * Global audit log hook'u — Fastify app'e ekle
 */
export function registerAuditHook(app: FastifyInstance) {
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = (request as any).__startTime;
    const duration = startTime ? Date.now() - startTime : undefined;

    const method = request.method;
    const path = request.url;

    // Context parse et
    const context = parseRequestContext(method, path);
    if (!context) return; // GET request'leri veya bilinmeyen path'ler skip

    // Login zaten auth route'ta loglanıyor
    if (context.action === 'LOGIN') return;

    // Service inline audit log zaten yazdıysa → çift log yazma
    if (hasInlineAuditLogs()) return;

    const statusCode = reply.statusCode;

    const clientIp = getClientIp(request);
    const userAgent = request.headers['user-agent'] || undefined;
    const fingerprint = request.headers['x-fingerprint'] as string || undefined;

    // User bilgisi
    const user = (request as any).user;
    const userId = user?.id || 'anonymous';
    const userEmail = user?.email || 'anonymous';
    const userRole = user?.role || 'unknown';

    // Entity ID: URL'den parse et
    let entityId: string | undefined;
    const pathParts = path.split('/').filter(Boolean);
    // /api/transactions/:id/reverse gibi pattern'lerde ID'yi bul
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      // UUID pattern
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
        entityId = part;
        break;
      }
      // fin-xxx pattern (financier IDs)
      if (/^fin-/.test(part)) {
        entityId = part;
        break;
      }
    }

    // Response'dan entity_id al (create işlemlerinde)
    if (!entityId && statusCode < 400) {
      const responseBody = (request as any).__responseBody;
      entityId = extractEntityId(responseBody);
    }

    const description = buildDescription(
      context.action, context.entityType, method, path,
      request.body as any
    );

    await auditService.log({
      action: context.action,
      entity_type: context.entityType,
      entity_id: entityId,
      description,
      new_values: method === 'POST' || method === 'PUT' || method === 'PATCH'
        ? sanitizeBody(request.body as any) : undefined,
      user_id: userId,
      user_email: userEmail,
      user_role: userRole,
      ip_address: clientIp,
      user_agent: userAgent,
      fingerprint,
      session_id: user?.sessionId || undefined,
      request_method: method,
      request_path: path,
      status_code: statusCode,
      duration_ms: duration,
    });
  });

  // Request start time hook + AsyncLocalStorage context
  app.addHook('onRequest', async (request: FastifyRequest) => {
    const startTime = Date.now();
    (request as any).__startTime = startTime;

    const ctx: AuditRequestContext = {
      ip_address: getClientIp(request),
      user_agent: request.headers['user-agent'] || undefined,
      fingerprint: request.headers['x-fingerprint'] as string || undefined,
      request_method: request.method,
      request_path: request.url,
      user_role: undefined, // henüz authenticate olmadı, preHandler'da set edilecek
      start_time: startTime,
      inlineAuditCount: 0,
    };

    // AsyncLocalStorage context'i başlat — tüm async chain boyunca erişilebilir
    auditStorage.enterWith(ctx);
  });

  // preHandler'da user authenticate olduktan sonra role'u context'e ekle
  app.addHook('preHandler', async (request: FastifyRequest) => {
    const ctx = auditStorage.getStore();
    const user = (request as any).user;
    if (ctx && user?.role) {
      ctx.user_role = user.role;
    }
  });

  // Response body capture (for entity ID extraction)
  app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
    if (request.method !== 'GET') {
      try {
        (request as any).__responseBody = typeof payload === 'string' ? payload : undefined;
      } catch {}
    }
    return payload;
  });
}

/**
 * Hassas bilgileri temizle (şifre vs.)
 */
function sanitizeBody(body: any): Record<string, any> | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'password_hash', 'token', 'accessToken', 'refreshToken', 'secret'];
  for (const key of sensitiveKeys) {
    if (key in sanitized) sanitized[key] = '[REDACTED]';
  }
  return sanitized;
}
