import { Prisma, EntityType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, ConflictError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import type {
  CreateExternalPartyInput,
  UpdateExternalPartyInput,
  ExternalPartyQueryInput,
} from './external-party.schema.js';

export interface ExternalPartyWithAccount {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  account: {
    id: string;
    balance: Decimal;
    blocked_amount: Decimal;
    credit_limit: Decimal;
  } | null;
}

export class ExternalPartyService {
  /**
   * Create external party with account
   */
  async create(input: CreateExternalPartyInput, createdBy: string): Promise<ExternalPartyWithAccount> {
    // Fetch user for audit log
    const user = await prisma.user.findUnique({
      where: { id: createdBy },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User', createdBy);
    }

    const externalParty = await prisma.$transaction(async (tx) => {
      const newParty = await tx.externalParty.create({
        data: {
          name: input.name,
          description: input.description,
          phone: input.phone,
          email: input.email || null,
          is_active: true,
        },
      });

      // Create account for tracking debt/credit
      await tx.account.create({
        data: {
          entity_type: EntityType.EXTERNAL_PARTY,
          entity_id: newParty.id,
          external_party_id: newParty.id,
          balance: new Decimal(0),
          blocked_amount: new Decimal(0),
          credit_limit: new Decimal(0),
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity_type: 'ExternalParty',
          entity_id: newParty.id,
          new_data: newParty as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });

      return newParty;
    });

    logger.info({ externalPartyId: externalParty.id }, 'External party created');

    return this.findById(externalParty.id);
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<ExternalPartyWithAccount> {
    const party = await prisma.externalParty.findUnique({
      where: { id, deleted_at: null },
      include: {
        account: {
          select: {
            id: true,
            balance: true,
            blocked_amount: true,
            credit_limit: true,
          },
        },
      },
    });

    if (!party) {
      throw new NotFoundError('ExternalParty', id);
    }

    return party as ExternalPartyWithAccount;
  }

  /**
   * List with pagination
   */
  async findAll(query: ExternalPartyQueryInput) {
    const where: Prisma.ExternalPartyWhereInput = {
      deleted_at: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.is_active !== undefined) {
      where.is_active = query.is_active === 'true';
    }

    const [items, total] = await Promise.all([
      prisma.externalParty.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              balance: true,
              blocked_amount: true,
              credit_limit: true,
            },
          },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.externalParty.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      hasNext: query.page * query.limit < total,
      hasPrev: query.page > 1,
    };
  }

  /**
   * Update
   */
  async update(id: string, input: UpdateExternalPartyInput, updatedBy: string): Promise<ExternalPartyWithAccount> {
    const existing = await this.findById(id);

    // Fetch user for audit log
    const user = await prisma.user.findUnique({
      where: { id: updatedBy },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User', updatedBy);
    }

    const party = await prisma.$transaction(async (tx) => {
      const updated = await tx.externalParty.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          phone: input.phone,
          email: input.email || null,
          is_active: input.is_active,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity_type: 'ExternalParty',
          entity_id: id,
          old_data: existing as unknown as Prisma.JsonObject,
          new_data: updated as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });

      return updated;
    });

    logger.info({ externalPartyId: party.id }, 'External party updated');

    return this.findById(party.id);
  }

  /**
   * Delete
   */
  async delete(id: string, deletedBy: string): Promise<void> {
    const existing = await this.findById(id);

    // Check balance
    if (existing.account && !new Decimal(existing.account.balance).isZero()) {
      throw new ConflictError(
        `Bu kişi silinemez çünkü bakiyesi sıfır değil (${existing.account.balance} ₺)`
      );
    }

    // Fetch user for audit log
    const user = await prisma.user.findUnique({
      where: { id: deletedBy },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User', deletedBy);
    }

    await prisma.$transaction(async (tx) => {
      await tx.externalParty.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity_type: 'ExternalParty',
          entity_id: id,
          old_data: existing as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });
    });

    logger.info({ externalPartyId: id }, 'External party deleted');
  }

  /**
   * Get transactions
   */
  async getTransactions(externalPartyId: string, query: { page: number; limit: number }) {
    await this.findById(externalPartyId);

    const where = {
      external_party_id: externalPartyId,
      deleted_at: null,
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { transaction_date: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
}

export const externalPartyService = new ExternalPartyService();
