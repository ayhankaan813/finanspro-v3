import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.schema.js';
import type { LoginInput, RefreshTokenInput, ChangePasswordInput } from './auth.schema.js';
import { env } from '../../config/index.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /auth/login
   * Login and get access/refresh tokens
   */
  app.post<{ Body: LoginInput }>(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);
      const user = await authService.validateUser(input);
      const payload = authService.createTokenPayload(user);

      const accessToken = app.jwt.sign(payload, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      });

      const refreshToken = app.jwt.sign(
        { userId: user.id, type: 'refresh' },
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
      );

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      };
    }
  );

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  app.post<{ Body: RefreshTokenInput }>(
    '/refresh',
    {
      schema: {
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const input = refreshTokenSchema.parse(request.body);

      try {
        const decoded = app.jwt.verify<{ userId: string; type: string }>(input.refreshToken);

        if (decoded.type !== 'refresh') {
          return reply.status(401).send({
            success: false,
            error: { code: 'INVALID_TOKEN', message: 'Geçersiz refresh token' },
          });
        }

        const user = await authService.getUserById(decoded.userId);
        const payload = authService.createTokenPayload(user);

        const accessToken = app.jwt.sign(payload, {
          expiresIn: env.JWT_ACCESS_EXPIRES_IN,
        });

        return {
          success: true,
          data: { accessToken },
        };
      } catch (error) {
        return reply.status(401).send({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Refresh token geçersiz veya süresi dolmuş' },
        });
      }
    }
  );

  /**
   * GET /auth/me
   * Get current user info (requires auth)
   */
  app.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const user = await authService.getUserById(request.user!.userId);

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }
  );

  /**
   * POST /auth/change-password
   * Change current user's password (requires auth)
   */
  app.post<{ Body: ChangePasswordInput }>(
    '/change-password',
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['currentPassword', 'newPassword', 'confirmPassword'],
          properties: {
            currentPassword: { type: 'string', minLength: 6 },
            newPassword: { type: 'string', minLength: 6 },
            confirmPassword: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      const input = changePasswordSchema.parse(request.body);
      await authService.changePassword(request.user!.userId, input);

      return {
        success: true,
        data: { message: 'Şifre başarıyla değiştirildi' },
      };
    }
  );

  /**
   * POST /auth/logout
   * Logout (client should discard tokens)
   */
  app.post(
    '/logout',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      // In a more advanced implementation, we would invalidate the refresh token
      // For now, the client just discards the tokens

      return {
        success: true,
        data: { message: 'Çıkış yapıldı' },
      };
    }
  );
}

/**
 * Authentication middleware
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<{
      userId: string;
      email: string;
      role: string;
    }>();

    request.user = decoded;
  } catch (error) {
    reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Oturum açmanız gerekiyor' },
    });
  }
}

/**
 * Admin authorization middleware
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.user?.role !== 'ADMIN') {
    reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Bu işlem için admin yetkisi gerekiyor' },
    });
  }
}
