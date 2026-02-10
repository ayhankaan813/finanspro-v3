/**
 * FinansPro V3 - Entity Types
 */

// ==================== ENUMS ====================

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum EntityType {
  SITE = "SITE",
  PARTNER = "PARTNER",
  FINANCIER = "FINANCIER",
  EXTERNAL_PARTY = "EXTERNAL_PARTY",
  ORGANIZATION = "ORGANIZATION",
}

export enum TransactionType {
  // Site operations
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  SITE_PAYMENT = "SITE_PAYMENT",
  SITE_DELIVERY = "SITE_DELIVERY",

  // Partner operations
  PARTNER_PAYMENT = "PARTNER_PAYMENT",
  PARTNER_WITHDRAW = "PARTNER_WITHDRAW",
  PARTNER_DEPOSIT = "PARTNER_DEPOSIT",

  // Financier operations
  FINANCIER_PAYMENT = "FINANCIER_PAYMENT",
  FINANCIER_TRANSFER = "FINANCIER_TRANSFER",

  // External party operations
  EXTERNAL_DEBT_IN = "EXTERNAL_DEBT_IN",
  EXTERNAL_DEBT_OUT = "EXTERNAL_DEBT_OUT",
  EXTERNAL_PAYMENT = "EXTERNAL_PAYMENT",

  // Organization operations
  ORG_EXPENSE = "ORG_EXPENSE",
  ORG_INCOME = "ORG_INCOME",
  ORG_WITHDRAW = "ORG_WITHDRAW",

  // Corrections
  ADJUSTMENT = "ADJUSTMENT",
  REVERSAL = "REVERSAL",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REVERSED = "REVERSED",
  FAILED = "FAILED",
}

export enum LedgerEntryType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export enum CategoryType {
  SITE_PAYMENT = "SITE_PAYMENT",
  ORG_EXPENSE = "ORG_EXPENSE",
  ORG_INCOME = "ORG_INCOME",
  PARTNER_PAYMENT = "PARTNER_PAYMENT",
  FINANCIER_PAYMENT = "FINANCIER_PAYMENT",
}

export enum AdjustmentType {
  TRANSACTION_AMOUNT_CHANGE = "TRANSACTION_AMOUNT_CHANGE",
  TRANSACTION_DATE_CHANGE = "TRANSACTION_DATE_CHANGE",
  TRANSACTION_CATEGORY_CHANGE = "TRANSACTION_CATEGORY_CHANGE",
  TRANSACTION_DELETE = "TRANSACTION_DELETE",
  BALANCE_CORRECTION = "BALANCE_CORRECTION",
  BALANCE_RESET = "BALANCE_RESET",
  COMMISSION_OVERRIDE = "COMMISSION_OVERRIDE",
  COMMISSION_RECALCULATE = "COMMISSION_RECALCULATE",
}

export enum AdjustmentStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
  REVERTED = "REVERTED",
}

// ==================== BASE TYPES ====================

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

// ==================== USER ====================

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: Date | null;
}

// ==================== SITE ====================

export interface Site extends BaseEntity {
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
}

// ==================== PARTNER ====================

export interface Partner extends BaseEntity {
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
}

// ==================== FINANCIER ====================

export interface Financier extends BaseEntity {
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
}

export interface FinancierBlock {
  id: string;
  financier_id: string;
  amount: string; // Decimal as string
  reason?: string | null;
  started_at: Date;
  resolved_at?: Date | null;
  estimated_days?: number | null;
  created_at: Date;
  updated_at: Date;
}

// ==================== EXTERNAL PARTY ====================

export interface ExternalParty extends BaseEntity {
  name: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
}

// ==================== ACCOUNT ====================

export interface Account {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  balance: string; // Decimal as string (CAN BE NEGATIVE!)
  blocked_amount: string;
  credit_limit: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== TRANSACTION ====================

export interface Transaction extends BaseEntity {
  type: TransactionType;
  status: TransactionStatus;
  gross_amount: string;
  net_amount: string;
  site_id?: string | null;
  partner_id?: string | null;
  financier_id?: string | null;
  external_party_id?: string | null;
  category_id?: string | null;
  delivery_type_id?: string | null;
  description?: string | null;
  reference_id?: string | null;
  transaction_date: Date;
  original_transaction_id?: string | null;
  reversed_at?: Date | null;
  reversal_reason?: string | null;
  created_by: string;
}

// ==================== LEDGER ====================

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  entry_type: LedgerEntryType;
  account_id: string;
  account_type: EntityType;
  account_name: string;
  amount: string;
  balance_after: string;
  description: string;
  created_at: Date;
}

// ==================== COMMISSION ====================

export interface CommissionSnapshot {
  id: string;
  transaction_id: string;
  site_commission_rate: string;
  site_commission_amount: string;
  partner_commission_rate?: string | null;
  partner_commission_amount?: string | null;
  financier_commission_rate?: string | null;
  financier_commission_amount?: string | null;
  organization_amount: string;
  created_at: Date;
}

export interface CommissionRate {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  transaction_type: TransactionType;
  related_site_id?: string | null;
  rate: string;
  effective_from: Date;
  effective_until?: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ==================== SETTINGS ====================

export interface Category {
  id: string;
  type: CategoryType;
  name: string;
  description?: string | null;
  color?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryType {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// ==================== ADJUSTMENT ====================

export interface Adjustment {
  id: string;
  type: AdjustmentType;
  status: AdjustmentStatus;
  target_type: string;
  target_id: string;
  field_name?: string | null;
  old_value: unknown;
  new_value: unknown;
  affected_accounts?: unknown | null;
  affected_ledgers?: unknown | null;
  reason: string;
  evidence_urls: string[];
  requested_by: string;
  requested_at: Date;
  reviewed_by?: string | null;
  reviewed_at?: Date | null;
  review_note?: string | null;
  applied_at?: Date | null;
  applied_by?: string | null;
  can_revert: boolean;
  reverted_at?: Date | null;
  reverted_by?: string | null;
  revert_reason?: string | null;
  result_transaction_id?: string | null;
  result_ledger_ids: string[];
  created_at: Date;
  updated_at: Date;
}

// ==================== AUDIT ====================

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_data?: unknown | null;
  new_data?: unknown | null;
  user_id: string;
  user_email: string;
  ip_address?: string | null;
  created_at: Date;
}
