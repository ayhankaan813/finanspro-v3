"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import {
  FileBarChart,
  Download,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-api";

const months = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function MonthlyReportPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: stats, isLoading } = useDashboardStats();

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Mock monthly data - in real implementation, this would come from API
  const monthlyData = {
    totalDeposits: 15250000,
    totalWithdrawals: 12800000,
    siteDeliveries: 8500000,
    partnerPayments: 450000,
    commissionEarned: 285000,
    netProfit: 185000,
    transactionCount: 1245,
    avgTransactionSize: 22500,
  };

  const weeklyBreakdown = [
    { week: "1. Hafta", deposits: 3200000, withdrawals: 2800000 },
    { week: "2. Hafta", deposits: 4100000, withdrawals: 3500000 },
    { week: "3. Hafta", deposits: 3800000, withdrawals: 3200000 },
    { week: "4. Hafta", deposits: 4150000, withdrawals: 3300000 },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aylık Rapor</h1>
          <p className="text-muted-foreground">
            Aylık finansal performans ve özet raporu
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Excel İndir
        </Button>
      </div>

      {/* Month Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[200px]">
              <p className="text-2xl font-bold">
                {months[selectedMonth]} {selectedYear}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Yatırım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-amount text-success-600">
              {formatMoney(monthlyData.totalDeposits)}
            </p>
            <p className="text-xs text-success-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% geçen aya göre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Çekim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-amount text-danger-600">
              {formatMoney(monthlyData.totalWithdrawals)}
            </p>
            <p className="text-xs text-danger-600 flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              -5% geçen aya göre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Komisyon Geliri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-amount text-primary-600">
              {formatMoney(monthlyData.commissionEarned)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyData.transactionCount} işlem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Kar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-amount text-success-600">
              {formatMoney(monthlyData.netProfit)}
            </p>
            <p className="text-xs text-success-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8% geçen aya göre
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Haftalık Dağılım</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Hafta</th>
                  <th className="pb-3 font-medium text-right">Yatırım</th>
                  <th className="pb-3 font-medium text-right">Çekim</th>
                  <th className="pb-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {weeklyBreakdown.map((week) => (
                  <tr key={week.week} className="border-b last:border-0">
                    <td className="py-3 font-medium">{week.week}</td>
                    <td className="py-3 text-right font-amount text-success-600">
                      {formatMoney(week.deposits)}
                    </td>
                    <td className="py-3 text-right font-amount text-danger-600">
                      {formatMoney(week.withdrawals)}
                    </td>
                    <td className={`py-3 text-right font-amount font-medium ${
                      week.deposits - week.withdrawals >= 0
                        ? "text-success-600"
                        : "text-danger-600"
                    }`}>
                      {formatMoney(week.deposits - week.withdrawals)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-secondary">
                  <td className="py-3 font-bold">Toplam</td>
                  <td className="py-3 text-right font-amount font-bold text-success-600">
                    {formatMoney(monthlyData.totalDeposits)}
                  </td>
                  <td className="py-3 text-right font-amount font-bold text-danger-600">
                    {formatMoney(monthlyData.totalWithdrawals)}
                  </td>
                  <td className="py-3 text-right font-amount font-bold text-success-600">
                    {formatMoney(monthlyData.totalDeposits - monthlyData.totalWithdrawals)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Site & Partner Summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Site Teslim Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <span>Toplam Site Teslimi</span>
                <span className="font-amount font-bold">{formatMoney(monthlyData.siteDeliveries)}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Detaylı site bazlı rapor için Excel'i indirin
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partner Ödeme Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <span>Toplam Partner Ödemesi</span>
                <span className="font-amount font-bold">{formatMoney(monthlyData.partnerPayments)}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Detaylı partner bazlı rapor için Excel'i indirin
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
