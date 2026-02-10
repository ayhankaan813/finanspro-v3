import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token gerekli'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string().min(6),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
