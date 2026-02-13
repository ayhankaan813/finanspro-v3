import { Prisma, EntityType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, ConflictError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import type { CreatePartnerInput, UpdatePartnerInput, PartnerQueryInput, AssignSiteInput } from './partner.schema.js';

export interface PartnerWithAccount {
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

export class PartnerService {
  /**
   * Create a new partner with auto-created account
   */
  async create(input: CreatePartnerInput, createdBy: string): Promise<PartnerWithAccount> {
    // Check if code already exists
    const existing = await prisma.partner.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new ConflictError(`Partner kodu '${input.code}' zaten kullanılıyor`);
    }

    const partner = await prisma.$transaction(async (tx) => {
      const newPartner = await tx.partner.create({
        data: {
          name: input.name,
          code: input.code,
          description: input.description,
          is_active: true,
        },
      });

      // Auto-create account (Partner balance can be NEGATIVE!)
      await tx.account.create({
        data: {
          entity_type: EntityType.PARTNER,
          entity_id: newPartner.id,
          partner_id: newPartner.id,
          balance: new Decimal(0),
          blocked_amount: new Decimal(0),
          credit_limit: new Decimal(0), // Partners don't have credit limits
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity_type: 'Partner',
          entity_id: newPartner.id,
          new_data: newPartner as unknown as Prisma.JsonObject,
          user_id: createdBy,
          user_email: '',
        },
      });

      return newPartner;
    });

    logger.info({ partnerId: partner.id, code: partner.code }, 'Partner created');

    return this.findById(partner.id);
  }

  /**
   * Find partner by ID with account
   */
  async findById(id: string): Promise<PartnerWithAccount> {
    const partner = await prisma.partner.findUnique({
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

    if (!partner) {
      throw new NotFoundError('Partner', id);
    }

    return partner as PartnerWithAccount;
  }

  /**
   * List partners with pagination
   */
  async findAll(query: PartnerQueryInput) {
    const where: Prisma.PartnerWhereInput = {
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
      prisma.partner.findMany({
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
            select: { site_partners: { where: { is_active: true, deleted_at: null } } },
          },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.partner.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        ...p,
        site_count: p._count.site_partners,
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
   * Update partner
   */
  async update(id: string, input: UpdatePartnerInput, updatedBy: string): Promise<PartnerWithAccount> {
    const existing = await this.findById(id);

    const partner = await prisma.$transaction(async (tx) => {
      const updated = await tx.partner.update({
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
          entity_type: 'Partner',
          entity_id: id,
          old_data: existing as unknown as Prisma.JsonObject,
          new_data: updated as unknown as Prisma.JsonObject,
          user_id: updatedBy,
          user_email: '',
        },
      });

      return updated;
    });

    logger.info({ partnerId: partner.id }, 'Partner updated');

    return this.findById(partner.id);
  }

  /**
   * Soft delete partner
   */
  async delete(id: string, deletedBy: string): Promise<void> {
    const existing = await this.findById(id);

    // Check balance - only allow delete if balance is 0
    if (existing.account && !new Decimal(existing.account.balance).isZero()) {
      throw new ConflictError(
        `Bu partner silinemez çünkü bakiyesi sıfır değil (${existing.account.balance} ₺)`
      );
    }

    await prisma.$transaction(async (tx) => {
      // Deactivate all site partnerships
      await tx.sitePartner.updateMany({
        where: { partner_id: id },
        data: { is_active: false, deleted_at: new Date() },
      });

      await tx.partner.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity_type: 'Partner',
          entity_id: id,
          old_data: existing as unknown as Prisma.JsonObject,
          user_id: deletedBy,
          user_email: '',
        },
      });
    });

    logger.info({ partnerId: id }, 'Partner deleted');
  }

  /**
   * Get partner's assigned sites
   */
  async getSites(partnerId: string) {
    await this.findById(partnerId);

    const sitePartners = await prisma.sitePartner.findMany({
      where: {
        partner_id: partnerId,
        deleted_at: null,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            code: true,
            is_active: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return sitePartners.map((sp) => ({
      id: sp.id,
      site: sp.site,
      is_active: sp.is_active,
      effective_from: sp.effective_from,
      effective_until: sp.effective_until,
    }));
  }

  /**
   * Assign partner to a site
   */
  async assignSite(partnerId: string, input: AssignSiteInput, createdBy: string) {
    await this.findById(partnerId);

    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: input.site_id, deleted_at: null },
    });

    if (!site) {
      throw new NotFoundError('Site', input.site_id);
    }

    // Check if already assigned
    const existing = await prisma.sitePartner.findUnique({
      where: {
        site_id_partner_id: {
          site_id: input.site_id,
          partner_id: partnerId,
        },
      },
    });

    if (existing && !existing.deleted_at) {
      throw new ConflictError('Bu partner zaten bu siteye atanmış');
    }

    const sitePartner = await prisma.$transaction(async (tx) => {
      if (existing) {
        // Reactivate existing assignment
        return tx.sitePartner.update({
          where: { id: existing.id },
          data: {
            is_active: true,
            deleted_at: null,
            effective_from: input.effective_from ? new Date(input.effective_from) : new Date(),
            effective_until: input.effective_until ? new Date(input.effective_until) : null,
          },
        });
      }

      return tx.sitePartner.create({
        data: {
          site_id: input.site_id,
          partner_id: partnerId,
          is_active: true,
          effective_from: input.effective_from ? new Date(input.effective_from) : new Date(),
          effective_until: input.effective_until ? new Date(input.effective_until) : null,
        },
      });
    });

    logger.info({ partnerId, siteId: input.site_id }, 'Partner assigned to site');

    return sitePartner;
  }

  /**
   * Remove partner from a site
   */
  async removeSite(partnerId: string, siteId: string, removedBy: string) {
    const sitePartner = await prisma.sitePartner.findUnique({
      where: {
        site_id_partner_id: {
          site_id: siteId,
          partner_id: partnerId,
        },
      },
    });

    if (!sitePartner || sitePartner.deleted_at) {
      throw new NotFoundError('SitePartner', `${partnerId}-${siteId}`);
    }

    await prisma.sitePartner.update({
      where: { id: sitePartner.id },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    logger.info({ partnerId, siteId }, 'Partner removed from site');
  }

  /**
   * Get partner's commission rates
   */
  async getCommissionRates(partnerId: string) {
    await this.findById(partnerId);

    const rates = await prisma.commissionRate.findMany({
      where: {
        entity_type: EntityType.PARTNER,
        entity_id: partnerId,
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return rates;
  }

  /**
   * Get yearly statistics for a partner
   * Returns monthly breakdown of commissions, payments, topups, and balances
   */
  async getYearlyStatistics(partnerId: string, year: number) {
    await this.findById(partnerId); // Verify partner exists

    // Get all transactions for this partner in the given year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    // Get partner's account
    const partnerAccount = await prisma.account.findFirst({
      where: { partner_id: partnerId },
    });

    if (!partnerAccount) {
      throw new Error(`Partner account not found for partner ${partnerId}`);
    }

    // Get all ledger entries for this partner's account in the given year
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: {
        account_id: partnerAccount.id,
        created_at: { gte: startDate, lt: endDate },
        transaction: {
          status: 'COMPLETED',
          type: { not: 'REVERSAL' },
          deleted_at: null,
        },
      },
      include: {
        transaction: {
          include: {
            commission_snapshot: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Initialize monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      commission_earned: new Decimal(0),
      payment_received: new Decimal(0),
      topup_made: new Decimal(0),
      balance: new Decimal(0),
    }));

    // Process ledger entries to calculate monthly data
    for (const entry of ledgerEntries) {
      const tx = entry.transaction;
      const month = entry.created_at.getMonth();
      const amount = new Decimal(entry.amount.toString());

      // CREDIT entries increase partner balance (commission earned)
      if (entry.entry_type === 'CREDIT') {
        // This is commission earned from DEPOSIT/WITHDRAWAL transactions
        if (tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL') {
          monthlyData[month].commission_earned = monthlyData[month].commission_earned.plus(amount);
        }
      }

      // DEBIT entries decrease partner balance (payments or topups)
      if (entry.entry_type === 'DEBIT') {
        if (tx.type === 'PARTNER_PAYMENT') {
          monthlyData[month].payment_received = monthlyData[month].payment_received.plus(amount);
        } else if (tx.type === 'TOP_UP') {
          monthlyData[month].topup_made = monthlyData[month].topup_made.plus(amount);
        }
      }
    }

    // Calculate running balance for each month
    let runningBalance = new Decimal(partnerAccount?.balance?.toString() || '0');
    for (let i = 11; i >= 0; i--) {
      monthlyData[i].balance = runningBalance;
      // Go backwards: subtract this month's net change
      const netChange = monthlyData[i].commission_earned
        .minus(monthlyData[i].payment_received)
        .minus(monthlyData[i].topup_made);
      runningBalance = runningBalance.minus(netChange);
    }

    return {
      year,
      partnerId,
      partnerName: (await this.findById(partnerId)).name,
      currentBalance: partnerAccount?.balance || new Decimal(0),
      monthlyData: monthlyData.map((m) => ({
        month: m.month,
        commission_earned: m.commission_earned.toFixed(2),
        payment_received: m.payment_received.toFixed(2),
        topup_made: m.topup_made.toFixed(2),
        balance: m.balance.toFixed(2),
      })),
    };
  }

  /**
   * Get monthly (daily) statistics for a partner
   * Returns daily breakdown of commissions, payments, topups, and balances for a specific month
   */
  async getMonthlyStatistics(partnerId: string, year: number, month: number) {
    const partner = await this.findById(partnerId);

    // Get partner's account
    const partnerAccount = await prisma.account.findFirst({
      where: { partner_id: partnerId },
    });

    if (!partnerAccount) {
      throw new Error(`Partner account not found for partner ${partnerId}`);
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Get ledger entries for this month
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: {
        account_id: partnerAccount.id,
        created_at: { gte: startDate, lt: endDate },
        transaction: {
          status: 'COMPLETED',
          type: { not: 'REVERSAL' },
          deleted_at: null,
        },
      },
      include: {
        transaction: {
          include: {
            commission_snapshot: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Initialize daily data
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      commission_earned: new Decimal(0),
      payment_received: new Decimal(0),
      topup_made: new Decimal(0),
      balance: new Decimal(0),
    }));

    // Process ledger entries to calculate daily data
    for (const entry of ledgerEntries) {
      const tx = entry.transaction;
      const day = entry.created_at.getDate(); // 1-31
      const dayIndex = day - 1; // 0-30
      const amount = new Decimal(entry.amount.toString());

      // CREDIT entries increase partner balance (commission earned)
      if (entry.entry_type === 'CREDIT') {
        if (tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL') {
          dailyData[dayIndex].commission_earned = dailyData[dayIndex].commission_earned.plus(amount);
        }
      }

      // DEBIT entries decrease partner balance (payments or topups)
      if (entry.entry_type === 'DEBIT') {
        if (tx.type === 'PARTNER_PAYMENT') {
          dailyData[dayIndex].payment_received = dailyData[dayIndex].payment_received.plus(amount);
        } else if (tx.type === 'TOP_UP') {
          dailyData[dayIndex].topup_made = dailyData[dayIndex].topup_made.plus(amount);
        }
      }
    }

    // Calculate running balance for each day
    let runningBalance = new Decimal(partnerAccount?.balance?.toString() || '0');
    for (let i = daysInMonth - 1; i >= 0; i--) {
      dailyData[i].balance = runningBalance;
      // Go backwards: subtract this day's net change
      const netChange = dailyData[i].commission_earned
        .minus(dailyData[i].payment_received)
        .minus(dailyData[i].topup_made);
      runningBalance = runningBalance.minus(netChange);
    }

    return {
      year,
      month,
      partnerId,
      partnerName: partner.name,
      currentBalance: partnerAccount?.balance || new Decimal(0),
      dailyData: dailyData.map((d) => ({
        day: d.day,
        commission_earned: d.commission_earned.toFixed(2),
        payment_received: d.payment_received.toFixed(2),
        topup_made: d.topup_made.toFixed(2),
        balance: d.balance.toFixed(2),
      })),
    };
  }
}

export const partnerService = new PartnerService();
