"use client";

import { useState } from "react";
import { useKasaRaporu, KasaRaporuRow } from "@/hooks/use-api";
import { formatMoney } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Truck,
  CreditCard,
  RotateCcw,
  Briefcase,
  Download,
} from "lucide-react";
import { exportToExcel, toNumber } from "@/lib/export-utils";

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function KasaRaporuPage() {
  const now = new Date();
  const [view, setView] = useState<"daily" | "monthly">("monthly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, error } = useKasaRaporu({
    year,
    month: view === "daily" ? month : undefined,
    view,
  });

  const goBack = () => {
    if (view === "daily") {
      if (month === 1) { setMonth(12); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else {
      setYear(y => y - 1);
    }
  };

  const goForward = () => {
    if (view === "daily") {
      if (month === 12) { setMonth(1); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    } else {
      setYear(y => y + 1);
    }
  };

  const partners = data?.meta.partners || [];
  const rows = data?.rows || [];
  const summary = data?.summary;

  const handleRowClick = (row: KasaRaporuRow) => {
    if (view === "monthly") {
      setMonth(row.period);
      setView("daily");
    }
  };

  const periodLabel = view === "daily"
    ? `${MONTH_NAMES[month - 1]} ${year}`
    : `${year}`;

  // Total column count for loading skeletons
  const colCount = 9 + partners.length; // TARİH DEVİR TAKVİYE YATIRIM ÇEKİM TESLİM ORG [partners...] ÖDEME KASA

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Kasa Raporu</h1>
            <p className="text-slate-300 text-sm mt-1">
              {view === "monthly" ? "Aylık özet görünüm" : "Günlük detay görünüm"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setView("monthly")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "monthly"
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setView("daily")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "daily"
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Günlük
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={goBack} className="text-white hover:bg-slate-700">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm font-semibold min-w-[100px] text-center">
                {periodLabel}
              </span>
              <Button size="icon" variant="ghost" onClick={goForward} className="text-white hover:bg-slate-700">
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="h-5 w-px bg-slate-600 mx-1" />
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-slate-700 text-xs gap-1"
                onClick={() => {
                  if (!rows.length) return;
                  const partnerCols = partners.map(p => ({
                    header: `${p.name} (₺)`,
                    key: `partner_${p.id}`,
                    width: 14,
                  }));
                  const exportData = rows.map(row => {
                    const base: Record<string, any> = {
                      tarih: row.label,
                      devir: toNumber(row.devir),
                      takviye: toNumber(row.takviye),
                      yatirim: toNumber(row.yatirim),
                      cekim: toNumber(row.cekim),
                      teslim: toNumber(row.teslim),
                      org_kar: toNumber(row.orgKar),
                      odeme: toNumber(row.odeme),
                      kasa: toNumber(row.kasa),
                    };
                    partners.forEach(p => {
                      base[`partner_${p.id}`] = toNumber(row.partnerKar[p.id] || "0");
                    });
                    return base;
                  });
                  if (summary) {
                    const totalRow: Record<string, any> = {
                      tarih: "TOPLAM",
                      devir: toNumber(summary.devir),
                      takviye: toNumber(summary.takviye),
                      yatirim: toNumber(summary.yatirim),
                      cekim: toNumber(summary.cekim),
                      teslim: toNumber(summary.teslim),
                      org_kar: toNumber(summary.orgKar),
                      odeme: toNumber(summary.odeme),
                      kasa: toNumber(summary.kasa),
                    };
                    partners.forEach(p => {
                      totalRow[`partner_${p.id}`] = toNumber(summary.partnerKar[p.id] || "0");
                    });
                    exportData.push(totalRow);
                  }
                  exportToExcel([{
                    name: "Kasa Raporu",
                    data: exportData,
                    columns: [
                      { header: "Tarih", key: "tarih", width: 14 },
                      { header: "Devir (₺)", key: "devir", width: 14 },
                      { header: "Takviye (₺)", key: "takviye", width: 14 },
                      { header: "Yatırım (₺)", key: "yatirim", width: 14 },
                      { header: "Çekim (₺)", key: "cekim", width: 14 },
                      { header: "Teslim (₺)", key: "teslim", width: 14 },
                      { header: "Org Kar (₺)", key: "org_kar", width: 14 },
                      ...partnerCols,
                      { header: "Ödeme (₺)", key: "odeme", width: 14 },
                      { header: "Kasa (₺)", key: "kasa", width: 16 },
                    ],
                  }], `kasa_raporu_${view === "daily" ? `${year}_${String(month).padStart(2, "0")}` : `${year}`}`);
                }}
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-4 text-red-600 dark:text-red-400 text-sm">
            Veri yüklenirken hata oluştu: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          <SummaryCard label="KASA" value={data?.meta.currentKasa || "0"} icon={Wallet} primary />
          <SummaryCard label="DEVİR" value={summary.devir} icon={RotateCcw} />
          <SummaryCard label="TAKVİYE" value={summary.takviye} icon={ArrowUpCircle} positive />
          <SummaryCard label="YATIRIM" value={summary.yatirim} icon={TrendingUp} positive />
          <SummaryCard label="ÇEKİM" value={summary.cekim} icon={ArrowDownCircle} negative />
          <SummaryCard label="TESLİM" value={summary.teslim} icon={Truck} negative />
          <SummaryCard label="ORG KAR" value={summary.orgKar} icon={Briefcase} positive />
          <SummaryCard label="ÖDEME" value={summary.odeme} icon={CreditCard} negative />
        </div>
      ) : null}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b">
                <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50 px-2 sm:px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[80px]">
                  TARİH
                </th>
                <th className="px-2 sm:px-3 py-3 text-right font-semibold text-slate-600 dark:text-slate-300 min-w-[90px]">DEVİR</th>
                <th className="px-2 sm:px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 min-w-[90px]">TAKVİYE</th>
                <th className="px-2 sm:px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 min-w-[90px]">YATIRIM</th>
                <th className="px-2 sm:px-3 py-3 text-right font-semibold text-red-600 dark:text-red-400 min-w-[90px]">ÇEKİM</th>
                <th className="px-2 sm:px-3 py-3 text-right font-semibold text-red-600 dark:text-red-400 min-w-[90px]">TESLİM</th>
                <th className="px-2 sm:px-3 py-3 text-right font-semibold text-purple-600 dark:text-purple-400 min-w-[90px]">ORG KAR</th>
                {partners.map(p => (
                  <th key={p.id} className="px-2 sm:px-3 py-3 text-right font-semibold text-blue-600 dark:text-blue-400 min-w-[90px]">
                    {p.name}
                  </th>
                ))}
                <th className="px-2 sm:px-3 py-3 text-right font-semibold text-red-600 dark:text-red-400 min-w-[90px]">ÖDEME</th>
                <th className="sticky right-0 z-10 bg-slate-50 dark:bg-slate-800/50 px-2 sm:px-4 py-3 text-right font-semibold text-slate-900 dark:text-white min-w-[100px] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                  KASA
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: colCount }).map((_, j) => (
                      <td key={j} className="px-2 sm:px-3 py-2.5">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.map((row, idx) => {
                const hasData = parseFloat(row.yatirim) !== 0 || parseFloat(row.takviye) !== 0 ||
                  parseFloat(row.cekim) !== 0 || parseFloat(row.teslim) !== 0 || parseFloat(row.odeme) !== 0;

                return (
                  <tr
                    key={row.period}
                    onClick={() => handleRowClick(row)}
                    className={`border-b transition-colors ${
                      view === "monthly" ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30" : ""
                    } ${!hasData ? "opacity-50" : ""} ${idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-800/20"}`}
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-2 sm:px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {row.label}
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 text-right text-slate-600 dark:text-slate-300 tabular-nums">{formatMoney(row.devir)}</td>
                    <td className="px-2 sm:px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {parseFloat(row.takviye) > 0 ? formatMoney(row.takviye) : "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {parseFloat(row.yatirim) > 0 ? formatMoney(row.yatirim) : "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 text-right text-red-600 dark:text-red-400 tabular-nums">
                      {parseFloat(row.cekim) > 0 ? formatMoney(row.cekim) : "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 text-right text-red-600 dark:text-red-400 tabular-nums">
                      {parseFloat(row.teslim) > 0 ? formatMoney(row.teslim) : "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 text-right text-purple-600 dark:text-purple-400 tabular-nums">
                      {parseFloat(row.orgKar) > 0 ? formatMoney(row.orgKar) : "-"}
                    </td>
                    {partners.map(p => (
                      <td key={p.id} className="px-2 sm:px-3 py-2.5 text-right text-blue-600 dark:text-blue-400 tabular-nums">
                        {parseFloat(row.partnerKar[p.id] || "0") > 0 ? formatMoney(row.partnerKar[p.id]) : "-"}
                      </td>
                    ))}
                    <td className="px-2 sm:px-3 py-2.5 text-right text-red-600 dark:text-red-400 tabular-nums">
                      {parseFloat(row.odeme) > 0 ? formatMoney(row.odeme) : "-"}
                    </td>
                    <td className="sticky right-0 z-10 bg-inherit px-2 sm:px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white tabular-nums shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                      {formatMoney(row.kasa)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {summary && !isLoading && (
              <tfoot>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border-t-2 border-slate-300 dark:border-slate-600">
                  <td className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 px-2 sm:px-4 py-3 font-bold text-slate-900 dark:text-white">
                    TOPLAM
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-right font-bold text-slate-700 dark:text-slate-200 tabular-nums">{formatMoney(summary.devir)}</td>
                  <td className="px-2 sm:px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(summary.takviye)}</td>
                  <td className="px-2 sm:px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(summary.yatirim)}</td>
                  <td className="px-2 sm:px-3 py-3 text-right font-bold text-red-600 dark:text-red-400 tabular-nums">{formatMoney(summary.cekim)}</td>
                  <td className="px-2 sm:px-3 py-3 text-right font-bold text-red-600 dark:text-red-400 tabular-nums">{formatMoney(summary.teslim)}</td>
                  <td className="px-2 sm:px-3 py-3 text-right font-bold text-purple-600 dark:text-purple-400 tabular-nums">{formatMoney(summary.orgKar)}</td>
                  {partners.map(p => (
                    <td key={p.id} className="px-2 sm:px-3 py-3 text-right font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatMoney(summary.partnerKar[p.id] || "0")}
                    </td>
                  ))}
                  <td className="px-2 sm:px-3 py-3 text-right font-bold text-red-600 dark:text-red-400 tabular-nums">{formatMoney(summary.odeme)}</td>
                  <td className="sticky right-0 z-10 bg-slate-100 dark:bg-slate-800 px-2 sm:px-4 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                    {formatMoney(summary.kasa)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, primary, positive, negative }: {
  label: string;
  value: string;
  icon: React.ElementType;
  primary?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <Card className={primary ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0" : ""}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${
            primary ? "text-white/70" :
            positive ? "text-emerald-500" :
            negative ? "text-red-500" :
            "text-slate-400"
          }`} />
          <span className={`text-[10px] sm:text-xs font-medium ${
            primary ? "text-white/70" : "text-muted-foreground"
          }`}>
            {label}
          </span>
        </div>
        <p className={`text-sm sm:text-base font-bold tabular-nums ${
          primary ? "text-white" :
          positive ? "text-emerald-600 dark:text-emerald-400" :
          negative ? "text-red-600 dark:text-red-400" :
          ""
        }`}>
          {formatMoney(value)}
        </p>
      </CardContent>
    </Card>
  );
}
