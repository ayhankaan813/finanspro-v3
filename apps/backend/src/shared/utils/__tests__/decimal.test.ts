import { describe, it, expect } from 'vitest';
import {
  toDecimal,
  formatMoney,
  parseMoney,
  isEqual,
  isZero,
  isPositive,
  isNegative,
  percentage,
  sum,
  Decimal,
} from '../decimal.js';

describe('Decimal Utilities', () => {
  describe('toDecimal', () => {
    it('should convert string to Decimal', () => {
      const result = toDecimal('100.50');
      expect(result.toString()).toBe('100.5');
    });

    it('should convert number to Decimal', () => {
      const result = toDecimal(100.50);
      expect(result.toString()).toBe('100.5');
    });

    it('should accept Decimal input', () => {
      const input = new Decimal('99.99');
      const result = toDecimal(input);
      expect(result.eq(input)).toBe(true);
    });

    it('should handle zero', () => {
      expect(toDecimal(0).isZero()).toBe(true);
      expect(toDecimal('0').isZero()).toBe(true);
    });

    it('should handle negative values', () => {
      const result = toDecimal('-500.75');
      expect(result.isNegative()).toBe(true);
      expect(result.toString()).toBe('-500.75');
    });
  });

  describe('formatMoney', () => {
    it('should format basic amount with ₺', () => {
      // Backend formatMoney uses dot as thousands separator but keeps dot for decimal
      expect(formatMoney('1000')).toBe('1.000.00 ₺');
    });

    it('should format decimal amount', () => {
      expect(formatMoney('1234.56')).toBe('1.234.56 ₺');
    });

    it('should format large amounts', () => {
      expect(formatMoney('1000000')).toBe('1.000.000.00 ₺');
    });

    it('should format zero', () => {
      expect(formatMoney(0)).toBe('0.00 ₺');
    });

    it('should format negative amounts', () => {
      expect(formatMoney('-500.25')).toBe('-500.25 ₺');
    });

    it('should use custom currency', () => {
      expect(formatMoney('100', '$')).toBe('100.00 $');
    });

    it('should always have 2 decimal places', () => {
      expect(formatMoney('100')).toMatch(/\.00/);
      expect(formatMoney('100.1')).toMatch(/\.10/);
    });
  });

  describe('parseMoney', () => {
    it('should parse Turkish formatted money', () => {
      const result = parseMoney('1.234,56 ₺');
      expect(result.toString()).toBe('1234.56');
    });

    it('should parse amount without currency', () => {
      const result = parseMoney('5.000,00');
      expect(result.toString()).toBe('5000');
    });

    it('should parse simple amount', () => {
      const result = parseMoney('100');
      expect(result.toString()).toBe('100');
    });
  });

  describe('comparison functions', () => {
    it('isEqual should detect equal decimals', () => {
      expect(isEqual(new Decimal('100'), new Decimal('100.00'))).toBe(true);
      expect(isEqual(new Decimal('100'), new Decimal('101'))).toBe(false);
    });

    it('isZero should detect zero', () => {
      expect(isZero(new Decimal(0))).toBe(true);
      expect(isZero(new Decimal('0.00'))).toBe(true);
      expect(isZero(new Decimal(1))).toBe(false);
    });

    it('isPositive should detect positive non-zero', () => {
      expect(isPositive(new Decimal('100'))).toBe(true);
      expect(isPositive(new Decimal('0'))).toBe(false);
      expect(isPositive(new Decimal('-1'))).toBe(false);
    });

    it('isNegative should detect negative', () => {
      expect(isNegative(new Decimal('-100'))).toBe(true);
      expect(isNegative(new Decimal('0'))).toBe(false);
      expect(isNegative(new Decimal('1'))).toBe(false);
    });
  });

  describe('percentage', () => {
    it('should calculate percentage correctly', () => {
      // 1000 * 0.06 = 60 (6%)
      const result = percentage(new Decimal('1000'), new Decimal('0.06'));
      expect(result.toString()).toBe('60');
    });

    it('should handle small percentages', () => {
      // 10000 * 0.015 = 150 (1.5%)
      const result = percentage(new Decimal('10000'), new Decimal('0.015'));
      expect(result.toString()).toBe('150');
    });

    it('should handle zero percentage', () => {
      const result = percentage(new Decimal('1000'), new Decimal('0'));
      expect(result.isZero()).toBe(true);
    });
  });

  describe('sum', () => {
    it('should sum array of decimals', () => {
      const values = [new Decimal('10'), new Decimal('20'), new Decimal('30')];
      expect(sum(values).toString()).toBe('60');
    });

    it('should handle empty array', () => {
      expect(sum([]).isZero()).toBe(true);
    });

    it('should handle negative values in sum', () => {
      const values = [new Decimal('100'), new Decimal('-30'), new Decimal('50')];
      expect(sum(values).toString()).toBe('120');
    });

    it('should maintain precision', () => {
      const values = [new Decimal('0.1'), new Decimal('0.2')];
      expect(sum(values).toString()).toBe('0.3');
    });
  });

  describe('financial precision', () => {
    it('should not have floating point issues with 0.1 + 0.2', () => {
      const a = new Decimal('0.1');
      const b = new Decimal('0.2');
      expect(a.plus(b).toString()).toBe('0.3');
    });

    it('should handle commission calculation correctly', () => {
      // Deposit 10000 TL, site commission 6%, partner 1.5%, financier 2.5%, org 2%
      const amount = new Decimal('10000');
      const siteRate = new Decimal('0.06');
      const partnerRate = new Decimal('0.015');
      const financierRate = new Decimal('0.025');

      const siteCommission = amount.times(siteRate); // 600
      const partnerCommission = amount.times(partnerRate); // 150
      const financierCommission = amount.times(financierRate); // 250
      const orgProfit = siteCommission.minus(partnerCommission).minus(financierCommission); // 200

      expect(siteCommission.toString()).toBe('600');
      expect(partnerCommission.toString()).toBe('150');
      expect(financierCommission.toString()).toBe('250');
      expect(orgProfit.toString()).toBe('200');

      // Verify: partner + financier + org = site commission
      const total = partnerCommission.plus(financierCommission).plus(orgProfit);
      expect(total.eq(siteCommission)).toBe(true);
    });

    it('should handle rounding with toDecimalPlaces(2)', () => {
      const amount = new Decimal('9999');
      const rate = new Decimal('0.033'); // 3.3%
      const commission = amount.times(rate).toDecimalPlaces(2);
      expect(commission.toString()).toBe('329.97');
    });
  });
});
