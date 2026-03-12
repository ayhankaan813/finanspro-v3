"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
}

export function useNotifications(limit = 20) {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<{ items: Notification[]; total: number }>(`/api/notifications`, {
        params: { limit: String(limit) },
      });
    },
    enabled: !!accessToken,
  });
}

export function useUnreadCount() {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<{ count: number }>("/api/notifications/unread/count");
    },
    enabled: !!accessToken,
    refetchInterval: 60000,
    staleTime: 60000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      api.setToken(accessToken);
      return api.put(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      api.setToken(accessToken);
      return api.put("/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

// ==================== APPROVAL STATS ====================
export interface ApprovalStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
}

export function useApprovalStats() {
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["approval-stats"],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<ApprovalStats>("/api/approvals/stats");
    },
    enabled: !!accessToken,
    refetchInterval: 120000,
    staleTime: 60000,
  });
}
