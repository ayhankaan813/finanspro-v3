import { Prisma } from '@prisma/client';
import { getRequestContext, incrementInlineAuditCount } from './audit.context.js';

/**
 * Prisma middleware: auditLog.create çağrılarına 
 * otomatik olarak IP, User-Agent, Fingerprint, request info ekler
 * 
 * Service'ler tx.auditLog.create() kullanıyor — bu middleware 
 * her create çağrısında eksik alanları AsyncLocalStorage'dan doldurur
 */
export const auditLogMiddleware: Prisma.Middleware = async (params, next) => {
  if (params.model === 'AuditLog' && params.action === 'create') {
    const data = params.args.data;
    const reqCtx = getRequestContext();

    if (reqCtx) {
      // Sadece boş alanları doldur (service tarafından explicit set edilenleri ezme)
      if (!data.ip_address) data.ip_address = reqCtx.ip_address;
      if (!data.user_agent) data.user_agent = reqCtx.user_agent || null;
      if (!data.fingerprint) data.fingerprint = reqCtx.fingerprint || null;
      if (!data.request_method) data.request_method = reqCtx.request_method;
      if (!data.request_path) data.request_path = reqCtx.request_path;
      if (!data.user_role) data.user_role = reqCtx.user_role || null;
    }

    // İnline audit log sayacını artır (hook çift log yazmasın)
    incrementInlineAuditCount();
  }

  return next(params);
};
