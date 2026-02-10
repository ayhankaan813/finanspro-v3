import { z } from 'zod';

export const createSiteSchema = z.object({
  name: z.string().min(2, 'Site adı en az 2 karakter olmalı').max(100),
  code: z.string().min(2, 'Site kodu en az 2 karakter olmalı').max(20).toUpperCase(),
  description: z.string().max(500).optional(),
  // Initial commission rates (optional - defaults will be applied)
  deposit_commission_rate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(), // e.g., "5.00"
  withdrawal_commission_rate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(), // e.g., "5.00"
});

export const updateSiteSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const siteQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'code', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type SiteQueryInput = z.infer<typeof siteQuerySchema>;
