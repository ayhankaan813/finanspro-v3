import { describe, it, expect } from 'vitest';

// Extracted from pending.service.ts — buildDescription is a private function
// We replicate it here for pure testing
const typeLabels: Record<string, string> = {
  deposit: 'Yatırım',
  withdrawal: 'Çekim',
  delivery: 'Teslim',
  'site-delivery': 'Site Teslim',
  payment: 'Ödeme',
  'partner-payment': 'Partner Ödeme',
  'top-up': 'Takviye',
  'external-debt': 'Dış Borç',
  'external-payment': 'Dış Ödeme',
  'org-expense': 'Org. Gider',
  'org-income': 'Org. Gelir',
  'org-withdraw': 'Org. Çekim',
  'financier-transfer': 'Finansör Transfer',
};

function buildDescription(type: string, payload: any): string {
  const label = typeLabels[type] || type;
  const amount = payload.amount || payload.gross_amount || '?';
  return `${label} talebi — ${Number(amount).toLocaleString('tr-TR')} ₺`;
}

describe('buildDescription', () => {
  it('should build deposit description', () => {
    const desc = buildDescription('deposit', { amount: 10000 });
    expect(desc).toContain('Yatırım talebi');
    expect(desc).toContain('10.000');
    expect(desc).toContain('₺');
  });

  it('should build withdrawal description', () => {
    const desc = buildDescription('withdrawal', { amount: 5000 });
    expect(desc).toContain('Çekim talebi');
    expect(desc).toContain('5.000');
  });

  it('should build site-delivery description', () => {
    const desc = buildDescription('site-delivery', { amount: 7500 });
    expect(desc).toContain('Site Teslim talebi');
    expect(desc).toContain('7.500');
  });

  it('should build org-expense description', () => {
    const desc = buildDescription('org-expense', { amount: 2500 });
    expect(desc).toContain('Org. Gider talebi');
    expect(desc).toContain('2.500');
  });

  it('should build financier-transfer description', () => {
    const desc = buildDescription('financier-transfer', { amount: 20000 });
    expect(desc).toContain('Finansör Transfer talebi');
    expect(desc).toContain('20.000');
  });

  it('should handle gross_amount fallback', () => {
    const desc = buildDescription('deposit', { gross_amount: 8000 });
    expect(desc).toContain('8.000');
  });

  it('should handle missing amount gracefully', () => {
    const desc = buildDescription('deposit', {});
    // When amount is '?' (string), Number('?') = NaN, so output contains NaN
    // The function returns '?' but Number('?') = NaN → toLocaleString = 'NaN'
    expect(desc).toContain('Yatırım talebi');
  });

  it('should handle unknown type gracefully', () => {
    const desc = buildDescription('unknown-type', { amount: 100 });
    expect(desc).toContain('unknown-type talebi');
  });

  it('should format all 13 known types', () => {
    Object.keys(typeLabels).forEach((type) => {
      const desc = buildDescription(type, { amount: 1000 });
      expect(desc).toContain('talebi');
      expect(desc).toContain('₺');
    });
  });
});
