import { z } from 'zod';

export const createExternalPartySchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı').max(100),
  description: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Geçerli email giriniz').optional().or(z.literal('')),
});

export const updateExternalPartySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  is_active: z.boolean().optional(),
});

export const externalPartyQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateExternalPartyInput = z.infer<typeof createExternalPartySchema>;
export type UpdateExternalPartyInput = z.infer<typeof updateExternalPartySchema>;
export type ExternalPartyQueryInput = z.infer<typeof externalPartyQuerySchema>;
