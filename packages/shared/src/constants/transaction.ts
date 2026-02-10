import { TransactionType, EntityType } from "../types/entities";

/**
 * Transaction type labels (Turkish)
 */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.DEPOSIT]: "Yatırım",
  [TransactionType.WITHDRAWAL]: "Çekim",
  [TransactionType.SITE_PAYMENT]: "Site Ödemesi",
  [TransactionType.SITE_DELIVERY]: "Site Teslimat",
  [TransactionType.PARTNER_PAYMENT]: "Partner Ödemesi",
  [TransactionType.PARTNER_WITHDRAW]: "Partner Çekim",
  [TransactionType.PARTNER_DEPOSIT]: "Partner Yatırım",
  [TransactionType.FINANCIER_PAYMENT]: "Finansör Ödemesi",
  [TransactionType.FINANCIER_TRANSFER]: "Finansör Transfer",
  [TransactionType.EXTERNAL_DEBT_IN]: "Dış Borç Alma",
  [TransactionType.EXTERNAL_DEBT_OUT]: "Dış Borç Verme",
  [TransactionType.EXTERNAL_PAYMENT]: "Dış Kişi Ödeme",
  [TransactionType.ORG_EXPENSE]: "Organizasyon Gider",
  [TransactionType.ORG_INCOME]: "Organizasyon Gelir",
  [TransactionType.ORG_WITHDRAW]: "Hak Ediş Çekim",
  [TransactionType.ADJUSTMENT]: "Manuel Düzeltme",
  [TransactionType.REVERSAL]: "İptal/Ters İşlem",
};

/**
 * Transaction type colors
 */
export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  [TransactionType.DEPOSIT]: "#22c55e",
  [TransactionType.WITHDRAWAL]: "#ef4444",
  [TransactionType.SITE_PAYMENT]: "#8b5cf6",
  [TransactionType.SITE_DELIVERY]: "#3b82f6",
  [TransactionType.PARTNER_PAYMENT]: "#10b981",
  [TransactionType.PARTNER_WITHDRAW]: "#f97316",
  [TransactionType.PARTNER_DEPOSIT]: "#06b6d4",
  [TransactionType.FINANCIER_PAYMENT]: "#f59e0b",
  [TransactionType.FINANCIER_TRANSFER]: "#eab308",
  [TransactionType.EXTERNAL_DEBT_IN]: "#ec4899",
  [TransactionType.EXTERNAL_DEBT_OUT]: "#f43f5e",
  [TransactionType.EXTERNAL_PAYMENT]: "#d946ef",
  [TransactionType.ORG_EXPENSE]: "#6b7280",
  [TransactionType.ORG_INCOME]: "#14b8a6",
  [TransactionType.ORG_WITHDRAW]: "#64748b",
  [TransactionType.ADJUSTMENT]: "#94a3b8",
  [TransactionType.REVERSAL]: "#78716c",
};

/**
 * Entity type labels (Turkish)
 */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  [EntityType.SITE]: "Site",
  [EntityType.PARTNER]: "Partner",
  [EntityType.FINANCIER]: "Finansör",
  [EntityType.EXTERNAL_PARTY]: "Dış Kişi",
  [EntityType.ORGANIZATION]: "Organizasyon",
};

/**
 * Entity type colors
 */
export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  [EntityType.SITE]: "#6366f1",
  [EntityType.PARTNER]: "#10b981",
  [EntityType.FINANCIER]: "#f59e0b",
  [EntityType.EXTERNAL_PARTY]: "#ec4899",
  [EntityType.ORGANIZATION]: "#3b82f6",
};

/**
 * Which entities are affected by each transaction type
 */
export const TRANSACTION_AFFECTED_ENTITIES: Record<TransactionType, EntityType[]> = {
  [TransactionType.DEPOSIT]: [EntityType.SITE, EntityType.PARTNER, EntityType.FINANCIER, EntityType.ORGANIZATION],
  [TransactionType.WITHDRAWAL]: [EntityType.SITE, EntityType.FINANCIER, EntityType.ORGANIZATION],
  [TransactionType.SITE_PAYMENT]: [EntityType.SITE, EntityType.FINANCIER],
  [TransactionType.SITE_DELIVERY]: [EntityType.SITE, EntityType.FINANCIER],
  [TransactionType.PARTNER_PAYMENT]: [EntityType.PARTNER, EntityType.FINANCIER],
  [TransactionType.PARTNER_WITHDRAW]: [EntityType.PARTNER, EntityType.FINANCIER],
  [TransactionType.PARTNER_DEPOSIT]: [EntityType.PARTNER, EntityType.FINANCIER],
  [TransactionType.FINANCIER_PAYMENT]: [EntityType.FINANCIER, EntityType.ORGANIZATION],
  [TransactionType.FINANCIER_TRANSFER]: [EntityType.FINANCIER],
  [TransactionType.EXTERNAL_DEBT_IN]: [EntityType.EXTERNAL_PARTY, EntityType.FINANCIER],
  [TransactionType.EXTERNAL_DEBT_OUT]: [EntityType.EXTERNAL_PARTY, EntityType.FINANCIER],
  [TransactionType.EXTERNAL_PAYMENT]: [EntityType.EXTERNAL_PARTY, EntityType.FINANCIER],
  [TransactionType.ORG_EXPENSE]: [EntityType.ORGANIZATION, EntityType.FINANCIER],
  [TransactionType.ORG_INCOME]: [EntityType.ORGANIZATION, EntityType.FINANCIER],
  [TransactionType.ORG_WITHDRAW]: [EntityType.ORGANIZATION, EntityType.FINANCIER],
  [TransactionType.ADJUSTMENT]: [],
  [TransactionType.REVERSAL]: [],
};
