/**
 * Tests for ledger balance validation logic
 * Pure logic: Debit must equal Credit (double-entry bookkeeping)
 */
import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import { LedgerImbalanceError, BusinessError } from '../../../shared/utils/errors.js';

// Extracted pure validation functions from LedgerService
function validateEntries(entries: Array<{ entry_type: 'DEBIT' | 'CREDIT'; amount: Decimal }>) {
  if (entries.length === 0) {
    throw new BusinessError('Ledger entries cannot be empty', 'NO_LEDGER_ENTRIES');
  }

  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  for (const entry of entries) {
    if (entry.entry_type === 'DEBIT') {
      totalDebit = totalDebit.plus(entry.amount);
    } else {
      totalCredit = totalCredit.plus(entry.amount);
    }
  }

  if (!totalDebit.eq(totalCredit)) {
    throw new LedgerImbalanceError(totalDebit.toString(), totalCredit.toString());
  }

  return { totalDebit, totalCredit };
}

describe('Ledger Balance Validation', () => {
  it('should pass when debit equals credit (simple)', () => {
    const entries = [
      { entry_type: 'DEBIT' as const, amount: new Decimal('1000') },
      { entry_type: 'CREDIT' as const, amount: new Decimal('1000') },
    ];
    const result = validateEntries(entries);
    expect(result.totalDebit.toString()).toBe('1000');
    expect(result.totalCredit.toString()).toBe('1000');
  });

  it('should pass when multiple debits and credits balance', () => {
    // Deposit scenario: Site gets debit (-), Financier gets credit (+), commissions split
    const entries = [
      { entry_type: 'DEBIT' as const, amount: new Decimal('600') },   // Site commission
      { entry_type: 'CREDIT' as const, amount: new Decimal('150') },  // Partner commission
      { entry_type: 'CREDIT' as const, amount: new Decimal('250') },  // Financier commission
      { entry_type: 'CREDIT' as const, amount: new Decimal('200') },  // Organization profit
    ];
    const result = validateEntries(entries);
    expect(result.totalDebit.eq(result.totalCredit)).toBe(true);
  });

  it('should fail when debit exceeds credit', () => {
    const entries = [
      { entry_type: 'DEBIT' as const, amount: new Decimal('1000') },
      { entry_type: 'CREDIT' as const, amount: new Decimal('999') },
    ];
    expect(() => validateEntries(entries)).toThrow(LedgerImbalanceError);
  });

  it('should fail when credit exceeds debit', () => {
    const entries = [
      { entry_type: 'DEBIT' as const, amount: new Decimal('500') },
      { entry_type: 'CREDIT' as const, amount: new Decimal('501') },
    ];
    expect(() => validateEntries(entries)).toThrow(LedgerImbalanceError);
  });

  it('should fail with empty entries', () => {
    expect(() => validateEntries([])).toThrow(BusinessError);
  });

  it('should handle precise decimal amounts', () => {
    const entries = [
      { entry_type: 'DEBIT' as const, amount: new Decimal('333.33') },
      { entry_type: 'DEBIT' as const, amount: new Decimal('333.34') },
      { entry_type: 'CREDIT' as const, amount: new Decimal('666.67') },
    ];
    const result = validateEntries(entries);
    expect(result.totalDebit.eq(result.totalCredit)).toBe(true);
  });

  it('should detect tiny imbalance (1 kuruş difference)', () => {
    const entries = [
      { entry_type: 'DEBIT' as const, amount: new Decimal('1000.00') },
      { entry_type: 'CREDIT' as const, amount: new Decimal('999.99') },
    ];
    expect(() => validateEntries(entries)).toThrow(LedgerImbalanceError);
  });

  describe('realistic transaction scenarios', () => {
    it('should validate deposit scenario (10,000 TL, 6% commission)', () => {
      const amount = new Decimal('10000');
      const siteCommission = new Decimal('600');    // 6%
      const partnerShare = new Decimal('150');       // 1.5%
      const financierShare = new Decimal('250');     // 2.5%
      const orgProfit = new Decimal('200');          // 2%

      // Double entry for deposit:
      // DEBIT: Financier account (receives cash)
      // CREDIT: Site account (owes the deposit to player)
      const mainEntries = [
        { entry_type: 'DEBIT' as const, amount },
        { entry_type: 'CREDIT' as const, amount },
      ];
      expect(() => validateEntries(mainEntries)).not.toThrow();

      // Commission entries:
      // DEBIT: Site commission pool
      // CREDIT: Partner + Financier + Org
      const commissionEntries = [
        { entry_type: 'DEBIT' as const, amount: siteCommission },
        { entry_type: 'CREDIT' as const, amount: partnerShare },
        { entry_type: 'CREDIT' as const, amount: financierShare },
        { entry_type: 'CREDIT' as const, amount: orgProfit },
      ];
      expect(() => validateEntries(commissionEntries)).not.toThrow();
    });

    it('should validate simple delivery (no commissions)', () => {
      const amount = new Decimal('5000');
      const entries = [
        { entry_type: 'DEBIT' as const, amount },
        { entry_type: 'CREDIT' as const, amount },
      ];
      expect(() => validateEntries(entries)).not.toThrow();
    });
  });
});
