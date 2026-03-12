import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';

/**
 * Kasa raporu hesaplama mantığını test eder.
 * Kasa = Devir + (Girişler) - (Çıkışlar)
 *
 * GİRİŞLER (kasaya para giren):
 *   - DEPOSIT (yatırım)
 *   - TOP_UP (takviye)
 *   - EXTERNAL_DEBT_IN (dış borç alma)
 *
 * ÇIKIŞLAR (kasadan para çıkan):
 *   - WITHDRAWAL (çekim)
 *   - DELIVERY (teslimat)
 *   - PAYMENT (ödeme)
 *   - ORG_EXPENSE (org gideri)
 *   - ORG_WITHDRAW (hak ediş)
 *   - EXTERNAL_DEBT_OUT (dış borç verme)
 *   - EXTERNAL_PAYMENT (dış ödeme)
 *
 * NÖTR (kasa toplamı değişmez):
 *   - FINANCIER_TRANSFER (kasalar arası)
 *   - ORG_INCOME (org geliri — ayrı hesap)
 */

type TxType =
  | 'DEPOSIT' | 'WITHDRAWAL' | 'TOP_UP' | 'DELIVERY'
  | 'PAYMENT' | 'ORG_EXPENSE' | 'ORG_WITHDRAW' | 'ORG_INCOME'
  | 'FINANCIER_TRANSFER' | 'EXTERNAL_DEBT_IN' | 'EXTERNAL_DEBT_OUT'
  | 'EXTERNAL_PAYMENT';

interface SimpleTx {
  type: TxType;
  amount: number;
}

// Girişler
const INFLOW_TYPES: TxType[] = ['DEPOSIT', 'TOP_UP', 'EXTERNAL_DEBT_IN'];

// Çıkışlar
const OUTFLOW_TYPES: TxType[] = [
  'WITHDRAWAL', 'DELIVERY', 'PAYMENT', 'ORG_EXPENSE', 'ORG_WITHDRAW',
  'EXTERNAL_DEBT_OUT', 'EXTERNAL_PAYMENT',
];

// Nötr
const NEUTRAL_TYPES: TxType[] = ['FINANCIER_TRANSFER', 'ORG_INCOME'];

function calculateKasaBalance(devir: number, transactions: SimpleTx[]): number {
  let balance = new Decimal(devir);

  transactions.forEach(tx => {
    const amount = new Decimal(tx.amount);
    if (INFLOW_TYPES.includes(tx.type)) {
      balance = balance.plus(amount);
    } else if (OUTFLOW_TYPES.includes(tx.type)) {
      balance = balance.minus(amount);
    }
    // NEUTRAL types: no change
  });

  return balance.toNumber();
}

function calculateDailySummary(transactions: SimpleTx[]) {
  const summary = {
    yatirim: 0,
    cekim: 0,
    takviye: 0,
    teslim: 0,
    odeme: 0,
    orgKar: 0,
    netChange: 0,
  };

  transactions.forEach(tx => {
    const amt = tx.amount;
    switch (tx.type) {
      case 'DEPOSIT': summary.yatirim += amt; summary.netChange += amt; break;
      case 'WITHDRAWAL': summary.cekim += amt; summary.netChange -= amt; break;
      case 'TOP_UP': summary.takviye += amt; summary.netChange += amt; break;
      case 'DELIVERY': summary.teslim += amt; summary.netChange -= amt; break;
      case 'PAYMENT':
      case 'ORG_EXPENSE':
      case 'ORG_WITHDRAW':
      case 'EXTERNAL_DEBT_OUT':
      case 'EXTERNAL_PAYMENT':
        summary.odeme += amt; summary.netChange -= amt; break;
      case 'EXTERNAL_DEBT_IN':
        summary.takviye += amt; summary.netChange += amt; break;
      case 'ORG_INCOME':
        summary.orgKar += amt; break; // nötr
      case 'FINANCIER_TRANSFER':
        break; // nötr
    }
  });

  return summary;
}

