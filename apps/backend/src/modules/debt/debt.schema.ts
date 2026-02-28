import { z } from 'zod';

// ==================== CREATE DEBT ====================

export const createDebtSchema = z.object({
  lender_id: z.string().uuid('Geçersiz borç veren finansör ID'),
  borrower_id: z.string().uuid('Geçersiz borç alan finansör ID'),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Tutar pozitif bir sayı olmalı' }
  ),
  description: z.string().max(500).optional(),
});

// ==================== CREATE PAYMENT ====================

export const createDebtPaymentSchema = z.object({
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Ödeme tutarı pozitif bir sayı olmalı' }
  ),
  description: z.string().max(500).optional(),
});

// ==================== CANCEL DEBT ====================

export const cancelDebtSchema = z.object({
  cancellation_reason: z.string().max(500).optional(),
});

// ==================== QUERY ====================

export const debtQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'PAID', 'CANCELLED']).optional(),
  financier_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ==================== TYPES ====================

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type CreateDebtPaymentInput = z.infer<typeof createDebtPaymentSchema>;
export type CancelDebtInput = z.infer<typeof cancelDebtSchema>;
export type DebtQueryInput = z.infer<typeof debtQuerySchema>;
