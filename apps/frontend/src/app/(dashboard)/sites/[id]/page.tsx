"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, cn } from "@/lib/utils";
import { useSiteById, useSiteStatistics, useSiteMonthlyStatistics } from "@/hooks/use-api";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  FileDown,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
  Percent,
  Landmark,
  CreditCard,
} from "lucide-react";

// Ay isimleri
const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);

  const { data: site, isLoading: siteLoading } = useSiteById(siteId);
  const { data: statistics, isLoading: statsLoading } = useSiteStatistics(siteId, selectedYear);
  const { data: monthlyStats } = useSiteMonthlyStatistics(
    siteId,
    selectedYear,
    selectedMonth || 1
  );

  if (siteLoading || statsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-twilight-600" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
        <h3 className="text-lg font-bold text-twilight-900">Site bulunamadı</h3>
        <Button onClick={() => router.push("/sites")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>
    );
  }

  // Site is a LIABILITY account - positive balance means we owe money to customers
  const accountBalance = parseFloat(site.account?.balance || "0");
  const displayBalance = accountBalance;

  // Get monthly data from API - backend always returns 12 months
  const monthlyData = statistics?.monthlyData?.map((data) => ({
    month: data.month,
    monthName: MONTHS[data.month - 1],
    deposit: parseFloat(data.deposit || "0"),
    withdrawal: parseFloat(data.withdrawal || "0"),
    delivery: parseFloat(data.delivery || "0"),
    delivery_commission: parseFloat(data.delivery_commission || "0"),
    topup: parseFloat(data.topup || "0"),
    payment: parseFloat(data.payment || "0"),
    commission: parseFloat(data.commission || "0"),
    balance: parseFloat(data.balance || "0"),
  })) || Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: MONTHS[i],
    deposit: 0, withdrawal: 0, delivery: 0, delivery_commission: 0,
    topup: 0, payment: 0, commission: 0, balance: 0,
  }));

  // Get daily data from API
  const daysInSelectedMonth = selectedMonth ? new Date(selectedYear, selectedMonth, 0).getDate() : 0;
  const dailyData = monthlyStats?.dailyData?.map((data) => ({
    day: data.day,
    deposit: parseFloat(data.deposit || "0"),
    withdrawal: parseFloat(data.withdrawal || "0"),
    delivery: parseFloat(data.delivery || "0"),
    delivery_commission: parseFloat(data.delivery_commission || "0"),
    topup: parseFloat(data.topup || "0"),
    payment: parseFloat(data.payment || "0"),
    commission: parseFloat(data.commission || "0"),
    balance: parseFloat(data.balance || "0"),
  })) || Array.from({ length: daysInSelectedMonth }, (_, i) => ({
    day: i + 1,
    deposit: 0, withdrawal: 0, delivery: 0, delivery_commission: 0,
    topup: 0, payment: 0, commission: 0, balance: 0,
  }));

  // Compute totals for stat cards (use monthlyData source for instant display)
  const currentMonthData = selectedMonth ? monthlyData[selectedMonth - 1] : null;
  const totals = currentMonthData ? {
    deposit: currentMonthData.deposit,
    withdrawal: currentMonthData.withdrawal,
    payment: currentMonthData.payment,
    topup: currentMonthData.topup,
    delivery: currentMonthData.delivery,
    delivery_commission: currentMonthData.delivery_commission,
    commission: currentMonthData.commission,
  } : {
    deposit: monthlyData.reduce((acc, m) => acc + m.deposit, 0),
    withdrawal: monthlyData.reduce((acc, m) => acc + m.withdrawal, 0),
    payment: monthlyData.reduce((acc, m) => acc + m.payment, 0),
    topup: monthlyData.reduce((acc, m) => acc + m.topup, 0),
    delivery: monthlyData.reduce((acc, m) => acc + m.delivery, 0),
    delivery_commission: monthlyData.reduce((acc, m) => acc + m.delivery_commission, 0),
    commission: monthlyData.reduce((acc, m) => acc + m.commission, 0),
  };

  // Table footer totals (from actual displayed table data)
  const tableData = selectedMonth ? dailyData : monthlyData;
  const tableTotals = {
    deposit: tableData.reduce((acc, d) => acc + d.deposit, 0),
    withdrawal: tableData.reduce((acc, d) => acc + d.withdrawal, 0),
    payment: tableData.reduce((acc, d) => acc + d.payment, 0),
    topup: tableData.reduce((acc, d) => acc + d.topup, 0),
    delivery: tableData.reduce((acc, d) => acc + d.delivery, 0),
    delivery_commission: tableData.reduce((acc, d) => acc + d.delivery_commission, 0),
    commission: tableData.reduce((acc, d) => acc + d.commission, 0),
  };

  const handleMonthClick = (month: number) => setSelectedMonth(month);
  const handleBackToYearly = () => setSelectedMonth(null);

  const handlePrevMonth = () => {
    if (selectedMonth === null) return;
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === null) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const statCards = [
    { label: "Yatırım", value: totals.deposit, color: "text-emerald-600", bg: "bg-emerald-50", icon: ArrowDownToLine },
    { label: "Çekim", value: totals.withdrawal, color: "text-rose-600", bg: "bg-rose-50", icon: ArrowUpFromLine },
    { label: "Ödeme", value: totals.payment, color: "text-orange-600", bg: "bg-orange-50", icon: CreditCard },
    { label: "Takviye", value: totals.topup, color: "text-blue-600", bg: "bg-blue-50", icon: RefreshCw },
    { label: "Teslimat", value: totals.delivery, color: "text-purple-600", bg: "bg-purple-50", icon: Package },
    { label: "Tes.Kom.", value: totals.delivery_commission, color: "text-indigo-600", bg: "bg-indigo-50", icon: Percent },
    { label: "Komisyon", value: totals.commission, color: "text-slate-600", bg: "bg-slate-100", icon: Landmark },
  ];

  return (
    <div className="space-y-3 sm:space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/sites")}
            className="rounded-xl h-8 w-8 sm:h-10 sm:w-10 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-3xl font-bold text-twilight-900">{site.name}</h1>
            <p className="text-[10px] sm:text-sm text-twilight-500 font-mono">{site.code}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-1 sm:gap-2 h-7 sm:h-10 text-[11px] sm:text-sm px-2 sm:px-4 rounded-lg sm:rounded-xl">
          <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Excel&apos;e Aktar</span>
          <span className="sm:hidden">Excel</span>
        </Button>
      </div>

      {/* Balance Card - Compact */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-twilight-900 via-twilight-800 to-twilight-900 text-white overflow-hidden">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-twilight-300 uppercase tracking-wider mb-0.5 sm:mb-2">Güncel Bakiye</p>
              <p className={cn(
                "text-2xl sm:text-4xl lg:text-5xl font-bold font-mono",
                displayBalance >= 0 ? "text-emerald-300" : "text-rose-300"
              )}>
                {formatMoney(Math.abs(displayBalance))}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-twilight-300">
                {selectedMonth ? `${MONTHS[selectedMonth - 1]} ${selectedYear}` : `${selectedYear} Yılı`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg sm:rounded-xl bg-white p-1.5 sm:p-3 border border-slate-100 shadow-sm">
              <div className={cn("h-5 w-5 sm:h-6 sm:w-6 rounded-md flex items-center justify-center mb-0.5 sm:mb-1", stat.bg)}>
                <Icon className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3", stat.color)} />
              </div>
              <p className="text-[8px] sm:text-[10px] font-medium text-slate-500 uppercase truncate leading-tight">{stat.label}</p>
              <p className={cn("text-[10px] sm:text-sm font-bold font-mono mt-0.5", stat.color)}>
                {formatMoney(stat.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Month/Year Selector - Always visible */}
      <div className="flex items-center justify-between bg-white rounded-xl sm:rounded-2xl border border-twilight-100 p-2 sm:p-4 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Calendar className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-twilight-400" />
          <span className="text-[11px] sm:text-sm font-medium text-twilight-900">
            {selectedMonth ? "Günlük Detay" : "Yıllık Detay"}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          {selectedMonth ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToYearly}
              className="h-6 sm:h-9 text-[10px] sm:text-sm px-1.5 sm:px-3 rounded-md sm:rounded-lg"
            >
              Yıllık
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(new Date().getMonth() + 1)}
              className="h-6 sm:h-9 text-[10px] sm:text-sm px-1.5 sm:px-3 rounded-md sm:rounded-lg"
            >
              Günlük
            </Button>
          )}
          {selectedMonth && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                className="h-6 w-6 sm:h-9 sm:w-9 rounded-md sm:rounded-lg"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div className="min-w-[80px] sm:min-w-[180px] text-center">
                <span className="text-xs sm:text-lg font-bold text-twilight-900">
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                className="h-6 w-6 sm:h-9 sm:w-9 rounded-md sm:rounded-lg"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Data Table */}
      <Card className="border-0 shadow-lg">
        <div className="border-b border-twilight-100 bg-twilight-50/30 px-3 sm:px-6 py-2 sm:py-4">
          <h2 className="text-xs sm:text-lg font-bold text-twilight-900">
            {selectedMonth
              ? `${MONTHS[selectedMonth - 1]} ${selectedYear} Günlük Detay`
              : `${selectedYear} Yıllık Detay`
            }
          </h2>
        </div>
        <CardContent className="p-0">
          <div className="max-h-[65vh] overflow-y-auto">
            <table className="w-full table-fixed">
              <thead className="sticky top-0 z-10 bg-twilight-50/95 backdrop-blur-sm shadow-[0_1px_0_0_theme(colors.twilight.100)]">
                <tr>
                  <th className="w-[28px] sm:w-[70px] px-1 sm:px-3 py-1.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-twilight-600 uppercase">TARİH</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-emerald-600 uppercase">YAT.</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-rose-600 uppercase">ÇEKİM</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-orange-600 uppercase">ÖDEME</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-blue-600 uppercase">TAK.</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-purple-600 uppercase">TES.</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-indigo-600 uppercase">T.KOM.</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-twilight-600 uppercase">KOM.</th>
                  <th className="px-1 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-twilight-900 uppercase">BAKİYE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-twilight-50">
                {selectedMonth ? (
                  dailyData.map((day) => (
                    <tr key={day.day} className="hover:bg-twilight-50/50 transition-colors">
                      <td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900">{day.day}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-emerald-600">{formatMoney(day.deposit, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-rose-600">{formatMoney(day.withdrawal, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-orange-600">{formatMoney(day.payment, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-blue-600">{formatMoney(day.topup, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-purple-600">{formatMoney(day.delivery, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-indigo-600">{formatMoney(day.delivery_commission, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-twilight-600">{formatMoney(day.commission, "")}</td>
                      <td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-twilight-900 font-bold">{formatMoney(day.balance, "")}</td>
                    </tr>
                  ))
                ) : (
                  monthlyData.map((month) => (
                    <tr
                      key={month.month}
                      className="hover:bg-twilight-50/50 transition-colors cursor-pointer"
                      onClick={() => handleMonthClick(month.month)}
                    >
                      <td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900">{month.monthName}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-emerald-600">{formatMoney(month.deposit, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-rose-600">{formatMoney(month.withdrawal, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-orange-600">{formatMoney(month.payment, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-blue-600">{formatMoney(month.topup, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-purple-600">{formatMoney(month.delivery, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-indigo-600">{formatMoney(month.delivery_commission, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-twilight-600">{formatMoney(month.commission, "")}</td>
                      <td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-twilight-900 font-bold">{formatMoney(month.balance, "")}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-twilight-900 text-white">
                <tr>
                  <td className="px-1 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-bold">TOPLAM</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.deposit, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.withdrawal, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.payment, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.topup, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.delivery, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.delivery_commission, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.commission, "")}</td>
                  <td className="px-1 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(Math.abs(displayBalance), "")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
