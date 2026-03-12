-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('SITE', 'PARTNER', 'FINANCIER', 'EXTERNAL_PARTY', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'TOP_UP', 'DELIVERY', 'EXTERNAL_DEBT_IN', 'EXTERNAL_DEBT_OUT', 'ORG_EXPENSE', 'ORG_INCOME', 'ORG_WITHDRAW', 'FINANCIER_TRANSFER', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'REVERSED', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('PAYMENT', 'ORG_EXPENSE', 'ORG_INCOME');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('TRANSACTION_AMOUNT_CHANGE', 'TRANSACTION_DATE_CHANGE', 'TRANSACTION_CATEGORY_CHANGE', 'TRANSACTION_DELETE', 'BALANCE_CORRECTION', 'BALANCE_RESET', 'COMMISSION_OVERRIDE', 'COMMISSION_RECALCULATE');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'APPLIED', 'REJECTED', 'REVERTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSACTION_PENDING', 'TRANSACTION_APPROVED', 'TRANSACTION_REJECTED', 'ADJUSTMENT_PENDING', 'ADJUSTMENT_APPROVED', 'ADJUSTMENT_REJECTED', 'SYSTEM_ALERT', 'BALANCE_ALERT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PersonnelStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PersonnelPaymentType" AS ENUM ('SALARY', 'ADVANCE', 'BONUS', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('ACTIVE', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_partners" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "site_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "financiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financier_blocks" (
    "id" TEXT NOT NULL,
    "financier_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "estimated_days" INTEGER,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financier_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_parties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "external_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "blocked_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "site_id" TEXT,
    "partner_id" TEXT,
    "financier_id" TEXT,
    "external_party_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "gross_amount" DECIMAL(15,2) NOT NULL,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "site_commission_rate" DECIMAL(7,5),
    "partner_commission_rate" DECIMAL(7,5),
    "financier_commission_rate" DECIMAL(7,5),
    "site_id" TEXT,
    "partner_id" TEXT,
    "financier_id" TEXT,
    "external_party_id" TEXT,
    "source_type" "EntityType",
    "source_id" TEXT,
    "topup_source_type" "EntityType",
    "topup_source_id" TEXT,
    "delivery_commission_rate" DECIMAL(7,5),
    "delivery_commission_amount" DECIMAL(15,2),
    "delivery_partner_rate" DECIMAL(7,5),
    "delivery_partner_amount" DECIMAL(15,2),
    "category_id" TEXT,
    "delivery_type_id" TEXT,
    "description" TEXT,
    "reference_id" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(3),
    "edited_by" TEXT,
    "edit_count" INTEGER NOT NULL DEFAULT 0,
    "edit_reason" TEXT,
    "original_transaction_id" TEXT,
    "reversed_at" TIMESTAMP(3),
    "reversal_reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "entry_type" "LedgerEntryType" NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_type" "EntityType" NOT NULL,
    "account_name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_snapshots" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "site_commission_rate" DECIMAL(7,5) NOT NULL,
    "site_commission_amount" DECIMAL(15,2) NOT NULL,
    "partner_commission_rate" DECIMAL(7,5),
    "partner_commission_amount" DECIMAL(15,2),
    "financier_commission_rate" DECIMAL(7,5),
    "financier_commission_amount" DECIMAL(15,2),
    "organization_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rates" (
    "id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "related_site_id" TEXT,
    "rate" DECIMAL(7,5) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "site_id" TEXT,
    "partner_id" TEXT,
    "financier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_commissions" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "delivery_type_id" TEXT NOT NULL,
    "rate" DECIMAL(7,5) NOT NULL,
    "partner_id" TEXT,
    "partner_rate" DECIMAL(7,5),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjustments" (
    "id" TEXT NOT NULL,
    "type" "AdjustmentType" NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "field_name" TEXT,
    "old_value" JSONB NOT NULL,
    "new_value" JSONB NOT NULL,
    "affected_accounts" JSONB,
    "affected_ledgers" JSONB,
    "reason" TEXT NOT NULL,
    "evidence_urls" TEXT[],
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "applied_at" TIMESTAMP(3),
    "applied_by" TEXT,
    "can_revert" BOOLEAN NOT NULL DEFAULT true,
    "reverted_at" TIMESTAMP(3),
    "reverted_by" TEXT,
    "revert_reason" TEXT,
    "result_transaction_id" TEXT,
    "result_ledger_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "user_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "user_id" TEXT NOT NULL,
    "action_url" TEXT,
    "action_text" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "monthly_salary" DECIMAL(15,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "status" "PersonnelStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_payment" (
    "id" TEXT NOT NULL,
    "personnel_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_type" "PersonnelPaymentType" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'ACTIVE',
    "lender_id" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "debt_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sites_code_key" ON "sites"("code");

-- CreateIndex
CREATE INDEX "sites_code_idx" ON "sites"("code");

-- CreateIndex
CREATE INDEX "sites_is_active_idx" ON "sites"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "partners_code_key" ON "partners"("code");

-- CreateIndex
CREATE INDEX "partners_code_idx" ON "partners"("code");

-- CreateIndex
CREATE INDEX "partners_is_active_idx" ON "partners"("is_active");

-- CreateIndex
CREATE INDEX "site_partners_is_active_idx" ON "site_partners"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "site_partners_site_id_partner_id_key" ON "site_partners"("site_id", "partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "financiers_code_key" ON "financiers"("code");

-- CreateIndex
CREATE INDEX "financiers_code_idx" ON "financiers"("code");

-- CreateIndex
CREATE INDEX "financiers_is_active_idx" ON "financiers"("is_active");

-- CreateIndex
CREATE INDEX "financier_blocks_financier_id_idx" ON "financier_blocks"("financier_id");

-- CreateIndex
CREATE INDEX "financier_blocks_resolved_at_idx" ON "financier_blocks"("resolved_at");

-- CreateIndex
CREATE INDEX "external_parties_is_active_idx" ON "external_parties"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_entity_id_key" ON "accounts"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_site_id_key" ON "accounts"("site_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_partner_id_key" ON "accounts"("partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_financier_id_key" ON "accounts"("financier_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_external_party_id_key" ON "accounts"("external_party_id");

-- CreateIndex
CREATE INDEX "accounts_entity_type_entity_id_idx" ON "accounts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "accounts_entity_type_idx" ON "accounts"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_original_transaction_id_key" ON "transactions"("original_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_type_status_transaction_date_idx" ON "transactions"("type", "status", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_site_id_transaction_date_idx" ON "transactions"("site_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_transaction_date_idx" ON "transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_financier_id_transaction_date_idx" ON "transactions"("financier_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_external_party_id_transaction_date_idx" ON "transactions"("external_party_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_source_type_source_id_idx" ON "transactions"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "transactions_type_source_type_transaction_date_idx" ON "transactions"("type", "source_type", "transaction_date");

-- CreateIndex
CREATE INDEX "ledger_entries_transaction_id_idx" ON "ledger_entries"("transaction_id");

-- CreateIndex
CREATE INDEX "ledger_entries_account_id_created_at_idx" ON "ledger_entries"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_created_at_idx" ON "ledger_entries"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "commission_snapshots_transaction_id_key" ON "commission_snapshots"("transaction_id");

-- CreateIndex
CREATE INDEX "commission_snapshots_transaction_id_idx" ON "commission_snapshots"("transaction_id");

-- CreateIndex
CREATE INDEX "commission_snapshots_created_at_idx" ON "commission_snapshots"("created_at");

-- CreateIndex
CREATE INDEX "commission_rates_entity_type_entity_id_transaction_type_idx" ON "commission_rates"("entity_type", "entity_id", "transaction_type");

-- CreateIndex
CREATE INDEX "commission_rates_is_active_idx" ON "commission_rates"("is_active");

-- CreateIndex
CREATE INDEX "categories_type_is_active_idx" ON "categories"("type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_types_code_key" ON "delivery_types"("code");

-- CreateIndex
CREATE INDEX "delivery_types_is_active_idx" ON "delivery_types"("is_active");

-- CreateIndex
CREATE INDEX "delivery_commissions_is_active_idx" ON "delivery_commissions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_commissions_site_id_delivery_type_id_key" ON "delivery_commissions"("site_id", "delivery_type_id");

-- CreateIndex
CREATE INDEX "adjustments_status_created_at_idx" ON "adjustments"("status", "created_at");

-- CreateIndex
CREATE INDEX "adjustments_target_type_target_id_idx" ON "adjustments"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "adjustments_requested_by_idx" ON "adjustments"("requested_by");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "personnel_payment_personnel_id_idx" ON "personnel_payment"("personnel_id");

-- CreateIndex
CREATE INDEX "personnel_payment_period_year_period_month_idx" ON "personnel_payment"("period_year", "period_month");

-- CreateIndex
CREATE INDEX "personnel_payment_personnel_id_period_year_period_month_idx" ON "personnel_payment"("personnel_id", "period_year", "period_month");

-- CreateIndex
CREATE INDEX "debts_lender_id_idx" ON "debts"("lender_id");

-- CreateIndex
CREATE INDEX "debts_borrower_id_idx" ON "debts"("borrower_id");

-- CreateIndex
CREATE INDEX "debts_status_idx" ON "debts"("status");

-- CreateIndex
CREATE INDEX "debts_lender_id_status_idx" ON "debts"("lender_id", "status");

-- CreateIndex
CREATE INDEX "debts_borrower_id_status_idx" ON "debts"("borrower_id", "status");

-- CreateIndex
CREATE INDEX "debts_created_at_idx" ON "debts"("created_at");

-- CreateIndex
CREATE INDEX "debt_payments_debt_id_idx" ON "debt_payments"("debt_id");

-- CreateIndex
CREATE INDEX "debt_payments_created_at_idx" ON "debt_payments"("created_at");

-- AddForeignKey
ALTER TABLE "site_partners" ADD CONSTRAINT "site_partners_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_partners" ADD CONSTRAINT "site_partners_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financier_blocks" ADD CONSTRAINT "financier_blocks_financier_id_fkey" FOREIGN KEY ("financier_id") REFERENCES "financiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_financier_id_fkey" FOREIGN KEY ("financier_id") REFERENCES "financiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_external_party_id_fkey" FOREIGN KEY ("external_party_id") REFERENCES "external_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_financier_id_fkey" FOREIGN KEY ("financier_id") REFERENCES "financiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_external_party_id_fkey" FOREIGN KEY ("external_party_id") REFERENCES "external_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_delivery_type_id_fkey" FOREIGN KEY ("delivery_type_id") REFERENCES "delivery_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_snapshots" ADD CONSTRAINT "commission_snapshots_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_financier_id_fkey" FOREIGN KEY ("financier_id") REFERENCES "financiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_commissions" ADD CONSTRAINT "delivery_commissions_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_commissions" ADD CONSTRAINT "delivery_commissions_delivery_type_id_fkey" FOREIGN KEY ("delivery_type_id") REFERENCES "delivery_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_payment" ADD CONSTRAINT "personnel_payment_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "financiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "financiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

