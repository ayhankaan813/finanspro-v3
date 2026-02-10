"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { useDashboardStats, useTransactions } from "@/hooks/use-api";

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: transactions, isLoading: txLoading } = useTransactions({
    date_from: selectedDate,
    date_to: selectedDate,
    limit: 100,
  });

  const isLoading = statsLoading || txLoading;

  // Calculate daily stats from transactions
  const dailyStats = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    depositCount: 0,
    withdrawalCount: 0,
    netFlow: 0,
  };

  if (transactions?.items) {
    transactions.items.forEach((tx) => {
      const amount = parseFloat(tx.gross_amount);
      if (tx.type === "DEPOSIT") {
        dailyStats.totalDeposits += amount;
        dailyStats.depositCount++;
      } else if (tx.type === "WITHDRAWAL") {
        dailyStats.totalWithdrawals += amount;
        dailyStats.withdrawalCount++;
      }
    });
    dailyStats.netFlow = dailyStats.totalDeposits - dailyStats.totalWithdrawals;
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Günlük Özet</h1>
          <p className="text-muted-foreground">
            Günlük finansal özet ve işlem raporu
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44"
          />
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Yatırım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-amount text-success-600">
                  {formatMoney(dailyStats.totalDeposits)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dailyStats.depositCount} işlem
                </p>
              </div>
              <div className="rounded-full bg-success-100 p-3">
                <ArrowUpRight className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Çekim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-amount text-danger-600">
                  {formatMoney(dailyStats.totalWithdrawals)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dailyStats.withdrawalCount} işlem
                </p>
              </div>
              <div className="rounded-full bg-danger-100 p-3">
                <ArrowDownRight className="h-5 w-5 text-danger-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Akış
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold font-amount ${
                  dailyStats.netFlow >= 0 ? "text-success-600" : "text-danger-600"
                }`}>
                  {formatMoney(dailyStats.netFlow)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Yatırım - Çekim
                </p>
              </div>
              <div className={`rounded-full p-3 ${
                dailyStats.netFlow >= 0 ? "bg-success-100" : "bg-danger-100"
              }`}>
                {dailyStats.netFlow >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-success-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-danger-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam İşlem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {transactions?.items?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedDate}
                </p>
              </div>
              <div className="rounded-full bg-primary-100 p-3">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Güncel Bakiyeler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm text-muted-foreground">Toplam Kasa</p>
              <p className="text-xl font-bold font-amount">
                {formatMoney(stats?.totalCash || 0)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm text-muted-foreground">Site Borcu</p>
              <p className="text-xl font-bold font-amount text-site">
                {formatMoney(stats?.siteDebt || 0)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm text-muted-foreground">Partner Hak Ediş</p>
              <p className="text-xl font-bold font-amount text-partner">
                {formatMoney(stats?.partnerBalance || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Günün İşlemleri</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions?.items && transactions.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Saat</th>
                    <th className="pb-3 font-medium">Tür</th>
                    <th className="pb-3 font-medium">Site/Partner</th>
                    <th className="pb-3 font-medium">Finansör</th>
                    <th className="pb-3 font-medium text-right">Tutar</th>
                    <th className="pb-3 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.items.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">
                        {new Date(tx.transaction_date).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          tx.type === "DEPOSIT"
                            ? "bg-success-100 text-success-700"
                            : tx.type === "WITHDRAWAL"
                            ? "bg-danger-100 text-danger-700"
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-sm">{tx.site?.name || "-"}</td>
                      <td className="py-3 text-sm">{tx.financier_id ? "Finansör" : "-"}</td>
                      <td className="py-3 text-right font-amount font-medium">
                        {formatMoney(parseFloat(tx.gross_amount))}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          tx.status === "COMPLETED"
                            ? "bg-success-100 text-success-700"
                            : tx.status === "PENDING"
                            ? "bg-warning-100 text-warning-700"
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Bu tarihte işlem bulunamadı
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
