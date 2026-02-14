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

  /**
   * Get yearly statistics with monthly breakdown
   */
  async getYearlyStatistics(externalPartyId: string, year: number) {
    const party = await this.findById(externalPartyId);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        external_party_id: externalPartyId,
        transaction_date: { gte: startDate, lt: endDate },
        status: 'COMPLETED',
        type: { not: 'REVERSAL' },
        deleted_at: null,
      },
      orderBy: { transaction_date: 'asc' },
    });

    // Initialize 12 months
    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      debtIn: new Decimal(0),
      debtOut: new Decimal(0),
      payment: new Decimal(0),
      balance: new Decimal(0),
    }));

    // Aggregate by month
    for (const tx of transactions) {
      const month = new Date(tx.transaction_date).getMonth(); // 0-11
      const grossAmount = new Decimal(tx.gross_amount);

      switch (tx.type) {
        case 'EXTERNAL_DEBT_IN':
          monthlyStats[month].debtIn = monthlyStats[month].debtIn.plus(grossAmount);
          break;
        case 'EXTERNAL_DEBT_OUT':
          monthlyStats[month].debtOut = monthlyStats[month].debtOut.plus(grossAmount);
          break;
        case 'EXTERNAL_PAYMENT':
          monthlyStats[month].payment = monthlyStats[month].payment.plus(grossAmount);
          break;
      }
    }

    // Running balance - BACKWARD from current balance
    // External Party is LIABILITY: CREDIT increases (DEBT_IN), DEBIT decreases (DEBT_OUT, PAYMENT)
    // monthChange = debtIn - debtOut - payment
    const currentBalance = new Decimal(party.account?.balance || 0);
    let runningBalance = currentBalance;

    for (let i = 11; i >= 0; i--) {
      monthlyStats[i].balance = runningBalance;

      const monthChange = monthlyStats[i].debtIn
        .minus(monthlyStats[i].debtOut)
        .minus(monthlyStats[i].payment);

      runningBalance = runningBalance.minus(monthChange);
    }

    return {
      year,
      externalPartyId,
      externalPartyName: party.name,
      currentBalance: currentBalance.toFixed(2),
      monthlyData: monthlyStats.map((m) => ({
        month: m.month,
        debtIn: m.debtIn.toFixed(2),
        debtOut: m.debtOut.toFixed(2),
        payment: m.payment.toFixed(2),
        balance: m.balance.toFixed(2),
      })),
    };
  }

  /**
   * Get monthly statistics with daily breakdown
   */
  async getMonthlyStatistics(externalPartyId: string, year: number, month: number) {
    const party = await this.findById(externalPartyId);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    const transactions = await prisma.transaction.findMany({
      where: {
        external_party_id: externalPartyId,
        transaction_date: { gte: startDate, lt: endDate },
        status: 'COMPLETED',
        type: { not: 'REVERSAL' },
        deleted_at: null,
      },
      orderBy: { transaction_date: 'asc' },
    });

    const dailyStats = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      debtIn: new Decimal(0),
      debtOut: new Decimal(0),
      payment: new Decimal(0),
      balance: new Decimal(0),
    }));

    for (const tx of transactions) {
      const day = new Date(tx.transaction_date).getDate();
      const dayIndex = day - 1;
      const grossAmount = new Decimal(tx.gross_amount);

      switch (tx.type) {
        case 'EXTERNAL_DEBT_IN':
          dailyStats[dayIndex].debtIn = dailyStats[dayIndex].debtIn.plus(grossAmount);
          break;
        case 'EXTERNAL_DEBT_OUT':
          dailyStats[dayIndex].debtOut = dailyStats[dayIndex].debtOut.plus(grossAmount);
          break;
        case 'EXTERNAL_PAYMENT':
          dailyStats[dayIndex].payment = dailyStats[dayIndex].payment.plus(grossAmount);
          break;
      }
    }

    // Backward running balance
    const currentBalance = new Decimal(party.account?.balance || 0);
    let runningBalance = currentBalance;

    for (let i = daysInMonth - 1; i >= 0; i--) {
      dailyStats[i].balance = runningBalance;

      const dayChange = dailyStats[i].debtIn
        .minus(dailyStats[i].debtOut)
        .minus(dailyStats[i].payment);

      runningBalance = runningBalance.minus(dayChange);
    }

    return {
      year,
      month,
      externalPartyId,
      externalPartyName: party.name,
      currentBalance: currentBalance.toFixed(2),
      dailyData: dailyStats.map((d) => ({
        day: d.day,
        debtIn: d.debtIn.toFixed(2),
        debtOut: d.debtOut.toFixed(2),
        payment: d.payment.toFixed(2),
        balance: d.balance.toFixed(2),
      })),
    };
  }
}

export const externalPartyService = new ExternalPartyService();
