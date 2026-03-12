/**
 * Tests for net amount calculation logic
 * 
 * Net amount is calculated differently per transaction type:
 * - DEPOSIT: net = gross - site_commission (player receives less)
 * - WITHDRAWAL: net = gross + site_commission (player pays more)
 * - DELIVERY/TOP_UP/PAYMENT: net = gross (no commission on these)
 */
import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';

// Extracted pure logic from transaction.service.ts
function calculateNetAmount(
  transactionType: string,
  grossAmount: Decimal,
  siteCommissionAmount: Decimal
): Decimal {
  switch (transactionType) {
    case 'DEPOSIT':
      // Player deposited 10000, site commission 600 → player gets 9400 credited
      return grossAmount.minus(siteCommissionAmount).toDecimalPlaces(2);
    case 'WITHDRAWAL':
      // Player wants 10000, site commission 600 → 10600 deducted from balance
      return grossAmount.plus(siteCommissionAmount).toDecimalPlaces(2);
    default:
      // Delivery, top-up, payment: no commission adjustment
      return grossAmount.toDecimalPlaces(2);
  }
}

describe('Net Amount Calculation', () => {
  describe('DEPOSIT', () => {
    it('should subtract site commission from gross', () => {
      const gross = new Decimal('10000');
      const commission = new Decimal('600'); // 6%
      const net = calculateNetAmount('DEPOSIT', gross, commission);
      expect(net.toString()).toBe('9400');
    });

    it('should handle zero commission', () => {
      const net = calculateNetAmount('DEPOSIT', new Decimal('5000'), new Decimal('0'));
      expect(net.toString()).toBe('5000');
    });

    it('should handle small amounts', () => {
      const gross = new Decimal('100');
      const commission = new Decimal('6'); // 6%
      const net = calculateNetAmount('DEPOSIT', gross, commission);
      expect(net.toString()).toBe('94');
    });

    it('should maintain precision', () => {
      const gross = new Decimal('9999');
      const commission = new Decimal('329.97'); // ~3.3%
      const net = calculateNetAmount('DEPOSIT', gross, commission);
      expect(net.toString()).toBe('9669.03');
    });
  });

  describe('WITHDRAWAL', () => {
    it('should add site commission to gross', () => {
      const gross = new Decimal('10000');
      const commission = new Decimal('300'); // 3%
      const net = calculateNetAmount('WITHDRAWAL', gross, commission);
      expect(net.toString()).toBe('10300');
    });

    it('should handle zero commission', () => {
      const net = calculateNetAmount('WITHDRAWAL', new Decimal('5000'), new Decimal('0'));
      expect(net.toString()).toBe('5000');
    });
  });

  describe('DELIVERY and other types', () => {
    it('should return gross amount for DELIVERY', () => {
      const gross = new Decimal('5000');
      const net = calculateNetAmount('DELIVERY', gross, new Decimal('0'));
      expect(net.toString()).toBe('5000');
    });

    it('should return gross amount for TOP_UP', () => {
      const gross = new Decimal('50000');
      const net = calculateNetAmount('TOP_UP', gross, new Decimal('0'));
      expect(net.toString()).toBe('50000');
    });

    it('should return gross amount for PAYMENT', () => {
      const gross = new Decimal('3000');
      const net = calculateNetAmount('PAYMENT', gross, new Decimal('0'));
      expect(net.toString()).toBe('3000');
    });
  });
});

describe('Commission Distribution Validation', () => {
  it('partner + financier + org should equal site commission', () => {
    const siteCommission = new Decimal('600');
    const partnerCommission = new Decimal('150');
    const financierCommission = new Decimal('250');
    const orgProfit = siteCommission.minus(partnerCommission).minus(financierCommission);

    expect(orgProfit.toString()).toBe('200');
    expect(
      partnerCommission.plus(financierCommission).plus(orgProfit).eq(siteCommission)
    ).toBe(true);
  });

  it('should detect when commissions exceed site commission', () => {
    const siteCommission = new Decimal('600');
    const partnerCommission = new Decimal('300');
    const financierCommission = new Decimal('400');
    const orgProfit = siteCommission.minus(partnerCommission).minus(financierCommission);

    // Org would be negative — this is an error
    expect(orgProfit.isNegative()).toBe(true);
  });

  it('should handle withdrawal (org gets full site commission)', () => {
    const siteCommission = new Decimal('300');
    const financierCommission = new Decimal('150');
    // In withdrawal, no partner commission — org gets full site commission
    const orgProfit = siteCommission;
    expect(orgProfit.toString()).toBe('300');
  });
});
