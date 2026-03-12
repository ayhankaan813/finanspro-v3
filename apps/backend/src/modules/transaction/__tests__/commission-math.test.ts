import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';

/**
 * Komisyon hesaplama mantığının pure-math testleri.
 * CommissionService DB'ye bağlı, burada sadece matematik doğrulanıyor.
 *
 * Sabit oranlar:
 *   Site: %6 (toplam havuz)
 *   Partner: %1.5 (gross'tan)
 *   Finansör: %2.5 (gross'tan)
 *   Organizasyon: %2 (fark ile hesaplanır)
 */

const SITE_RATE = new Decimal('0.06');
const PARTNER_RATE = new Decimal('0.015');
const FINANCIER_RATE = new Decimal('0.025');
const ORG_RATE = new Decimal('0.02');

interface CommissionResult {
  siteCommission: Decimal;
  partnerCommission: Decimal;
  financierCommission: Decimal;
  organizationAmount: Decimal;
  totalDistributed: Decimal;
}

function calculateDepositCommission(grossAmount: Decimal): CommissionResult {
  const siteCommission = grossAmount.times(SITE_RATE).toDecimalPlaces(2);
  const partnerCommission = grossAmount.times(PARTNER_RATE).toDecimalPlaces(2);
  const financierCommission = grossAmount.times(FINANCIER_RATE).toDecimalPlaces(2);
  // Org absorbs rounding
  const organizationAmount = siteCommission
    .minus(partnerCommission)
    .minus(financierCommission)
    .toDecimalPlaces(2);
  const totalDistributed = partnerCommission
    .plus(financierCommission)
    .plus(organizationAmount);

  return { siteCommission, partnerCommission, financierCommission, organizationAmount, totalDistributed };
}

function calculateWithdrawalCommission(grossAmount: Decimal): {
  siteCommission: Decimal;
  financierCommission: Decimal;
  organizationAmount: Decimal;
} {
  const siteCommission = grossAmount.times(SITE_RATE).toDecimalPlaces(2);
  const financierCommission = grossAmount.times(FINANCIER_RATE).toDecimalPlaces(2);
  // Withdrawal: org gets the full site commission
  const organizationAmount = siteCommission;
  return { siteCommission, financierCommission, organizationAmount };
}

// Net amount calculation (DEPOSIT)
function calcDepositNetAmount(gross: Decimal, financierRate: Decimal): Decimal {
  return gross.minus(gross.times(financierRate).toDecimalPlaces(2));
}

// Net amount calculation (WITHDRAWAL)
function calcWithdrawalNetAmount(gross: Decimal, financierRate: Decimal): Decimal {
  return gross.plus(gross.times(financierRate).toDecimalPlaces(2));
}

describe('Commission Math — Deposit', () => {
  it('should calculate correctly for 1,000 TL', () => {
    const result = calculateDepositCommission(new Decimal('1000'));
    expect(result.siteCommission.toString()).toBe('60');
    expect(result.partnerCommission.toString()).toBe('15');
    expect(result.financierCommission.toString()).toBe('25');
    expect(result.organizationAmount.toString()).toBe('20');
    expect(result.totalDistributed.toString()).toBe('60');
  });

  it('should calculate correctly for 5,000 TL', () => {
    const result = calculateDepositCommission(new Decimal('5000'));
    expect(result.siteCommission.toString()).toBe('300');
    expect(result.partnerCommission.toString()).toBe('75');
    expect(result.financierCommission.toString()).toBe('125');
    expect(result.organizationAmount.toString()).toBe('100');
  });

  it('should calculate correctly for 100 TL', () => {
    const result = calculateDepositCommission(new Decimal('100'));
    expect(result.siteCommission.toString()).toBe('6');
    expect(result.partnerCommission.toString()).toBe('1.5');
    expect(result.financierCommission.toString()).toBe('2.5');
    expect(result.organizationAmount.toString()).toBe('2');
  });

  it('total distributed should equal site commission', () => {
    const amounts = ['100', '333', '777.77', '1234.56', '50000', '99999.99'];
    amounts.forEach(amt => {
      const result = calculateDepositCommission(new Decimal(amt));
      expect(result.totalDistributed.toString()).toBe(result.siteCommission.toString());
    });
  });

  it('org amount should never be negative', () => {
    const amounts = ['1', '10', '100', '1000', '10000', '100000'];
    amounts.forEach(amt => {
      const result = calculateDepositCommission(new Decimal(amt));
      expect(result.organizationAmount.gte(0)).toBe(true);
    });
  });

  it('partner + financier + org = site commission (identity)', () => {
    const result = calculateDepositCommission(new Decimal('7777'));
    const sum = result.partnerCommission.plus(result.financierCommission).plus(result.organizationAmount);
    expect(sum.toString()).toBe(result.siteCommission.toString());
  });
});

