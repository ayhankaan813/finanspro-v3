import { z } from 'zod';
import { EntityType, TransactionType } from '@prisma/client';

export const createCommissionRateSchema = z.object({
  entity_type: z.nativeEnum(EntityType),
  entity_id: z.string().uuid('Geçersiz entity ID'),
  transaction_type: z.nativeEnum(TransactionType),
  related_site_id: z.string().uuid().optional().nullable(),
  rate: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1;
  }, { message: 'Oran 0 ile 1 arasında olmalı (örn: 0.10 = %10)' }),
  effective_from: z.string().datetime().optional(),
  effective_until: z.string().datetime().optional().nullable(),
});

export const updateCommissionRateSchema = z.object({
  rate: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1;
  }, { message: 'Oran 0 ile 1 arasında olmalı' }).optional(),
  effective_until: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const commissionRateQuerySchema = z.object({
  entity_type: z.nativeEnum(EntityType).optional(),
  entity_id: z.string().uuid().optional(),
  transaction_type: z.nativeEnum(TransactionType).optional(),
  is_active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type CreateCommissionRateInput = z.infer<typeof createCommissionRateSchema>;
export type UpdateCommissionRateInput = z.infer<typeof updateCommissionRateSchema>;
export type CommissionRateQueryInput = z.infer<typeof commissionRateQuerySchema>;