describe('Kasa Balance Calculation', () => {
  it('should handle empty transactions', () => {
    expect(calculateKasaBalance(10000, [])).toBe(10000);
  });

  it('deposits increase balance', () => {
    const txs: SimpleTx[] = [
      { type: 'DEPOSIT', amount: 5000 },
      { type: 'DEPOSIT', amount: 3000 },
    ];
    expect(calculateKasaBalance(0, txs)).toBe(8000);
  });

  it('withdrawals decrease balance', () => {
    const txs: SimpleTx[] = [
      { type: 'WITHDRAWAL', amount: 2000 },
    ];
    expect(calculateKasaBalance(10000, txs)).toBe(8000);
  });

  it('mixed transactions', () => {
    const txs: SimpleTx[] = [
      { type: 'DEPOSIT', amount: 5000 },    // +5000 → 5000
      { type: 'WITHDRAWAL', amount: 2000 },  // -2000 → 3000
      { type: 'TOP_UP', amount: 50000 },     // +50000 → 53000
      { type: 'DELIVERY', amount: 3000 },    // -3000 → 50000
      { type: 'PAYMENT', amount: 1000 },     // -1000 → 49000
    ];
    expect(calculateKasaBalance(0, txs)).toBe(49000);
  });

  it('financier transfer does not change total balance', () => {
    const txs: SimpleTx[] = [
      { type: 'FINANCIER_TRANSFER', amount: 10000 },
    ];
    expect(calculateKasaBalance(50000, txs)).toBe(50000);
  });

  it('org income does not change kasa balance', () => {
    const txs: SimpleTx[] = [
      { type: 'ORG_INCOME', amount: 5000 },
    ];
    expect(calculateKasaBalance(50000, txs)).toBe(50000);
  });

  it('external debt in increases balance', () => {
    const txs: SimpleTx[] = [
      { type: 'EXTERNAL_DEBT_IN', amount: 20000 },
    ];
    expect(calculateKasaBalance(30000, txs)).toBe(50000);
  });

  it('external debt out decreases balance', () => {
    const txs: SimpleTx[] = [
      { type: 'EXTERNAL_DEBT_OUT', amount: 15000 },
    ];
    expect(calculateKasaBalance(50000, txs)).toBe(35000);
  });

  it('devir + netChange = endBalance', () => {
    const devir = 100000;
    const txs: SimpleTx[] = [
      { type: 'DEPOSIT', amount: 50000 },
      { type: 'WITHDRAWAL', amount: 20000 },
      { type: 'DELIVERY', amount: 8000 },
      { type: 'TOP_UP', amount: 30000 },
      { type: 'PAYMENT', amount: 5000 },
      { type: 'ORG_EXPENSE', amount: 2000 },
    ];
    const endBalance = calculateKasaBalance(devir, txs);
    const summary = calculateDailySummary(txs);
    expect(devir + summary.netChange).toBe(endBalance);
  });

  it('balance can go negative', () => {
    const txs: SimpleTx[] = [
      { type: 'WITHDRAWAL', amount: 100000 },
    ];
    expect(calculateKasaBalance(50000, txs)).toBe(-50000);
  });
});

describe('Daily Summary Calculation', () => {
  it('should categorize transactions correctly', () => {
    const txs: SimpleTx[] = [
      { type: 'DEPOSIT', amount: 5000 },
      { type: 'WITHDRAWAL', amount: 2000 },
      { type: 'TOP_UP', amount: 50000 },
      { type: 'DELIVERY', amount: 3000 },
      { type: 'PAYMENT', amount: 1000 },
      { type: 'ORG_INCOME', amount: 500 },
    ];

    const summary = calculateDailySummary(txs);
    expect(summary.yatirim).toBe(5000);
    expect(summary.cekim).toBe(2000);
    expect(summary.takviye).toBe(50000);
    expect(summary.teslim).toBe(3000);
    expect(summary.odeme).toBe(1000);
    expect(summary.orgKar).toBe(500);
    expect(summary.netChange).toBe(49000); // 5000+50000 - 2000-3000-1000
  });

  it('multiple payments should aggregate', () => {
    const txs: SimpleTx[] = [
      { type: 'PAYMENT', amount: 1000 },
      { type: 'ORG_EXPENSE', amount: 2000 },
      { type: 'ORG_WITHDRAW', amount: 3000 },
      { type: 'EXTERNAL_PAYMENT', amount: 500 },
    ];
    const summary = calculateDailySummary(txs);
    expect(summary.odeme).toBe(6500);
    expect(summary.netChange).toBe(-6500);
  });

  it('empty transactions = all zeros', () => {
    const summary = calculateDailySummary([]);
    expect(summary.yatirim).toBe(0);
    expect(summary.cekim).toBe(0);
    expect(summary.netChange).toBe(0);
  });
});

describe('Transaction Type Classification', () => {
  it('all types should be classified', () => {
    const allTypes: TxType[] = [
      'DEPOSIT', 'WITHDRAWAL', 'TOP_UP', 'DELIVERY',
      'PAYMENT', 'ORG_EXPENSE', 'ORG_WITHDRAW', 'ORG_INCOME',
      'FINANCIER_TRANSFER', 'EXTERNAL_DEBT_IN', 'EXTERNAL_DEBT_OUT',
      'EXTERNAL_PAYMENT',
    ];

    allTypes.forEach(type => {
      const isInflow = INFLOW_TYPES.includes(type);
      const isOutflow = OUTFLOW_TYPES.includes(type);
      const isNeutral = NEUTRAL_TYPES.includes(type);
      // Every type must belong to exactly one category
      const categories = [isInflow, isOutflow, isNeutral].filter(Boolean).length;
      expect(categories).toBe(1);
    });
  });

  it('inflow types should be 3', () => {
    expect(INFLOW_TYPES).toHaveLength(3);
  });

  it('outflow types should be 7', () => {
    expect(OUTFLOW_TYPES).toHaveLength(7);
  });

  it('neutral types should be 2', () => {
    expect(NEUTRAL_TYPES).toHaveLength(2);
  });
});

describe('Devir (Opening Balance) Calculation', () => {
  it('current month: devir = currentKasa - netChange', () => {
    const currentKasa = 45000;
    const netChange = -5000; // month had net outflow
    const devir = currentKasa - netChange; // 45000 - (-5000) = 50000
    expect(devir).toBe(50000);
  });

  it('back-calculation: if no transactions, devir = currentKasa', () => {
    const currentKasa = 45000;
    const netChange = 0;
    const devir = currentKasa - netChange;
    expect(devir).toBe(45000);
  });

  it('large positive net change: devir < currentKasa', () => {
    const currentKasa = 100000;
    const netChange = 60000; // lots of deposits
    const devir = currentKasa - netChange; // 100000 - 60000 = 40000
    expect(devir).toBe(40000);
  });
});
