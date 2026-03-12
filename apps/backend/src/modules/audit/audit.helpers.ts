import { FastifyRequest } from 'fastify';

/**
 * Request'ten audit bilgilerini çıkar
 * Servis dosyalarında kullanmak için
 */
export function getAuditContext(request: FastifyRequest) {
  const user = (request as any).user;
  const forwarded = request.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : request.ip || 'unknown';

  return {
    user_id: user?.id || 'unknown',
    user_email: user?.email || 'unknown',
    user_role: user?.role || 'unknown',
    ip_address: clientIp,
    user_agent: request.headers['user-agent'] || undefined,
    fingerprint: request.headers['x-fingerprint'] as string || undefined,
    request_method: request.method,
    request_path: request.url,
  };
}

/**
 * Inline audit log yazıldıktan sonra ID'yi request'e kaydet
 * Hook sonradan IP/UA bilgisini ekler
 */
export function trackInlineAuditLog(request: FastifyRequest, logId: string) {
  if (!(request as any).__inlineAuditLogIds) {
    (request as any).__inlineAuditLogIds = [];
  }
  (request as any).__inlineAuditLogIds.push(logId);
}
