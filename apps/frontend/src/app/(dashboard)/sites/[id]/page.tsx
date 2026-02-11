"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { useSiteById, useSiteTransactions, useSiteStatistics, useSiteMonthlyStatistics } from "@/hooks/use-api";
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
} from "lucide-react";

// Ay isimleri
const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Ay isimleri için fonksiyon kaldırıldı - artık API'den gelecek

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = yıllık görünüm

  const { data: site, isLoading: siteLoading } = useSiteById(siteId);
  const { data: statistics, isLoading: statsLoading } = useSiteStatistics(siteId, selectedYear);
  const { data: monthlyStats, isLoading: monthlyStatsLoading } = useSiteMonthlyStatistics(
    siteId,
    selectedYear,
    selectedMonth || 1
  );

  if (siteLoading || statsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-twilight-600" />
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
  // Display as-is (no sign flip needed)
  const accountBalance = parseFloat(site.account?.balance || "0");
  const displayBalance = accountBalance; // Show as-is: 94 TL stays 94 TL

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
    balance: parseFloat(data.balance || "0"), // Show as-is (LIABILITY account)
  })) || Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: MONTHS[i],
    deposit: 0,
    withdrawal: 0,
    delivery: 0,
    delivery_commission: 0,
    topup: 0,
    payment: 0,
    commission: 0,
    balance: 0,
  }));

  // Get daily data from API - backend returns all days in month
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
    balance: parseFloat(data.balance || "0"), // Show as-is (LIABILITY account)
  })) || Array.from({ length: daysInSelectedMonth }, (_, i) => ({
    day: i + 1,
    deposit: 0,
    withdrawal: 0,
    delivery: 0,
    delivery_commission: 0,
    topup: 0,
    payment: 0,
    commission: 0,
    balance: 0,
  }));

  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
  };

  const handleBackToYearly = () => {
    setSelectedMonth(null);
  };

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

  const currentMonthData = selectedMonth ? monthlyData[selectedMonth - 1] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/sites")}
            className="rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-twilight-900">{site.name}</h1>
            <p className="text-sm text-twilight-500 font-mono mt-1">{site.code}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Excel'e Aktar
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-twilight-200 mb-2">Güncel Bakiye</p>
              <p className={`text-5xl font-bold font-mono ${displayBalance >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {formatMoney(Math.abs(displayBalance))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Selector (sadece günlük görünümde) */}
      {selectedMonth && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-twilight-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-twilight-400" />
            <span className="text-sm font-medium text-twilight-900">Aylık Hesap Özeti</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToYearly}
              className="h-9"
            >
              Yıllık Görünüm
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="h-9 w-9 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[180px] text-center">
              <span className="text-lg font-bold text-twilight-900">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-9 w-9 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Monthly Stats (sadece günlük görünümde) */}
      {selectedMonth && currentMonthData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-twilight-500 uppercase mb-1">Toplam Yatırım</p>
              <p className="text-lg font-bold text-emerald-600 font-mono">
                {formatMoney(currentMonthData.deposit)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <ArrowUpFromLine className="h-4 w-4 text-rose-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-twilight-500 uppercase mb-1">Toplam Çekim</p>
              <p className="text-lg font-bold text-rose-600 font-mono">
                {formatMoney(currentMonthData.withdrawal)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-twilight-500 uppercase mb-1">Teslimat</p>
              <p className="text-lg font-bold text-purple-600 font-mono">
                {formatMoney(currentMonthData.delivery)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-twilight-500 uppercase mb-1">Takviye</p>
              <p className="text-lg font-bold text-blue-600 font-mono">
                {formatMoney(currentMonthData.topup)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-twilight-500 uppercase mb-1">Ödeme</p>
              <p className="text-lg font-bold text-orange-600 font-mono">
                {formatMoney(currentMonthData.payment)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-twilight-500 uppercase mb-1">Tes. Komisyon</p>
              <p className="text-lg font-bold text-indigo-600 font-mono">
                {formatMoney(currentMonthData.delivery_commission)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-twilight-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-twilight-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-twilight-500 uppercase mb-1">Komisyon</p>
              <p className="text-lg font-bold text-twilight-600 font-mono">
                {formatMoney(currentMonthData.commission)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Yearly or Daily Table */}
      <Card className="border-0 shadow-lg">
        <div className="border-b border-twilight-100 bg-twilight-50/30 px-6 py-4">
          <h2 className="text-lg font-bold text-twilight-900">
            {selectedMonth
              ? `${MONTHS[selectedMonth - 1]} ${selectedYear} Günlük Detay`
              : `${selectedYear} Yıllık Detay`
            }
          </h2>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-twilight-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-twilight-600 uppercase">
                    TARİH
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-twilight-600 uppercase">
                    YATIRIM
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-twilight-600 uppercase">
                    ÇEKİM
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-twilight-600 uppercase">
                    ÖDEME
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-twilight-600 uppercase">
                    TAKVİYE
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-twilight-600 uppercase">
                    TESLİMAT
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-twilight-600 uppercase">
                    TES.KOMİS.
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-twilight-600 uppercase">
                    KOMİSYON
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-twilight-600 uppercase">
                    BAKİYE
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-twilight-100">
                {selectedMonth ? (
                  // Günlük görünüm
                  dailyData.map((day) => (
                    <tr key={day.day} className="hover:bg-twilight-50/50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-twilight-900">
                        {day.day}. Gün
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-emerald-600">
                        {formatMoney(day.deposit)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-rose-600">
                        {formatMoney(day.withdrawal)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-orange-600">
                        {formatMoney(day.payment)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-blue-600">
                        {formatMoney(day.topup)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-purple-600">
                        {formatMoney(day.delivery)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-indigo-600">
                        {formatMoney(day.delivery_commission)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-twilight-600">
                        {formatMoney(day.commission)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-twilight-900 font-bold">
                        {formatMoney(day.balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  // Yıllık görünüm
                  monthlyData.map((month) => (
                    <tr
                      key={month.month}
                      className="hover:bg-twilight-50/50 transition-colors cursor-pointer"
                      onClick={() => handleMonthClick(month.month)}
                    >
                      <td className="px-6 py-3 text-sm font-medium text-twilight-900 hover:text-twilight-600 hover:underline">
                        {month.month}. {month.monthName}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-emerald-600">
                        {formatMoney(month.deposit)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-rose-600">
                        {formatMoney(month.withdrawal)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-orange-600">
                        {formatMoney(month.payment)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-blue-600">
                        {formatMoney(month.topup)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-purple-600">
                        {formatMoney(month.delivery)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-indigo-600">
                        {formatMoney(month.delivery_commission)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-twilight-600">
                        {formatMoney(month.commission)}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right text-twilight-900 font-bold">
                        {formatMoney(month.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-twilight-900 text-white">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold">TOPLAM</td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-bold">
                    {formatMoney(
                      selectedMonth
                        ? dailyData.reduce((acc, d) => acc + d.deposit, 0)
                        : monthlyData.reduce((acc, m) => acc + m.deposit, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-bold">
                    {formatMoney(
                      selectedMonth
                        ? dailyData.reduce((acc, d) => acc + d.withdrawal, 0)
                        : monthlyData.reduce((acc, m) => acc + m.withdrawal, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-bold">
                    {formatMoney(
                      selectedMonth
                        ? dailyData.reduce((acc, d) => acc + d.payment, 0)
                        : monthlyData.reduce((acc, m) => acc + m.payment, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-bold">
                    {formatMoney(
                      selectedMonth
                        ? dailyData.reduce((acc, d) => acc + d.topup, 0)
                        : monthlyData.reduce((acc, m) => acc + m.topup, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-bold">
                    {formatMoney(
                      selectedMonth
                        ? dailyData.reduce((acc, d) => acc + d.delivery, 0)
                        : monthlyData.reduce((acc, m) => acc + m.delivery, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-bold">
                    {formatMoney(
                      selectedMonth
                        ? dailyData.reduce((acc, d) => acc + d.delivery_commission, 0)
                        : monthlyData.reduce((acc, m) => acc + m.delivery_commission, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-bold">
                    {formatMoney(
                      selectedMonth
                        ? dailyData.reduce((acc, d) => acc + d.commission, 0)
                        : monthlyData.reduce((acc, m) => acc + m.commission, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-bold">
                    {formatMoney(Math.abs(displayBalance))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
