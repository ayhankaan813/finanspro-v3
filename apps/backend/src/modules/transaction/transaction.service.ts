import { Prisma, TransactionType, TransactionStatus, EntityType, LedgerEntryType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, BusinessError, InsufficientBalanceError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import { ledgerService, LedgerEntryData } from '../ledger/ledger.service.js';
import { commissionService } from './commission.service.js';
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
    const financierNetAmount = amount.sub(commission.financier_commission_amount);

    // Net amount for site (after site commission deduction)
    const siteNetAmount = amount.sub(commission.site_commission_amount);

    return prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
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

      // Create commission snapshot
      await commissionService.createSnapshot(transaction.id, commission, tx);

      // Build ledger entries
      const entries: LedgerEntryData[] = [];

      // DEPOSIT Ledger Entries (CORRECT):
      // Example: 100K deposit, site 4% commission, partner gets 50% share of commission
      //
      // Commission breakdown:
      // - Site commission: 4% × 100K = 4K (total commission pool)
      // - Partner share: 50% × 4K = 2K (partner gets HALF of the 4K commission)
      // - Organization: 4K - 2K = 2K (org keeps the other HALF)
      //
      // Physical money flow:
      // - Customer gives 100K to Financier
      // - Site owes customer 96K (after 4K commission deducted)
      // - From the 4K commission: Partner gets 2K, Org gets 2K
      //
      // Ledger entries (double-entry accounting):
      // DEBIT:  Financier +100K (receives cash)
      // CREDIT: Site +96K (liability to customer)
      // CREDIT: Organization +4K (site commission revenue)
      // DEBIT:  Organization +2K (partner commission expense)
      // CREDIT: Partner +2K (partner earns their share)
      //
      // Balance check:
      // DEBIT:  100K + 2K = 102K
      // CREDIT: 96K + 4K + 2K = 102K ✓ BALANCED!
      //
      // IMPORTANT: Partner NEVER gets more than site commission!
      // Partner rate is a SHARE of the site commission, not separate from gross.

      // 1. DEBIT: Financier receives cash from customer
      entries.push({
        account_id: input.financier_id,
        account_type: EntityType.FINANCIER,
        account_name: financier.name,
        entry_type: LedgerEntryType.DEBIT,
        amount: amount, // Full gross amount (100K)
        description: `Yatırım alındı: ${site.name} - Tutar: ${amount}`,
      });

      // 2. CREDIT: Site liability increases (what site owes to customers after commission)
      entries.push({
        account_id: input.site_id,
        account_type: EntityType.SITE,
        account_name: site.name,
        entry_type: LedgerEntryType.CREDIT,
        amount: siteNetAmount, // 96K (after 4% commission)
        description: `Müşteri yatırımı: Net ${siteNetAmount}`,
      });

      // 3. CREDIT: Organization receives site commission (revenue)
      const orgAccount = await this.getOrCreateOrganizationAccount(tx);
      entries.push({
        account_id: orgAccount.entity_id,
        account_type: EntityType.ORGANIZATION,
        account_name: 'Organizasyon',
        entry_type: LedgerEntryType.CREDIT,
        amount: commission.site_commission_amount, // 4K (site commission)
        description: `Site komisyonu geliri: ${site.name}`,
      });

      // 4. DEBIT: Organization pays partner commission (expense)
      for (const pc of commission.partner_commissions) {
        entries.push({
          account_id: orgAccount.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.DEBIT,
          amount: pc.amount, // 5K (partner commission)
          description: `Partner komisyon ödemesi: ${pc.partner_name}`,
        });

        // 5. CREDIT: Partner earns commission
        entries.push({
          account_id: pc.partner_id,
          account_type: EntityType.PARTNER,
          account_name: pc.partner_name,
          entry_type: LedgerEntryType.CREDIT,
          amount: pc.amount, // 5K
          description: `Yatırım komisyonu: ${site.name}`,
        });
      }

      // 6. Handle financier commission if any
      if (commission.financier_commission_amount.gt(0)) {
        // DEBIT: Organization pays financier commission (expense)
        entries.push({
          account_id: orgAccount.entity_id,
          account_type: EntityType.ORGANIZATION,
          account_name: 'Organizasyon',
          entry_type: LedgerEntryType.DEBIT,
          amount: commission.financier_commission_amount,
          description: `Finansör komisyon ödemesi: ${financier.name}`,
        });

        // CREDIT: Financier earns commission
        entries.push({
          account_id: input.financier_id,
          account_type: EntityType.FINANCIER,
          account_name: financier.name,
          entry_type: LedgerEntryType.CREDIT,
          amount: commission.financier_commission_amount,
          description: `Yatırım komisyonu kazancı`,
        });
      }

      // Create ledger entries (this validates Debit = Credit)
      await ledgerService.createEntries(transaction.id, entries, tx);

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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
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
    const siteTotalPay = amount.add(commission.site_commission_amount);

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.COMPLETED,
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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.SITE_DELIVERY,
          status: TransactionStatus.COMPLETED,
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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.PARTNER_PAYMENT,
          status: TransactionStatus.COMPLETED,
          gross_amount: amount,
          net_amount: amount,
          partner_id: input.partner_id,
          financier_id: input.financier_id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

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
    const availableBalance = new Decimal(fromFinancier.account!.balance).sub(fromFinancier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.FINANCIER_TRANSFER,
          status: TransactionStatus.COMPLETED,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.from_financier_id, // Primary financier (source)
          description: input.description || `Transfer: ${fromFinancier.name} → ${toFinancier.name}`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

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

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.EXTERNAL_DEBT_IN,
          status: TransactionStatus.COMPLETED,
          gross_amount: amount,
          net_amount: amount,
          external_party_id: input.external_party_id,
          financier_id: input.financier_id,
          description: input.description || `Borç alındı: ${externalParty.name}'dan`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.EXTERNAL_DEBT_OUT,
          status: TransactionStatus.COMPLETED,
          gross_amount: amount,
          net_amount: amount,
          external_party_id: input.external_party_id,
          financier_id: input.financier_id,
          description: input.description || `Borç verildi: ${externalParty.name}'a`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.EXTERNAL_PAYMENT,
          status: TransactionStatus.COMPLETED,
          gross_amount: amount,
          net_amount: amount,
          external_party_id: input.external_party_id,
          financier_id: input.financier_id,
          description: input.description || `Ödeme: ${externalParty.name}'a`,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.ORG_EXPENSE,
          status: TransactionStatus.COMPLETED,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.financier_id,
          category_id: input.category_id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

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

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.ORG_INCOME,
          status: TransactionStatus.COMPLETED,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.financier_id,
          category_id: input.category_id,
          description: input.description,
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
    if (availableBalance.lt(amount)) {
      throw new InsufficientBalanceError(availableBalance.toString(), amount.toString());
    }

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.ORG_WITHDRAW,
          status: TransactionStatus.COMPLETED,
          gross_amount: amount,
          net_amount: amount,
          financier_id: input.financier_id,
          description: input.description || 'Hak ediş çekimi',
          transaction_date: input.transaction_date ? new Date(input.transaction_date) : new Date(),
          created_by: createdBy,
        },
      });

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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
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

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.PAYMENT,
          status: TransactionStatus.COMPLETED,
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

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.TOP_UP,
          status: TransactionStatus.COMPLETED,
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
    const availableBalance = new Decimal(financier.account!.balance).sub(financier.account!.blocked_amount);
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
    const commissionAmount = grossAmount.mul(commissionRate);
    const netAmount = grossAmount.sub(commissionAmount);

    // Calculate partner commission (if exists)
    let partnerCommissionRate = new Decimal(0);
    let partnerCommissionAmount = new Decimal(0);
    let partnerInfo: { id: string; name: string } | null = null;

    if (deliveryCommission?.partner_id && deliveryCommission?.partner_rate) {
      partnerCommissionRate = new Decimal(deliveryCommission.partner_rate);
      partnerCommissionAmount = grossAmount.mul(partnerCommissionRate);

      const partner = await prisma.partner.findUnique({
        where: { id: deliveryCommission.partner_id },
      });
      if (partner) {
        partnerInfo = { id: partner.id, name: partner.name };
      }
    }

    // Organization gets: total commission - partner commission
    const orgCommissionAmount = commissionAmount.sub(partnerCommissionAmount);

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: TransactionType.DELIVERY,
          status: TransactionStatus.COMPLETED,
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
          user_id: reversedBy,
          user_email: '',
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

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.site_id) where.site_id = query.site_id;
    if (query.partner_id) where.partner_id = query.partner_id;
    if (query.financier_id) where.financier_id = query.financier_id;

    if (query.date_from || query.date_to) {
      where.transaction_date = {};
      if (query.date_from) where.transaction_date.gte = new Date(query.date_from);
      if (query.date_to) where.transaction_date.lte = new Date(query.date_to);
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true, color: true } },
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
}

export const transactionService = new TransactionService();