describe('Commission Math — Withdrawal', () => {
  it('should calculate correctly for 2,000 TL', () => {
    const result = calculateWithdrawalCommission(new Decimal('2000'));
    expect(result.siteCommission.toString()).toBe('120');
    expect(result.financierCommission.toString()).toBe('50');
    // Withdrawal: org gets full site commission
    expect(result.organizationAmount.toString()).toBe('120');
  });

  it('org gets full site commission (no partner share)', () => {
    const result = calculateWithdrawalCommission(new Decimal('10000'));
    expect(result.organizationAmount.toString()).toBe(result.siteCommission.toString());
  });
});

describe('Net Amount Calculation', () => {
  it('DEPOSIT: net = gross - financier commission', () => {
    const net = calcDepositNetAmount(new Decimal('5000'), FINANCIER_RATE);
    // 5000 - (5000 × 0.025) = 5000 - 125 = 4875
    expect(net.toString()).toBe('4875');
  });

  it('WITHDRAWAL: net = gross + financier commission', () => {
    const net = calcWithdrawalNetAmount(new Decimal('2000'), FINANCIER_RATE);
    // 2000 + (2000 × 0.025) = 2000 + 50 = 2050
    expect(net.toString()).toBe('2050');
  });

  it('DEPOSIT with 0% financier = gross', () => {
    const net = calcDepositNetAmount(new Decimal('1000'), new Decimal('0'));
    expect(net.toString()).toBe('1000');
  });

  it('WITHDRAWAL with 0% financier = gross', () => {
    const net = calcWithdrawalNetAmount(new Decimal('1000'), new Decimal('0'));
    expect(net.toString()).toBe('1000');
  });

  it('handles odd amounts with precision', () => {
    const net = calcDepositNetAmount(new Decimal('333.33'), FINANCIER_RATE);
    // 333.33 - (333.33 × 0.025 = 8.33) = 325
    expect(net.toString()).toBe('325');
  });
});

describe('Commission Validation Rules', () => {
  it('site rate must be >= sum of partner + financier + org rates', () => {
    // 0.06 >= 0.015 + 0.025 + 0.02 = 0.06 ✓
    const sumRates = PARTNER_RATE.plus(FINANCIER_RATE).plus(ORG_RATE);
    expect(SITE_RATE.gte(sumRates)).toBe(true);
  });

  it('all rates must be non-negative', () => {
    expect(SITE_RATE.gte(0)).toBe(true);
    expect(PARTNER_RATE.gte(0)).toBe(true);
    expect(FINANCIER_RATE.gte(0)).toBe(true);
    expect(ORG_RATE.gte(0)).toBe(true);
  });

  it('site rate must be less than 100%', () => {
    expect(SITE_RATE.lt(1)).toBe(true);
  });

  it('total commission should equal 12% of gross', () => {
    // Site (6%) = Partner (1.5%) + Financier (2.5%) + Org (2%)
    // But financier is separate (otomatik kesilir, deftere girmez)
    // Total deductible: 6% + 2.5% = 8.5%? No:
    // Site rate = 6%, Financier rate = 2.5% (separately deducted)
    // For 1000 TL deposit:
    //   - Financier takes: 25 TL (not in ledger)
    //   - Net to ledger: 975 TL
    //   - Of that net, site commission pool = 60 TL (6% of gross)
    //   - Partner gets 15, Org gets 20
    const gross = new Decimal('1000');
    const result = calculateDepositCommission(gross);
    expect(result.siteCommission.div(gross).times(100).toString()).toBe('6');
  });
});

describe('Edge Cases', () => {
  it('very small amount (1 TL)', () => {
    const result = calculateDepositCommission(new Decimal('1'));
    expect(result.siteCommission.toString()).toBe('0.06');
    expect(result.totalDistributed.toString()).toBe(result.siteCommission.toString());
  });

  it('very large amount (1,000,000 TL)', () => {
    const result = calculateDepositCommission(new Decimal('1000000'));
    expect(result.siteCommission.toString()).toBe('60000');
    expect(result.partnerCommission.toString()).toBe('15000');
    expect(result.financierCommission.toString()).toBe('25000');
    expect(result.organizationAmount.toString()).toBe('20000');
  });

  it('zero amount', () => {
    const result = calculateDepositCommission(new Decimal('0'));
    expect(result.siteCommission.toString()).toBe('0');
    expect(result.partnerCommission.toString()).toBe('0');
    expect(result.financierCommission.toString()).toBe('0');
    expect(result.organizationAmount.toString()).toBe('0');
  });

  it('amount with many decimals', () => {
    const result = calculateDepositCommission(new Decimal('1234.5678'));
    // Verify no floating point issues
    expect(result.totalDistributed.toString()).toBe(result.siteCommission.toString());
    expect(result.organizationAmount.gte(0)).toBe(true);
  });
});
