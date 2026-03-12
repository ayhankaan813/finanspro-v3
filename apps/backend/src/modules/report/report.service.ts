import prisma from '../../shared/prisma/client.js';
import Decimal from 'decimal.js';

interface KasaRaporuRow {
  label: string;
  period: number;
  devir: string;
  takviye: string;
  yatirim: string;
  cekim: string;
  teslim: string;
  orgKar: string;
  partnerKar: Record<string, string>;
  odeme: string;
  kasa: string;
}

interface KasaRaporuResponse {
  meta: {
    year: number;
    month?: number;
    view: 'daily' | 'monthly';
    partners: Array<{ id: string; name: string }>;
    currentKasa: string;
  };
  summary: KasaRaporuRow;
  rows: KasaRaporuRow[];
}

class ReportService {
  async getKasaRaporu(year: number, view: 'daily' | 'monthly', month?: number): Promise<KasaRaporuResponse> {
    let startDate: Date;
    let endDate: Date;

    if (view === 'daily' && month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year + 1, 0, 1);
    }

    const txDateFilter = {
      transaction_date: { gte: startDate, lt: endDate },
      status: 'COMPLETED' as const,
      deleted_at: null,
    };

    // 1. Get ALL completed transactions for the period (no limit!)
    const transactions = await prisma.transaction.findMany({
      where: {
        ...txDateFilter,
        type: { not: 'REVERSAL' },
      },
      orderBy: { transaction_date: 'asc' },
    });

    // 2. Get partner commissions from ledger entries
    const partnerCommissions = await prisma.ledgerEntry.findMany({
      where: {
        account_type: 'PARTNER',
        entry_type: 'CREDIT',
        transaction: txDateFilter,
      },
      select: {
        amount: true,
        account_id: true,
        account_name: true,
        transaction: { select: { transaction_date: true } },
      },
    });

    // 3. Get organization commissions from ledger entries
    const orgCommissions = await prisma.ledgerEntry.findMany({
      where: {
        account_type: 'ORGANIZATION',
        entry_type: 'CREDIT',
        transaction: txDateFilter,
      },
      select: {
        amount: true,
        transaction: { select: { transaction_date: true } },
      },
    });

    // 4. Get current kasa (sum of all financier account balances)
    const financierAccounts = await prisma.account.findMany({
      where: { entity_type: 'FINANCIER' },
      select: { balance: true },
    });

    const currentKasa = financierAccounts.reduce(
      (sum, acc) => sum.plus(new Decimal(acc.balance)),
      new Decimal(0)
    );

    // 5. Build unique partner list
    const partnerMap = new Map<string, string>();
    partnerCommissions.forEach(pc => {
      if (pc.account_id && pc.account_name && !partnerMap.has(pc.account_id)) {
        partnerMap.set(pc.account_id, pc.account_name);
      }
    });
    const partners = Array.from(partnerMap.entries()).map(([id, name]) => ({ id, name }));

    // 6. Determine periods
    const periodCount = view === 'daily' ? new Date(year, month!, 0).getDate() : 12;
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // 7. Initialize period data
    const periodData = Array.from({ length: periodCount }, () => ({
      devir: new Decimal(0),
      takviye: new Decimal(0),
      yatirim: new Decimal(0),
      cekim: new Decimal(0),
      teslim: new Decimal(0),
      orgKar: new Decimal(0),
      partnerKar: new Map<string, Decimal>(),
      odeme: new Decimal(0),
      kasa: new Decimal(0),
    }));

    // Helper: get period index from date
    const getPeriodIndex = (date: Date) => view === 'daily' ? date.getDate() - 1 : date.getMonth();

    // 8. Aggregate transactions by period
    transactions.forEach(tx => {
      const periodIndex = getPeriodIndex(new Date(tx.transaction_date));
      if (periodIndex < 0 || periodIndex >= periodCount) return;

      const grossAmount = new Decimal(tx.gross_amount);
      const data = periodData[periodIndex];

      switch (tx.type) {
        case 'DEPOSIT':
          data.yatirim = data.yatirim.plus(grossAmount);
          break;
        case 'TOP_UP':
        case 'EXTERNAL_DEBT_IN':
        case 'ORG_INCOME':
          data.takviye = data.takviye.plus(grossAmount);
          break;
        case 'WITHDRAWAL':
          data.cekim = data.cekim.plus(grossAmount);
          break;
        case 'DELIVERY':
        case 'SITE_DELIVERY':
          data.teslim = data.teslim.plus(grossAmount);
          break;
        case 'PAYMENT':
        case 'PARTNER_PAYMENT':
        case 'ORG_EXPENSE':
        case 'ORG_WITHDRAW':
        case 'EXTERNAL_DEBT_OUT':
        case 'EXTERNAL_PAYMENT':
          data.odeme = data.odeme.plus(grossAmount);
          break;
        case 'FINANCIER_TRANSFER':
          break;
      }
    });

