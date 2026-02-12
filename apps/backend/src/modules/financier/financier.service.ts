import { Prisma, EntityType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, ConflictError, BusinessError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import type {
  CreateFinancierInput,
  UpdateFinancierInput,
  FinancierQueryInput,
  CreateBlockInput,
  ResolveBlockInput,
} from './financier.schema.js';

export interface FinancierWithAccount {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  account: {
    id: string;
    balance: Decimal;
    blocked_amount: Decimal;
    credit_limit: Decimal;
  } | null;
  active_blocks_count?: number;
}

export class FinancierService {
  /**
   * Create a new financier with auto-created account
   */
  async create(input: CreateFinancierInput, createdBy: string): Promise<FinancierWithAccount> {
    const existing = await prisma.financier.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new ConflictError(`Finansör kodu '${input.code}' zaten kullanılıyor`);
    }

    // Fetch user for audit log
    const user = await prisma.user.findUnique({
      where: { id: createdBy },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User', createdBy);
    }

    const financier = await prisma.$transaction(async (tx) => {
      const newFinancier = await tx.financier.create({
        data: {
          name: input.name,
          code: input.code,
          description: input.description,
          is_active: true,
        },
      });

      await tx.account.create({
        data: {
          entity_type: EntityType.FINANCIER,
          entity_id: newFinancier.id,
          financier_id: newFinancier.id,
          balance: new Decimal(0),
          blocked_amount: new Decimal(0),
          credit_limit: new Decimal(0),
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity_type: 'Financier',
          entity_id: newFinancier.id,
          new_data: newFinancier as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });

      return newFinancier;
    });

    logger.info({ financierId: financier.id, code: financier.code }, 'Financier created');

    return this.findById(financier.id);
  }

  /**
   * Find financier by ID with account and block count
   */
  async findById(id: string): Promise<FinancierWithAccount> {
    const financier = await prisma.financier.findUnique({
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
        _count: {
          select: {
            blocks: { where: { resolved_at: null } },
          },
        },
      },
    });

    if (!financier) {
      throw new NotFoundError('Financier', id);
    }

    return {
      ...financier,
      active_blocks_count: financier._count.blocks,
    } as FinancierWithAccount;
  }

  /**
   * List financiers
   */
  async findAll(query: FinancierQueryInput) {
    const where: Prisma.FinancierWhereInput = {
      deleted_at: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.is_active !== undefined) {
      where.is_active = query.is_active === 'true';
    }

    const [items, total] = await Promise.all([
      prisma.financier.findMany({
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
          _count: {
            select: { blocks: { where: { resolved_at: null } } },
          },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.financier.count({ where }),
    ]);

    return {
      items: items.map((f) => ({
        ...f,
        active_blocks_count: f._count.blocks,
        available_balance: f.account
          ? new Decimal(f.account.balance).minus(f.account.blocked_amount).toString()
          : '0',
      })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      hasNext: query.page * query.limit < total,
      hasPrev: query.page > 1,
    };
  }

  /**
   * Update financier
   */
  async update(id: string, input: UpdateFinancierInput, updatedBy: string): Promise<FinancierWithAccount> {
    const existing = await this.findById(id);

    // Fetch user for audit log
    const user = await prisma.user.findUnique({
      where: { id: updatedBy },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User', updatedBy);
    }

    const financier = await prisma.$transaction(async (tx) => {
      const updated = await tx.financier.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          is_active: input.is_active,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity_type: 'Financier',
          entity_id: id,
          old_data: existing as unknown as Prisma.JsonObject,
          new_data: updated as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });

      return updated;
    });

    logger.info({ financierId: financier.id }, 'Financier updated');

    return this.findById(financier.id);
  }

  /**
   * Delete financier
   */
  async delete(id: string, deletedBy: string): Promise<void> {
    const existing = await this.findById(id);

    if (existing.account && !new Decimal(existing.account.balance).isZero()) {
      throw new ConflictError(
        `Bu finansör silinemez çünkü bakiyesi sıfır değil (${existing.account.balance} ₺)`
      );
    }

    if (existing.active_blocks_count && existing.active_blocks_count > 0) {
      throw new ConflictError('Bu finansör silinemez çünkü aktif blokeler var');
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
      await tx.financier.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity_type: 'Financier',
          entity_id: id,
          old_data: existing as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });
    });

    logger.info({ financierId: id }, 'Financier deleted');
  }

  /**
   * Get financier's blocks
   */
  async getBlocks(financierId: string, includeResolved: boolean = false) {
    await this.findById(financierId);

    const where: Prisma.FinancierBlockWhereInput = {
      financier_id: financierId,
    };

    if (!includeResolved) {
      where.resolved_at = null;
    }

    const blocks = await prisma.financierBlock.findMany({
      where,
      orderBy: { started_at: 'desc' },
    });

    return blocks;
  }

  /**
   * Create a new block on financier's account
   */
  async createBlock(financierId: string, input: CreateBlockInput, createdBy: string) {
    const financier = await this.findById(financierId);

    if (!financier.account) {
      throw new NotFoundError('Account for Financier', financierId);
    }

    const blockAmount = new Decimal(input.amount);
    const currentBalance = new Decimal(financier.account.balance);
    const currentBlocked = new Decimal(financier.account.blocked_amount);
    const availableBalance = currentBalance.minus(currentBlocked);

    if (blockAmount.greaterThan(availableBalance)) {
      throw new BusinessError(
        `Yetersiz kullanılabilir bakiye. Mevcut: ${availableBalance.toString()} ₺, İstenen: ${blockAmount.toString()} ₺`,
        'INSUFFICIENT_AVAILABLE_BALANCE'
      );
    }

    // Fetch user for audit log
    const user = await prisma.user.findUnique({
      where: { id: createdBy },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User', createdBy);
    }

    const block = await prisma.$transaction(async (tx) => {
      // Create block record
      const newBlock = await tx.financierBlock.create({
        data: {
          financier_id: financierId,
          amount: blockAmount,
          reason: input.reason,
          estimated_days: input.estimated_days || this.estimateBlockDuration(financierId),
        },
      });

      // Update account blocked amount
      await tx.account.update({
        where: { entity_id: financierId },
        data: {
          blocked_amount: currentBlocked.plus(blockAmount),
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE_BLOCK',
          entity_type: 'FinancierBlock',
          entity_id: newBlock.id,
          new_data: {
            financier_id: financierId,
            amount: blockAmount.toString(),
            reason: input.reason,
          } as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });

      return newBlock;
    });

    logger.info({ financierId, blockId: block.id, amount: input.amount }, 'Block created');

    return block;
  }

  /**
   * Resolve (release) a block
   */
  async resolveBlock(financierId: string, blockId: string, input: ResolveBlockInput, resolvedBy: string) {
    const financier = await this.findById(financierId);

    const block = await prisma.financierBlock.findUnique({
      where: { id: blockId },
    });

    if (!block || block.financier_id !== financierId) {
      throw new NotFoundError('Block', blockId);
    }

    if (block.resolved_at) {
      throw new BusinessError('Bu bloke zaten çözülmüş', 'ALREADY_RESOLVED');
    }

    // Fetch user for audit log
    const user = await prisma.user.findUnique({
      where: { id: resolvedBy },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User', resolvedBy);
    }

    await prisma.$transaction(async (tx) => {
      // Update block as resolved
      await tx.financierBlock.update({
        where: { id: blockId },
        data: { resolved_at: new Date() },
      });

      // Update account blocked amount
      const currentBlocked = new Decimal(financier.account!.blocked_amount);
      const newBlocked = currentBlocked.minus(block.amount);

      await tx.account.update({
        where: { entity_id: financierId },
        data: {
          blocked_amount: newBlocked.isNegative() ? new Decimal(0) : newBlocked,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'RESOLVE_BLOCK',
          entity_type: 'FinancierBlock',
          entity_id: blockId,
          old_data: { resolved_at: null } as unknown as Prisma.JsonObject,
          new_data: {
            resolved_at: new Date().toISOString(),
            resolution_note: input.resolution_note,
          } as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });
    });

    logger.info({ financierId, blockId }, 'Block resolved');
  }

  /**
   * Estimate block duration based on historical data (ML-like prediction)
   */
  private async estimateBlockDuration(financierId: string): Promise<number> {
    const pastBlocks = await prisma.financierBlock.findMany({
      where: {
        financier_id: financierId,
        resolved_at: { not: null },
      },
      orderBy: { resolved_at: 'desc' },
      take: 10, // Last 10 resolved blocks
    });

    if (pastBlocks.length === 0) {
      // No history, use default
      return 3;
    }

    const durations = pastBlocks.map((block) => {
      const start = new Date(block.started_at).getTime();
      const end = new Date(block.resolved_at!).getTime();
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Days
    });

    // Calculate average
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    return Math.max(1, Math.round(avgDuration));
  }

  /**
   * Get available balance (total - blocked)
   */
  async getAvailableBalance(financierId: string): Promise<{ total: string; blocked: string; available: string }> {
    const financier = await this.findById(financierId);

    if (!financier.account) {
      throw new NotFoundError('Account for Financier', financierId);
    }

    const total = new Decimal(financier.account.balance);
    const blocked = new Decimal(financier.account.blocked_amount);
    const available = total.minus(blocked);

    return {
      total: total.toString(),
      blocked: blocked.toString(),
      available: available.toString(),
    };
  }

  /**
   * Get financier's transactions
   */
  async getTransactions(financierId: string, query: { page: number; limit: number }) {
    await this.findById(financierId); // Ensure financier exists

    const where = {
      financier_id: financierId,
      deleted_at: null,
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { transaction_date: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          site: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true, color: true } },
          delivery_type: { select: { id: true, name: true } },
          commission_snapshot: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      hasNext: query.page < Math.ceil(total / query.limit),
      hasPrev: query.page > 1,
    };
  }
}

export const financierService = new FinancierService();
