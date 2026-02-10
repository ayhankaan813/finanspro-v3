import { z } from 'zod';

export const createFinancierSchema = z.object({
  name: z.string().min(2, 'Finansör adı en az 2 karakter olmalı').max(100),
  code: z.string().min(2, 'Finansör kodu en az 2 karakter olmalı').max(20).toUpperCase(),
  description: z.string().max(500).optional(),
});

export const updateFinancierSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const financierQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'code', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createBlockSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  reason: z.string().max(500).optional(),
  estimated_days: z.number().int().min(1).max(30).optional(),
});

export const resolveBlockSchema = z.object({
  resolution_note: z.string().max(500).optional(),
});

export type CreateFinancierInput = z.infer<typeof createFinancierSchema>;
export type UpdateFinancierInput = z.infer<typeof updateFinancierSchema>;
export type FinancierQueryInput = z.infer<typeof financierQuerySchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type ResolveBlockInput = z.infer<typeof resolveBlockSchema>;
