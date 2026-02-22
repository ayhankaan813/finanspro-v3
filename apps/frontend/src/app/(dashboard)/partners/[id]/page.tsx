"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, cn } from "@/lib/utils";
import { usePartner, usePartnerStatistics, usePartnerMonthlyStatistics } from "@/hooks/use-api";
import {
  ArrowLeft,
  Loader2,
  FileDown,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  Percent,
} from "lucide-react";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);

  const { data: partner, isLoading: partnerLoading } = usePartner(partnerId);
  const { data: statistics, isLoading: statsLoading } = usePartnerStatistics(partnerId, selectedYear);
  const { data: monthlyStats } = usePartnerMonthlyStatistics(
    partnerId,
    selectedYear,
    selectedMonth || 1
  );

  if (partnerLoading || statsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-twilight-600" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
        <h3 className="text-lg font-bold text-twilight-900">Partner bulunamadı</h3>
        <Button onClick={() => router.push("/partners")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>
    );
  }

  const balance = parseFloat(partner.account?.balance || "0");

  const monthlyData = statistics?.monthlyData?.map((data) => ({
    month: data.month,
    monthName: MONTHS[data.month - 1],
    commission_earned: parseFloat(data.commission_earned || "0"),
    payment_received: parseFloat(data.payment_received || "0"),
    topup_made: parseFloat(data.topup_made || "0"),
    balance: parseFloat(data.balance || "0"),
  })) || Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: MONTHS[i],
    commission_earned: 0, payment_received: 0, topup_made: 0, balance: 0,
  }));

  const daysInSelectedMonth = selectedMonth ? new Date(selectedYear, selectedMonth, 0).getDate() : 0;
  const dailyData = monthlyStats?.dailyData?.map((data) => ({
    day: data.day,
    commission_earned: parseFloat(data.commission_earned || "0"),
    payment_received: parseFloat(data.payment_received || "0"),
    topup_made: parseFloat(data.topup_made || "0"),
    balance: parseFloat(data.balance || "0"),
  })) || Array.from({ length: daysInSelectedMonth }, (_, i) => ({
    day: i + 1,
    commission_earned: 0, payment_received: 0, topup_made: 0, balance: 0,
  }));

  // Stat card totals
  const currentMonthData = selectedMonth ? monthlyData[selectedMonth - 1] : null;
  const totals = currentMonthData ? {
    commission_earned: currentMonthData.commission_earned,
    payment_received: currentMonthData.payment_received,
    topup_made: currentMonthData.topup_made,
  } : {
    commission_earned: monthlyData.reduce((acc, m) => acc + m.commission_earned, 0),
    payment_received: monthlyData.reduce((acc, m) => acc + m.payment_received, 0),
    topup_made: monthlyData.reduce((acc, m) => acc + m.topup_made, 0),
  };

  // Table footer totals
  const tableData = selectedMonth ? dailyData : monthlyData;
  const tableTotals = {
    commission_earned: tableData.reduce((acc, d) => acc + d.commission_earned, 0),
    payment_received: tableData.reduce((acc, d) => acc + d.payment_received, 0),
    topup_made: tableData.reduce((acc, d) => acc + d.topup_made, 0),
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
    { label: "Komisyon", value: totals.commission_earned, color: "text-emerald-600", bg: "bg-emerald-50", icon: Percent },
    { label: "Ödeme", value: totals.payment_received, color: "text-rose-600", bg: "bg-rose-50", icon: DollarSign },
    { label: "Takviye", value: totals.topup_made, color: "text-blue-600", bg: "bg-blue-50", icon: RefreshCw },
  ];

  return (
    <div className="space-y-3 sm:space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/partners")}
            className="rounded-xl h-8 w-8 sm:h-10 sm:w-10 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-3xl font-bold text-twilight-900">{partner.name}</h1>
            <p className="text-[10px] sm:text-sm text-twilight-500 font-mono">{partner.code}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-1 sm:gap-2 h-7 sm:h-10 text-[11px] sm:text-sm px-2 sm:px-4 rounded-lg sm:rounded-xl">
          <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Excel&apos;e Aktar</span>
          <span className="sm:hidden">Excel</span>
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white overflow-hidden">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div>
            <p className="text-[10px] sm:text-sm text-purple-300 uppercase tracking-wider mb-0.5 sm:mb-2">Hak Ediş Bakiyesi</p>
            <p className={cn(
              "text-2xl sm:text-4xl lg:text-5xl font-bold font-mono",
              balance >= 0 ? "text-rose-300" : "text-emerald-300"
            )}>
              {formatMoney(Math.abs(balance))}
            </p>
            <p className="text-[10px] sm:text-xs text-purple-300 mt-1 sm:mt-2">
              {balance > 0
                ? "Partner'a ödeme yapmanız gerekiyor"
                : balance < 0
                ? "Partner fazla takviye yapmış (alacaklısınız)"
                : "Hesaplar kapalı"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg sm:rounded-xl bg-white p-2 sm:p-4 border border-slate-100 shadow-sm">
              <div className={cn("h-6 w-6 sm:h-8 sm:w-8 rounded-md sm:rounded-lg flex items-center justify-center mb-1 sm:mb-2", stat.bg)}>
                <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4", stat.color)} />
              </div>
              <p className="text-[9px] sm:text-xs font-medium text-slate-500 uppercase">{stat.label}</p>
              <p className={cn("text-xs sm:text-lg font-bold font-mono mt-0.5", stat.color)}>
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
            <table className="w-full table-fixed">
              <thead className="sticky top-0 z-10 bg-twilight-50/95 backdrop-blur-sm shadow-[0_1px_0_0_theme(colors.twilight.100)]">
                <tr>
                  <th className="w-[40px] sm:w-[80px] px-1.5 sm:px-4 py-1.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-twilight-600 uppercase">TARİH</th>
                  <th className="px-1 sm:px-4 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-emerald-600 uppercase">KOM.</th>
                  <th className="px-1 sm:px-4 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-rose-600 uppercase">ÖDEME</th>
                  <th className="px-1 sm:px-4 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-blue-600 uppercase">TAK.</th>
                  <th className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-twilight-900 uppercase">BAKİYE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-twilight-50">
                {selectedMonth ? (
                  dailyData.map((day) => (
                    <tr key={day.day} className="hover:bg-twilight-50/50 transition-colors">
                      <td className="px-1.5 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900">{day.day}</td>
                      <td className="px-1 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-mono text-right text-emerald-600">{formatMoney(day.commission_earned, "")}</td>
                      <td className="px-1 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-mono text-right text-rose-600">{formatMoney(day.payment_received, "")}</td>
                      <td className="px-1 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-mono text-right text-blue-600">{formatMoney(day.topup_made, "")}</td>
                      <td className="px-1.5 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-mono text-right text-twilight-900 font-bold">{formatMoney(day.balance, "")}</td>
                    </tr>
                  ))
                ) : (
                  monthlyData.map((month) => (
                    <tr
                      key={month.month}
                      className="hover:bg-twilight-50/50 transition-colors cursor-pointer"
                      onClick={() => handleMonthClick(month.month)}
                    >
                      <td className="px-1.5 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-medium text-twilight-900">{month.monthName}</td>
                      <td className="px-1 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-mono text-right text-emerald-600">{formatMoney(month.commission_earned, "")}</td>
                      <td className="px-1 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-mono text-right text-rose-600">{formatMoney(month.payment_received, "")}</td>
                      <td className="px-1 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-mono text-right text-blue-600">{formatMoney(month.topup_made, "")}</td>
                      <td className="px-1.5 sm:px-4 py-1 sm:py-2.5 text-[10px] sm:text-sm font-mono text-right text-twilight-900 font-bold">{formatMoney(month.balance, "")}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-twilight-900 text-white">
                <tr>
                  <td className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-[9px] sm:text-sm font-bold">TOPLAM</td>
                  <td className="px-1 sm:px-4 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.commission_earned, "")}</td>
                  <td className="px-1 sm:px-4 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.payment_received, "")}</td>
                  <td className="px-1 sm:px-4 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(tableTotals.topup_made, "")}</td>
                  <td className="px-1.5 sm:px-4 py-1.5 sm:py-3 text-[9px] sm:text-sm font-mono text-right font-bold">{formatMoney(balance, "")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-twilight-500 bg-twilight-50 p-2.5 sm:p-4 rounded-lg sm:rounded-xl">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-emerald-500"></div>
          <span>Komisyon: Hak ediş</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-rose-500"></div>
          <span>Ödeme: Yapılan ödeme</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-blue-500"></div>
          <span>Takviye: Kasaya yatırılan</span>
        </div>
      </div>
    </div>
  );
}
