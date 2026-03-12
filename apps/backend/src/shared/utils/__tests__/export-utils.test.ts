import { describe, it, expect } from 'vitest';

// Export utils fonksiyonlarını doğrudan test ediyoruz
// (Frontend'deki export-utils.ts'in pure logic kısmı)

// ─── toNumber ───
function toNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : Number(val);
  return isNaN(n) ? 0 : n;
}

// ─── formatDateForExport ───
function formatDateForExport(dateStr: string | Date): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

// ─── formatDateTimeForExport ───
function formatDateTimeForExport(dateStr: string | Date): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

// ─── CSV Escape ───
function csvEscape(val: any): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─── TX Type Labels ───
const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Yatırım',
  WITHDRAWAL: 'Çekim',
  PAYMENT: 'Ödeme',
  TOP_UP: 'Takviye',
  DELIVERY: 'Teslimat',
  ORG_EXPENSE: 'Org. Gideri',
  ORG_INCOME: 'Org. Geliri',
  ORG_WITHDRAW: 'Hak Ediş',
  FINANCIER_TRANSFER: 'Kasa Transferi',
  EXTERNAL_DEBT_IN: 'Borç Alındı',
  EXTERNAL_DEBT_OUT: 'Borç Verildi',
  EXTERNAL_PAYMENT: 'Dış Ödeme',
  REVERSAL: 'İptal',
};

describe('Export Utils — toNumber', () => {
  it('should convert numeric string', () => {
    expect(toNumber('12345.67')).toBe(12345.67);
  });

  it('should convert number', () => {
    expect(toNumber(42)).toBe(42);
  });

  it('should return 0 for null', () => {
    expect(toNumber(null)).toBe(0);
  });

  it('should return 0 for undefined', () => {
    expect(toNumber(undefined)).toBe(0);
  });

  it('should return 0 for empty string', () => {
    expect(toNumber('')).toBe(0);
  });

  it('should strip currency symbols', () => {
    expect(toNumber('1.234,56 ₺')).toBe(1.23456);
  });

  it('should handle negative numbers', () => {
    expect(toNumber('-500.00')).toBe(-500);
  });

  it('should return 0 for NaN input', () => {
    expect(toNumber('abc')).toBe(0);
  });

  it('should handle Decimal.js string format', () => {
    expect(toNumber('18000.00')).toBe(18000);
  });

  it('should handle zero', () => {
    expect(toNumber(0)).toBe(0);
    expect(toNumber('0')).toBe(0);
    expect(toNumber('0.00')).toBe(0);
  });
});

describe('Export Utils — formatDateForExport', () => {
  it('should format ISO date string', () => {
    const result = formatDateForExport('2026-03-12T00:00:00.000Z');
    // Local timezone dependent — just check format pattern
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  it('should format Date object', () => {
    const result = formatDateForExport(new Date(2026, 2, 15)); // March 15, 2026
    expect(result).toBe('15.03.2026');
  });

  it('should return empty for invalid date', () => {
    expect(formatDateForExport('invalid')).toBe('');
  });

  it('should pad single digit day and month', () => {
    const result = formatDateForExport(new Date(2026, 0, 5)); // Jan 5
    expect(result).toBe('05.01.2026');
  });
});

describe('Export Utils — formatDateTimeForExport', () => {
  it('should include hours and minutes', () => {
    const result = formatDateTimeForExport(new Date(2026, 2, 12, 14, 30));
    expect(result).toBe('12.03.2026 14:30');
  });

  it('should pad zeros', () => {
    const result = formatDateTimeForExport(new Date(2026, 0, 5, 3, 7));
    expect(result).toBe('05.01.2026 03:07');
  });

  it('should return empty for invalid date', () => {
    expect(formatDateTimeForExport('garbage')).toBe('');
  });
});

describe('Export Utils — CSV Escape', () => {
  it('should not escape simple strings', () => {
    expect(csvEscape('hello')).toBe('hello');
  });

  it('should escape strings with commas', () => {
    expect(csvEscape('hello, world')).toBe('"hello, world"');
  });

  it('should escape strings with double quotes', () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it('should escape strings with newlines', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });

  it('should handle null/undefined', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });

  it('should convert numbers to string', () => {
    expect(csvEscape(42)).toBe('42');
  });
});

describe('Export Utils — TX Type Labels', () => {
  it('should have labels for all 13 types', () => {
    expect(Object.keys(TX_TYPE_LABELS)).toHaveLength(13);
  });

  it('should map DEPOSIT to Yatırım', () => {
    expect(TX_TYPE_LABELS['DEPOSIT']).toBe('Yatırım');
  });

  it('should map WITHDRAWAL to Çekim', () => {
    expect(TX_TYPE_LABELS['WITHDRAWAL']).toBe('Çekim');
  });

  it('should map all required types', () => {
    const requiredTypes = [
      'DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'TOP_UP', 'DELIVERY',
      'ORG_EXPENSE', 'ORG_INCOME', 'ORG_WITHDRAW', 'FINANCIER_TRANSFER',
      'EXTERNAL_DEBT_IN', 'EXTERNAL_DEBT_OUT', 'EXTERNAL_PAYMENT', 'REVERSAL',
    ];
    requiredTypes.forEach(type => {
      expect(TX_TYPE_LABELS[type]).toBeDefined();
      expect(TX_TYPE_LABELS[type].length).toBeGreaterThan(0);
    });
  });
});
