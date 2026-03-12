import { Prisma, TransactionType, TransactionStatus, EntityType, LedgerEntryType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { logger } from '../../shared/utils/logger.js';
import { notificationService } from '../notification/notification.service.js';
import { auditLogService } from '../../shared/audit-log.js';
import { commissionService } from '../transaction/commission.service.js';
import { ledgerService, LedgerEntryData } from '../ledger/ledger.service.js';

export class ApprovalService {
  /**
   * Check if transaction requires approval based on CEO's rules:
   * - DEPOSIT and WITHDRAWAL: NO approval needed
   * - All other types: YES approval needed
   * - ADMIN role: NO approval needed (can do everything)
   */
  requiresApproval(type: TransactionType, userRole: string): boolean {
    if (userRole === 'ADMIN') return false;
    if (type === 'DEPOSIT' || type === 'WITHDRAWAL') return false;
    return true;
  }

  /**
   * Get all pending transactions
   */
  async getPendingTransactions() {
    return prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        deleted_at: null,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true, code: true } },
        financier: { select: { id: true, name: true, code: true } },
        external_party: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        delivery_type: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Approve a pending transaction — builds ledger entries based on tx type
   */
  async approveTransaction(transactionId: string, reviewerId: string, reviewNote?: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        site: { include: { account: true } },
        partner: { include: { account: true } },
        financier: { include: { account: true } },
        external_party: { include: { account: true } },
        delivery_type: true,
      },
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'PENDING') {
      throw new Error(`Transaction is not pending (current status: ${transaction.status})`);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update status to COMPLETED
        const updated = await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'COMPLETED' },
        });

        // 2. Build and create ledger entries based on transaction type
        await this.createLedgerForTransaction(transaction, tx);

        return updated;
      });

      // 3. Audit log
      await auditLogService.log({
        action: 'APPROVE_TRANSACTION',
        entityType: 'Transaction',
        entityId: transactionId,
        userId: reviewerId,
        oldData: { status: 'PENDING' },
        newData: { status: 'COMPLETED', reviewNote },
      });

      // 4. Notify requester
      const requester = await prisma.user.findUnique({ where: { id: transaction.created_by } });
      if (requester) {
        await notificationService.createNotification({
          userId: requester.id,
          type: 'TRANSACTION_APPROVED',
          title: 'İşlem Onaylandı',
          message: `${transaction.type} işleminiz onaylandı. Tutar: ${transaction.gross_amount} TL`,
          entityType: 'Transaction',
          entityId: transactionId,
          actionUrl: `/transactions`,
          actionText: 'İşlemi Gör',
          priority: 'NORMAL',
        });
      }

      logger.info({ transactionId, reviewerId }, 'Transaction approved');
      return result;
    } catch (error) {
      logger.error({ transactionId, error }, 'Failed to approve transaction');
      throw error;
    }
  }

  /**
   * Create appropriate ledger entries for a transaction based on its type.
   * This mirrors the logic in transaction.service.ts process* methods.
   */
  private async createLedgerForTransaction(transaction: any, tx: Prisma.TransactionClient) {
    const amount = new Decimal(transaction.gross_amount);
    const entries: LedgerEntryData[] = [];

    switch (transaction.type) {
      case 'DEPOSIT': {
        const commission = await commissionService.calculateDepositCommission(
          transaction.site_id, transaction.financier_id, amount
        );
        const financierNet = amount.minus(commission.financier_commission_amount).toDecimalPlaces(2);
        const siteNet = amount.minus(commission.site_commission_amount).toDecimalPlaces(2);

        await commissionService.createSnapshot(transaction.id, commission, tx);

        entries.push({
          account_id: transaction.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.DEBIT,
          amount: financierNet,
          description: `Yatırım alındı: ${transaction.site?.name} (Net: ${financierNet})`,
        });
        entries.push({
          account_id: transaction.site_id,
          account_type: EntityType.SITE,
          account_name: transaction.site?.name || 'Site',
          entry_type: LedgerEntryType.CREDIT,
          amount: siteNet,
          description: `Site bakiyesi: ${siteNet}`,
        });
        for (const pc of commission.partner_commissions) {
          entries.push({
            account_id: pc.partner_id,
            account_type: EntityType.PARTNER,
            account_name: pc.partner_name,
            entry_type: LedgerEntryType.CREDIT,
            amount: pc.amount,
            description: `Partner komisyonu: ${transaction.site?.name}`,
          });
        }
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);
        entries.push({
          account_id: orgAccount.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.CREDIT,
          amount: commission.organization_amount,
          description: `Organizasyon geliri: ${transaction.site?.name}`,
        });
        break;
      }

      case 'WITHDRAWAL': {
        const commission = await commissionService.calculateWithdrawalCommission(
          transaction.site_id, transaction.financier_id, amount
        );
        const siteTotalPay = amount.plus(commission.site_commission_amount).toDecimalPlaces(2);

        await commissionService.createSnapshot(transaction.id, commission, tx);

        entries.push({
          account_id: transaction.site_id,
          account_type: EntityType.SITE,
          account_name: transaction.site?.name || 'Site',
          entry_type: LedgerEntryType.DEBIT,
          amount: siteTotalPay,
          description: `Çekim işlemi: ${amount} + ${commission.site_commission_amount} kom`,
        });
        entries.push({
          account_id: transaction.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount: amount,
          description: `Müşteriye ödeme: ${transaction.site?.name}`,
        });
        const orgAccount2 = await this.getOrCreateOrganizationAccount(tx);
        entries.push({
          account_id: orgAccount2.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.CREDIT,
          amount: commission.site_commission_amount,
          description: `Çekim komisyonu: ${transaction.site?.name}`,
        });
        break;
      }

      case 'ORG_EXPENSE': {
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);
        entries.push({
          account_id: orgAccount.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: transaction.description || 'Organizasyon gideri',
        });
        entries.push({
          account_id: transaction.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Org gideri: ${transaction.description || 'Gider'}`,
        });
        break;
      }

      case 'ORG_INCOME': {
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);
        entries.push({
          account_id: transaction.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: `Org geliri: ${transaction.description || 'Gelir'}`,
        });
        entries.push({
          account_id: orgAccount.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: transaction.description || 'Organizasyon geliri',
        });
        break;
      }

      case 'ORG_WITHDRAW': {
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);
        entries.push({
          account_id: orgAccount.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: transaction.description || 'Hak ediş çekimi',
        });
        entries.push({
          account_id: transaction.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: 'Organizasyon hak ediş çekimi',
        });
        break;
      }

      case 'PAYMENT': {
        const sourceType = transaction.source_type as EntityType;
        const sourceId = transaction.source_id;
        let sourceName = 'Bilinmeyen';
        
        if (sourceType === EntityType.SITE && transaction.site) sourceName = transaction.site.name;
        else if (sourceType === EntityType.PARTNER && transaction.partner) sourceName = transaction.partner.name;
        else if (sourceType === EntityType.EXTERNAL_PARTY && transaction.external_party) sourceName = transaction.external_party.name;
        else if (sourceType === EntityType.ORGANIZATION) sourceName = 'Organizasyon';

        const actualSourceId = sourceType === EntityType.ORGANIZATION 
          ? (await this.getOrCreateOrganizationAccount(tx)).entity_id
          : sourceId;

        entries.push({
          account_id: actualSourceId!,
          account_type: sourceType,
          account_name: sourceName,
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: `Ödeme: ${transaction.description || 'Ödeme işlemi'}`,
        });
        entries.push({
          account_id: transaction.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Ödeme: ${sourceName} adına`,
        });
        break;
      }

      case 'TOP_UP': {
        entries.push({
          account_id: transaction.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: `Takviye alındı`,
        });

        const topupSourceType = transaction.topup_source_type as EntityType | null;
        if (topupSourceType === EntityType.PARTNER && transaction.partner) {
          entries.push({
            account_id: transaction.partner_id!,
            account_type: EntityType.PARTNER,
            account_name: transaction.partner.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: 'Takviye: Açık kapatma',
          });
        } else if (topupSourceType === EntityType.ORGANIZATION) {
          const orgAccount = await this.getOrCreateOrganizationAccount(tx);
          entries.push({
            account_id: orgAccount.entity_id,
            account_type: EntityType.ORGANIZATION,
            account_name: 'Organizasyon',
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: 'Takviye: Org sermaye',
          });
        } else {
          const orgAccount = await this.getOrCreateOrganizationAccount(tx);
          entries.push({
            account_id: orgAccount.entity_id,
            account_type: EntityType.ORGANIZATION,
            account_name: 'Organizasyon',
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: 'Takviye: Dış kaynak',
          });
        }
        break;
      }

      case 'DELIVERY': {
        const commRate = transaction.delivery_commission_rate ? new Decimal(transaction.delivery_commission_rate) : new Decimal(0);
        const commAmount = transaction.delivery_commission_amount ? new Decimal(transaction.delivery_commission_amount) : amount.times(commRate);
        const netAmount = amount.minus(commAmount);
        const partnerAmount = transaction.delivery_partner_amount ? new Decimal(transaction.delivery_partner_amount) : new Decimal(0);
        const orgCommission = commAmount.minus(partnerAmount);

        entries.push({
          account_id: transaction.site_id!,
          account_type: EntityType.SITE,
          account_name: transaction.site?.name || 'Site',
          entry_type: LedgerEntryType.DEBIT,
          amount: netAmount,
          description: `Teslimat: ${transaction.delivery_type?.name || 'Teslim'} - Net tutar`,
        });

        if (orgCommission.gt(0)) {
          const orgAccount = await this.getOrCreateOrganizationAccount(tx);
          entries.push({
            account_id: orgAccount.entity_id,
            account_type: EntityType.ORGANIZATION,
            account_name: 'Organizasyon',
            entry_type: LedgerEntryType.DEBIT,
            amount: orgCommission,
            description: `Teslimat komisyonu: ${transaction.site?.name}`,
          });
        }

        if (transaction.partner_id && partnerAmount.gt(0)) {
          entries.push({
            account_id: transaction.partner_id,
            account_type: EntityType.PARTNER,
            account_name: transaction.partner?.name || 'Partner',
            entry_type: LedgerEntryType.CREDIT,
            amount: partnerAmount,
            description: `Teslimat komisyonu: ${transaction.site?.name}`,
          });
        }

        entries.push({
          account_id: transaction.financier_id!,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Teslimat: ${transaction.site?.name} - ${transaction.delivery_type?.name || 'Teslim'}`,
        });
        break;
      }

      case 'FINANCIER_TRANSFER': {
        // Source financier is in financier_id, target is in description
        // For pending transfers we need to find the target from the original creation context
        // The description format: "Transfer: SourceName → TargetName"
        entries.push({
          account_id: transaction.financier_id!,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Transfer çıkış`,
        });
        // For now, financier_transfer pending approval needs a target
        // This is handled by finding the original transaction data
        // TODO: Store to_financier_id on transaction record
        logger.warn({ transactionId: transaction.id }, 'Financier transfer approval — target financier not tracked separately');
        break;
      }

      case 'EXTERNAL_DEBT_IN': {
        entries.push({
          account_id: transaction.financier_id!,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: `Borç alındı: ${transaction.external_party?.name}`,
        });
        entries.push({
          account_id: transaction.external_party_id!,
          account_type: EntityType.EXTERNAL_PARTY,
          account_name: transaction.external_party?.name || 'Dış Kişi',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Borç verildi: ${transaction.financier?.name}`,
        });
        break;
      }

      case 'EXTERNAL_DEBT_OUT': {
        entries.push({
          account_id: transaction.financier_id!,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Borç verildi: ${transaction.external_party?.name}`,
        });
        entries.push({
          account_id: transaction.external_party_id!,
          account_type: EntityType.EXTERNAL_PARTY,
          account_name: transaction.external_party?.name || 'Dış Kişi',
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: `Borç alındı: ${transaction.financier?.name}`,
        });
        break;
      }

      case 'EXTERNAL_PAYMENT': {
        entries.push({
          account_id: transaction.external_party_id!,
          account_type: EntityType.EXTERNAL_PARTY,
          account_name: transaction.external_party?.name || 'Dış Kişi',
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: 'Ödeme alındı',
        });
        entries.push({
          account_id: transaction.financier_id!,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Dış kişi ödemesi: ${transaction.external_party?.name}`,
        });
        break;
      }

      case 'PARTNER_PAYMENT': {
        entries.push({
          account_id: transaction.partner_id!,
          account_type: EntityType.PARTNER,
          account_name: transaction.partner?.name || 'Partner',
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: 'Komisyon ödemesi',
        });
        entries.push({
          account_id: transaction.financier_id!,
          account_type: EntityType.FINANCIER,
          account_name: transaction.financier?.name || 'Finansör',
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Partner ödemesi: ${transaction.partner?.name}`,
        });
        break;
      }

      // SITE_DELIVERY handled same as old delivery pattern
      default: {
        // For any unhandled type, create simple financier debit/credit
        logger.warn({ type: transaction.type }, 'Unhandled transaction type in approval ledger creation');
        return; // Don't create entries for unknown types
      }
    }

    if (entries.length > 0) {
      await ledgerService.createEntries(transaction.id, entries, tx);
    }
  }

  /**
   * Reject a pending transaction
   */
  async rejectTransaction(transactionId: string, reviewerId: string, rejectionReason: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'PENDING') {
      throw new Error(`Transaction is not pending (current status: ${transaction.status})`);
    }
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        reversal_reason: rejectionReason,
      },
    });

    await auditLogService.log({
      action: 'REJECT_TRANSACTION',
      entityType: 'Transaction',
      entityId: transactionId,
      userId: reviewerId,
      oldData: { status: 'PENDING' },
      newData: { status: 'FAILED', rejectionReason },
    });

    const requester = await prisma.user.findUnique({ where: { id: transaction.created_by } });
    if (requester) {
      await notificationService.createNotification({
        userId: requester.id,
        type: 'TRANSACTION_REJECTED',
        title: 'İşlem Reddedildi',
        message: `${transaction.type} işleminiz reddedildi. Sebep: ${rejectionReason}`,
        entityType: 'Transaction',
        entityId: transactionId,
        actionUrl: `/transactions`,
        actionText: 'İşlemi Gör',
        priority: 'HIGH',
      });
    }

    logger.info({ transactionId, reviewerId, rejectionReason }, 'Transaction rejected');
    return updatedTransaction;
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      prisma.transaction.count({
        where: { status: 'PENDING', deleted_at: null },
      }),
      prisma.transaction.count({
        where: {
          status: 'COMPLETED',
          created_at: { lt: new Date() },
          updated_at: { gte: todayStart },
        },
      }),
      prisma.transaction.count({
        where: {
          status: 'FAILED',
          updated_at: { gte: todayStart },
        },
      }),
      prisma.transaction.count({ where: { deleted_at: null } }),
    ]);

    return { pendingCount, approvedCount, rejectedCount, totalCount };
  }

  private async getOrCreateOrganizationAccount(tx: Prisma.TransactionClient) {
    const ORG_ENTITY_ID = 'org-main-account';
    let account = await tx.account.findUnique({ where: { entity_id: ORG_ENTITY_ID } });
    if (!account) {
      account = await tx.account.create({
        data: {
          entity_type: EntityType.ORGANIZATION,
          entity_id: ORG_ENTITY_ID,
          balance: 0,
          blocked_amount: 0,
          credit_limit: 0,
        },
      });
    }
    return account;
  }
}

export const approvalService = new ApprovalService();
