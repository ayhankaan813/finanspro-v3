import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request context'ini async olarak service'lere taşır
 * Servis fonksiyonlarına request parametresi geçirmeden
 * audit log'a IP, User-Agent, Fingerprint bilgisi ekler
 */
export interface AuditRequestContext {
  ip_address: string;
  user_agent?: string;
  fingerprint?: string;
  request_method: string;
  request_path: string;
  user_role?: string;
  start_time: number;
  inlineAuditCount: number; // Service inline audit log sayacı
}

export const auditStorage = new AsyncLocalStorage<AuditRequestContext>();

/**
 * Mevcut request context'ini al (service içinden çağır)
 */
export function getRequestContext(): AuditRequestContext | undefined {
  return auditStorage.getStore();
}

/**
 * Inline audit log yazıldığında sayacı artır
 */
export function incrementInlineAuditCount(): void {
  const ctx = auditStorage.getStore();
  if (ctx) ctx.inlineAuditCount++;
}

/**
 * İnline audit log sayacını kontrol et
 */
export function hasInlineAuditLogs(): boolean {
  const ctx = auditStorage.getStore();
  return ctx ? ctx.inlineAuditCount > 0 : false;
}
