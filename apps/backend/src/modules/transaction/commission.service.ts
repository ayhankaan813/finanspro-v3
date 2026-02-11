import { EntityType, TransactionType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { logger } from '../../shared/utils/logger.js';

export interface CommissionCalculation {
  site_commission_rate: Decimal;
  site_commission_amount: Decimal;
  partner_commissions: Array<{
    partner_id: string;
    partner_name: string;
    rate: Decimal;
    amount: Decimal;
  }>;
  financier_commission_rate: Decimal;
  financier_commission_amount: Decimal;
  organization_amount: Decimal;
  total_commission: Decimal;
}

export class CommissionService {
  /**
   * Calculate commissions for a deposit transaction
   *
   * Formula:
   * Site Commission = Amount × Site Rate (total commission pool, e.g., 6%)
   * Partner Commission = Amount × Partner Rate (from gross, e.g., 1.5%)
   * Financier Commission = Amount × Financier Rate (from gross, e.g., 2.5%)
   * Organization Profit = Amount × Organization Rate (from gross, e.g., 2%)
   *
   * IMPORTANT: Partner + Financier + Organization = Site Commission
   *
   * Example: 100 TL deposit, 6% site commission
   * - Site Commission: 6 TL (total pool)
   * - Partner: 100 × 1.5% = 1.5 TL
   * - Financier: 100 × 2.5% = 2.5 TL
   * - Organization: 100 × 2% = 2 TL
   * - Total: 1.5 + 2.5 + 2 = 6 TL ✅
   */
  async calculateDepositCommission(
    siteId: string,
    financierId: string,
    amount: Decimal
  ): Promise<CommissionCalculation> {
    // 1. Get site commission rate
    const siteRate = await this.getEffectiveRate(
      EntityType.SITE,
      siteId,
      TransactionType.DEPOSIT
    );
    const siteCommissionAmount = amount.mul(siteRate);

    // 2. Get partner commissions for this site
    // Partner commission is calculated from GROSS amount (not from site commission)
    const partnerCommissions = await this.calculatePartnerCommissions(
      siteId,
      amount, // Pass GROSS amount
      TransactionType.DEPOSIT
    );
    const totalPartnerCommission = partnerCommissions.reduce(
      (sum, pc) => sum.add(pc.amount),
      new Decimal(0)
    );

    // 3. Get financier commission rate (calculated from GROSS amount)
    const financierRate = await this.getEffectiveRate(
      EntityType.FINANCIER,
      financierId,
      TransactionType.DEPOSIT
    );
    const financierCommissionAmount = amount.mul(financierRate);

    // 4. Calculate organization profit
    // Organization gets: Site Commission - Partner Commission - Financier Commission
    const organizationAmount = siteCommissionAmount
      .sub(totalPartnerCommission)
      .sub(financierCommissionAmount);

    // 5. CRITICAL VALIDATION: Total distributed commission cannot exceed site commission
    // Partner + Financier + Organization ≤ Site Commission
    const totalDistributed = totalPartnerCommission
      .plus(financierCommissionAmount)
      .plus(organizationAmount);

    if (totalDistributed.gt(siteCommissionAmount)) {
      const diff = totalDistributed.minus(siteCommissionAmount).toString();
      logger.error(
        {
          siteCommissionAmount: siteCommissionAmount.toString(),
          totalDistributed: totalDistributed.toString(),
          difference: diff,
          partnerTotal: totalPartnerCommission.toString(),
          financierCommission: financierCommissionAmount.toString(),
          organizationAmount: organizationAmount.toString(),
        },
        'Commission distribution exceeds site commission!'
      );
      throw new Error(
        `Komisyon dağılımı hatalı! ` +
        `Dağıtılan toplam (${totalDistributed.toString()} TL) ` +
        `site komisyonundan (${siteCommissionAmount.toString()} TL) fazla olamaz. ` +
        `Fark: ${diff} TL`
      );
    }

    // 6. WARNING: If organization amount is negative, something is wrong
    if (organizationAmount.lt(0)) {
      logger.warn(
        {
          organizationAmount: organizationAmount.toString(),
          siteCommissionAmount: siteCommissionAmount.toString(),
          totalPartnerCommission: totalPartnerCommission.toString(),
          financierCommissionAmount: financierCommissionAmount.toString(),
        },
        'Organization amount is negative - commission rates may need adjustment'
      );
      throw new Error(
        `Organizasyon karı negatif çıktı (${organizationAmount.toString()} TL). ` +
        `Partner (${totalPartnerCommission.toString()} TL) + ` +
        `Finansör (${financierCommissionAmount.toString()} TL) komisyonları, ` +
        `site komisyonundan (${siteCommissionAmount.toString()} TL) fazla!`
      );
    }

    logger.debug(
      {
        siteId,
        financierId,
        amount: amount.toString(),
        siteRate: siteRate.toString(),
        siteCommissionAmount: siteCommissionAmount.toString(),
        partnerCommissions: partnerCommissions.map((pc) => ({
          partner_id: pc.partner_id,
          amount: pc.amount.toString(),
        })),
        financierRate: financierRate.toString(),
        financierCommissionAmount: financierCommissionAmount.toString(),
        organizationAmount: organizationAmount.toString(),
      },
      'Commission calculated for deposit'
    );

    return {
      site_commission_rate: siteRate,
      site_commission_amount: siteCommissionAmount,
      partner_commissions: partnerCommissions,
      financier_commission_rate: financierRate,
      financier_commission_amount: financierCommissionAmount,
      organization_amount: organizationAmount,
      total_commission: siteCommissionAmount,
    };
  }

  /**
   * Calculate commissions for a withdrawal transaction
   * Withdrawals typically don't have partner commissions
   */
  async calculateWithdrawalCommission(
    siteId: string,
    financierId: string,
    amount: Decimal
  ): Promise<CommissionCalculation> {
    // 1. Get site commission rate for withdrawal
    const siteRate = await this.getEffectiveRate(
      EntityType.SITE,
      siteId,
      TransactionType.WITHDRAWAL
    );
    const siteCommissionAmount = amount.mul(siteRate);

    // 2. No partner commissions for withdrawals
    const partnerCommissions: Array<{
      partner_id: string;
      partner_name: string;
      rate: Decimal;
      amount: Decimal;
    }> = [];

    // 3. Financier commission for withdrawal
    const financierRate = await this.getEffectiveRate(
      EntityType.FINANCIER,
      financierId,
      TransactionType.WITHDRAWAL
    );
    const financierCommissionAmount = amount.mul(financierRate);

    // 4. Organization gets the full site commission for withdrawals
    const organizationAmount = siteCommissionAmount;

    // 5. VALIDATION: Ensure no negative amounts
    if (organizationAmount.lt(0)) {
      logger.warn(
        {
          organizationAmount: organizationAmount.toString(),
          siteCommissionAmount: siteCommissionAmount.toString(),
          financierCommissionAmount: financierCommissionAmount.toString(),
        },
        'Withdrawal commission calculation resulted in negative organization amount'
      );
      throw new Error(
        `Çekim işlemi komisyon hesaplaması hatalı. Organizasyon tutarı negatif: ${organizationAmount.toString()} TL`
      );
    }

    return {
      site_commission_rate: siteRate,
      site_commission_amount: siteCommissionAmount,
      partner_commissions: partnerCommissions,
      financier_commission_rate: financierRate,
      financier_commission_amount: financierCommissionAmount,
      organization_amount: organizationAmount,
      total_commission: siteCommissionAmount,
    };
  }

  /**
   * Get partner commissions for a site
   *
   * IMPORTANT: The 'amount' parameter here is the GROSS TRANSACTION AMOUNT!
   * Partner rate represents their commission percentage from the gross amount.
   *
   * Example:
   * - Gross amount: 100 TL
   * - Partner rate: 1.5% (0.015)
   * - Partner gets: 100 × 0.015 = 1.5 TL
   */
  private async calculatePartnerCommissions(
    siteId: string,
    grossAmount: Decimal,
    transactionType: TransactionType
  ): Promise<Array<{ partner_id: string; partner_name: string; rate: Decimal; amount: Decimal }>> {
    // Get active site-partner relationships
    const sitePartners = await prisma.sitePartner.findMany({
      where: {
        site_id: siteId,
        is_active: true,
        deleted_at: null,
        OR: [
          { effective_until: null },
          { effective_until: { gt: new Date() } },
        ],
      },
      include: {
        partner: {
          select: { id: true, name: true },
        },
      },
    });

    const partnerCommissions = [];

    for (const sp of sitePartners) {
      // Get partner's share percentage for this site
      // This represents what % of the site commission the partner gets
      const shareRate = await this.getEffectiveRate(
        EntityType.PARTNER,
        sp.partner.id,
        transactionType,
        siteId // related_site_id
      );

      if (!shareRate.isZero()) {
        // Partner gets their commission from gross amount
        const commissionAmount = grossAmount.mul(shareRate);
        partnerCommissions.push({
          partner_id: sp.partner.id,
          partner_name: sp.partner.name,
          rate: shareRate,
          amount: commissionAmount,
        });
      }
    }

    return partnerCommissions;
  }

  /**
   * Get effective commission rate for an entity
   */
  private async getEffectiveRate(
    entityType: EntityType,
    entityId: string,
    transactionType: TransactionType,
    relatedSiteId?: string
  ): Promise<Decimal> {
    const now = new Date();

    const rate = await prisma.commissionRate.findFirst({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        transaction_type: transactionType,
        related_site_id: relatedSiteId || null,
        is_active: true,
        effective_from: { lte: now },
        OR: [
          { effective_until: null },
          { effective_until: { gt: now } },
        ],
      },
      orderBy: { effective_from: 'desc' },
    });

    return rate ? rate.rate : new Decimal(0);
  }

  /**
   * Create commission snapshot for a transaction
   */
  async createSnapshot(
    transactionId: string,
    commission: CommissionCalculation,
    tx: any
  ) {
    const snapshot = await tx.commissionSnapshot.create({
      data: {
        transaction_id: transactionId,
        site_commission_rate: commission.site_commission_rate,
        site_commission_amount: commission.site_commission_amount,
        partner_commission_rate: commission.partner_commissions.length > 0
          ? commission.partner_commissions.reduce((sum, pc) => sum.add(pc.rate), new Decimal(0))
          : null,
        partner_commission_amount: commission.partner_commissions.length > 0
          ? commission.partner_commissions.reduce((sum, pc) => sum.add(pc.amount), new Decimal(0))
          : null,
        financier_commission_rate: commission.financier_commission_rate.isZero()
          ? null
          : commission.financier_commission_rate,
        financier_commission_amount: commission.financier_commission_amount.isZero()
          ? null
          : commission.financier_commission_amount,
        organization_amount: commission.organization_amount,
      },
    });

    return snapshot;
  }
}

export const commissionService = new CommissionService();
