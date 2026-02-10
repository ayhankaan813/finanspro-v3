import { Prisma, EntityType, LedgerEntryType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { LedgerImbalanceError, NotFoundError, BusinessError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';

export interface LedgerEntryData {
  account_id: string;
  account_type: EntityType;
  account_name: string;
  entry_type: LedgerEntryType;
  amount: Decimal;
  description: string;
}

export interface LedgerResult {
  entries: Array<{
    id: string;
    account_id: string;
    account_type: EntityType;
    account_name: string;
    entry_type: LedgerEntryType;
    amount: Decimal;
    balance_after: Decimal;
  }>;
  totalDebit: Decimal;
  totalCredit: Decimal;
}

export class LedgerService {
  /**
   * Create ledger entries for a transaction
   * Ensures double-entry bookkeeping (Total Debit = Total Credit)
   */
  async createEntries(
    transactionId: string,
    entries: LedgerEntryData[],
    tx: Prisma.TransactionClient
  ): Promise<LedgerResult> {
    // Validate that we have entries
    if (entries.length === 0) {
      throw new BusinessError('Ledger entries cannot be empty', 'NO_LEDGER_ENTRIES');
    }

    // Calculate totals
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const entry of entries) {
      if (entry.entry_type === LedgerEntryType.DEBIT) {
        totalDebit = totalDebit.add(entry.amount);
      } else {
        totalCredit = totalCredit.add(entry.amount);
      }
    }

    // Validate balance (CRITICAL: Debit MUST equal Credit)
    if (!totalDebit.eq(totalCredit)) {
      logger.error(
        {
          transactionId,
          totalDebit: totalDebit.toString(),
          totalCredit: totalCredit.toString(),
          difference: totalDebit.sub(totalCredit).toString(),
        },
        'CRITICAL: Ledger imbalance detected!'
      );

      throw new LedgerImbalanceError(totalDebit.toString(), totalCredit.toString());
    }

    // Create entries and update balances
    const createdEntries = [];

    for (const entry of entries) {
      // Get current account balance
      const account = await tx.account.findUnique({
        where: { entity_id: entry.account_id },
        select: { id: true, balance: true },
      });

      if (!account) {
        throw new NotFoundError('Account', entry.account_id);
      }

      // Calculate new balance based on account type
      // For ASSET accounts (SITE, FINANCIER): DEBIT increases, CREDIT decreases
      // For LIABILITY accounts (PARTNER, EXTERNAL_PARTY, ORGANIZATION): CREDIT increases, DEBIT decreases
      const currentBalance = new Decimal(account.balance);
      let newBalance: Decimal;

      const isLiabilityAccount = [
        EntityType.PARTNER,
        EntityType.EXTERNAL_PARTY,
        EntityType.ORGANIZATION,
      ].includes(entry.account_type);

      if (isLiabilityAccount) {
        // Liability: CREDIT increases, DEBIT decreases
        if (entry.entry_type === LedgerEntryType.CREDIT) {
          newBalance = currentBalance.add(entry.amount);
        } else {
          newBalance = currentBalance.sub(entry.amount);
        }
      } else {
        // Asset (SITE, FINANCIER): DEBIT increases, CREDIT decreases
        if (entry.entry_type === LedgerEntryType.DEBIT) {
          newBalance = currentBalance.add(entry.amount);
        } else {
          newBalance = currentBalance.sub(entry.amount);
        }
      }

      // Update account balance
      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });

      // Create ledger entry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          transaction_id: transactionId,
          entry_type: entry.entry_type,
          account_id: account.id,
          account_type: entry.account_type,
          account_name: entry.account_name,
          amount: entry.amount,
          balance_after: newBalance,
          description: entry.description,
        },
      });

      createdEntries.push({
        id: ledgerEntry.id,
        account_id: account.id,
        account_type: entry.account_type,
        account_name: entry.account_name,
        entry_type: entry.entry_type,
        amount: entry.amount,
        balance_after: newBalance,
      });
    }

    logger.info(
      {
        transactionId,
        entriesCount: createdEntries.length,
        totalDebit: totalDebit.toString(),
        totalCredit: totalCredit.toString(),
      },
      'Ledger entries created'
    );

    return {
      entries: createdEntries,
      totalDebit,
      totalCredit,
    };
  }

  /**
   * Reverse ledger entries for a transaction
   * Creates opposite entries to cancel out the original
   */
  async reverseEntries(
    originalTransactionId: string,
    reversalTransactionId: string,
    tx: Prisma.TransactionClient
  ): Promise<LedgerResult> {
    // Get original entries
    const originalEntries = await tx.ledgerEntry.findMany({
      where: { transaction_id: originalTransactionId },
    });

    if (originalEntries.length === 0) {
      throw new NotFoundError('LedgerEntries for transaction', originalTransactionId);
    }

    // Create reversed entries
    const reversedEntries: LedgerEntryData[] = originalEntries.map((entry) => ({
      account_id: entry.account_id,
      account_type: entry.account_type,
      account_name: entry.account_name,
      // Swap DEBIT <-> CREDIT
      entry_type: entry.entry_type === LedgerEntryType.DEBIT ? LedgerEntryType.CREDIT : LedgerEntryType.DEBIT,
      amount: entry.amount,
      description: `İptal: ${entry.description}`,
    }));

    return this.createEntries(reversalTransactionId, reversedEntries, tx);
  }

  /**
   * Get ledger entries for a transaction
   */
  async getEntriesByTransaction(transactionId: string) {
    const entries = await prisma.ledgerEntry.findMany({
      where: { transaction_id: transactionId },
      orderBy: { created_at: 'asc' },
    });

    return entries;
  }

  /**
   * Get ledger entries for an account
   */
  async getEntriesByAccount(accountId: string, query: { page: number; limit: number }) {
    const where = { account_id: accountId };

    const [items, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          transaction: {
            select: {
              id: true,
              type: true,
              status: true,
              transaction_date: true,
            },
          },
        },
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
   * Verify ledger balance (system-wide)
   * Total Debit should equal Total Credit across ALL entries
   */
  async verifySystemBalance(): Promise<{ isBalanced: boolean; debitTotal: string; creditTotal: string; difference: string }> {
    const result = await prisma.ledgerEntry.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        entry_type: LedgerEntryType.DEBIT,
      },
    });

    const debitTotal = new Decimal(result._sum.amount || 0);

    const creditResult = await prisma.ledgerEntry.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        entry_type: LedgerEntryType.CREDIT,
      },
    });

    const creditTotal = new Decimal(creditResult._sum.amount || 0);
    const difference = debitTotal.sub(creditTotal);
    const isBalanced = difference.isZero();

    if (!isBalanced) {
      logger.error(
        {
          debitTotal: debitTotal.toString(),
          creditTotal: creditTotal.toString(),
          difference: difference.toString(),
        },
        'CRITICAL: System ledger imbalance detected!'
      );
    }

    return {
      isBalanced,
      debitTotal: debitTotal.toString(),
      creditTotal: creditTotal.toString(),
      difference: difference.toString(),
    };
  }

  /**
   * Get account balance from ledger (for reconciliation)
   */
  async calculateAccountBalance(accountId: string): Promise<Decimal> {
    const debitSum = await prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { account_id: accountId, entry_type: LedgerEntryType.DEBIT },
    });

    const creditSum = await prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { account_id: accountId, entry_type: LedgerEntryType.CREDIT },
    });

    const totalDebit = new Decimal(debitSum._sum.amount || 0);
    const totalCredit = new Decimal(creditSum._sum.amount || 0);

    return totalDebit.sub(totalCredit);
  }

  /**
   * Reconcile account balance (compare stored balance vs calculated)
   */
  async reconcileAccountBalance(entityId: string): Promise<{
    isReconciled: boolean;
    storedBalance: string;
    calculatedBalance: string;
    difference: string;
  }> {
    const account = await prisma.account.findUnique({
      where: { entity_id: entityId },
    });

    if (!account) {
      throw new NotFoundError('Account', entityId);
    }

    const calculatedBalance = await this.calculateAccountBalance(account.id);
    const storedBalance = new Decimal(account.balance);
    const difference = storedBalance.sub(calculatedBalance);
    const isReconciled = difference.isZero();

    if (!isReconciled) {
      logger.warn(
        {
          accountId: account.id,
          entityId,
          storedBalance: storedBalance.toString(),
          calculatedBalance: calculatedBalance.toString(),
          difference: difference.toString(),
        },
        'Account balance mismatch detected'
      );
    }

    return {
      isReconciled,
      storedBalance: storedBalance.toString(),
      calculatedBalance: calculatedBalance.toString(),
      difference: difference.toString(),
    };
  }
}

export const ledgerService = new LedgerService();
