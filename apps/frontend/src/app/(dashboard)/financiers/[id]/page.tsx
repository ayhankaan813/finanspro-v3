"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, cn, formatTurkeyDate } from "@/lib/utils";
import { useFinancier, useFinancierBlocks, useFinancierStatistics, useFinancierMonthlyStatistics } from "@/hooks/use-api";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowUpFromLine,
  ArrowDownToLine,
  HandCoins,
  Banknote,
  FileDown,
  Package,
  Percent,
  Landmark,
  CreditCard,
  RefreshCw,
} from "lucide-react";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function FinancierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const financierId = params.id as string;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);

  const { data: financier, isLoading: isLoadingFinancier } = useFinancier(financierId);
  const { data: statistics, isLoading: isLoadingStats } = useFinancierStatistics(financierId, selectedYear);
  const { data: monthlyStats, isLoading: isLoadingMonthlyStats } = useFinancierMonthlyStatistics(
    financierId,
    selectedYear,
    selectedMonth || 1
  );
  const { data: blocksData } = useFinancierBlocks(financierId);

  if (isLoadingFinancier || isLoadingStats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!financier) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
        <h3 className="text-lg font-bold text-twilight-900">Finansör Bulunamadı</h3>
        <Button onClick={() => router.push("/financiers")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Finansörlere Dön
        </Button>
      </div>
    );
  }

  // Get monthly data from API
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
    blocked: parseFloat(data.blocked || "0"),
    balance: parseFloat(data.balance || "0"),
  })) || Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: MONTHS[i],
    deposit: 0, withdrawal: 0, delivery: 0, delivery_commission: 0,
    topup: 0, payment: 0, commission: 0, blocked: 0, balance: 0,
  }));

  // Get daily data from API
  const daysInMonth = selectedMonth ? new Date(selectedYear, selectedMonth, 0).getDate() : 0;
  const dailyData = monthlyStats?.dailyData?.map((data) => ({
    day: data.day,
    deposit: parseFloat(data.deposit || "0"),
    withdrawal: parseFloat(data.withdrawal || "0"),
    delivery: parseFloat(data.delivery || "0"),
    delivery_commission: parseFloat(data.delivery_commission || "0"),
    topup: parseFloat(data.topup || "0"),
    payment: parseFloat(data.payment || "0"),
    commission: parseFloat(data.commission || "0"),
    blocked: parseFloat(data.blocked || "0"),
    balance: parseFloat(data.balance || "0"),
  })) || Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    deposit: 0, withdrawal: 0, delivery: 0, delivery_commission: 0,
    topup: 0, payment: 0, commission: 0, blocked: 0, balance: 0,
  }));

  const balance = parseFloat(financier.account?.balance || "0");
  const blockedAmount = parseFloat(financier.account?.blocked_amount || "0");
  const availableBalance = parseFloat(financier.available_balance || "0");
  const hasBlocks = financier.active_blocks_count > 0 || blockedAmount > 0;

  // Stat card totals
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

  // Table footer totals
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
    { label: "Çekim", value: totals.withdrawal, color: "text-rose-600", bg: "bg-rose-50", icon: TrendingDown },
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
            onClick={() => router.push("/financiers")}
            className="rounded-xl h-8 w-8 sm:h-10 sm:w-10 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-3xl font-bold text-twilight-900">{financier.name}</h1>
            <p className="text-[10px] sm:text-sm text-twilight-500 font-mono">{financier.code}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-1 sm:gap-2 h-7 sm:h-10 text-[11px] sm:text-sm px-2 sm:px-4 rounded-lg sm:rounded-xl">
          <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Excel&apos;e Aktar</span>
          <span className="sm:hidden">Excel</span>
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 text-white overflow-hidden">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-amber-200 uppercase tracking-wider mb-0.5 sm:mb-2">Toplam Bakiye</p>
              <p className="text-2xl sm:text-4xl lg:text-5xl font-bold font-mono text-white">
                {formatMoney(balance)}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div>
                <p className="text-[9px] sm:text-xs text-amber-200">Müsait</p>
                <p className="text-sm sm:text-xl font-bold font-mono text-emerald-200">{formatMoney(availableBalance)}</p>
              </div>
              {hasBlocks && (
                <div>
                  <p className="text-[9px] sm:text-xs text-orange-200 flex items-center gap-1 justify-end">
                    <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    Bloke
                  </p>
                  <p className="text-sm sm:text-xl font-bold font-mono text-orange-200">{formatMoney(blockedAmount)}</p>
                </div>
              )}
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
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-6 w-6 sm:h-9 sm:w-9 rounded-md sm:rounded-lg">
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div className="min-w-[80px] sm:min-w-[180px] text-center">
                <span className="text-xs sm:text-lg font-bold text-twilight-900">
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-6 w-6 sm:h-9 sm:w-9 rounded-md sm:rounded-lg">
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
            <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="sticky top-0 z-10 bg-twilight-50/95 backdrop-blur-sm shadow-[0_1px_0_0_theme(colors.twilight.100)]">
                <tr>
                  <th className="w-[28px] sm:w-[70px] px-1 sm:px-3 py-1.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-twilight-600 uppercase whitespace-nowrap">TARİH</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-emerald-600 uppercase whitespace-nowrap">YAT.</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-rose-600 uppercase whitespace-nowrap">ÇEKİM</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-orange-600 uppercase whitespace-nowrap">ÖDEME</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-blue-600 uppercase whitespace-nowrap">TAK.</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-purple-600 uppercase whitespace-nowrap">TES.</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-indigo-600 uppercase whitespace-nowrap">T.KOM.</th>
                  <th className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">KOM.</th>
                  <th className="px-1 sm:px-3 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-twilight-900 uppercase whitespace-nowrap">BAKİYE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-twilight-50">
                {selectedMonth ? (
                  isLoadingMonthlyStats ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                          <span className="text-xs text-twilight-500">Yükleniyor...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    dailyData.map((day) => (
                      <tr key={day.day} className="hover:bg-twilight-50/50 transition-colors">
                        <td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900 whitespace-nowrap">{day.day}</td>
                        <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-emerald-600 whitespace-nowrap">{formatMoney(day.deposit, "")}</td>
                        <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-rose-600 whitespace-nowrap">{formatMoney(day.withdrawal, "")}</td>
                        <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-orange-600 whitespace-nowrap">{formatMoney(day.payment, "")}</td>
                        <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-blue-600 whitespace-nowrap">{formatMoney(day.topup, "")}</td>
                        <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-purple-600 whitespace-nowrap">{formatMoney(day.delivery, "")}</td>
                        <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-indigo-600 whitespace-nowrap">{formatMoney(day.delivery_commission, "")}</td>
                        <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-slate-600 whitespace-nowrap">{formatMoney(day.commission, "")}</td>
                        <td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-twilight-900 font-bold whitespace-nowrap">{formatMoney(day.balance, "")}</td>
                      </tr>
                    ))
                  )
                ) : (
                  monthlyData.map((row) => (
                    <tr
                      key={row.month}
                      className="hover:bg-twilight-50/50 transition-colors cursor-pointer"
                      onClick={() => handleMonthClick(row.month)}
                    >
                      <td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900 whitespace-nowrap">{row.monthName}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-emerald-600 whitespace-nowrap">{formatMoney(row.deposit, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-rose-600 whitespace-nowrap">{formatMoney(row.withdrawal, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-orange-600 whitespace-nowrap">{formatMoney(row.payment, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-blue-600 whitespace-nowrap">{formatMoney(row.topup, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-purple-600 whitespace-nowrap">{formatMoney(row.delivery, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-indigo-600 whitespace-nowrap">{formatMoney(row.delivery_commission, "")}</td>
                      <td className="px-0.5 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-slate-600 whitespace-nowrap">{formatMoney(row.commission, "")}</td>
                      <td className="px-1 sm:px-3 py-1 sm:py-2.5 text-[9px] sm:text-sm font-mono text-right text-twilight-900 font-bold whitespace-nowrap">{formatMoney(row.balance, "")}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-twilight-900 text-white">
                <tr>
                  <td className="px-1 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-bold whitespace-nowrap">TOPLAM</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold whitespace-nowrap">{formatMoney(tableTotals.deposit, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold whitespace-nowrap">{formatMoney(tableTotals.withdrawal, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold whitespace-nowrap">{formatMoney(tableTotals.payment, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold whitespace-nowrap">{formatMoney(tableTotals.topup, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold whitespace-nowrap">{formatMoney(tableTotals.delivery, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold whitespace-nowrap">{formatMoney(tableTotals.delivery_commission, "")}</td>
                  <td className="px-0.5 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold whitespace-nowrap">{formatMoney(tableTotals.commission, "")}</td>
                  <td className="px-1 sm:px-3 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold whitespace-nowrap">{formatMoney(balance, "")}</td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Blocks Section */}
      {hasBlocks && blocksData?.items && blocksData.items.length > 0 && (
        <Card className="border-0 shadow-lg border-l-4 border-l-orange-500">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-orange-100 flex items-center justify-center">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-twilight-900">Aktif Blokeler</h3>
                  <p className="text-[10px] sm:text-sm text-twilight-500">Bekleyen işlemler</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-twilight-500">Toplam</p>
                <p className="text-sm sm:text-xl font-bold text-orange-600">{formatMoney(blockedAmount)}</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {blocksData.items
                .filter((block: any) => !block.resolved_at)
                .map((block: any) => {
                  const startDate = new Date(block.started_at);
                  const daysPassed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-orange-50/50 border border-orange-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1">
                          <span className="text-sm sm:text-xl font-bold text-orange-600">
                            {formatMoney(parseFloat(block.amount))}
                          </span>
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-bold shrink-0">
                            {daysPassed} gün
                          </span>
                        </div>
                        {block.reason && (
                          <p className="text-[11px] sm:text-sm text-twilight-600 truncate">{block.reason}</p>
                        )}
                        <p className="text-[10px] sm:text-xs text-twilight-400 mt-0.5">
                          {formatTurkeyDate(block.started_at)}
                          {block.estimated_days && ` \u2022 Tahmini: ${block.estimated_days} gün`}
                        </p>
                      </div>
                      <Unlock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 ml-2 shrink-0" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-twilight-500 bg-twilight-50 p-2.5 sm:p-4 rounded-lg sm:rounded-xl">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-emerald-500"></div>
          <span>Yatırım</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-rose-500"></div>
          <span>Çekim</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-orange-500"></div>
          <span>Ödeme</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-blue-500"></div>
          <span>Takviye</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-purple-500"></div>
          <span>Teslimat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-indigo-500"></div>
          <span>Tes.Kom.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-slate-500"></div>
          <span>Komisyon</span>
        </div>
      </div>
    </div>
  );
}
