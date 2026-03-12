import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.schema.js';
import type { LoginInput, RefreshTokenInput, ChangePasswordInput } from './auth.schema.js';
import { env } from '../../config/index.js';
import { auditService } from '../audit/audit.service.js';

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
      config: {
        rateLimit: {
          max: 50,
          timeWindow: '1 minute',
        },
      },
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

      // Audit log — LOGIN
      const forwarded = request.headers['x-forwarded-for'];
      const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
      auditService.log({
        action: 'LOGIN',
        entity_type: 'auth',
        entity_id: user.id,
        description: `${user.name} (${user.role}) sisteme giriş yaptı`,
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        ip_address: clientIp,
        user_agent: request.headers['user-agent'] || undefined,
        fingerprint: request.headers['x-fingerprint'] as string || undefined,
        request_method: 'POST',
        request_path: '/api/auth/login',
        status_code: 200,
      }).catch(() => {}); // fire-and-forget

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
            partner_id: user.partner_id || undefined,
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

    // VIEWER write guard — sadece GET/HEAD/OPTIONS yapabilir
    if (
      decoded.role === 'VIEWER' &&
      request.method !== 'GET' &&
      request.method !== 'HEAD' &&
      request.method !== 'OPTIONS'
    ) {
      reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'İzleyici hesaplar işlem yapamaz (sadece görüntüleme)' },
      });
      return;
    }
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

/**
 * Rol bazlı yetkilendirme factory
 * Kullanım: preHandler: [authenticate, requireRole('ADMIN', 'OPERATOR')]
 */
export function requireRole(...roles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userRole = request.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Bu işlem için ${roles.join(' veya ')} yetkisi gerekiyor`,
        },
      });
    }
  };
}

/**
 * Yazma yetkisi middleware — VIEWER hariç tüm roller
 */
export async function requireWrite(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.user?.role === 'VIEWER') {
    reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'İzleyici hesaplar işlem yapamaz' },
    });
  }
}

/**
 * Partner data filtreleme helper
 * Partner rolündeki kullanıcı sadece kendi verilerini görebilir
 */
export function getPartnerFilter(request: FastifyRequest): { partnerId?: string; siteIds?: string[] } {
  if (request.user?.role !== 'PARTNER') return {};

  // JWT'den partner bilgisi (login sırasında token'a eklenir)
  const decoded = request.user as any;
  return {
    partnerId: decoded.partnerId,
    siteIds: decoded.allowedSites,
  };
}
