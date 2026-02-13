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
        totalDebit = totalDebit.plus(entry.amount);
      } else {
        totalCredit = totalCredit.plus(entry.amount);
      }
    }

    // Validate balance (CRITICAL: Debit MUST equal Credit)
    if (!totalDebit.eq(totalCredit)) {
      logger.error(
        {
          transactionId,
          totalDebit: totalDebit.toString(),
          totalCredit: totalCredit.toString(),
          difference: totalDebit.minus(totalCredit).toString(),
        },
        'CRITICAL: Ledger imbalance detected!'
      );

      throw new LedgerImbalanceError(totalDebit.toString(), totalCredit.toString());
    }

    // Create entries and update balances
    const createdEntries = [];

    for (const entry of entries) {
      // Get current account balance
      // entry.account_id can be either entity_id (from transaction service) or account.id (from reverse)
      // Try entity_id first (unique index), then fall back to id (primary key)
      let account = await tx.account.findUnique({
        where: { entity_id: entry.account_id },
        select: { id: true, balance: true },
      });

      if (!account) {
        // Fallback: try by primary key (used in reverseEntries where account_id comes from ledger)
        account = await tx.account.findUnique({
          where: { id: entry.account_id },
          select: { id: true, balance: true },
        });
      }

      if (!account) {
        throw new NotFoundError('Account', entry.account_id);
      }

      // Calculate new balance based on account type
      // For ASSET accounts (FINANCIER, ORGANIZATION): DEBIT increases, CREDIT decreases
      // For LIABILITY accounts (SITE, PARTNER, EXTERNAL_PARTY): CREDIT increases, DEBIT decreases
      const currentBalance = new Decimal(account.balance);
      let newBalance: Decimal;

      // LIABILITY: Site (we owe them customer money), Partner (we owe commission), External Party (we owe debt)
      const isLiabilityAccount = (
        entry.account_type === EntityType.SITE ||
        entry.account_type === EntityType.PARTNER ||
        entry.account_type === EntityType.EXTERNAL_PARTY
      );

      // ASSET: Financier (holds money for us), Organization (our profit/capital)
      const isAssetAccount = (
        entry.account_type === EntityType.FINANCIER ||
        entry.account_type === EntityType.ORGANIZATION
      );

      if (isAssetAccount) {
        // Asset: DEBIT increases, CREDIT decreases
        if (entry.entry_type === LedgerEntryType.DEBIT) {
          newBalance = currentBalance.plus(entry.amount);
        } else {
          newBalance = currentBalance.minus(entry.amount);
        }
      } else if (isLiabilityAccount) {
        // Liability: CREDIT increases, DEBIT decreases
        if (entry.entry_type === LedgerEntryType.CREDIT) {
          newBalance = currentBalance.plus(entry.amount);
        } else {
          newBalance = currentBalance.minus(entry.amount);
        }
      } else {
        // Fallback for unknown account types
        throw new BusinessError(
          `Unknown account type: ${entry.account_type}`,
          'UNKNOWN_ACCOUNT_TYPE'
        );
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
   * Undo ledger entries for a transaction (for edit feature)
   * Unlike reverseEntries, this DELETES the old entries and restores account balances
   * Used when editing a transaction: first undo old entries, then create new ones
   */
  async undoEntries(
    transactionId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // Get all ledger entries for this transaction
    const entries = await tx.ledgerEntry.findMany({
      where: { transaction_id: transactionId },
    });

    if (entries.length === 0) {
      throw new NotFoundError('LedgerEntries for transaction', transactionId);
    }

    // Reverse balance effects for each entry
    for (const entry of entries) {
      const account = await tx.account.findUnique({
        where: { id: entry.account_id },
        select: { id: true, balance: true },
      });

      if (!account) {
        throw new NotFoundError('Account', entry.account_id);
      }

      const currentBalance = new Decimal(account.balance);
      let restoredBalance: Decimal;

      // LIABILITY: Site, Partner, External Party
      const isLiabilityAccount = (
        entry.account_type === EntityType.SITE ||
        entry.account_type === EntityType.PARTNER ||
        entry.account_type === EntityType.EXTERNAL_PARTY
      );

      // ASSET: Financier, Organization
      const isAssetAccount = (
        entry.account_type === EntityType.FINANCIER ||
        entry.account_type === EntityType.ORGANIZATION
      );

      if (isAssetAccount) {
        // Asset: DEBIT increased balance → undo by subtracting
        // Asset: CREDIT decreased balance → undo by adding
        if (entry.entry_type === LedgerEntryType.DEBIT) {
          restoredBalance = currentBalance.minus(entry.amount);
        } else {
          restoredBalance = currentBalance.plus(entry.amount);
        }
      } else if (isLiabilityAccount) {
        // Liability: CREDIT increased balance → undo by subtracting
        // Liability: DEBIT decreased balance → undo by adding
        if (entry.entry_type === LedgerEntryType.CREDIT) {
          restoredBalance = currentBalance.minus(entry.amount);
        } else {
          restoredBalance = currentBalance.plus(entry.amount);
        }
      } else {
        throw new BusinessError(
          `Unknown account type: ${entry.account_type}`,
          'UNKNOWN_ACCOUNT_TYPE'
        );
      }

      // Restore account balance
      await tx.account.update({
        where: { id: account.id },
        data: { balance: restoredBalance },
      });
    }

    // Delete old ledger entries
    await tx.ledgerEntry.deleteMany({
      where: { transaction_id: transactionId },
    });

    logger.info(
      {
        transactionId,
        entriesRemoved: entries.length,
      },
      'Ledger entries undone (for edit)'
    );
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
    const difference = debitTotal.minus(creditTotal);
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

    return totalDebit.minus(totalCredit);
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
    const difference = storedBalance.minus(calculatedBalance);
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
