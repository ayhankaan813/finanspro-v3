import { Prisma, EntityType, TransactionType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, ConflictError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import type { CreateSiteInput, UpdateSiteInput, SiteQueryInput } from './site.schema.js';

export interface SiteWithAccount {
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
}

export class SiteService {
  /**
   * Create a new site with auto-created account
   */
  async create(input: CreateSiteInput, createdBy: string): Promise<SiteWithAccount> {
    // Check if code already exists
    const existing = await prisma.site.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new ConflictError(`Site kodu '${input.code}' zaten kullanılıyor`);
    }

    // Create site and account in transaction
    const site = await prisma.$transaction(async (tx) => {
      const newSite = await tx.site.create({
        data: {
          name: input.name,
          code: input.code,
          description: input.description,
          is_active: true,
        },
      });

      // Auto-create account for the site
      await tx.account.create({
        data: {
          entity_type: EntityType.SITE,
          entity_id: newSite.id,
          site_id: newSite.id,
          balance: new Decimal(0),
          blocked_amount: new Decimal(0),
          credit_limit: new Decimal(0),
        },
      });

      // Create default commission rates with effective_from
      const depositRate = input.deposit_commission_rate || '5.00';
      const withdrawalRate = input.withdrawal_commission_rate || '5.00';

      // DEPOSIT commission rate
      await tx.commissionRate.create({
        data: {
          entity_type: EntityType.SITE,
          entity_id: newSite.id,
          site_id: newSite.id,
          transaction_type: TransactionType.DEPOSIT,
          rate: new Decimal(depositRate).dividedBy(100), // Convert % to decimal (5.00 -> 0.05000)
          effective_from: new Date(),
          effective_until: null, // Open-ended
          is_active: true,
        },
      });

      // WITHDRAWAL commission rate
      await tx.commissionRate.create({
        data: {
          entity_type: EntityType.SITE,
          entity_id: newSite.id,
          site_id: newSite.id,
          transaction_type: TransactionType.WITHDRAWAL,
          rate: new Decimal(withdrawalRate).dividedBy(100), // Convert % to decimal (5.00 -> 0.05000)
          effective_from: new Date(),
          effective_until: null, // Open-ended
          is_active: true,
        },
      });

      logger.info(
        { siteId: newSite.id, depositRate, withdrawalRate },
        'Default commission rates created for new site'
      );

      // Create audit log (skip if user doesn't exist)
      try {
        await tx.auditLog.create({
          data: {
            action: 'CREATE',
            entity_type: 'Site',
            entity_id: newSite.id,
            new_data: newSite as unknown as Prisma.JsonObject,
            user_id: createdBy,
            user_email: '', // Will be filled by middleware
          },
        });
      } catch (auditError) {
        logger.warn({ error: auditError, userId: createdBy }, 'Failed to create audit log - user may not exist');
      }

      return newSite;
    });

    logger.info({ siteId: site.id, code: site.code }, 'Site created');

    return this.findById(site.id);
  }

  /**
   * Find site by ID with account
   */
  async findById(id: string): Promise<SiteWithAccount> {
    const site = await prisma.site.findUnique({
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

    if (!site) {
      throw new NotFoundError('Site', id);
    }

    return site as SiteWithAccount;
  }

  /**
   * Find site by code
   */
  async findByCode(code: string): Promise<SiteWithAccount> {
    const site = await prisma.site.findUnique({
      where: { code, deleted_at: null },
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

    if (!site) {
      throw new NotFoundError('Site', code);
    }

    return site as SiteWithAccount;
  }

  /**
   * List sites with pagination and filtering
   */
  async findAll(query: SiteQueryInput) {
    const where: Prisma.SiteWhereInput = {
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
      prisma.site.findMany({
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
      prisma.site.count({ where }),
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
   * Update site
   */
  async update(id: string, input: UpdateSiteInput, updatedBy: string): Promise<SiteWithAccount> {
    const existing = await this.findById(id);

    const site = await prisma.$transaction(async (tx) => {
      const updated = await tx.site.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          is_active: input.is_active,
        },
      });

      // Create audit log (skip if user doesn't exist)
      try {
        await tx.auditLog.create({
          data: {
            action: 'UPDATE',
            entity_type: 'Site',
            entity_id: id,
            old_data: existing as unknown as Prisma.JsonObject,
            new_data: updated as unknown as Prisma.JsonObject,
            user_id: updatedBy,
            user_email: '',
          },
        });
      } catch (auditError) {
        logger.warn({ error: auditError }, 'Failed to create audit log');
      }

      return updated;
    });

    logger.info({ siteId: site.id }, 'Site updated');

    return this.findById(site.id);
  }

  /**
   * Soft delete site
   */
  async delete(id: string, deletedBy: string): Promise<void> {
    const existing = await this.findById(id);

    // Check if site has any transactions
    const transactionCount = await prisma.transaction.count({
      where: { site_id: id, deleted_at: null },
    });

    if (transactionCount > 0) {
      throw new ConflictError(
        `Bu site silinemez çünkü ${transactionCount} adet işlem kaydı bulunuyor`
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.site.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      try {
        await tx.auditLog.create({
          data: {
            action: 'DELETE',
            entity_type: 'Site',
            entity_id: id,
            old_data: existing as unknown as Prisma.JsonObject,
            user_id: deletedBy,
            user_email: '',
          },
        });
      } catch (auditError) {
        logger.warn({ error: auditError }, 'Failed to create audit log');
      }
    });

    logger.info({ siteId: id }, 'Site deleted');
  }

  /**
   * Get site's partners
   */
  async getPartners(siteId: string) {
    await this.findById(siteId); // Ensure site exists

    const sitePartners = await prisma.sitePartner.findMany({
      where: {
        site_id: siteId,
        deleted_at: null,
        is_active: true,
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            code: true,
            is_active: true,
          },
        },
      },
    });

    return sitePartners.map((sp) => ({
      id: sp.id,
      partner: sp.partner,
      effective_from: sp.effective_from,
      effective_until: sp.effective_until,
    }));
  }

  /**
   * Get site's transactions
   */
  async getTransactions(siteId: string, query: { page: number; limit: number }) {
    await this.findById(siteId); // Ensure site exists

    const where = {
      site_id: siteId,
      deleted_at: null,
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { transaction_date: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          category: { select: { id: true, name: true, color: true } },
          delivery_type: { select: { id: true, name: true } },
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
    };
  }

  /**
   * Get site's ledger entries
   */
  async getLedgerEntries(siteId: string, query: { page: number; limit: number }) {
    const site = await this.findById(siteId);

    if (!site.account) {
      throw new NotFoundError('Account for Site', siteId);
    }

    const where = {
      account_id: site.account.id,
    };

    const [items, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.ledgerEntry.count({ where }),
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
   * Get yearly statistics for a site
   */
  async getYearlyStatistics(siteId: string, year: number) {
    const site = await this.findById(siteId);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    // Get all transactions for this site in the year
    const transactions = await prisma.transaction.findMany({
      where: {
        site_id: siteId,
        transaction_date: { gte: startDate, lt: endDate },
        status: 'COMPLETED',
        type: { not: 'REVERSAL' },
        deleted_at: null,
      },
      include: {
        commission_snapshot: true,
      },
      orderBy: { transaction_date: 'asc' },
    });

    // Initialize monthly data
    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      deposit: new Decimal(0),
      withdrawal: new Decimal(0),
      delivery: new Decimal(0),
      delivery_commission: new Decimal(0),
      topup: new Decimal(0),
      payment: new Decimal(0),
      commission: new Decimal(0),
      balance: new Decimal(0),
    }));

    // Aggregate transactions by month
    transactions.forEach((tx) => {
      const month = new Date(tx.transaction_date).getMonth(); // 0-11
      const grossAmount = new Decimal(tx.gross_amount);
      const netAmount = new Decimal(tx.net_amount);

      switch (tx.type) {
        case 'DEPOSIT':
          monthlyStats[month].deposit = monthlyStats[month].deposit.plus(grossAmount);
          if (tx.commission_snapshot) {
            monthlyStats[month].commission = monthlyStats[month].commission.plus(
              tx.commission_snapshot.site_commission_amount
            );
          }
          break;

        case 'WITHDRAWAL':
          monthlyStats[month].withdrawal = monthlyStats[month].withdrawal.plus(grossAmount);
          if (tx.commission_snapshot) {
            monthlyStats[month].commission = monthlyStats[month].commission.plus(
              tx.commission_snapshot.site_commission_amount
            );
          }
          break;

        case 'DELIVERY':
          monthlyStats[month].delivery = monthlyStats[month].delivery.plus(grossAmount);
          if (tx.delivery_commission_amount) {
            monthlyStats[month].delivery_commission = monthlyStats[month].delivery_commission.plus(
              tx.delivery_commission_amount
            );
          }
          break;

        case 'TOP_UP':
          monthlyStats[month].topup = monthlyStats[month].topup.plus(grossAmount);
          break;

        case 'PAYMENT':
          monthlyStats[month].payment = monthlyStats[month].payment.plus(grossAmount);
          break;
      }
    });

    // Calculate running balance (Site is LIABILITY - negative in DB means positive for customer)
    const currentBalance = site.account?.balance || new Decimal(0);
    let runningBalance = currentBalance;

    // Calculate balances backward from current balance
    for (let i = 11; i >= 0; i--) {
      monthlyStats[i].balance = runningBalance;

      // Going backwards: subtract this month's net change to get previous month's balance
      // Site balance is stored as positive (LIABILITY account)
      // Deposit/Topup -> INCREASES balance (site owes more)
      // Withdrawal/Payment/Commission -> DECREASES balance (site owes less)
      const monthChange = monthlyStats[i].deposit
        .plus(monthlyStats[i].topup)
        .minus(monthlyStats[i].withdrawal)
        .minus(monthlyStats[i].payment)
        .minus(monthlyStats[i].commission)
        .minus(monthlyStats[i].delivery_commission);

      runningBalance = runningBalance.minus(monthChange);
    }

    return {
      year,
      siteId,
      siteName: site.name,
      currentBalance: currentBalance,
      monthlyData: monthlyStats.map((m) => ({
        month: m.month,
        deposit: m.deposit.toFixed(2),
        withdrawal: m.withdrawal.toFixed(2),
        delivery: m.delivery.toFixed(2),
        delivery_commission: m.delivery_commission.toFixed(2),
        topup: m.topup.toFixed(2),
        payment: m.payment.toFixed(2),
        commission: m.commission.toFixed(2),
        balance: m.balance.toFixed(2),
      })),
    };
  }

  /**
   * Get monthly (daily) statistics for a site
   */
  async getMonthlyStatistics(siteId: string, year: number, month: number) {
    const site = await this.findById(siteId);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Get all transactions for this site in the month
    const transactions = await prisma.transaction.findMany({
      where: {
        site_id: siteId,
        transaction_date: { gte: startDate, lt: endDate },
        status: 'COMPLETED',
        type: { not: 'REVERSAL' },
        deleted_at: null,
      },
      include: {
        commission_snapshot: true,
      },
      orderBy: { transaction_date: 'asc' },
    });

    // Initialize daily data
    const dailyStats = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      deposit: new Decimal(0),
      withdrawal: new Decimal(0),
      delivery: new Decimal(0),
      delivery_commission: new Decimal(0),
      topup: new Decimal(0),
      payment: new Decimal(0),
      commission: new Decimal(0),
      balance: new Decimal(0),
    }));

    // Aggregate transactions by day
    transactions.forEach((tx) => {
      const day = new Date(tx.transaction_date).getDate(); // 1-31
      const dayIndex = day - 1; // 0-30
      const grossAmount = new Decimal(tx.gross_amount);

      switch (tx.type) {
        case 'DEPOSIT':
          dailyStats[dayIndex].deposit = dailyStats[dayIndex].deposit.plus(grossAmount);
          if (tx.commission_snapshot) {
            dailyStats[dayIndex].commission = dailyStats[dayIndex].commission.plus(
              tx.commission_snapshot.site_commission_amount
            );
          }
          break;

        case 'WITHDRAWAL':
          dailyStats[dayIndex].withdrawal = dailyStats[dayIndex].withdrawal.plus(grossAmount);
          if (tx.commission_snapshot) {
            dailyStats[dayIndex].commission = dailyStats[dayIndex].commission.plus(
              tx.commission_snapshot.site_commission_amount
            );
          }
          break;

        case 'DELIVERY':
          dailyStats[dayIndex].delivery = dailyStats[dayIndex].delivery.plus(grossAmount);
          if (tx.delivery_commission_amount) {
            dailyStats[dayIndex].delivery_commission = dailyStats[dayIndex].delivery_commission.plus(
              tx.delivery_commission_amount
            );
          }
          break;

        case 'TOP_UP':
          dailyStats[dayIndex].topup = dailyStats[dayIndex].topup.plus(grossAmount);
          break;

        case 'PAYMENT':
          dailyStats[dayIndex].payment = dailyStats[dayIndex].payment.plus(grossAmount);
          break;
      }
    });

    // Calculate running balance
    const currentBalance = site.account?.balance || new Decimal(0);
    let runningBalance = currentBalance;

    // Calculate balances backward from current balance
    for (let i = daysInMonth - 1; i >= 0; i--) {
      dailyStats[i].balance = runningBalance;

      const dayChange = dailyStats[i].deposit
        .plus(dailyStats[i].topup)
        .minus(dailyStats[i].withdrawal)
        .minus(dailyStats[i].payment)
        .minus(dailyStats[i].commission)
        .minus(dailyStats[i].delivery_commission);

      runningBalance = runningBalance.minus(dayChange);
    }

    return {
      year,
      month,
      siteId,
      siteName: site.name,
      currentBalance: currentBalance,
      dailyData: dailyStats.map((d) => ({
        day: d.day,
        deposit: d.deposit.toFixed(2),
        withdrawal: d.withdrawal.toFixed(2),
        delivery: d.delivery.toFixed(2),
        delivery_commission: d.delivery_commission.toFixed(2),
        topup: d.topup.toFixed(2),
        payment: d.payment.toFixed(2),
        commission: d.commission.toFixed(2),
        balance: d.balance.toFixed(2),
      })),
    };
  }

  /**
   * Get transaction stats for ALL sites within a date range
   * Returns deposit/withdrawal totals grouped by site_id
   */
  async getAllSiteStats(from: Date, to: Date) {
    const transactions = await prisma.transaction.groupBy({
      by: ['site_id', 'type'],
      where: {
        site_id: { not: null },
        transaction_date: { gte: from, lte: to },
        status: 'COMPLETED',
        deleted_at: null,
        type: { in: ['DEPOSIT', 'WITHDRAWAL'] },
      },
      _sum: {
        gross_amount: true,
      },
    });

    // Build a map: { siteId: { totalDeposit, totalWithdrawal } }
    const statsMap: Record<string, { totalDeposit: string; totalWithdrawal: string }> = {};

    transactions.forEach((row) => {
      const siteId = row.site_id!;
      if (!statsMap[siteId]) {
        statsMap[siteId] = { totalDeposit: '0', totalWithdrawal: '0' };
      }
      const amount = row._sum.gross_amount?.toFixed(2) || '0';
      if (row.type === 'DEPOSIT') {
        statsMap[siteId].totalDeposit = amount;
      } else if (row.type === 'WITHDRAWAL') {
        statsMap[siteId].totalWithdrawal = amount;
      }
    });

    return statsMap;
  }
}

export const siteService = new SiteService();
