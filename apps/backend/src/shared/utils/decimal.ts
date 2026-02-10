import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 9,
});

/**
 * Create a new Decimal from various inputs
 */
export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Format decimal for display (Turkish locale)
 */
export function formatMoney(value: Decimal | string | number, currency: string = '₺'): string {
  const decimal = toDecimal(value);
  return `${decimal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ${currency}`;
}

/**
 * Parse Turkish formatted money string to Decimal
 */
export function parseMoney(value: string): Decimal {
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[₺\s]/g, '');
  // Replace Turkish decimal separator
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return new Decimal(normalized);
}

/**
 * Check if two decimals are equal
 */
export function isEqual(a: Decimal, b: Decimal): boolean {
  return a.eq(b);
}

/**
 * Check if decimal is zero
 */
export function isZero(value: Decimal): boolean {
  return value.isZero();
}

/**
 * Check if decimal is positive
 */
export function isPositive(value: Decimal): boolean {
  return value.isPositive() && !value.isZero();
}

/**
 * Check if decimal is negative
 */
export function isNegative(value: Decimal): boolean {
  return value.isNegative();
}

/**
 * Calculate percentage
 */
export function percentage(value: Decimal, percent: Decimal): Decimal {
  return value.mul(percent);
}

/**
 * Sum array of decimals
 */
export function sum(values: Decimal[]): Decimal {
  return values.reduce((acc, val) => acc.add(val), new Decimal(0));
}

export { Decimal };
