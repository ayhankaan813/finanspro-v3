/**
 * Sayfa bazlı erişim hakları
 * Her sayfa hangi roller tarafından erişilebilir?
 */

type Permission = {
  roles: string[];
  readOnly?: boolean; // VIEWER için sadece görüntüleme
};

const NO_PARTNER = ["ADMIN", "OPERATOR", "VIEWER", "USER"];
const ADMIN_ONLY = ["ADMIN"];
const ADMIN_VIEWER = ["ADMIN", "VIEWER"];
const ALL = ["ADMIN", "OPERATOR", "PARTNER", "VIEWER", "USER"];

export const pagePermissions: Record<string, Permission> = {
  "/dashboard": { roles: ALL },
  "/transactions": { roles: ALL },
  "/transactions/import": { roles: NO_PARTNER },
  "/organization": { roles: NO_PARTNER },
  "/sites": { roles: ALL },
  "/partners": { roles: NO_PARTNER },
  "/financiers": { roles: NO_PARTNER },
  "/external-parties": { roles: NO_PARTNER },
  "/borclar": { roles: ["ADMIN", "PARTNER", "VIEWER"] },
  "/reports/daily": { roles: NO_PARTNER },
  "/reports/monthly": { roles: NO_PARTNER },
  "/reports/reconciliation": { roles: NO_PARTNER },
  "/reports/analysis": { roles: NO_PARTNER },
  "/reports/kasa-raporu": { roles: NO_PARTNER },
  "/approvals": { roles: ["ADMIN", "PARTNER", "VIEWER"] },
  "/users": { roles: ADMIN_ONLY },
  "/audit-log": { roles: ADMIN_VIEWER },
  "/settings": { roles: ADMIN_ONLY },
};

/**
 * Kullanıcının belirli bir sayfaya erişim hakkı var mı?
 */
export function canAccessPage(pathname: string, userRole: string): boolean {
  // Detay sayfaları: /sites/[id], /partners/[id] vb.
  const basePath = getBasePath(pathname);
  const permission = pagePermissions[basePath];
  
  // Tanımlanmamış sayfa — varsayılan olarak izin ver
  if (!permission) return true;
  
  return permission.roles.includes(userRole);
}

/**
 * Kullanıcı VIEWER mi? (read-only mod)
 */
export function isReadOnly(userRole: string): boolean {
  return userRole === "VIEWER";
}

/**
 * URL'den base path çıkar: /sites/abc-123 → /sites
 */
function getBasePath(pathname: string): string {
  // UUID pattern'li segmentleri kaldır
  const segments = pathname.split("/").filter(Boolean);
  const cleaned = segments.filter(
    seg => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)
  );
  return "/" + cleaned.join("/");
}
