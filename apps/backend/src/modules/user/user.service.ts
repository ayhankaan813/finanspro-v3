import { hash } from 'bcryptjs';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, ConflictError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'PARTNER' | 'VIEWER';
  partner_id?: string;
  allowed_sites?: string[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'OPERATOR' | 'PARTNER' | 'VIEWER';
  is_active?: boolean;
  partner_id?: string | null;
  allowed_sites?: string[] | null;
  password?: string; // yeni şifre (opsiyonel)
}

class UserService {
  async findAll() {
    return prisma.user.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        partner_id: true,
        allowed_sites: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        partner: { select: { id: true, name: true, code: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        partner_id: true,
        allowed_sites: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        partner: { select: { id: true, name: true, code: true } },
      },
    });

    if (!user || user.deleted_at) {
      throw new NotFoundError('User', id);
    }

    return user;
  }

  async create(input: CreateUserInput) {
    // Email kontrolü
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictError('Bu email adresi zaten kullanılıyor');
    }

    // Partner rolü için partner_id zorunlu
    if (input.role === 'PARTNER' && !input.partner_id) {
      throw new Error('Partner rolü için partner seçimi zorunludur');
    }

    const password_hash = await hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password_hash,
        name: input.name,
        role: input.role as any,
        partner_id: input.partner_id || null,
        allowed_sites: input.allowed_sites || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        partner_id: true,
        allowed_sites: true,
        created_at: true,
        partner: { select: { id: true, name: true, code: true } },
      },
    });

    logger.info({ userId: user.id, email: user.email, role: user.role }, 'User created');
    return user;
  }

  async update(id: string, input: UpdateUserInput) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deleted_at) {
      throw new NotFoundError('User', id);
    }

    // Email değiştiriyorsa uniqueness kontrolü
    if (input.email && input.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (emailExists) {
        throw new ConflictError('Bu email adresi zaten kullanılıyor');
      }
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email;
    if (input.role !== undefined) data.role = input.role;
    if (input.is_active !== undefined) data.is_active = input.is_active;
    if (input.partner_id !== undefined) data.partner_id = input.partner_id;
    if (input.allowed_sites !== undefined) data.allowed_sites = input.allowed_sites;
    if (input.password) {
      data.password_hash = await hash(input.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        partner_id: true,
        allowed_sites: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        partner: { select: { id: true, name: true, code: true } },
      },
    });

    logger.info({ userId: user.id, role: user.role }, 'User updated');
    return user;
  }

  async softDelete(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deleted_at) {
      throw new NotFoundError('User', id);
    }

    await prisma.user.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });

    logger.info({ userId: id }, 'User soft deleted');
  }
}

export const userService = new UserService();
