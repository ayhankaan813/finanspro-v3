"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { useEffect } from "react";

// Types
export interface Site {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  account: {
    id: string;
    balance: string;
    blocked_amount: string;
    credit_limit: string;
  } | null;
}

export interface Partner {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  account: {
    id: string;
    balance: string;
    blocked_amount: string;
    credit_limit: string;
  } | null;
}

export interface Financier {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  account: {
    id: string;
    balance: string;
    blocked_amount: string;
    credit_limit: string;
  } | null;
  active_blocks_count: number;
  available_balance: string;
}

export interface ExternalParty {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  account: {
    id: string;
    balance: string;
  } | null;
}

export interface Transaction {
  id: string;
  type: string;
  status: string;
  gross_amount: string;
  net_amount: string;
  site_id: string | null;
  partner_id: string | null;
  financier_id: string | null;
  external_party_id: string | null;
  description: string | null;
  transaction_date: string;
  created_at: string;
  site?: { id: string; name: string; code: string } | null;
  category?: { id: string; name: string; color: string } | null;
  commission_snapshot?: {
    site_commission_amount: string;
    partner_commission_amount: string | null;
    financier_commission_amount: string | null;
    organization_amount: string;
  } | null;
}

export interface FinancierBlock {
  id: string;
  financier_id: string;
  amount: string;
  reason: string | null;
  started_at: string;
  resolved_at: string | null;
  estimated_days: number | null;
}

export interface CommissionRate {
  id: string;
  entity_type: "SITE" | "PARTNER" | "FINANCIER";
  entity_id: string;
  transaction_type: string;
  related_site_id: string | null;
  rate: string;
  effective_from: string;
  effective_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Hook to sync auth token with API client
export function useApiAuth() {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    api.setToken(accessToken);
  }, [accessToken]);
}

// ==================== SITES ====================
export function useSites(params?: { page?: number; limit?: number; search?: string }) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["sites", params],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PaginatedResponse<Site>>("/api/sites", {
        params: {
          page: String(params?.page || 1),
          limit: String(params?.limit || 20),
          ...(params?.search && { search: params.search }),
        },
      });
    },
    enabled: !!accessToken,
  });
}

export function useSite(id: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["site", id],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<Site>(`/api/sites/${id}`);
    },
    enabled: !!accessToken && !!id,
  });
}

// Alias for useSite
export const useSiteById = useSite;

