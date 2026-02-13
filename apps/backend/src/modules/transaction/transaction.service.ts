import { Prisma, TransactionType, TransactionStatus, EntityType, LedgerEntryType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, BusinessError, InsufficientBalanceError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import { ledgerService, LedgerEntryData } from '../ledger/ledger.service.js';
import { commissionService } from './commission.service.js';
import { approvalService } from '../approval/approval.service.js';
import { notificationService } from '../notification/notification.service.js';
import type {
  CreateDepositInput,
  CreateWithdrawalInput,
  CreateSiteDeliveryInput,
  CreatePartnerPaymentInput,
  CreateFinancierTransferInput,
  CreateExternalDebtInput,
  CreateExternalPaymentInput,
  CreateOrgExpenseInput,
  CreateOrgIncomeInput,
  CreateOrgWithdrawInput,
  CreatePaymentInput,
  CreateTopUpInput,
  CreateDeliveryInput,
  TransactionQueryInput,
  ReverseTransactionInput,
  EditTransactionInput,
} from './transaction.schema.js';

export class TransactionService {
  /**
   * Process a DEPOSIT transaction
   *
   * Money flow:
   * - Customer deposits money to site
   * - Financier receives physical money (minus their commission)
   * - Site owes money (negative balance increase)
   * - Partners get their commission share
   * - Organization gets remaining commission
   *
   * Ledger entries:
   * DEBIT:  Financier (net amount = gross - financier commission)
   * CREDIT: Site (net amount = gross - site commission)
   * CREDIT: Partners (their commission share)
   * CREDIT: Organization (remaining commission)
   */
  async processDeposit(input: CreateDepositInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    // Validate site exists
    const site = await prisma.site.findUnique({
      where: { id: input.site_id, deleted_at: null },
      include: { account: true },
    });
    if (!site) throw new NotFoundError('Site', input.site_id);

    // Validate financier exists and has available balance
    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Financier', input.financier_id);

    // Calculate commissions
    const commission = await commissionService.calculateDepositCommission(
      input.site_id,
      input.financier_id,
      amount
    );

    // Net amount to financier (after their commission deduction)
    // toDecimalPlaces(2) ensures consistency with DB Decimal(15,2) columns
    const financierNetAmount = amount.minus(commission.financier_commission_amount).toDecimalPlaces(2);

    // Net amount for site (after site commission deduction)
    const siteNetAmount = amount.minus(commission.site_commission_amount).toDecimalPlaces(2);

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.DEPOSIT, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.DEPOSIT,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: siteNetAmount,
          site_id: input.site_id,
          financier_id: input.financier_id,
          description: input.description,
          reference_id: input.reference_id,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        // Create commission snapshot
        await commissionService.createSnapshot(transaction.id, commission, tx);

        // Build ledger entries
        const entries: LedgerEntryData[] = [];

        // DEPOSIT Ledger Entries:
        //
        // Physical reality:
        // - Customer deposits money to site
        // - Money goes to Financier's bank account
        // - Financier IMMEDIATELY CUTS their commission - THIS NEVER ENTERS OUR BOOKS
        // - We only account for the net amount (gross - financier commission)
        //
        // Commission breakdown (from site commission pool):
        // - Site gets: gross - site_commission (net amount)
        // - Partner gets: their commission share (from gross)
        // - Financier gets: their commission (ALREADY CUT - not in our accounting)
        // - Organization gets: site_commission - partner - financier (our profit)
        //
        // Ledger entries (double-entry accounting):
        // DEBIT: Financier = gross - financier_commission (money held by financier - ASSET)
        // CREDIT: Site = gross - site_commission (we owe site - LIABILITY)
        // CREDIT: Partner = partner_commission (we owe partner - LIABILITY)
        // CREDIT: Organization = org_amount (our profit - ASSET/REVENUE)
        //
        // Balance check:
        // DEBIT = gross - financier_commission
        // CREDIT = (gross - site_commission) + partner_commission + org_amount
        //        = (gross - site_commission) + partner_commission + (site_commission - partner_commission - financier_commission)
        //        = gross - financier_commission ✓ BALANCED!

        // 1. DEBIT: Financier receives net amount (after their commission is already cut)
        // Uses calculated commission from commission service, NOT hardcoded rate
        entries.push({
          account_id: input.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: financier.name,
          entry_type: LedgerEntryType.DEBIT,
          amount: financierNetAmount, // gross - financier_commission (from commission service)
          description: `Yatırım alındı: ${site.name} (Net: ${financierNetAmount})`,
        });

        // 2. CREDIT: Site liability increases (money we owe to site/customers)
        entries.push({
          account_id: input.site_id,
          account_type: EntityType.SITE,
          account_name: site.name,
          entry_type: LedgerEntryType.CREDIT,
          amount: siteNetAmount, // 94 TL (100 - 6 commission)
          description: `Site bakiyesi: ${siteNetAmount}`,
        });

        // 3. CREDIT: Partner commission (we owe them)
        for (const pc of commission.partner_commissions) {
          entries.push({
            account_id: pc.partner_id,
            account_type: EntityType.PARTNER,
            account_name: pc.partner_name,
            entry_type: LedgerEntryType.CREDIT,
            amount: pc.amount, // 1.5 TL
            description: `Partner komisyonu: ${site.name}`,
          });
        }

        // 4. CREDIT: Organization profit (our revenue)
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);
        entries.push({
          account_id: orgAccount.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.CREDIT,
          amount: commission.organization_amount, // 2 TL (our profit)
          description: `Organizasyon geliri: ${site.name}`,
        });

        // NOTE: Financier's 2.5 TL commission is NOT recorded because they already cut it
        // before the money entered our accounting system. We never see that 2.5 TL.

        // Create ledger entries (this validates Debit = Credit)
        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Yatırım Onay Bekliyor',
          message: `${site.name} sitesine ${amount} TL yatırım onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'CREATE_TRANSACTION',
          entity_type: 'Transaction',
          entity_id: transaction.id,
          new_data: {
            type: 'DEPOSIT',
            amount: amount.toString(),
            site: site.name,
            financier: financier.name,
          } as unknown as Prisma.JsonObject,
          user_id: createdBy,
          user_email: '',
        },
      });

      logger.info(
        {
          transactionId: transaction.id,
          type: 'DEPOSIT',
          amount: amount.toString(),
          siteId: input.site_id,
          financierId: input.financier_id,
        },
        'Deposit processed'
      );

      return transaction;
    });
  }

  /**
   * Process a WITHDRAWAL transaction
   *
   * Money flow:
   * - Customer withdraws money from site
   * - Site pays (balance decreases/becomes more negative)
   * - Financier pays out money
   * - Organization gets the commission
   */
  async processWithdrawal(input: CreateWithdrawalInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    // Validate site
    const site = await prisma.site.findUnique({
      where: { id: input.site_id, deleted_at: null },
      include: { account: true },
    });
    if (!site) throw new NotFoundError('Site', input.site_id);

    // Validate financier and check available balance
    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Financier', input.financier_id);

    // Check financier has enough available balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Calculate commission
    const commission = await commissionService.calculateWithdrawalCommission(
      input.site_id,
      input.financier_id,
      amount
    );

    // Site pays amount + commission
    const siteTotalPay = amount.plus(commission.site_commission_amount).toDecimalPlaces(2);

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.WITHDRAWAL, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.WITHDRAWAL,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          site_id: input.site_id,
          financier_id: input.financier_id,
          description: input.description,
          reference_id: input.reference_id,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        await commissionService.createSnapshot(transaction.id, commission, tx);

        const entries: LedgerEntryData[] = [];

        // WITHDRAWAL Ledger Entries:
        // Site pays 50K + 1.5K commission = 51.5K total
        // Financier pays out 50K to customer
        // Organization earns 1.5K commission

        // 1. DEBIT: Site liability decreases (site owes less)
        entries.push({
          account_id: input.site_id,
          account_type: EntityType.SITE,
          account_name: site.name,
          entry_type: LedgerEntryType.DEBIT,
          amount: siteTotalPay,
          description: `Çekim işlemi: ${amount} + ${commission.site_commission_amount} kom`,
        });

        // 2. CREDIT: Financier pays out cash to customer
        entries.push({
          account_id: input.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: financier.name,
          entry_type: LedgerEntryType.CREDIT,
          amount: amount,
          description: `Müşteriye ödeme: ${site.name}`,
        });

        // 3. CREDIT: Organization earns commission
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);
        entries.push({
          account_id: orgAccount.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.CREDIT,
          amount: commission.site_commission_amount,
          description: `Çekim komisyonu: ${site.name}`,
        });

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Çekim Onay Bekliyor',
          message: `${site.name} sitesinden ${amount} TL çekim onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'CREATE_TRANSACTION',
          entity_type: 'Transaction',
          entity_id: transaction.id,
          new_data: {
            type: 'WITHDRAWAL',
            amount: amount.toString(),
            site: site.name,
          } as unknown as Prisma.JsonObject,
          user_id: createdBy,
          user_email: '',
        },
      });

      logger.info(
        { transactionId: transaction.id, type: 'WITHDRAWAL', amount: amount.toString() },
        'Withdrawal processed'
      );

      return transaction;
    });
  }

  /**
   * Process SITE_DELIVERY - Cash delivery to site
   * Site's debt decreases, Financier's balance decreases
   */
  async processSiteDelivery(input: CreateSiteDeliveryInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    const site = await prisma.site.findUnique({
      where: { id: input.site_id, deleted_at: null },
      include: { account: true },
    });
    if (!site) throw new NotFoundError('Site', input.site_id);

    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Financier', input.financier_id);

    // Check available balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.SITE_DELIVERY, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.SITE_DELIVERY,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          site_id: input.site_id,
          financier_id: input.financier_id,
          delivery_type_id: input.delivery_type_id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [
          // DEBIT: Site debt decreases (they receive money)
          {
            account_id: input.site_id,
            account_type: EntityType.SITE,
            account_name: site.name,
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: `Kasa teslimi: ${financier.name}'dan`,
          },
          // CREDIT: Financier pays out
          {
            account_id: input.financier_id,
            account_type: EntityType.FINANCIER,
            account_name: financier.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Kasa teslimi: ${site.name}'a`,
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Kasa Teslimi Onay Bekliyor',
          message: `${site.name} sitesine ${amount} TL kasa teslimi onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        { transactionId: transaction.id, type: 'SITE_DELIVERY', amount: amount.toString() },
        'Site delivery processed'
      );

      return transaction;
    });
  }

  /**
   * Process PARTNER_PAYMENT - Pay commission to partner
   */
  async processPartnerPayment(input: CreatePartnerPaymentInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    const partner = await prisma.partner.findUnique({
      where: { id: input.partner_id, deleted_at: null },
      include: { account: true },
    });
    if (!partner) throw new NotFoundError('Partner', input.partner_id);

    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Financier', input.financier_id);

    // Check available balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.PARTNER_PAYMENT, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.PARTNER_PAYMENT,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          partner_id: input.partner_id,
          financier_id: input.financier_id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [
          // DEBIT: Partner balance decreases (they receive cash)
          {
            account_id: input.partner_id,
            account_type: EntityType.PARTNER,
            account_name: partner.name,
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: `Komisyon ödemesi`,
          },
          // CREDIT: Financier pays out
          {
            account_id: input.financier_id,
            account_type: EntityType.FINANCIER,
            account_name: financier.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Partner ödemesi: ${partner.name}`,
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Partner Ödemesi Onay Bekliyor',
          message: `${partner.name} partner'e ${amount} TL komisyon ödemesi onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        { transactionId: transaction.id, type: 'PARTNER_PAYMENT', amount: amount.toString() },
        'Partner payment processed'
      );

      return transaction;
    });
  }

  /**
   * Process FINANCIER_TRANSFER - Transfer between financiers
   * Money moves from one financier to another
   */
  async processFinancierTransfer(input: CreateFinancierTransferInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    if (input.from_financier_id === input.to_financier_id) {
      throw new BusinessError('Kaynak ve hedef finansör aynı olamaz', 'SAME_FINANCIER');
    }

    // Validate source financier
    const fromFinancier = await prisma.financier.findUnique({
      where: { id: input.from_financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!fromFinancier) throw new NotFoundError('Kaynak Finansör', input.from_financier_id);

    // Validate target financier
    const toFinancier = await prisma.financier.findUnique({
      where: { id: input.to_financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!toFinancier) throw new NotFoundError('Hedef Finansör', input.to_financier_id);

    // Check source has enough available balance
    const availableBalance = new Decimal(fromFinancier.account!.balance).minus(fromFinancier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.FINANCIER_TRANSFER, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.FINANCIER_TRANSFER,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.from_financier_id, // Primary financier (source)
          description: input.description || `Transfer: ${fromFinancier.name} → ${toFinancier.name}`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [
          // CREDIT: Source financier sends money (balance decreases)
          {
            account_id: input.from_financier_id,
            account_type: EntityType.FINANCIER,
            account_name: fromFinancier.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Transfer çıkış: ${toFinancier.name}'a`,
          },
          // DEBIT: Target financier receives money (balance increases)
          {
            account_id: input.to_financier_id,
            account_type: EntityType.FINANCIER,
            account_name: toFinancier.name,
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: `Transfer giriş: ${fromFinancier.name}'dan`,
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Finansör Transferi Onay Bekliyor',
          message: `${fromFinancier.name}'dan ${toFinancier.name}'a ${amount} TL transfer onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'CREATE_TRANSACTION',
          entity_type: 'Transaction',
          entity_id: transaction.id,
          new_data: {
            type: 'FINANCIER_TRANSFER',
            amount: amount.toString(),
            from: fromFinancier.name,
            to: toFinancier.name,
          } as unknown as Prisma.JsonObject,
          user_id: createdBy,
          user_email: '',
        },
      });

      logger.info(
        { transactionId: transaction.id, type: 'FINANCIER_TRANSFER', amount: amount.toString() },
        'Financier transfer processed'
      );

      return transaction;
    });
  }

  /**
   * Process EXTERNAL_DEBT_IN - Borrow money from external party
   * External party gives us money, they become our creditor
   */
  async processExternalDebtIn(input: Omit<CreateExternalDebtInput, 'direction'>, createdBy: string) {
    const amount = new Decimal(input.amount);

    const externalParty = await prisma.externalParty.findUnique({
      where: { id: input.external_party_id, deleted_at: null },
      include: { account: true },
    });
    if (!externalParty) throw new NotFoundError('Dış Kişi', input.external_party_id);

    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.EXTERNAL_DEBT_IN, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.EXTERNAL_DEBT_IN,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          external_party_id: input.external_party_id,
          financier_id: input.financier_id,
          description: input.description || `Borç alındı: ${externalParty.name}'dan`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [
          // DEBIT: Financier receives money
          {
            account_id: input.financier_id,
            account_type: EntityType.FINANCIER,
            account_name: financier.name,
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: `Borç alındı: ${externalParty.name}'dan`,
          },
          // CREDIT: External party is owed money (our liability increases)
          {
            account_id: input.external_party_id,
            account_type: EntityType.EXTERNAL_PARTY,
            account_name: externalParty.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Borç verildi: Finansör ${financier.name}'a`,
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Dış Borç Girişi Onay Bekliyor',
          message: `${externalParty.name}'dan ${amount} TL borç alınması onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        { transactionId: transaction.id, type: 'EXTERNAL_DEBT_IN', amount: amount.toString() },
        'External debt in processed'
      );

      return transaction;
    });
  }

  /**
   * Process EXTERNAL_DEBT_OUT - Lend money to external party
   * We give money to external party, they become our debtor
   */
  async processExternalDebtOut(input: Omit<CreateExternalDebtInput, 'direction'>, createdBy: string) {
    const amount = new Decimal(input.amount);

    const externalParty = await prisma.externalParty.findUnique({
      where: { id: input.external_party_id, deleted_at: null },
      include: { account: true },
    });
    if (!externalParty) throw new NotFoundError('Dış Kişi', input.external_party_id);

    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Check financier has enough balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.EXTERNAL_DEBT_OUT, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.EXTERNAL_DEBT_OUT,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          external_party_id: input.external_party_id,
          financier_id: input.financier_id,
          description: input.description || `Borç verildi: ${externalParty.name}'a`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [
          // CREDIT: Financier sends money
          {
            account_id: input.financier_id,
            account_type: EntityType.FINANCIER,
            account_name: financier.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Borç verildi: ${externalParty.name}'a`,
          },
          // DEBIT: External party owes us money (our receivable increases)
          {
            account_id: input.external_party_id,
            account_type: EntityType.EXTERNAL_PARTY,
            account_name: externalParty.name,
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: `Borç alındı: Finansör ${financier.name}'dan`,
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Dış Borç Çıkışı Onay Bekliyor',
          message: `${externalParty.name}'a ${amount} TL borç verilmesi onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        { transactionId: transaction.id, type: 'EXTERNAL_DEBT_OUT', amount: amount.toString() },
        'External debt out processed'
      );

      return transaction;
    });
  }

  /**
   * Process EXTERNAL_PAYMENT - Pay to external party (settle debt)
   * We pay our debt to external party
   */
  async processExternalPayment(input: CreateExternalPaymentInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    const externalParty = await prisma.externalParty.findUnique({
      where: { id: input.external_party_id, deleted_at: null },
      include: { account: true },
    });
    if (!externalParty) throw new NotFoundError('Dış Kişi', input.external_party_id);

    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Check financier has enough balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.EXTERNAL_PAYMENT, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.EXTERNAL_PAYMENT,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          external_party_id: input.external_party_id,
          financier_id: input.financier_id,
          description: input.description || `Ödeme: ${externalParty.name}'a`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [
          // DEBIT: External party receives money (our liability decreases)
          {
            account_id: input.external_party_id,
            account_type: EntityType.EXTERNAL_PARTY,
            account_name: externalParty.name,
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: `Ödeme alındı`,
          },
          // CREDIT: Financier pays money
          {
            account_id: input.financier_id,
            account_type: EntityType.FINANCIER,
            account_name: financier.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Dış kişi ödemesi: ${externalParty.name}'a`,
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Dış Ödeme Onay Bekliyor',
          message: `${externalParty.name}'a ${amount} TL ödeme onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        { transactionId: transaction.id, type: 'EXTERNAL_PAYMENT', amount: amount.toString() },
        'External payment processed'
      );

      return transaction;
    });
  }

  /**
   * Process ORG_EXPENSE - Organization expense
   * Organization spends money from financier
   */
  async processOrgExpense(input: CreateOrgExpenseInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Check financier has enough balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.ORG_EXPENSE, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.ORG_EXPENSE,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.financier_id,
          category_id: input.category_id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);

        const entries: LedgerEntryData[] = [
          // DEBIT: Organization spends (balance decreases)
          {
            account_id: orgAccount.entity_id,
            account_type: EntityType.ORGANIZATION,
            account_name: 'Organizasyon',
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: input.description || 'Organizasyon gideri',
          },
          // CREDIT: Financier pays
          {
            account_id: input.financier_id,
            account_type: EntityType.FINANCIER,
            account_name: financier.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Org gideri: ${input.description || 'Gider'}`,
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Organizasyon Gideri Onay Bekliyor',
          message: `${amount} TL organizasyon gideri onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        { transactionId: transaction.id, type: 'ORG_EXPENSE', amount: amount.toString() },
        'Organization expense processed'
      );

      return transaction;
    });
  }

  /**
   * Process ORG_INCOME - Organization income (non-commission)
   * Organization receives extra income
   */
  async processOrgIncome(input: CreateOrgIncomeInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.ORG_INCOME, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.ORG_INCOME,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.financier_id,
          category_id: input.category_id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);

        const entries: LedgerEntryData[] = [
          // DEBIT: Financier receives money
          {
            account_id: input.financier_id,
            account_type: EntityType.FINANCIER,
            account_name: financier.name,
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: `Org geliri: ${input.description || 'Gelir'}`,
          },
          // CREDIT: Organization earns (balance increases)
          {
            account_id: orgAccount.entity_id,
            account_type: EntityType.ORGANIZATION,
            account_name: 'Organizasyon',
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: input.description || 'Organizasyon geliri',
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Organizasyon Geliri Onay Bekliyor',
          message: `${amount} TL organizasyon geliri onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        { transactionId: transaction.id, type: 'ORG_INCOME', amount: amount.toString() },
        'Organization income processed'
      );

      return transaction;
    });
  }

  /**
   * Process ORG_WITHDRAW - Organization owner withdraws profit
   */
  async processOrgWithdraw(input: CreateOrgWithdrawInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Check financier has enough balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.ORG_WITHDRAW, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.ORG_WITHDRAW,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.financier_id,
          description: input.description || 'Hak ediş çekimi',
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const orgAccount = await this.getOrCreateOrganizationAccount(tx);

        const entries: LedgerEntryData[] = [
          // DEBIT: Organization balance decreases (owner takes profit)
          {
            account_id: orgAccount.entity_id,
            account_type: EntityType.ORGANIZATION,
            account_name: 'Organizasyon',
            entry_type: LedgerEntryType.DEBIT,
            amount,
            description: input.description || 'Hak ediş çekimi',
          },
          // CREDIT: Financier pays out
          {
            account_id: input.financier_id,
            account_type: EntityType.FINANCIER,
            account_name: financier.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: 'Organizasyon hak ediş çekimi',
          },
        ];

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Hak Ediş Çekimi Onay Bekliyor',
          message: `${amount} TL hak ediş çekimi onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        { transactionId: transaction.id, type: 'ORG_WITHDRAW', amount: amount.toString() },
        'Organization withdraw processed'
      );

      return transaction;
    });
  }

  // ==================== YENİ İŞLEM TİPLERİ ====================

  /**
   * Process PAYMENT - Herkese ödeme (KOMİSYONSUZ)
   *
   * Örnekler:
   * - Site adına maaş ödeme
   * - Partner'a komisyon ödeme
   * - Dış kişiye borç ödeme
   * - Org için gider
   *
   * Ledger:
   * DEBIT: Source bakiyesi azalır
   * CREDIT: Financier kasasından para çıkar
   */
  async processPayment(input: CreatePaymentInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    // Validate financier
    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Check available balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    // Get source entity info
    let sourceEntity: { id: string; name: string; type: EntityType } | null = null;

    if (input.source_type === 'SITE' && input.source_id) {
      const site = await prisma.site.findUnique({
        where: { id: input.source_id, deleted_at: null },
      });
      if (!site) throw new NotFoundError('Site', input.source_id);
      sourceEntity = { id: site.id, name: site.name, type: EntityType.SITE };
    } else if (input.source_type === 'PARTNER' && input.source_id) {
      const partner = await prisma.partner.findUnique({
        where: { id: input.source_id, deleted_at: null },
      });
      if (!partner) throw new NotFoundError('Partner', input.source_id);
      sourceEntity = { id: partner.id, name: partner.name, type: EntityType.PARTNER };
    } else if (input.source_type === 'EXTERNAL_PARTY' && input.source_id) {
      const external = await prisma.externalParty.findUnique({
        where: { id: input.source_id, deleted_at: null },
      });
      if (!external) throw new NotFoundError('Dış Kişi', input.source_id);
      sourceEntity = { id: external.id, name: external.name, type: EntityType.EXTERNAL_PARTY };
    } else if (input.source_type === 'ORGANIZATION') {
      const orgAccount = await this.getOrCreateOrganizationAccount(prisma as unknown as Prisma.TransactionClient);
      sourceEntity = { id: orgAccount.entity_id, name: 'Organizasyon', type: EntityType.ORGANIZATION };
    }

    if (!sourceEntity && input.source_type !== 'ORGANIZATION') {
      throw new BusinessError('Kaynak entity bulunamadı', 'SOURCE_NOT_FOUND');
    }

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.PAYMENT, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.PAYMENT,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.financier_id,
          site_id: input.source_type === 'SITE' ? input.source_id : undefined,
          partner_id: input.source_type === 'PARTNER' ? input.source_id : undefined,
          external_party_id: input.source_type === 'EXTERNAL_PARTY' ? input.source_id : undefined,
          source_type: sourceEntity?.type,
          source_id: sourceEntity?.id,
          category_id: input.category_id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [];

        // DEBIT: Source bakiyesi azalır (onlar adına ödeme yaptık)
        entries.push({
          account_id: sourceEntity!.id,
          account_type: sourceEntity!.type,
          account_name: sourceEntity!.name,
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: `Ödeme: ${input.description || 'Ödeme işlemi'}`,
        });

        // CREDIT: Financier kasasından para çıkar
        entries.push({
          account_id: input.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: financier.name,
          entry_type: LedgerEntryType.CREDIT,
          amount,
          description: `Ödeme: ${sourceEntity!.name} adına`,
        });

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Ödeme Onay Bekliyor',
          message: `${sourceEntity!.name} adına ${amount} TL ödeme onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        {
          transactionId: transaction.id,
          type: 'PAYMENT',
          amount: amount.toString(),
          sourceType: input.source_type,
        },
        'Payment processed'
      );

      return transaction;
    });
  }

  /**
   * Process TOP_UP - Kasaya para girişi (Takviye)
   *
   * Senaryolar:
   * - Partner açık kapatıyor (hakedişten fazla almıştı)
   * - Org kendi cebinden kasaya para koyuyor
   * - Dış kaynak (sistem dışı para)
   *
   * Ledger:
   * DEBIT: Financier kasasına para girer
   * CREDIT: Source bakiyesi değişir (açık kapanır)
   */
  async processTopUp(input: CreateTopUpInput, createdBy: string) {
    const amount = new Decimal(input.amount);

    // Validate financier
    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Get source entity info
    let sourceEntity: { id: string; name: string; type: EntityType } | null = null;

    if (input.source_type === 'PARTNER' && input.source_id) {
      const partner = await prisma.partner.findUnique({
        where: { id: input.source_id, deleted_at: null },
      });
      if (!partner) throw new NotFoundError('Partner', input.source_id);
      sourceEntity = { id: partner.id, name: partner.name, type: EntityType.PARTNER };
    } else if (input.source_type === 'ORGANIZATION') {
      const orgAccount = await this.getOrCreateOrganizationAccount(prisma as unknown as Prisma.TransactionClient);
      sourceEntity = { id: orgAccount.entity_id, name: 'Organizasyon', type: EntityType.ORGANIZATION };
    }
    // EXTERNAL için source yok, sadece kasaya para girer

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.TOP_UP, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.TOP_UP,
          status: transactionStatus,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.financier_id,
          partner_id: input.source_type === 'PARTNER' ? input.source_id : undefined,
          topup_source_type: sourceEntity?.type || EntityType.EXTERNAL_PARTY,
          topup_source_id: sourceEntity?.id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [];

        // DEBIT: Financier kasasına para girer
        entries.push({
          account_id: input.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: financier.name,
          entry_type: LedgerEntryType.DEBIT,
          amount,
          description: `Takviye: ${sourceEntity?.name || 'Dış kaynak'}`,
        });

        // CREDIT: Source bakiyesi değişir (açık kapanır)
        if (sourceEntity) {
          entries.push({
            account_id: sourceEntity.id,
            account_type: sourceEntity.type,
            account_name: sourceEntity.name,
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Takviye: Açık kapatma`,
          });
        } else {
          // Dış kaynak için Organization'a credit (gelir)
          const orgAccount = await this.getOrCreateOrganizationAccount(tx);
          entries.push({
            account_id: orgAccount.entity_id,
            account_type: EntityType.ORGANIZATION,
            account_name: 'Organizasyon',
            entry_type: LedgerEntryType.CREDIT,
            amount,
            description: `Takviye: Dış kaynak`,
          });
        }

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Takviye Onay Bekliyor',
          message: `${sourceEntity?.name || 'Dış kaynak'}'dan ${amount} TL takviye onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        {
          transactionId: transaction.id,
          type: 'TOP_UP',
          amount: amount.toString(),
          sourceType: input.source_type,
        },
        'Top-up processed'
      );

      return transaction;
    });
  }

  /**
   * Process DELIVERY - Site'ye para teslimi (KOMİSYONLU)
   *
   * Etki:
   * - Site bakiyesi AZALIR (net tutar)
   * - Partner bakiyesi ARTAR (varsa komisyon payı)
   * - Org bakiyesi ARTAR (komisyon geliri)
   * - Finansör kasası AZALIR (brüt tutar)
   *
   * Komisyon: Site + Tür (nakit/kripto/banka) bazlı + Partner payı (varsa)
   */
  async processDelivery(input: CreateDeliveryInput, createdBy: string) {
    const grossAmount = new Decimal(input.amount);

    // Validate site
    const site = await prisma.site.findUnique({
      where: { id: input.site_id, deleted_at: null },
      include: { account: true },
    });
    if (!site) throw new NotFoundError('Site', input.site_id);

    // Validate financier
    const financier = await prisma.financier.findUnique({
      where: { id: input.financier_id, deleted_at: null },
      include: { account: true },
    });
    if (!financier) throw new NotFoundError('Finansör', input.financier_id);

    // Check available balance
    const availableBalance = new Decimal(financier.account!.balance).minus(financier.account!.blocked_amount);
    if (availableBalance.lt(grossAmount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), grossAmount.toString());
    }

    // Validate delivery type
    const deliveryType = await prisma.deliveryType.findUnique({
      where: { id: input.delivery_type_id },
    });
    if (!deliveryType) throw new NotFoundError('Teslimat Türü', input.delivery_type_id);

    // Get delivery commission for this site + delivery type
    const deliveryCommission = await prisma.deliveryCommission.findUnique({
      where: {
        site_id_delivery_type_id: {
          site_id: input.site_id,
          delivery_type_id: input.delivery_type_id,
        },
      },
    });

    // Calculate commission
    const commissionRate = deliveryCommission ? new Decimal(deliveryCommission.rate) : new Decimal(0);
    const commissionAmount = grossAmount.times(commissionRate);
    const netAmount = grossAmount.minus(commissionAmount);

    // Calculate partner commission (if exists)
    let partnerCommissionRate = new Decimal(0);
    let partnerCommissionAmount = new Decimal(0);
    let partnerInfo: { id: string; name: string } | null = null;

    if (deliveryCommission?.partner_id && deliveryCommission?.partner_rate) {
      partnerCommissionRate = new Decimal(deliveryCommission.partner_rate);
      partnerCommissionAmount = grossAmount.times(partnerCommissionRate);

      const partner = await prisma.partner.findUnique({
        where: { id: deliveryCommission.partner_id },
      });
      if (partner) {
        partnerInfo = { id: partner.id, name: partner.name };
      }
    }

    // Organization gets: total commission - partner commission
    const orgCommissionAmount = commissionAmount.minus(partnerCommissionAmount);

    // Check if approval required
    const user = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!user) throw new NotFoundError('User', createdBy);

    const needsApproval = approvalService.requiresApproval(TransactionType.DELIVERY, user.role);
    const transactionStatus = needsApproval ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.DELIVERY,
          status: transactionStatus,
          gross_amount: grossAmount,
          net_amount: netAmount,
          site_id: input.site_id,
          financier_id: input.financier_id,
          partner_id: partnerInfo?.id,
          delivery_type_id: input.delivery_type_id,
          delivery_commission_rate: commissionRate,
          delivery_commission_amount: commissionAmount,
          delivery_partner_rate: partnerCommissionRate.gt(0) ? partnerCommissionRate : null,
          delivery_partner_amount: partnerCommissionAmount.gt(0) ? partnerCommissionAmount : null,
          description: input.description || `Teslimat: ${deliveryType.name}`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

      if (transactionStatus === TransactionStatus.COMPLETED) {
        const entries: LedgerEntryData[] = [];

        // 1. DEBIT: Site bakiyesi azalır (net tutar)
        entries.push({
          account_id: input.site_id,
          account_type: EntityType.SITE,
          account_name: site.name,
          entry_type: LedgerEntryType.DEBIT,
          amount: netAmount,
          description: `Teslimat: ${deliveryType.name} - Net tutar`,
        });

        // 2. DEBIT: Organization komisyon geliri
        if (orgCommissionAmount.gt(0)) {
          const orgAccount = await this.getOrCreateOrganizationAccount(tx);
          entries.push({
            account_id: orgAccount.entity_id,
            account_type: EntityType.ORGANIZATION,
            account_name: 'Organizasyon',
            entry_type: LedgerEntryType.DEBIT,
            amount: orgCommissionAmount,
            description: `Teslimat komisyonu: ${site.name}`,
          });
        }

        // 3. CREDIT: Partner komisyon geliri (varsa)
        if (partnerInfo && partnerCommissionAmount.gt(0)) {
          entries.push({
            account_id: partnerInfo.id,
            account_type: EntityType.PARTNER,
            account_name: partnerInfo.name,
            entry_type: LedgerEntryType.CREDIT,
            amount: partnerCommissionAmount,
            description: `Teslimat komisyonu: ${site.name}`,
          });
        }

        // 4. CREDIT: Financier kasasından para çıkar (brüt)
        entries.push({
          account_id: input.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: financier.name,
          entry_type: LedgerEntryType.CREDIT,
          amount: grossAmount,
          description: `Teslimat: ${site.name} - ${deliveryType.name}`,
        });

        await ledgerService.createEntries(transaction.id, entries, tx);
      } else {
        // Transaction is PENDING - notify admins
        await notificationService.notifyAdmins({
          type: 'TRANSACTION_PENDING',
          title: 'Yeni Teslimat Onay Bekliyor',
          message: `${site.name} sitesine ${grossAmount} TL teslimat (${deliveryType.name}) onay bekliyor.`,
          entityType: 'Transaction',
          entityId: transaction.id,
          actionUrl: `/approvals`,
          actionText: 'İncele',
          priority: 'HIGH',
        });
      }

      logger.info(
        {
          transactionId: transaction.id,
          type: 'DELIVERY',
          grossAmount: grossAmount.toString(),
          netAmount: netAmount.toString(),
          commissionAmount: commissionAmount.toString(),
          siteId: input.site_id,
        },
        'Delivery processed'
      );

      return transaction;
    });
  }

  /**
   * Reverse a transaction
   */
  async reverseTransaction(transactionId: string, input: ReverseTransactionInput, reversedBy: string) {
    const original = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        site: true,
        commission_snapshot: true,
      },
    });

    if (!original) {
      throw new NotFoundError('Transaction', transactionId);
    }

    if (original.status === TransactionStatus.REVERSED) {
      throw new BusinessError('Bu işlem zaten iptal edilmiş', 'ALREADY_REVERSED');
    }

    // Fetch user before transaction
    const user = await prisma.user.findUnique({
      where: { id: reversedBy },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User', reversedBy);
    }

    return prisma.$transaction(async (tx) => {
      // Create reversal transaction
      const reversal = await tx.transaction.create({
        data: {
          type: TransactionType.REVERSAL,
          status: TransactionStatus.COMPLETED,
          gross_amount: original.gross_amount,
          net_amount: original.net_amount,
          site_id: original.site_id,
          partner_id: original.partner_id,
          financier_id: original.financier_id,
          external_party_id: original.external_party_id,
          description: `İptal: ${input.reason}`,
          original_transaction_id: transactionId,
          transaction_date: new Date(),
          created_by: reversedBy,
        },
      });

      // Reverse ledger entries
      await ledgerService.reverseEntries(transactionId, reversal.id, tx);

      // Mark original as reversed
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.REVERSED,
          reversed_at: new Date(),
          reversal_reason: input.reason,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'REVERSE_TRANSACTION',
          entity_type: 'Transaction',
          entity_id: transactionId,
          old_data: { status: original.status } as unknown as Prisma.JsonObject,
          new_data: {
            status: 'REVERSED',
            reversal_id: reversal.id,
            reason: input.reason,
          } as unknown as Prisma.JsonObject,
          user_id: user.id,
          user_email: user.email,
        },
      });

      logger.info(
        { originalId: transactionId, reversalId: reversal.id },
        'Transaction reversed'
      );

      return reversal;
    });
  }

  /**
   * Edit a COMPLETED transaction (Admin only)
   * Strategy: Undo & Recreate
   * 1. Undo old ledger entries (restore account balances, delete entries)
   * 2. Recalculate with new values
   * 3. Create new ledger entries
   * 4. Update transaction record
   */
  async editTransaction(transactionId: string, input: EditTransactionInput, editedBy: string) {
    // Validate user is admin
    const user = await prisma.user.findUnique({ where: { id: editedBy } });
    if (!user) throw new NotFoundError('User', editedBy);
    if (user.role !== 'ADMIN') {
      throw new BusinessError('Sadece admin kullanıcılar işlem düzenleyebilir', 'NOT_ADMIN');
    }

    // Get original transaction
    const original = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        site: true,
        partner: true,
        financier: true,
        external_party: true,
        commission_snapshot: true,
        category: true,
        delivery_type: true,
      },
    });

    if (!original) throw new NotFoundError('Transaction', transactionId);
    if (original.status !== TransactionStatus.COMPLETED) {
      throw new BusinessError('Sadece tamamlanmış işlemler düzenlenebilir', 'NOT_COMPLETED');
    }
    if (original.type === TransactionType.REVERSAL) {
      throw new BusinessError('İptal işlemleri düzenlenemez', 'CANNOT_EDIT_REVERSAL');
    }

    // Determine what's changing
    const newAmount = input.amount ? new Decimal(input.amount) : new Decimal(original.gross_amount);
    const newSiteId = input.site_id || original.site_id;
    const newFinancierId = input.financier_id || original.financier_id;
    const newPartnerId = input.partner_id !== undefined ? input.partner_id : original.partner_id;
    const newExternalPartyId = input.external_party_id !== undefined ? input.external_party_id : original.external_party_id;
    const newDescription = input.description !== undefined ? input.description : original.description;
    const newReferenceId = input.reference_id !== undefined ? input.reference_id : original.reference_id;
    const newTransactionDate = input.transaction_date ? new Date(input.transaction_date) : original.transaction_date;
    const newCategoryId = input.category_id !== undefined ? input.category_id : original.category_id;
    const newDeliveryTypeId = input.delivery_type_id || original.delivery_type_id;

    // Check if financial recalculation is needed
    const financialFieldsChanged =
      input.amount !== undefined ||
      input.site_id !== undefined ||
      input.financier_id !== undefined ||
      input.partner_id !== undefined ||
      input.external_party_id !== undefined ||
      input.to_financier_id !== undefined ||
      input.delivery_type_id !== undefined ||
      input.override_commissions === true ||
      input.source_type !== undefined ||
      input.source_id !== undefined ||
      input.topup_source_type !== undefined ||
      input.topup_source_id !== undefined;

    // Store old data for audit
    const oldData = {
      gross_amount: original.gross_amount.toString(),
      net_amount: original.net_amount.toString(),
      site_id: original.site_id,
      financier_id: original.financier_id,
      partner_id: original.partner_id,
      external_party_id: original.external_party_id,
      description: original.description,
      reference_id: original.reference_id,
      transaction_date: original.transaction_date,
      category_id: original.category_id,
      delivery_type_id: original.delivery_type_id,
    };

    return prisma.$transaction(async (tx) => {
      let newNetAmount = newAmount;
      let updateData: any = {
        description: newDescription,
        reference_id: newReferenceId,
        transaction_date: newTransactionDate,
        category_id: newCategoryId,
        edited_at: new Date(),
        edited_by: editedBy,
        edit_count: { increment: 1 },
        edit_reason: input.reason,
      };

      if (financialFieldsChanged) {
        // === STEP 1: Undo old ledger entries ===
        await ledgerService.undoEntries(transactionId, tx);

        // Delete old commission snapshot if exists
        if (original.commission_snapshot) {
          await tx.commissionSnapshot.delete({
            where: { transaction_id: transactionId },
          });
        }

        // === STEP 2: Rebuild ledger entries based on transaction type ===
        const entries: LedgerEntryData[] = [];

        switch (original.type) {
          case TransactionType.DEPOSIT: {
            // Validate entities
            const site = await tx.site.findUnique({ where: { id: newSiteId!, deleted_at: null }, include: { account: true } });
            if (!site) throw new NotFoundError('Site', newSiteId!);
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null }, include: { account: true } });
            if (!financier) throw new NotFoundError('Financier', newFinancierId!);

            // Calculate or use custom commissions
            let commission;
            if (input.override_commissions && input.custom_site_commission !== undefined) {
              // Custom commission override
              const customSiteComm = new Decimal(input.custom_site_commission || '0').toDecimalPlaces(2);
              const customPartnerComm = new Decimal(input.custom_partner_commission || '0').toDecimalPlaces(2);
              const customFinancierComm = new Decimal(input.custom_financier_commission || '0').toDecimalPlaces(2);
              const customOrgAmount = new Decimal(input.custom_organization_amount || '0').toDecimalPlaces(2);

              commission = {
                site_commission_rate: new Decimal(0),
                site_commission_amount: customSiteComm,
                partner_commissions: customPartnerComm.gt(0) ? [{
                  partner_id: newPartnerId || '',
                  partner_name: '',
                  rate: new Decimal(0),
                  amount: customPartnerComm,
                }] : [],
                financier_commission_rate: new Decimal(0),
                financier_commission_amount: customFinancierComm,
                organization_amount: customOrgAmount,
                total_commission: customSiteComm,
              };
            } else {
              commission = await commissionService.calculateDepositCommission(newSiteId!, newFinancierId!, newAmount);
            }

            const financierNetAmount = newAmount.minus(commission.financier_commission_amount).toDecimalPlaces(2);
            const siteNetAmount = newAmount.minus(commission.site_commission_amount).toDecimalPlaces(2);
            newNetAmount = siteNetAmount;

            // Create commission snapshot
            await commissionService.createSnapshot(transactionId, commission, tx);

            // Ledger entries: same pattern as processDeposit
            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: financierNetAmount,
              description: `Yatırım alındı: ${site.name} (Net: ${financierNetAmount}) [Düzenlendi]`,
            });

            entries.push({
              account_id: newSiteId!,
              account_type: EntityType.SITE,
              account_name: site.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: siteNetAmount,
              description: `Site bakiyesi: ${siteNetAmount} [Düzenlendi]`,
            });

            for (const pc of commission.partner_commissions) {
              entries.push({
                account_id: pc.partner_id,
                account_type: EntityType.PARTNER,
                account_name: pc.partner_name,
                entry_type: LedgerEntryType.CREDIT,
                amount: pc.amount,
                description: `Partner komisyonu: ${site.name} [Düzenlendi]`,
              });
            }

            const orgAccount = await this.getOrCreateOrganizationAccount(tx);
            entries.push({
              account_id: orgAccount.entity_id,
              account_type: EntityType.ORGANIZATION,
              account_name: 'Organizasyon',
              entry_type: LedgerEntryType.CREDIT,
              amount: commission.organization_amount,
              description: `Organizasyon geliri: ${site.name} [Düzenlendi]`,
            });

            updateData.site_id = newSiteId;
            updateData.financier_id = newFinancierId;
            break;
          }

          case TransactionType.WITHDRAWAL: {
            const site = await tx.site.findUnique({ where: { id: newSiteId!, deleted_at: null }, include: { account: true } });
            if (!site) throw new NotFoundError('Site', newSiteId!);
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null }, include: { account: true } });
            if (!financier) throw new NotFoundError('Financier', newFinancierId!);

            let commission;
            if (input.override_commissions && input.custom_site_commission !== undefined) {
              const customSiteComm = new Decimal(input.custom_site_commission || '0').toDecimalPlaces(2);
              commission = {
                site_commission_rate: new Decimal(0),
                site_commission_amount: customSiteComm,
                financier_commission_rate: new Decimal(0),
                financier_commission_amount: new Decimal(0),
                partner_commissions: [],
                organization_amount: customSiteComm,
                total_commission: customSiteComm,
              };
            } else {
              commission = await commissionService.calculateWithdrawalCommission(newSiteId!, newFinancierId!, newAmount);
            }

            const siteTotalPay = newAmount.plus(commission.site_commission_amount).toDecimalPlaces(2);
            newNetAmount = newAmount;

            await commissionService.createSnapshot(transactionId, commission, tx);

            entries.push({
              account_id: newSiteId!,
              account_type: EntityType.SITE,
              account_name: site.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: siteTotalPay,
              description: `Çekim işlemi: ${newAmount} + ${commission.site_commission_amount} kom [Düzenlendi]`,
            });

            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Müşteriye ödeme: ${site.name} [Düzenlendi]`,
            });

            const orgAccount = await this.getOrCreateOrganizationAccount(tx);
            entries.push({
              account_id: orgAccount.entity_id,
              account_type: EntityType.ORGANIZATION,
              account_name: 'Organizasyon',
              entry_type: LedgerEntryType.CREDIT,
              amount: commission.site_commission_amount,
              description: `Çekim komisyonu: ${site.name} [Düzenlendi]`,
            });

            updateData.site_id = newSiteId;
            updateData.financier_id = newFinancierId;
            break;
          }

          case TransactionType.SITE_DELIVERY: {
            const site = await tx.site.findUnique({ where: { id: newSiteId!, deleted_at: null } });
            if (!site) throw new NotFoundError('Site', newSiteId!);
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Financier', newFinancierId!);

            entries.push({
              account_id: newSiteId!,
              account_type: EntityType.SITE,
              account_name: site.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Kasa teslimi: ${financier.name}'dan [Düzenlendi]`,
            });
            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Kasa teslimi: ${site.name}'a [Düzenlendi]`,
            });

            updateData.site_id = newSiteId;
            updateData.financier_id = newFinancierId;
            updateData.delivery_type_id = newDeliveryTypeId;
            break;
          }

          case TransactionType.PARTNER_PAYMENT: {
            const targetPartnerId = newPartnerId || original.partner_id;
            const partner = await tx.partner.findUnique({ where: { id: targetPartnerId!, deleted_at: null } });
            if (!partner) throw new NotFoundError('Partner', targetPartnerId!);
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Financier', newFinancierId!);

            entries.push({
              account_id: targetPartnerId!,
              account_type: EntityType.PARTNER,
              account_name: partner.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Komisyon ödemesi [Düzenlendi]`,
            });
            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Partner ödemesi: ${partner.name} [Düzenlendi]`,
            });

            updateData.partner_id = targetPartnerId;
            updateData.financier_id = newFinancierId;
            break;
          }

          case TransactionType.FINANCIER_TRANSFER: {
            const fromFinancierId = newFinancierId!;
            const toFinancierId = input.to_financier_id || original.description?.match(/→ (.+)/)?.[1] ? undefined : undefined;
            // For financier transfer, we need to get the to_financier from the original ledger entries
            const originalEntries = await tx.ledgerEntry.findMany({
              where: { transaction_id: transactionId },
            });
            // We already deleted entries in undoEntries, so use the description to find to_financier
            // Better approach: to_financier_id is passed in input
            const actualToFinancierId = input.to_financier_id;

            if (!actualToFinancierId) {
              throw new BusinessError('Hedef finansör belirtilmeli', 'MISSING_TO_FINANCIER');
            }

            const fromFinancier = await tx.financier.findUnique({ where: { id: fromFinancierId, deleted_at: null } });
            if (!fromFinancier) throw new NotFoundError('Kaynak Finansör', fromFinancierId);
            const toFinancier = await tx.financier.findUnique({ where: { id: actualToFinancierId, deleted_at: null } });
            if (!toFinancier) throw new NotFoundError('Hedef Finansör', actualToFinancierId);

            entries.push({
              account_id: fromFinancierId,
              account_type: EntityType.FINANCIER,
              account_name: fromFinancier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Transfer çıkış: ${toFinancier.name}'a [Düzenlendi]`,
            });
            entries.push({
              account_id: actualToFinancierId,
              account_type: EntityType.FINANCIER,
              account_name: toFinancier.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Transfer giriş: ${fromFinancier.name}'dan [Düzenlendi]`,
            });

            updateData.financier_id = fromFinancierId;
            break;
          }

          case TransactionType.EXTERNAL_DEBT_IN: {
            const extPartyId = newExternalPartyId || original.external_party_id;
            const externalParty = await tx.externalParty.findUnique({ where: { id: extPartyId!, deleted_at: null } });
            if (!externalParty) throw new NotFoundError('Dış Kişi', extPartyId!);
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);

            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Borç alındı: ${externalParty.name}'dan [Düzenlendi]`,
            });
            entries.push({
              account_id: extPartyId!,
              account_type: EntityType.EXTERNAL_PARTY,
              account_name: externalParty.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Borç verildi: Finansör ${financier.name}'a [Düzenlendi]`,
            });

            updateData.external_party_id = extPartyId;
            updateData.financier_id = newFinancierId;
            break;
          }

          case TransactionType.EXTERNAL_DEBT_OUT: {
            const extPartyId = newExternalPartyId || original.external_party_id;
            const externalParty = await tx.externalParty.findUnique({ where: { id: extPartyId!, deleted_at: null } });
            if (!externalParty) throw new NotFoundError('Dış Kişi', extPartyId!);
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);

            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Borç verildi: ${externalParty.name}'a [Düzenlendi]`,
            });
            entries.push({
              account_id: extPartyId!,
              account_type: EntityType.EXTERNAL_PARTY,
              account_name: externalParty.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Borç alındı: Finansör ${financier.name}'dan [Düzenlendi]`,
            });

            updateData.external_party_id = extPartyId;
            updateData.financier_id = newFinancierId;
            break;
          }

          case TransactionType.EXTERNAL_PAYMENT: {
            const extPartyId = newExternalPartyId || original.external_party_id;
            const externalParty = await tx.externalParty.findUnique({ where: { id: extPartyId!, deleted_at: null } });
            if (!externalParty) throw new NotFoundError('Dış Kişi', extPartyId!);
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);

            entries.push({
              account_id: extPartyId!,
              account_type: EntityType.EXTERNAL_PARTY,
              account_name: externalParty.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Ödeme alındı [Düzenlendi]`,
            });
            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Dış kişi ödemesi: ${externalParty.name}'a [Düzenlendi]`,
            });

            updateData.external_party_id = extPartyId;
            updateData.financier_id = newFinancierId;
            break;
          }

          case TransactionType.ORG_EXPENSE: {
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);
            const orgAccount = await this.getOrCreateOrganizationAccount(tx);

            entries.push({
              account_id: orgAccount.entity_id,
              account_type: EntityType.ORGANIZATION,
              account_name: 'Organizasyon',
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: newDescription || 'Organizasyon gideri [Düzenlendi]',
            });
            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Org gideri: ${newDescription || 'Gider'} [Düzenlendi]`,
            });

            updateData.financier_id = newFinancierId;
            updateData.category_id = newCategoryId;
            break;
          }

          case TransactionType.ORG_INCOME: {
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);
            const orgAccount = await this.getOrCreateOrganizationAccount(tx);

            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Org geliri: ${newDescription || 'Gelir'} [Düzenlendi]`,
            });
            entries.push({
              account_id: orgAccount.entity_id,
              account_type: EntityType.ORGANIZATION,
              account_name: 'Organizasyon',
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: newDescription || 'Organizasyon geliri [Düzenlendi]',
            });

            updateData.financier_id = newFinancierId;
            updateData.category_id = newCategoryId;
            break;
          }

          case TransactionType.ORG_WITHDRAW: {
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);
            const orgAccount = await this.getOrCreateOrganizationAccount(tx);

            entries.push({
              account_id: orgAccount.entity_id,
              account_type: EntityType.ORGANIZATION,
              account_name: 'Organizasyon',
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: newDescription || 'Hak ediş çekimi [Düzenlendi]',
            });
            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: 'Organizasyon hak ediş çekimi [Düzenlendi]',
            });

            updateData.financier_id = newFinancierId;
            break;
          }

          case TransactionType.PAYMENT: {
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);

            // Resolve source entity
            const sourceType = input.source_type || (original.source_type as any);
            const sourceId = input.source_id !== undefined ? input.source_id : original.source_id;
            let sourceEntity: { id: string; name: string; type: EntityType } | null = null;

            if (sourceType === 'SITE' && sourceId) {
              const site = await tx.site.findUnique({ where: { id: sourceId, deleted_at: null } });
              if (!site) throw new NotFoundError('Site', sourceId);
              sourceEntity = { id: site.id, name: site.name, type: EntityType.SITE };
            } else if (sourceType === 'PARTNER' && sourceId) {
              const partner = await tx.partner.findUnique({ where: { id: sourceId, deleted_at: null } });
              if (!partner) throw new NotFoundError('Partner', sourceId);
              sourceEntity = { id: partner.id, name: partner.name, type: EntityType.PARTNER };
            } else if (sourceType === 'EXTERNAL_PARTY' && sourceId) {
              const ext = await tx.externalParty.findUnique({ where: { id: sourceId, deleted_at: null } });
              if (!ext) throw new NotFoundError('Dış Kişi', sourceId);
              sourceEntity = { id: ext.id, name: ext.name, type: EntityType.EXTERNAL_PARTY };
            } else if (sourceType === 'ORGANIZATION') {
              const orgAccount = await this.getOrCreateOrganizationAccount(tx);
              sourceEntity = { id: orgAccount.entity_id, name: 'Organizasyon', type: EntityType.ORGANIZATION };
            }

            if (!sourceEntity) throw new BusinessError('Kaynak entity bulunamadı', 'SOURCE_NOT_FOUND');

            entries.push({
              account_id: sourceEntity.id,
              account_type: sourceEntity.type,
              account_name: sourceEntity.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Ödeme: ${newDescription || 'Ödeme işlemi'} [Düzenlendi]`,
            });
            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Ödeme: ${sourceEntity.name} adına [Düzenlendi]`,
            });

            updateData.financier_id = newFinancierId;
            updateData.source_type = sourceEntity.type;
            updateData.source_id = sourceEntity.id;
            break;
          }

          case TransactionType.TOP_UP: {
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);

            let sourceEntity: { id: string; name: string; type: EntityType } | null = null;
            const topupSourceType = input.topup_source_type || (original.topup_source_type as any);
            const topupSourceId = input.topup_source_id !== undefined ? input.topup_source_id : original.topup_source_id;

            if (topupSourceType === 'PARTNER' && topupSourceId) {
              const partner = await tx.partner.findUnique({ where: { id: topupSourceId, deleted_at: null } });
              if (!partner) throw new NotFoundError('Partner', topupSourceId);
              sourceEntity = { id: partner.id, name: partner.name, type: EntityType.PARTNER };
            } else if (topupSourceType === 'ORGANIZATION') {
              const orgAccount = await this.getOrCreateOrganizationAccount(tx);
              sourceEntity = { id: orgAccount.entity_id, name: 'Organizasyon', type: EntityType.ORGANIZATION };
            }

            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: newAmount,
              description: `Takviye: ${sourceEntity?.name || 'Dış kaynak'} [Düzenlendi]`,
            });

            if (sourceEntity) {
              entries.push({
                account_id: sourceEntity.id,
                account_type: sourceEntity.type,
                account_name: sourceEntity.name,
                entry_type: LedgerEntryType.CREDIT,
                amount: newAmount,
                description: `Takviye: Açık kapatma [Düzenlendi]`,
              });
            } else {
              const orgAccount = await this.getOrCreateOrganizationAccount(tx);
              entries.push({
                account_id: orgAccount.entity_id,
                account_type: EntityType.ORGANIZATION,
                account_name: 'Organizasyon',
                entry_type: LedgerEntryType.CREDIT,
                amount: newAmount,
                description: `Takviye: Dış kaynak [Düzenlendi]`,
              });
            }

            updateData.financier_id = newFinancierId;
            break;
          }

          case TransactionType.DELIVERY: {
            const site = await tx.site.findUnique({ where: { id: newSiteId!, deleted_at: null } });
            if (!site) throw new NotFoundError('Site', newSiteId!);
            const financier = await tx.financier.findUnique({ where: { id: newFinancierId!, deleted_at: null } });
            if (!financier) throw new NotFoundError('Finansör', newFinancierId!);

            const deliveryTypeId = newDeliveryTypeId!;
            const deliveryType = await tx.deliveryType.findUnique({ where: { id: deliveryTypeId } });
            if (!deliveryType) throw new NotFoundError('Teslimat Türü', deliveryTypeId);

            // Get delivery commission
            const deliveryCommission = await tx.deliveryCommission.findUnique({
              where: { site_id_delivery_type_id: { site_id: newSiteId!, delivery_type_id: deliveryTypeId } },
            });

            const commissionRate = deliveryCommission ? new Decimal(deliveryCommission.rate) : new Decimal(0);
            const commissionAmount = newAmount.times(commissionRate).toDecimalPlaces(2);
            const netAmount = newAmount.minus(commissionAmount).toDecimalPlaces(2);
            newNetAmount = netAmount;

            let partnerCommissionAmount = new Decimal(0);
            let partnerInfo: { id: string; name: string } | null = null;
            if (deliveryCommission?.partner_id && deliveryCommission?.partner_rate) {
              const partnerRate = new Decimal(deliveryCommission.partner_rate);
              partnerCommissionAmount = newAmount.times(partnerRate).toDecimalPlaces(2);
              const partner = await tx.partner.findUnique({ where: { id: deliveryCommission.partner_id } });
              if (partner) partnerInfo = { id: partner.id, name: partner.name };
            }

            const orgCommissionAmount = commissionAmount.minus(partnerCommissionAmount).toDecimalPlaces(2);

            entries.push({
              account_id: newSiteId!,
              account_type: EntityType.SITE,
              account_name: site.name,
              entry_type: LedgerEntryType.DEBIT,
              amount: netAmount,
              description: `Teslimat: ${deliveryType.name} - Net tutar [Düzenlendi]`,
            });

            if (orgCommissionAmount.gt(0)) {
              const orgAccount = await this.getOrCreateOrganizationAccount(tx);
              entries.push({
                account_id: orgAccount.entity_id,
                account_type: EntityType.ORGANIZATION,
                account_name: 'Organizasyon',
                entry_type: LedgerEntryType.DEBIT,
                amount: orgCommissionAmount,
                description: `Teslimat komisyonu: ${site.name} [Düzenlendi]`,
              });
            }

            if (partnerInfo && partnerCommissionAmount.gt(0)) {
              entries.push({
                account_id: partnerInfo.id,
                account_type: EntityType.PARTNER,
                account_name: partnerInfo.name,
                entry_type: LedgerEntryType.CREDIT,
                amount: partnerCommissionAmount,
                description: `Teslimat komisyonu: ${site.name} [Düzenlendi]`,
              });
            }

            entries.push({
              account_id: newFinancierId!,
              account_type: EntityType.FINANCIER,
              account_name: financier.name,
              entry_type: LedgerEntryType.CREDIT,
              amount: newAmount,
              description: `Teslimat: ${site.name} - ${deliveryType.name} [Düzenlendi]`,
            });

            updateData.site_id = newSiteId;
            updateData.financier_id = newFinancierId;
            updateData.delivery_type_id = deliveryTypeId;
            updateData.delivery_commission_rate = commissionRate;
            updateData.delivery_commission_amount = commissionAmount;
            break;
          }

          default:
            throw new BusinessError(`Bu işlem tipi düzenlenemez: ${original.type}`, 'UNSUPPORTED_EDIT_TYPE');
        }

        // === STEP 3: Create new ledger entries ===
        await ledgerService.createEntries(transactionId, entries, tx);
      }

      // === STEP 4: Update transaction record ===
      if (financialFieldsChanged) {
        updateData.gross_amount = newAmount;
        updateData.net_amount = newNetAmount;
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
        include: {
          site: { select: { id: true, name: true, code: true } },
          partner: { select: { id: true, name: true, code: true } },
          financier: { select: { id: true, name: true, code: true } },
          external_party: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, color: true } },
          delivery_type: { select: { id: true, name: true } },
          commission_snapshot: true,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'EDIT_TRANSACTION',
          entity_type: 'Transaction',
          entity_id: transactionId,
          old_data: oldData as unknown as Prisma.JsonObject,
          new_data: {
            ...updateData,
            ...(financialFieldsChanged ? {
              gross_amount: newAmount.toString(),
              net_amount: newNetAmount.toString(),
            } : {}),
            reason: input.reason,
          } as unknown as Prisma.JsonObject,
          user_id: editedBy,
          user_email: user.email,
        },
      });

      logger.info(
        {
          transactionId,
          type: original.type,
          oldAmount: original.gross_amount.toString(),
          newAmount: newAmount.toString(),
          financialRecalc: financialFieldsChanged,
          reason: input.reason,
        },
        'Transaction edited'
      );

      return updatedTransaction;
    });
  }

  /**
   * Get transaction by ID
   */
  async findById(id: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, color: true } },
        delivery_type: { select: { id: true, name: true } },
        commission_snapshot: true,
        ledger_entries: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction', id);
    }

    return transaction;
  }

  /**
   * List transactions with filtering
   */
  async findAll(query: TransactionQueryInput) {
    const where: Prisma.TransactionWhereInput = {
      deleted_at: null,
    };

    // AND koşulları: scope ve search gibi OR kullanan filtreleri AND ile birleştir
    const andConditions: Prisma.TransactionWhereInput[] = [];

    // Scope filtresi: organization → sadece org ile ilgili işlemler
    if (query.scope === 'organization') {
      andConditions.push({
        OR: [
          { type: { in: ['ORG_EXPENSE', 'ORG_INCOME', 'ORG_WITHDRAW'] as any } },
          { type: 'PAYMENT' as any, source_type: 'ORGANIZATION' },
          { type: 'TOP_UP' as any, topup_source_type: 'ORGANIZATION' },
        ],
      });
    }

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.site_id) where.site_id = query.site_id;
    if (query.partner_id) where.partner_id = query.partner_id;
    if (query.financier_id) where.financier_id = query.financier_id;

    if (query.date_from || query.date_to) {
      where.transaction_date = {};
      if (query.date_from) where.transaction_date.gte = new Date(query.date_from);
      if (query.date_to) {
        // Gün sonuna kadar dahil et (YYYY-MM-DD formatı için 23:59:59)
        const endDate = new Date(query.date_to);
        endDate.setHours(23, 59, 59, 999);
        where.transaction_date.lte = endDate;
      }
    }

    // Tutar aralığı filtresi
    if (query.min_amount !== undefined || query.max_amount !== undefined) {
      where.gross_amount = {};
      if (query.min_amount !== undefined) where.gross_amount.gte = query.min_amount;
      if (query.max_amount !== undefined) where.gross_amount.lte = query.max_amount;
    }

    // Arama filtresi: açıklama, referans ID, veya ilişkili entity isimlerinde arama
    if (query.search) {
      andConditions.push({
        OR: [
          { description: { contains: query.search, mode: 'insensitive' } },
          { reference_id: { contains: query.search, mode: 'insensitive' } },
          { site: { name: { contains: query.search, mode: 'insensitive' } } },
          { site: { code: { contains: query.search, mode: 'insensitive' } } },
          { partner: { name: { contains: query.search, mode: 'insensitive' } } },
          { partner: { code: { contains: query.search, mode: 'insensitive' } } },
          { financier: { name: { contains: query.search, mode: 'insensitive' } } },
          { financier: { code: { contains: query.search, mode: 'insensitive' } } },
          { external_party: { name: { contains: query.search, mode: 'insensitive' } } },
        ],
      });
    }

    // AND koşullarını birleştir
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, code: true } },
          partner: { select: { id: true, name: true, code: true } },
          financier: { select: { id: true, name: true, code: true } },
          external_party: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, color: true } },
          delivery_type: { select: { id: true, name: true } },
          commission_snapshot: true,
        },
        orderBy: { [query.sortBy]: query.sortOrder },
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
      hasNext: query.page * query.limit < total,
      hasPrev: query.page > 1,
    };
  }

  /**
   * Process BULK IMPORT
   * Creates multiple transactions (Deposit/Withdrawal) at once
   */
  async processBulkImport(input: { transactions: any[] }, createdBy: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Parallel processing might be risky for ledger consistency if too many conflicts
    // Process sequentially for safety
    for (const [index, row] of input.transactions.entries()) {
      try {
        // 1. Resolve Site
        const site = await prisma.site.findFirst({
          where: {
            OR: [{ name: { equals: row.site, mode: 'insensitive' } }, { code: { equals: row.site, mode: 'insensitive' } }],
            deleted_at: null,
          },
        });
        if (!site) throw new Error(`Site bulunamadı: ${row.site}`);

        // 2. Resolve Financier
        const financier = await prisma.financier.findFirst({
          where: {
            OR: [
              { name: { equals: row.financier, mode: 'insensitive' } },
              { code: { equals: row.financier, mode: 'insensitive' } },
            ],
            deleted_at: null,
          },
        });
        if (!financier) throw new Error(`Finansör bulunamadı: ${row.financier}`);

        // 3. Parse Date (DD.MM.YYYY -> Date object)
        const [day, month, year] = row.date.split('.');
        const transactionDate = new Date(`${year}-${month}-${day}`);

        // 4. Create Transaction
        if (row.type === 'DEPOSIT') {
          await this.processDeposit(
            {
              site_id: site.id,
              financier_id: financier.id,
              amount: row.amount.toString(),
              description: row.description || 'Toplu İçe Aktarım',
              transaction_date: transactionDate.toISOString(),
            },
            createdBy
          );
        } else if (row.type === 'WITHDRAWAL') {
          await this.processWithdrawal(
            {
              site_id: site.id,
              financier_id: financier.id,
              amount: row.amount.toString(),
              description: row.description || 'Toplu İçe Aktarım',
              transaction_date: transactionDate.toISOString(),
            },
            createdBy
          );
        } else {
          throw new Error(`Geçersiz işlem tipi: ${row.type}`);
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Satır ${index + 1}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Get or create Organization account
   */
  private async getOrCreateOrganizationAccount(tx: Prisma.TransactionClient) {
    const ORG_ENTITY_ID = 'org-main-account';

    let account = await tx.account.findUnique({
      where: { entity_id: ORG_ENTITY_ID },
    });

    if (!account) {
      account = await tx.account.create({
        data: {
          entity_type: EntityType.ORGANIZATION,
          entity_id: ORG_ENTITY_ID,
          balance: new Decimal(0),
          blocked_amount: new Decimal(0),
          credit_limit: new Decimal(0),
        },
      });
    }

    return account;
  }

  /**
   * Get edit history for a transaction from audit logs
   */
  async getEditHistory(transactionId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity_type: 'Transaction',
        entity_id: transactionId,
        action: 'EDIT_TRANSACTION',
      },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      edited_by: log.user,
      edited_at: log.created_at,
      old_data: log.old_data as Record<string, any> | null,
      new_data: log.new_data as Record<string, any> | null,
      reason: (log.new_data as Record<string, any>)?.reason || null,
    }));
  }
}

export const transactionService = new TransactionService();
