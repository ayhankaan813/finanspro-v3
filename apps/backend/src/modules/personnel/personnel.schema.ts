import { z } from 'zod';

export const createPersonnelSchema = z.object({
  first_name: z.string().min(2, 'Ad en az 2 karakter olmali').max(100),
  last_name: z.string().min(2, 'Soyad en az 2 karakter olmali').max(100),
  phone: z.string().max(20).optional(),
  role: z.string().min(1, 'Gorev belirtilmeli').max(100),
  monthly_salary: z.number().positive('Maas pozitif olmali'),
  start_date: z.string().or(z.date()),
  notes: z.string().max(500).optional(),
});

export const updatePersonnelSchema = z.object({
  first_name: z.string().min(2).max(100).optional(),
  last_name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  role: z.string().min(1).max(100).optional(),
  monthly_salary: z.number().positive().optional(),
  start_date: z.string().or(z.date()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive('Tutar pozitif olmali'),
  payment_type: z.enum(['SALARY', 'ADVANCE', 'BONUS', 'OTHER']),
  payment_date: z.string().or(z.date()),
  period_month: z.number().int().min(1).max(12),
  period_year: z.number().int().min(2000).max(2100),
  description: z.string().max(500).optional(),
});

export type CreatePersonnelInput = z.infer<typeof createPersonnelSchema>;
export type UpdatePersonnelInput = z.infer<typeof updatePersonnelSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
