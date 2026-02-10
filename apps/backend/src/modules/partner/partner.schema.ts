import { z } from 'zod';

export const createPartnerSchema = z.object({
  name: z.string().min(2, 'Partner adı en az 2 karakter olmalı').max(100),
  code: z.string().min(2, 'Partner kodu en az 2 karakter olmalı').max(20).toUpperCase(),
  description: z.string().max(500).optional(),
});

export const updatePartnerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const partnerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'code', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const assignSiteSchema = z.object({
  site_id: z.string().uuid('Geçersiz site ID'),
  effective_from: z.string().datetime().optional(),
  effective_until: z.string().datetime().optional().nullable(),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export type PartnerQueryInput = z.infer<typeof partnerQuerySchema>;
export type AssignSiteInput = z.infer<typeof assignSiteSchema>;
