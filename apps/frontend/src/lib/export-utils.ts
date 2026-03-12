import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ───────────────────────────────────────────
// Genel Excel Export Yardımcısı
// ───────────────────────────────────────────

export interface ExcelSheet {
  name: string; // Sheet adı (max 31 karakter)
  data: Record<string, any>[]; // Satır verileri
  columns: { header: string; key: string; width?: number }[];
}

/**
 * Tek veya çoklu sheet'li Excel dosyası oluşturup indirir.
 */
export function exportToExcel(
  sheets: ExcelSheet[],
  fileName: string
) {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // Header satırı
    const headers = sheet.columns.map((c) => c.header);
    // Veri satırları
    const rows = sheet.data.map((row) =>
      sheet.columns.map((c) => row[c.key] ?? "")
    );

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Kolon genişlikleri
    ws["!cols"] = sheet.columns.map((c) => ({
      wch: c.width || Math.max(c.header.length + 2, 14),
    }));

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  });

  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}.xlsx`);
}

/**
 * Basit CSV export (tek tablo).
 */
export function exportToCSV(
  data: Record<string, any>[],
  columns: { header: string; key: string }[],
  fileName: string
) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key] ?? "";
      // CSV'de virgül ve tırnak varsa escape et
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  // BOM ekle (Excel'in UTF-8 tanıması için)
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${fileName}.csv`);
}

// ───────────────────────────────────────────
// Formatlama Yardımcıları
// ───────────────────────────────────────────

/** Para değerini number olarak döndürür (Excel'de sayı olsun diye) */
export function toNumber(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = typeof val === "string" ? parseFloat(val.replace(/[^\d.-]/g, "")) : Number(val);
  return isNaN(n) ? 0 : n;
}

/** Tarih string'ini dd.MM.yyyy formatına çevirir */
export function formatDateForExport(dateStr: string | Date): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/** Tarih + saat formatı */
export function formatDateTimeForExport(dateStr: string | Date): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

// ───────────────────────────────────────────
// Sayfaya Özel Export Fonksiyonları
// ───────────────────────────────────────────

/** İşlem tipi Türkçe label */
const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Yatırım",
  WITHDRAWAL: "Çekim",
  PAYMENT: "Ödeme",
  TOP_UP: "Takviye",
  DELIVERY: "Teslimat",
  PARTNER_PAYMENT: "Partner Ödemesi",
  EXTERNAL_DEBT_IN: "Borç Alındı",
  EXTERNAL_DEBT_OUT: "Borç Verildi",
  EXTERNAL_PAYMENT: "Dış Ödeme",
  ORG_EXPENSE: "Org. Gideri",
  ORG_INCOME: "Org. Geliri",
  ORG_WITHDRAW: "Hak Ediş",
  FINANCIER_TRANSFER: "Kasa Transferi",
  REVERSAL: "İptal",
};

const TX_STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Tamamlandı",
  PENDING: "Bekliyor",
  REVERSED: "İptal Edildi",
  FAILED: "Başarısız",
};

/** İşlemler tablosunu Excel'e aktar */
export function exportTransactions(transactions: any[], dateLabel: string) {
  const data = transactions.map((tx) => ({
    tarih: formatDateTimeForExport(tx.transaction_date),
    tur: TX_TYPE_LABELS[tx.type] || tx.type,
    site: tx.site?.name || "",
    partner: tx.partner?.name || "",
    finansor: tx.financier?.name || "",
    dis_kisi: tx.external_party?.name || "",
    tutar: toNumber(tx.gross_amount),
    komisyon: tx.commission_snapshot
      ? toNumber(tx.commission_snapshot.organization_amount)
      : 0,
    durum: TX_STATUS_LABELS[tx.status] || tx.status,
    aciklama: tx.description || "",
  }));

  exportToExcel(
    [
      {
        name: "İşlemler",
        data,
        columns: [
          { header: "Tarih", key: "tarih", width: 18 },
          { header: "Tür", key: "tur", width: 18 },
          { header: "Site", key: "site", width: 16 },
          { header: "Partner", key: "partner", width: 16 },
          { header: "Finansör", key: "finansor", width: 16 },
          { header: "Dış Kişi", key: "dis_kisi", width: 16 },
          { header: "Tutar (₺)", key: "tutar", width: 16 },
          { header: "Komisyon (₺)", key: "komisyon", width: 14 },
          { header: "Durum", key: "durum", width: 14 },
          { header: "Açıklama", key: "aciklama", width: 30 },
        ],
      },
    ],
    `islemler_${dateLabel}`
  );
}

