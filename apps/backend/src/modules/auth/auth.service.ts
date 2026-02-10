import { compare, hash } from 'bcryptjs';
import prisma from '../../shared/prisma/client.js';
import { AuthenticationError, NotFoundError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  /**
   * Validate user credentials and return user data
   */
  async validateUser(input: LoginInput): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password_hash: true,
        is_active: true,
        deleted_at: true,
      },
    });

    if (!user || user.deleted_at) {
      logger.warn({ email: input.email }, 'Login attempt for non-existent user');
      throw new AuthenticationError('Email veya şifre hatalı');
    }

    if (!user.is_active) {
      logger.warn({ email: input.email }, 'Login attempt for inactive user');
      throw new AuthenticationError('Hesabınız devre dışı bırakılmış');
    }

    const isPasswordValid = await compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn({ email: input.email }, 'Invalid password attempt');
      throw new AuthenticationError('Email veya şifre hatalı');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        deleted_at: true,
      },
    });

    if (!user || user.deleted_at || !user.is_active) {
      throw new NotFoundError('User', userId);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const isCurrentPasswordValid = await compare(input.currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Mevcut şifre hatalı');
    }

    const newPasswordHash = await hash(input.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    logger.info({ userId }, 'User password changed successfully');
  }

  /**
   * Create token payload
   */
  createTokenPayload(user: AuthUser): TokenPayload {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}

export const authService = new AuthService();
