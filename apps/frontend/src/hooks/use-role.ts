"use client";

import { useAuthStore } from "@/stores/auth.store";

/**
 * Kullanıcı rolü hook'u — sayfa içinde yetki kontrolü için
 */
export function useRole() {
  const { user } = useAuthStore();
  const role = user?.role || "USER";

  return {
    role,
    isAdmin: role === "ADMIN",
    isOperator: role === "OPERATOR",
    isPartner: role === "PARTNER",
    isViewer: role === "VIEWER",
    isReadOnly: role === "VIEWER",
    canWrite: role !== "VIEWER",
    canManageUsers: role === "ADMIN",
    canApprove: role === "ADMIN",
    canCreateTransaction: role === "ADMIN" || role === "OPERATOR" || role === "USER",
    canCreateRequest: role === "PARTNER", // Partner talep oluşturabilir
    partnerId: (user as any)?.partner_id || null,
  };
}