/** Günlük rapor export */
export function exportDailyReport(
  transactions: any[],
  dailyStats: { totalDeposits: number; totalWithdrawals: number; netFlow: number; totalCommission: number },
  selectedDate: string
) {
  const dateLabel = selectedDate.replace(/-/g, "");

  // Sheet 1: Özet
  const summaryData = [
    { baslik: "Toplam Yatırım", deger: dailyStats.totalDeposits },
    { baslik: "Toplam Çekim", deger: dailyStats.totalWithdrawals },
    { baslik: "Net Akış", deger: dailyStats.netFlow },
    { baslik: "Toplam Komisyon", deger: dailyStats.totalCommission },
  ];

  // Sheet 2: İşlemler
  const txData = transactions.map((tx) => ({
    saat: formatDateTimeForExport(tx.transaction_date),
    tur: TX_TYPE_LABELS[tx.type] || tx.type,
    site: tx.site?.name || "",
    partner: tx.partner?.name || "",
    finansor: tx.financier?.name || "",
    tutar: toNumber(tx.gross_amount),
    durum: TX_STATUS_LABELS[tx.status] || tx.status,
    aciklama: tx.description || "",
  }));

  exportToExcel(
    [
      {
        name: "Günlük Özet",
        data: summaryData,
        columns: [
          { header: "Kalem", key: "baslik", width: 20 },
          { header: "Tutar (₺)", key: "deger", width: 18 },
        ],
      },
      {
        name: "İşlemler",
        data: txData,
        columns: [
          { header: "Saat", key: "saat", width: 18 },
          { header: "Tür", key: "tur", width: 18 },
          { header: "Site", key: "site", width: 16 },
          { header: "Partner", key: "partner", width: 16 },
          { header: "Finansör", key: "finansor", width: 16 },
          { header: "Tutar (₺)", key: "tutar", width: 16 },
          { header: "Durum", key: "durum", width: 14 },
          { header: "Açıklama", key: "aciklama", width: 30 },
        ],
      },
    ],
    `gunluk_rapor_${dateLabel}`
  );
}

/** Aylık rapor export (günlük dökümle) */
export function exportMonthlyReport(
  dailyData: any[],
  totals: any,
  monthLabel: string
) {
  // Sheet 1: Günlük Döküm
  const daily = dailyData.map((day) => ({
    tarih: formatDateForExport(day.date),
    yatirim: day.deposit || 0,
    cekim: day.withdrawal || 0,
    komisyon: day.commission || 0,
    teslim: day.delivery || 0,
    teslim_kom: day.deliveryCommission || 0,
    odeme: day.payment || 0,
    takviye: day.topup || 0,
    kasa: day.balance || 0,
  }));

  // Toplam satırı ekle
  daily.push({
    tarih: "TOPLAM",
    yatirim: totals.deposit,
    cekim: totals.withdrawal,
    komisyon: totals.commission,
    teslim: totals.delivery,
    teslim_kom: totals.deliveryCommission,
    odeme: totals.payment,
    takviye: totals.topup,
    kasa: totals.endBalance,
  });

  exportToExcel(
    [
      {
        name: "Aylık Rapor",
        data: daily,
        columns: [
          { header: "Tarih", key: "tarih", width: 14 },
          { header: "Yatırım (₺)", key: "yatirim", width: 16 },
          { header: "Çekim (₺)", key: "cekim", width: 16 },
          { header: "Komisyon (₺)", key: "komisyon", width: 14 },
          { header: "Teslim (₺)", key: "teslim", width: 14 },
          { header: "Teslim Kom. (₺)", key: "teslim_kom", width: 14 },
          { header: "Ödeme (₺)", key: "odeme", width: 14 },
          { header: "Takviye (₺)", key: "takviye", width: 14 },
          { header: "Kasa (₺)", key: "kasa", width: 16 },
        ],
      },
    ],
    `aylik_rapor_${monthLabel}`
  );
}