    // 9. Aggregate partner commissions by period
    partnerCommissions.forEach(pc => {
      if (!pc.transaction || !pc.account_id) return;
      const periodIndex = getPeriodIndex(new Date(pc.transaction.transaction_date));
      if (periodIndex < 0 || periodIndex >= periodCount) return;

      const data = periodData[periodIndex];
      const existing = data.partnerKar.get(pc.account_id) || new Decimal(0);
      data.partnerKar.set(pc.account_id, existing.plus(new Decimal(pc.amount)));
    });

    // 10. Aggregate org commissions by period
    orgCommissions.forEach(oc => {
      if (!oc.transaction) return;
      const periodIndex = getPeriodIndex(new Date(oc.transaction.transaction_date));
      if (periodIndex < 0 || periodIndex >= periodCount) return;

      periodData[periodIndex].orgKar = periodData[periodIndex].orgKar.plus(new Decimal(oc.amount));
    });

    // 11. Running balance — BACKWARD from currentKasa
    let running = currentKasa;

    // Account for transactions AFTER this period to get the end-of-period balance
    const futureTransactions = await prisma.transaction.findMany({
      where: {
        transaction_date: { gte: endDate },
        status: 'COMPLETED',
        type: { not: 'REVERSAL' },
        deleted_at: null,
      },
    });

    futureTransactions.forEach(tx => {
      const grossAmount = new Decimal(tx.gross_amount);
      switch (tx.type) {
        case 'DEPOSIT':
        case 'TOP_UP':
        case 'EXTERNAL_DEBT_IN':
        case 'ORG_INCOME':
          running = running.minus(grossAmount);
          break;
        case 'WITHDRAWAL':
        case 'DELIVERY':
        case 'SITE_DELIVERY':
        case 'PAYMENT':
        case 'PARTNER_PAYMENT':
        case 'ORG_EXPENSE':
        case 'ORG_WITHDRAW':
        case 'EXTERNAL_DEBT_OUT':
        case 'EXTERNAL_PAYMENT':
          running = running.plus(grossAmount);
          break;
      }
    });

    // Walk backward through periods
    for (let i = periodCount - 1; i >= 0; i--) {
      const data = periodData[i];
      data.kasa = running;

      const change = data.yatirim
        .plus(data.takviye)
        .minus(data.cekim)
        .minus(data.teslim)
        .minus(data.odeme);

      running = running.minus(change);
      data.devir = running;
    }

    // 12. Build response rows
    const rows: KasaRaporuRow[] = periodData.map((data, i) => {
      const period = i + 1;
      let label: string;

      if (view === 'daily') {
        const day = String(period).padStart(2, '0');
        const mon = String(month!).padStart(2, '0');
        label = `${day}.${mon}.${year}`;
      } else {
        label = monthNames[i];
      }

      const partnerKar: Record<string, string> = {};
      partners.forEach(p => {
        partnerKar[p.id] = (data.partnerKar.get(p.id) || new Decimal(0)).toFixed(2);
      });

      return {
        label,
        period,
        devir: data.devir.toFixed(2),
        takviye: data.takviye.toFixed(2),
        yatirim: data.yatirim.toFixed(2),
        cekim: data.cekim.toFixed(2),
        teslim: data.teslim.toFixed(2),
        orgKar: data.orgKar.toFixed(2),
        partnerKar,
        odeme: data.odeme.toFixed(2),
        kasa: data.kasa.toFixed(2),
      };
    });

    // 13. Build summary row
    const summaryPartnerKar: Record<string, string> = {};
    partners.forEach(p => {
      const total = periodData.reduce(
        (sum, d) => sum.plus(d.partnerKar.get(p.id) || new Decimal(0)),
        new Decimal(0)
      );
      summaryPartnerKar[p.id] = total.toFixed(2);
    });

    const summary: KasaRaporuRow = {
      label: 'TOPLAM',
      period: 0,
      devir: rows.length > 0 ? rows[0].devir : '0.00',
      takviye: periodData.reduce((s, d) => s.plus(d.takviye), new Decimal(0)).toFixed(2),
      yatirim: periodData.reduce((s, d) => s.plus(d.yatirim), new Decimal(0)).toFixed(2),
      cekim: periodData.reduce((s, d) => s.plus(d.cekim), new Decimal(0)).toFixed(2),
      teslim: periodData.reduce((s, d) => s.plus(d.teslim), new Decimal(0)).toFixed(2),
      orgKar: periodData.reduce((s, d) => s.plus(d.orgKar), new Decimal(0)).toFixed(2),
      partnerKar: summaryPartnerKar,
      odeme: periodData.reduce((s, d) => s.plus(d.odeme), new Decimal(0)).toFixed(2),
      kasa: rows.length > 0 ? rows[rows.length - 1].kasa : currentKasa.toFixed(2),
    };

    return {
      meta: {
        year,
        ...(view === 'daily' && month ? { month } : {}),
        view,
        partners,
        currentKasa: currentKasa.toFixed(2),
      },
      summary,
      rows,
    };
  }
}

export const reportService = new ReportService();
