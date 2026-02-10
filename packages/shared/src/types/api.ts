/**
 * FinansPro V3 - API Types
 */

// ==================== GENERIC API RESPONSE ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==================== PAGINATION ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

// ==================== AUTH ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// ==================== SITE ====================

export interface CreateSiteRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateSiteRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// ==================== PARTNER ====================

export interface CreatePartnerRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdatePartnerRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// ==================== FINANCIER ====================

export interface CreateFinancierRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateFinancierRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateBlockRequest {
  amount: string;
  reason?: string;
  estimated_days?: number;
}

export interface ResolveBlockRequest {
  resolution_note?: string;
}

// ==================== EXTERNAL PARTY ====================

export interface CreateExternalPartyRequest {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
}

export interface UpdateExternalPartyRequest {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

// ==================== TRANSACTION ====================

export interface CreateTransactionRequest {
  type: string;
  gross_amount: string;
  site_id?: string;
  partner_id?: string;
  financier_id?: string;
  external_party_id?: string;
  category_id?: string;
  delivery_type_id?: string;
  description?: string;
  reference_id?: string;
  transaction_date?: string;
}

export interface ReverseTransactionRequest {
  reason: string;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  site_id?: string;
  partner_id?: string;
  financier_id?: string;
  external_party_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
}

// ==================== ADJUSTMENT ====================

export interface CreateAdjustmentRequest {
  type: string;
  target_type: string;
  target_id: string;
  field_name?: string;
  new_value: unknown;
  reason: string;
  evidence_urls?: string[];
}

export interface ReviewAdjustmentRequest {
  action: "approve" | "reject";
  note?: string;
}

// ==================== COMMISSION ====================

export interface CreateCommissionRateRequest {
  entity_type: string;
  entity_id: string;
  transaction_type: string;
  related_site_id?: string;
  rate: string;
  effective_from?: string;
  effective_until?: string;
}

export interface UpdateCommissionRateRequest {
  rate?: string;
  effective_until?: string;
  is_active?: boolean;
}

// ==================== SETTINGS ====================

export interface CreateCategoryRequest {
  type: string;
  name: string;
  description?: string;
  color?: string;
  sort_order?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateDeliveryTypeRequest {
  name: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateDeliveryTypeRequest {
  name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ==================== REPORT ====================

export interface DashboardStats {
  total_balance: string;
  total_site_debt: string;
  total_partner_earnings: string;
  total_blocked_amount: string;
  active_blocks_count: number;
  pending_approvals_count: number;
  today_deposit_total: string;
  today_withdrawal_total: string;
}

export interface DailyReport {
  date: string;
  deposit_count: number;
  deposit_total: string;
  withdrawal_count: number;
  withdrawal_total: string;
  commission_earned: string;
  net_change: string;
}

export interface ReconciliationReport {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  opening_balance: string;
  total_debits: string;
  total_credits: string;
  closing_balance: string;
  transaction_count: number;
}