/** Kasa raporu export */
export function exportKasaRaporu(
  entries: any[],
  kasaBakiye: number,
  dateLabel: string
) {
  const data = entries.map((e) => ({
    tarih: formatDateTimeForExport(e.created_at || e.transaction_date),
    hesap: e.account_name || "",
    islem: e.description || "",
    borc: e.entry_type === "DEBIT" ? toNumber(e.amount) : 0,
    alacak: e.entry_type === "CREDIT" ? toNumber(e.amount) : 0,
    bakiye: toNumber(e.running_balance),
  }));

  const summary = [
    { baslik: "Toplam Kasa Bakiyesi", deger: kasaBakiye },
  ];

  exportToExcel(
    [
      {
        name: "Kasa Raporu",
        data,
        columns: [
          { header: "Tarih", key: "tarih", width: 18 },
          { header: "Hesap", key: "hesap", width: 20 },
          { header: "İşlem", key: "islem", width: 30 },
          { header: "Borç (₺)", key: "borc", width: 16 },
          { header: "Alacak (₺)", key: "alacak", width: 16 },
          { header: "Bakiye (₺)", key: "bakiye", width: 16 },
        ],
      },
      {
        name: "Özet",
        data: summary,
        columns: [
          { header: "Kalem", key: "baslik", width: 24 },
          { header: "Tutar (₺)", key: "deger", width: 18 },
        ],
      },
    ],
    `kasa_raporu_${dateLabel}`
  );
}

/** Mutabakat raporu export */
export function exportReconciliation(
  sites: any[],
  financiers: any[],
  partners: any[],
  dateLabel: string
) {
  const siteData = sites.map((s) => ({
    ad: s.name,
    bakiye: toNumber(s.balance),
    durum: s.is_active ? "Aktif" : "Pasif",
  }));

  const finData = financiers.map((f) => ({
    ad: f.name,
    toplam: toNumber(f.account?.balance),
    bloke: toNumber(f.account?.blocked_balance),
    musait: toNumber(f.account?.balance) - toNumber(f.account?.blocked_balance),
    durum: f.is_active ? "Aktif" : "Pasif",
  }));

  const partnerData = partners.map((p) => ({
    ad: p.name,
    hak_edis: toNumber(p.balance),
    durum: p.is_active ? "Aktif" : "Pasif",
  }));

  exportToExcel(
    [
      {
        name: "Siteler",
        data: siteData,
        columns: [
          { header: "Site Adı", key: "ad", width: 20 },
          { header: "Bakiye (₺)", key: "bakiye", width: 18 },
          { header: "Durum", key: "durum", width: 10 },
        ],
      },
      {
        name: "Finansörler",
        data: finData,
        columns: [
          { header: "Finansör Adı", key: "ad", width: 20 },
          { header: "Toplam (₺)", key: "toplam", width: 18 },
          { header: "Bloke (₺)", key: "bloke", width: 16 },
          { header: "Müsait (₺)", key: "musait", width: 16 },
          { header: "Durum", key: "durum", width: 10 },
        ],
      },
      {
        name: "Partnerler",
        data: partnerData,
        columns: [
          { header: "Partner Adı", key: "ad", width: 20 },
          { header: "Hak Ediş (₺)", key: "hak_edis", width: 18 },
          { header: "Durum", key: "durum", width: 10 },
        ],
      },
    ],
    `mutabakat_${dateLabel}`
  );
}

/** Analiz raporu export */
export function exportAnalysis(
  sitePerformance: any[],
  partnerPerformance: any[],
  dateLabel: string
) {
  const siteData = sitePerformance.map((s) => ({
    ad: s.name,
    yatirim: toNumber(s.deposits),
    cekim: toNumber(s.withdrawals),
    hacim: toNumber(s.volume),
    islem_sayisi: s.count || 0,
    komisyon: toNumber(s.commission),
  }));

  const partnerData = partnerPerformance.map((p) => ({
    ad: p.name,
    hacim: toNumber(p.volume),
    islem_sayisi: p.count || 0,
    komisyon: toNumber(p.commission),
  }));

  exportToExcel(
    [
      {
        name: "Site Performansı",
        data: siteData,
        columns: [
          { header: "Site Adı", key: "ad", width: 20 },
          { header: "Yatırım (₺)", key: "yatirim", width: 16 },
          { header: "Çekim (₺)", key: "cekim", width: 16 },
          { header: "Hacim (₺)", key: "hacim", width: 16 },
          { header: "İşlem Sayısı", key: "islem_sayisi", width: 14 },
          { header: "Komisyon (₺)", key: "komisyon", width: 14 },
        ],
      },
      {
        name: "Partner Performansı",
        data: partnerData,
        columns: [
          { header: "Partner Adı", key: "ad", width: 20 },
          { header: "Hacim (₺)", key: "hacim", width: 16 },
          { header: "İşlem Sayısı", key: "islem_sayisi", width: 14 },
          { header: "Komisyon (₺)", key: "komisyon", width: 14 },
        ],
      },
    ],
    `analiz_${dateLabel}`
  );
}