export function useSiteTransactions(
  siteId: string,
  params?: { page?: number; limit?: number }
) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["site-transactions", siteId, params],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PaginatedResponse<Transaction>>(`/api/sites/${siteId}/transactions`, {
        params: {
          page: String(params?.page || 1),
          limit: String(params?.limit || 20),
        },
      });
    },
    enabled: !!accessToken && !!siteId,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      description?: string;
      deposit_commission_rate?: string;
      withdrawal_commission_rate?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Site>("/api/sites", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string; is_active?: boolean } }) => {
      api.setToken(accessToken);
      return api.patch<Site>(`/api/sites/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["site", id] });
    },
  });
}

// ==================== PARTNERS ====================
export function usePartners(params?: { page?: number; limit?: number; search?: string }) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["partners", params],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PaginatedResponse<Partner>>("/api/partners", {
        params: {
          page: String(params?.page || 1),
          limit: String(params?.limit || 20),
          ...(params?.search && { search: params.search }),
        },
      });
    },
    enabled: !!accessToken,
  });
}

export function usePartner(id: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["partner", id],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<Partner>(`/api/partners/${id}`);
    },
    enabled: !!accessToken && !!id,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string }) => {
      api.setToken(accessToken);
      return api.post<Partner>("/api/partners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}

// ==================== FINANCIERS ====================
export function useFinanciers(params?: { page?: number; limit?: number; search?: string }) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["financiers", params],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PaginatedResponse<Financier>>("/api/financiers", {
        params: {
          page: String(params?.page || 1),
          limit: String(params?.limit || 20),
          ...(params?.search && { search: params.search }),
        },
      });
    },
    enabled: !!accessToken,
  });
}

export function useFinancier(id: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["financier", id],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<Financier>(`/api/financiers/${id}`);
    },
    enabled: !!accessToken && !!id,
  });
}

export function useCreateFinancier() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Financier>("/api/financiers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
    },
  });
}

export function useFinancierBlocks(financierId: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["financier-blocks", financierId],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<{ items: FinancierBlock[] }>(`/api/financiers/${financierId}/blocks`);
    },
    enabled: !!accessToken && !!financierId,
  });
}

export function useFinancierTransactions(
  financierId: string,
  params?: { page?: number; limit?: number }
) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ["financier-transactions", financierId, params],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PaginatedResponse<Transaction>>(`/api/financiers/${financierId}/transactions`, {
        params: {
          page: String(params?.page || 1),
          limit: String(params?.limit || 20),
        },
      });
    },
    enabled: !!accessToken && !!financierId,
  });
}

// ==================== EXTERNAL PARTIES ====================
export function useExternalParties(params?: { page?: number; limit?: number; search?: string }) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["external-parties", params],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PaginatedResponse<ExternalParty>>("/api/external-parties", {
        params: {
          page: String(params?.page || 1),
          limit: String(params?.limit || 20),
          ...(params?.search && { search: params.search }),
        },
      });
    },
    enabled: !!accessToken,
  });
}

export function useCreateExternalParty() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone?: string;
      email?: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<ExternalParty>("/api/external-parties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-parties"] });
    },
  });
}

// ==================== TRANSACTIONS ====================
export function useTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  site_id?: string;
  date_from?: string;
  date_to?: string;
}) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["transactions", params],
    queryFn: async () => {
      api.setToken(accessToken);
      const queryParams: Record<string, string> = {
        page: String(params?.page || 1),
        limit: String(params?.limit || 20),
      };
      if (params?.type) queryParams.type = params.type;
      if (params?.status) queryParams.status = params.status;
      if (params?.site_id) queryParams.site_id = params.site_id;
      if (params?.date_from) queryParams.date_from = params.date_from;
      if (params?.date_to) queryParams.date_to = params.date_to;

      return api.get<PaginatedResponse<Transaction>>("/api/transactions", { params: queryParams });
    },
    enabled: !!accessToken,
  });
}

export function useTransaction(id: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<Transaction>(`/api/transactions/${id}`);
    },
    enabled: !!accessToken && !!id,
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      site_id: string;
      financier_id: string;
      amount: string;
      description?: string;
      reference_id?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/deposit", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      site_id: string;
      financier_id: string;
      amount: string;
      description?: string;
      reference_id?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/withdrawal", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ==================== YENİ: ÖDEME (Payment) ====================
// Herkese ödeme yapılabilir: Site adına, Partner'a, Dış kişiye, Org için
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      source_type: "SITE" | "PARTNER" | "EXTERNAL_PARTY" | "ORGANIZATION";
      source_id?: string; // Org için opsiyonel
      financier_id: string;
      amount: string;
      category_id?: string;
      description?: string;
      transaction_date?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/payment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["external-parties"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ==================== YENİ: TAKVİYE (Top-up) ====================
// Kasaya para girişi: Partner açık kapatma, Org, Dış kaynak
export function useCreateTopUp() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      source_type: "PARTNER" | "ORGANIZATION" | "EXTERNAL";
      source_id?: string; // External için opsiyonel
      financier_id: string;
      amount: string;
      description?: string;
      transaction_date?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/top-up", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ==================== YENİ: TESLİM (Delivery) ====================
// Site'ye para teslimi - KOMİSYONLU (site komisyonu + partner payı varsa)
export function useCreateDelivery() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      site_id: string;
      financier_id: string;
      amount: string; // Brüt tutar (komisyon dahil)
      delivery_type_id: string; // Nakit, Kripto, Banka
      description?: string;
      transaction_date?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/delivery", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ESKİ: Site Delivery (geriye uyumluluk için - DEPRECATED)
export function useCreateSiteDelivery() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      site_id: string;
      financier_id: string;
      amount: string;
      delivery_type_id?: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/site-delivery", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreatePartnerPayment() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      partner_id: string;
      financier_id: string;
      amount: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/partner-payment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateFinancierTransfer() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      from_financier_id: string;
      to_financier_id: string;
      amount: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/financier-transfer", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateExternalDebt() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      external_party_id: string;
      financier_id: string;
      amount: string;
      direction: "in" | "out";
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/external-debt", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["external-parties"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateExternalPayment() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      external_party_id: string;
      financier_id: string;
      amount: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/external-payment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["external-parties"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateOrgExpense() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      financier_id: string;
      amount: string;
      category_id?: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/org-expense", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateOrgIncome() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      financier_id: string;
      amount: string;
      category_id?: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/org-income", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateOrgWithdraw() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      financier_id: string;
      amount: string;
      description?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<Transaction>("/api/transactions/org-withdraw", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financiers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ==================== DASHBOARD ====================
export interface DashboardStats {
  totalCash: number;
  siteDebt: number;
  partnerBalance: number;
  blockedAmount: number;
  activeBlocksCount: number;
}

export function useDashboardStats() {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      api.setToken(accessToken);

      // Fetch all data in parallel
      const [sites, partners, financiers] = await Promise.all([
        api.get<PaginatedResponse<Site>>("/api/sites", { params: { limit: "100" } }),
        api.get<PaginatedResponse<Partner>>("/api/partners", { params: { limit: "100" } }),
        api.get<PaginatedResponse<Financier>>("/api/financiers", { params: { limit: "100" } }),
      ]);

      // Calculate stats
      let totalCash = 0;
      let blockedAmount = 0;
      let activeBlocksCount = 0;

      financiers.items.forEach((f) => {
        totalCash += parseFloat(f.account?.balance || "0");
        blockedAmount += parseFloat(f.account?.blocked_amount || "0");
        activeBlocksCount += f.active_blocks_count || 0;
      });

      const siteDebt = sites.items.reduce((acc, s) => {
        return acc + Math.abs(parseFloat(s.account?.balance || "0"));
      }, 0);

      const partnerBalance = partners.items.reduce((acc, p) => {
        return acc + parseFloat(p.account?.balance || "0");
      }, 0);

      return {
        totalCash,
        siteDebt,
        partnerBalance,
        blockedAmount,
        activeBlocksCount,
        sites: sites.items,
        partners: partners.items,
        financiers: financiers.items,
      };
    },
    enabled: !!accessToken,
  });
}

// ==================== RECENT TRANSACTIONS ====================
export function useRecentTransactions(limit = 5) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["recent-transactions", limit],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PaginatedResponse<Transaction>>("/api/transactions", {
        params: { limit: String(limit), sortBy: "transaction_date", sortOrder: "desc" },
      });
    },
    enabled: !!accessToken,
  });
}

// ==================== ACTIVE BLOCKS ====================
export function useActiveBlocks() {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["active-blocks"],
    queryFn: async () => {
      api.setToken(accessToken);
      const financiers = await api.get<PaginatedResponse<Financier>>("/api/financiers", {
        params: { limit: "100" },
      });

      // Get blocks for each financier with active blocks
      const blocksPromises = financiers.items
        .filter((f) => f.active_blocks_count > 0)
        .map(async (f) => {
          const blocks = await api.get<{ items: FinancierBlock[] }>(`/api/financiers/${f.id}/blocks`);
          return blocks.items
            .filter((b) => !b.resolved_at)
            .map((b) => ({ ...b, financier_name: f.name }));
        });

      const allBlocks = await Promise.all(blocksPromises);
      return allBlocks.flat();
    },
    enabled: !!accessToken,
  });
}

// ==================== COMMISSION RATES ====================
export function useSiteCommissionRates(siteId: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["site-commission-rates", siteId],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<CommissionRate[]>(`/api/sites/${siteId}/commission-rates`);
    },
    enabled: !!accessToken && !!siteId,
  });
}

export function useCreateSiteCommissionRate() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      siteId,
      transaction_type,
      rate,
    }: {
      siteId: string;
      transaction_type: string;
      rate: string;
    }) => {
      api.setToken(accessToken);
      return api.post<CommissionRate>(`/api/sites/${siteId}/commission-rates`, {
        transaction_type,
        rate,
      });
    },
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: ["site-commission-rates", siteId] });
    },
  });
}

export function useUpdateSiteCommissionRate() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      siteId,
      rateId,
      rate,
      is_active,
    }: {
      siteId: string;
      rateId: string;
      rate?: string;
      is_active?: boolean;
    }) => {
      api.setToken(accessToken);
      return api.patch<CommissionRate>(`/api/sites/${siteId}/commission-rates/${rateId}`, {
        rate,
        is_active,
      });
    },
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: ["site-commission-rates", siteId] });
    },
  });
}

export function usePartnerCommissionRates(partnerId: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["partner-commission-rates", partnerId],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<CommissionRate[]>(`/api/partners/${partnerId}/commission-rates`);
    },
    enabled: !!accessToken && !!partnerId,
  });
}

export function useCreatePartnerCommissionRate() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      partnerId,
      transaction_type,
      rate,
      related_site_id,
    }: {
      partnerId: string;
      transaction_type: string;
      rate: string;
      related_site_id?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<CommissionRate>(`/api/partners/${partnerId}/commission-rates`, {
        transaction_type,
        rate,
        related_site_id,
      });
    },
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ["partner-commission-rates", partnerId] });
    },
  });
}

export function useUpdatePartnerCommissionRate() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      partnerId,
      rateId,
      rate,
      is_active,
    }: {
      partnerId: string;
      rateId: string;
      rate?: string;
      is_active?: boolean;
    }) => {
      api.setToken(accessToken);
      return api.patch<CommissionRate>(`/api/partners/${partnerId}/commission-rates/${rateId}`, {
        rate,
        is_active,
      });
    },
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ["partner-commission-rates", partnerId] });
    },
  });
}

export interface PartnerStatistics {
  year: number;
  partnerId: string;
  partnerName: string;
  currentBalance: string;
  monthlyData: Array<{
    month: number;
    commission_earned: string;
    payment_received: string;
    topup_made: string;
    balance: string;
  }>;
}

export function usePartnerStatistics(partnerId: string, year: number) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["partner-statistics", partnerId, year],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PartnerStatistics>(`/api/partners/${partnerId}/statistics/${year}`);
    },
    enabled: !!accessToken && !!partnerId && !!year,
  });
}

export interface PartnerMonthlyStatistics {
  year: number;
  month: number;
  partnerId: string;
  partnerName: string;
  currentBalance: string;
  dailyData: Array<{
    day: number;
    commission_earned: string;
    payment_received: string;
    topup_made: string;
    balance: string;
  }>;
}

export function usePartnerMonthlyStatistics(partnerId: string, year: number, month: number) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["partner-monthly-statistics", partnerId, year, month],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<PartnerMonthlyStatistics>(`/api/partners/${partnerId}/statistics/${year}/${month}`);
    },
    enabled: !!accessToken && !!partnerId && !!year && !!month,
  });
}

export interface SiteStatistics {
  year: number;
  siteId: string;
  siteName: string;
  currentBalance: string;
  monthlyData: Array<{
    month: number;
    deposit: string;
    withdrawal: string;
    delivery: string;
    delivery_commission: string;
    topup: string;
    payment: string;
    commission: string;
    balance: string;
  }>;
}

export function useSiteStatistics(siteId: string, year: number) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["site-statistics", siteId, year],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<SiteStatistics>(`/api/sites/${siteId}/statistics/${year}`);
    },
    enabled: !!accessToken && !!siteId && !!year,
  });
}

export interface SiteMonthlyStatistics {
  year: number;
  month: number;
  siteId: string;
  siteName: string;
  currentBalance: string;
  dailyData: Array<{
    day: number;
    deposit: string;
    withdrawal: string;
    delivery: string;
    delivery_commission: string;
    topup: string;
    payment: string;
    commission: string;
    balance: string;
  }>;
}

export function useSiteMonthlyStatistics(siteId: string, year: number, month: number) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["site-monthly-statistics", siteId, year, month],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<SiteMonthlyStatistics>(`/api/sites/${siteId}/statistics/${year}/${month}`);
    },
    enabled: !!accessToken && !!siteId && !!year && !!month,
  });
}

export function useFinancierCommissionRates(financierId: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["financier-commission-rates", financierId],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<CommissionRate[]>(`/api/financiers/${financierId}/commission-rates`);
    },
    enabled: !!accessToken && !!financierId,
  });
}

export function useCreateFinancierCommissionRate() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      financierId,
      transaction_type,
      rate,
    }: {
      financierId: string;
      transaction_type: string;
      rate: string;
    }) => {
      api.setToken(accessToken);
      return api.post<CommissionRate>(`/api/financiers/${financierId}/commission-rates`, {
        transaction_type,
        rate,
      });
    },
    onSuccess: (_, { financierId }) => {
      queryClient.invalidateQueries({ queryKey: ["financier-commission-rates", financierId] });
    },
  });
}

export function useUpdateFinancierCommissionRate() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      financierId,
      rateId,
      rate,
      is_active,
    }: {
      financierId: string;
      rateId: string;
      rate?: string;
      is_active?: boolean;
    }) => {
      api.setToken(accessToken);
      return api.patch<CommissionRate>(`/api/financiers/${financierId}/commission-rates/${rateId}`, {
        rate,
        is_active,
      });
    },
    onSuccess: (_, { financierId }) => {
      queryClient.invalidateQueries({ queryKey: ["financier-commission-rates", financierId] });
    },
  });
}

// ==================== DELIVERY TYPES ====================
export interface DeliveryType {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export function useDeliveryTypes() {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["delivery-types"],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<DeliveryType[]>("/api/delivery-types");
    },
    enabled: !!accessToken,
  });
}

// ==================== DELIVERY COMMISSIONS ====================
export interface DeliveryCommission {
  id: string;
  site_id: string;
  delivery_type_id: string;
  rate: string;
  partner_id: string | null;
  partner_rate: string | null;
  is_active: boolean;
  created_at: string;
  site?: { id: string; name: string; code: string };
  delivery_type?: { id: string; name: string; code: string | null };
  partner?: { id: string; name: string; code: string } | null;
}

export function useSiteDeliveryCommissions(siteId: string) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["site-delivery-commissions", siteId],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<DeliveryCommission[]>(`/api/sites/${siteId}/delivery-commissions`);
    },
    enabled: !!accessToken && !!siteId,
  });
}

export function useCreateDeliveryCommission() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      site_id: string;
      delivery_type_id: string;
      rate: string;
      partner_id?: string;
      partner_rate?: string;
    }) => {
      api.setToken(accessToken);
      return api.post<DeliveryCommission>(`/api/sites/${data.site_id}/delivery-commissions`, data);
    },
    onSuccess: (_, { site_id }) => {
      queryClient.invalidateQueries({ queryKey: ["site-delivery-commissions", site_id] });
    },
  });
}

export function useUpdateDeliveryCommission() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      siteId,
      commissionId,
      rate,
      partner_id,
      partner_rate,
      is_active,
    }: {
      siteId: string;
      commissionId: string;
      rate?: string;
      partner_id?: string | null;
      partner_rate?: string | null;
      is_active?: boolean;
    }) => {
      api.setToken(accessToken);
      return api.patch<DeliveryCommission>(`/api/sites/${siteId}/delivery-commissions/${commissionId}`, {
        rate,
        partner_id,
        partner_rate,
        is_active,
      });
    },
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: ["site-delivery-commissions", siteId] });
    },
  });
}

// ==================== CATEGORIES ====================
export interface Category {
  id: string;
  name: string;
  type: "SITE_EXPENSE" | "ORG_EXPENSE" | "ORG_INCOME";
  color: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export function useCategories(type?: "SITE_EXPENSE" | "ORG_EXPENSE" | "ORG_INCOME") {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      api.setToken(accessToken);
      const params: Record<string, string> = {};
      if (type) params.type = type;
      return api.get<Category[]>("/api/categories", { params });
    },
    enabled: !!accessToken,
  });
}

// ==================== ORGANIZATION ====================
export interface OrganizationStats {
  period: {
    year: number;
    month?: number;
  };
  totalIncome: string;
  totalExpense: string;
  netProfit: string;
  breakdown: Array<{
    categoryId: string | null;
    categoryName: string;
    color: string;
    amount: string;
  }>;
}

export interface OrganizationTransaction {
  id: string;
  date: string;
  type: string;
  description: string | null;
  amount: string;
  balance_after: string;
  entry_type: "DEBIT" | "CREDIT";
  category: { id: string; name: string; color: string } | null;
  related_entity: string | null;
}

export function useOrganizationStats(year: number, month?: number | null) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["organization-stats", year, month],
    queryFn: async () => {
      api.setToken(accessToken);
      const params: any = { year: String(year) };
      if (month) params.month = String(month);

      return api.get<OrganizationStats>("/api/organization/stats", { params });
    },
    enabled: !!accessToken,
  });
}

export function useOrganizationTransactions(params?: { page?: number; limit?: number }) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["organization-transactions", params],
    queryFn: async () => {
      api.setToken(accessToken);
      const queryParams = {
        page: String(params?.page || 1),
        limit: String(params?.limit || 20),
      };
      return api.get<PaginatedResponse<OrganizationTransaction>>("/api/organization/transactions", {
        params: queryParams,
      });
    },
    enabled: !!accessToken,
  });
}

export function useOrganizationAccount() {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["organization-account"],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<{ id: string; balance: string } | null>("/api/organization/account");
    },
    enabled: !!accessToken,
  });
}

// Analytics
export interface OrganizationAnalytics {
  period: {
    year: number;
    month?: number;
  };
  profitBySite: Array<{
    name: string;
    amount: number;
  }>;
  busyDays: Array<{
    day: string;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
    profit: number;
  }>;
}

export function useOrgAnalytics(year: number, month?: number | null) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["organization-analytics", year, month],
    queryFn: async () => {
      api.setToken(accessToken);
      const params: any = { year: String(year) };
      if (month) params.month = String(month);

      return api.get<OrganizationAnalytics>("/api/organization/analytics", { params });
    },
    enabled: !!accessToken,
  });
}
