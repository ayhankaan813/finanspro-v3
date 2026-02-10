import { z } from 'zod';
import { TransactionType, TransactionStatus } from '@prisma/client';

export const createDepositSchema = z.object({
  site_id: z.string().uuid('Geçersiz site ID'),
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  description: z.string().max(500).optional(),
  reference_id: z.string().max(100).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createWithdrawalSchema = z.object({
  site_id: z.string().uuid('Geçersiz site ID'),
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  description: z.string().max(500).optional(),
  reference_id: z.string().max(100).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createSitePaymentSchema = z.object({
  site_id: z.string().uuid('Geçersiz site ID'),
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  category_id: z.string().uuid().optional(),
  delivery_type_id: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createSiteDeliverySchema = z.object({
  site_id: z.string().uuid('Geçersiz site ID'),
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  delivery_type_id: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createPartnerPaymentSchema = z.object({
  partner_id: z.string().uuid('Geçersiz partner ID'),
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createFinancierTransferSchema = z.object({
  from_financier_id: z.string().uuid('Geçersiz kaynak finansör ID'),
  to_financier_id: z.string().uuid('Geçersiz hedef finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createExternalDebtSchema = z.object({
  external_party_id: z.string().uuid('Geçersiz dış kişi ID'),
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  direction: z.enum(['in', 'out'], { message: 'Yön "in" veya "out" olmalı' }),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createExternalPaymentSchema = z.object({
  external_party_id: z.string().uuid('Geçersiz dış kişi ID'),
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createOrgExpenseSchema = z.object({
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  category_id: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createOrgIncomeSchema = z.object({
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  category_id: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const createOrgWithdrawSchema = z.object({
  financier_id: z.string().uuid('Geçersiz finansör ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

// ==================== YENİ: ÖDEME (Payment) ====================
// Herkese ödeme yapılabilir: Site adına, Partner'a, Dış kişiye, Org için
export const createPaymentSchema = z.object({
  // Kimin adına ödeme? (source)
  source_type: z.enum(['SITE', 'PARTNER', 'EXTERNAL_PARTY', 'ORGANIZATION'], {
    message: 'Kaynak tipi geçersiz',
  }),
  source_id: z.string().uuid('Geçersiz kaynak ID').optional(), // Org için opsiyonel

  // Hangi kasadan?
  financier_id: z.string().uuid('Geçersiz finansör ID'),

  // Tutar
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),

  // Kategori (Maaş, Reklam, Kira, vs.)
  category_id: z.string().uuid().optional(),

  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

// ==================== YENİ: TAKVİYE (Top-up) ====================
// Kasaya para girişi: Partner açık kapatma, Org, Dış kaynak
export const createTopUpSchema = z.object({
  // Takviye kaynağı
  source_type: z.enum(['PARTNER', 'ORGANIZATION', 'EXTERNAL'], {
    message: 'Kaynak tipi geçersiz',
  }),
  source_id: z.string().uuid('Geçersiz kaynak ID').optional(), // External için opsiyonel

  // Hangi kasaya?
  financier_id: z.string().uuid('Geçersiz finansör ID'),

  // Tutar
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),

  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

// ==================== YENİ: TESLİM (Delivery) ====================
// Site'ye para teslimi - KOMİSYONLU
export const createDeliverySchema = z.object({
  site_id: z.string().uuid('Geçersiz site ID'),
  financier_id: z.string().uuid('Geçersiz finansör ID'),

  // Brüt tutar (komisyon dahil)
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),

  // Teslimat türü (Nakit, Kripto, Banka)
  delivery_type_id: z.string().uuid('Geçersiz teslimat türü ID'),

  description: z.string().max(500).optional(),
  transaction_date: z.string().datetime().optional(),
});

export const reverseTransactionSchema = z.object({
  reason: z.string().min(10, 'İptal sebebi en az 10 karakter olmalı').max(500),
});

export const transactionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  site_id: z.string().uuid().optional(),
  partner_id: z.string().uuid().optional(),
  financier_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sortBy: z.enum(['transaction_date', 'created_at', 'gross_amount']).default('transaction_date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateDepositInput = z.infer<typeof createDepositSchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type CreateSitePaymentInput = z.infer<typeof createSitePaymentSchema>;
export type CreateSiteDeliveryInput = z.infer<typeof createSiteDeliverySchema>;
export type CreatePartnerPaymentInput = z.infer<typeof createPartnerPaymentSchema>;
export type CreateFinancierTransferInput = z.infer<typeof createFinancierTransferSchema>;
export type CreateExternalDebtInput = z.infer<typeof createExternalDebtSchema>;
export type CreateExternalPaymentInput = z.infer<typeof createExternalPaymentSchema>;
export type CreateOrgExpenseInput = z.infer<typeof createOrgExpenseSchema>;
export type CreateOrgIncomeInput = z.infer<typeof createOrgIncomeSchema>;
export type CreateOrgWithdrawInput = z.infer<typeof createOrgWithdrawSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateTopUpInput = z.infer<typeof createTopUpSchema>;
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type ReverseTransactionInput = z.infer<typeof reverseTransactionSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
