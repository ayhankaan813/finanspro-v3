"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { useFinancier, useFinancierTransactions, useFinancierBlocks } from "@/hooks/use-api";
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
  Percent,
  HandCoins,
  Banknote,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function FinancierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const financierId = params.id as string;

  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear] = useState<number>(new Date().getFullYear());

  const { data: financier, isLoading: isLoadingFinancier } = useFinancier(financierId);
  const { data: transactionsData, isLoading: isLoadingTransactions } = useFinancierTransactions(
    financierId,
    { page: 1, limit: 1000 }
  );
  const { data: blocksData } = useFinancierBlocks(financierId);

  if (isLoadingFinancier || isLoadingTransactions) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-twilight-400 font-medium">Finansör detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!financier) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-twilight-900 mb-2">Finansör Bulunamadı</h2>
          <p className="text-twilight-500 mb-6">Bu finansör mevcut değil veya silinmiş olabilir.</p>
          <Button onClick={() => router.push("/financiers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Finansörlere Dön
          </Button>
        </div>
      </div>
    );
  }

  const transactions = transactionsData?.items || [];

  // DEBUG: Log transactions
  console.log('Financier transactions:', transactions.length);
  console.log('Transactions:', transactions.map(t => ({
    date: t.transaction_date,
    type: t.type,
    amount: t.gross_amount,
    commission: t.commission_snapshot?.financier_commission_amount
  })));

  // Calculate monthly data with running balance
  const monthlyDataTemp = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTransactions = transactions.filter((t) => {
      const txDate = new Date(t.transaction_date);
      return txDate.getMonth() + 1 === month && txDate.getFullYear() === selectedYear;
    });

    let deposit = 0;
    let withdrawal = 0;
    let payment = 0;
    let topup = 0;
    let commission = 0;

    monthTransactions.forEach((t) => {
      const grossAmount = parseFloat(t.gross_amount || "0");

      if (t.type === "DEPOSIT" && t.financier_id === financierId) {
        deposit += grossAmount;
        const commissionAmount = parseFloat(t.commission_snapshot?.financier_commission_amount || "0");
        commission += commissionAmount;
      }

      if (t.type === "WITHDRAWAL" && t.financier_id === financierId) {
        withdrawal += grossAmount;
        const commissionAmount = parseFloat(t.commission_snapshot?.financier_commission_amount || "0");
        commission += commissionAmount;
      }

      if (t.type === "PAYMENT" && t.financier_id === financierId) {
        payment += grossAmount;
      }

      if (t.type === "TOPUP" && t.financier_id === financierId) {
        topup += grossAmount;
      }
    });

    return {
      month,
      monthName: MONTHS[i],
      deposit,
      withdrawal,
      payment,
      topup,
      commission,
      netChange: deposit - commission - withdrawal - payment + topup,
    };
  });

  // Calculate running balance (backwards from current balance)
  const currentBalance = parseFloat(financier.account?.balance || "0");
  let runningBalance = currentBalance;
  const monthlyData = [];

  for (let i = 11; i >= 0; i--) {
    const data = monthlyDataTemp[i];
    monthlyData.unshift({
      month: data.month,
      monthName: data.monthName,
      deposit: data.deposit,
      withdrawal: data.withdrawal,
      payment: data.payment,
      topup: data.topup,
      commission: data.commission,
      balance: runningBalance,
    });
    runningBalance -= data.netChange;
  }

  // Calculate daily data for selected month with running balance
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dailyDataTemp = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayTransactions = transactions.filter((t) => {
      const txDate = new Date(t.transaction_date);
      return (
        txDate.getDate() === day &&
        txDate.getMonth() + 1 === selectedMonth &&
        txDate.getFullYear() === selectedYear
      );
    });

    let deposit = 0;
    let withdrawal = 0;
    let payment = 0;
    let topup = 0;
    let commission = 0;

    dayTransactions.forEach((t) => {
      const grossAmount = parseFloat(t.gross_amount || "0");

      if (t.type === "DEPOSIT" && t.financier_id === financierId) {
        deposit += grossAmount;
        const commissionAmount = parseFloat(t.commission_snapshot?.financier_commission_amount || "0");
        commission += commissionAmount;
      }

      if (t.type === "WITHDRAWAL" && t.financier_id === financierId) {
        withdrawal += grossAmount;
        const commissionAmount = parseFloat(t.commission_snapshot?.financier_commission_amount || "0");
        commission += commissionAmount;
      }

      if (t.type === "PAYMENT" && t.financier_id === financierId) {
        payment += grossAmount;
      }

      if (t.type === "TOPUP" && t.financier_id === financierId) {
        topup += grossAmount;
      }
    });

    return {
      day,
      date: `${day} ${MONTHS[selectedMonth - 1]}`,
      deposit,
      withdrawal,
      payment,
      topup,
      commission,
      netChange: deposit - commission - withdrawal - payment + topup,
    };
  });

  // Calculate running balance for daily data
  let dailyRunningBalance = currentBalance;
  const dailyData = [];
  for (let i = daysInMonth - 1; i >= 0; i--) {
    const data = dailyDataTemp[i];
    dailyData.unshift({
      day: data.day,
      date: data.date,
      deposit: data.deposit,
      withdrawal: data.withdrawal,
      payment: data.payment,
      topup: data.topup,
      commission: data.commission,
      balance: dailyRunningBalance,
    });
    dailyRunningBalance -= data.netChange;
  }

  const balance = parseFloat(financier.account?.balance || "0");
  const blockedAmount = parseFloat(financier.account?.blocked_amount || "0");
  const availableBalance = parseFloat(financier.available_balance || "0");
  const hasBlocks = financier.active_blocks_count > 0;

  // Stats for daily view
  const totalDeposit = dailyData.reduce((sum, d) => sum + d.deposit, 0);
  const totalWithdrawal = dailyData.reduce((sum, d) => sum + d.withdrawal, 0);
  const totalPayment = dailyData.reduce((sum, d) => sum + d.payment, 0);
  const totalTopup = dailyData.reduce((sum, d) => sum + d.topup, 0);
  const totalCommission = dailyData.reduce((sum, d) => sum + d.commission, 0);
  const netBalance = totalCommission + totalTopup - totalPayment;

  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
    setViewMode("daily");
  };

  const handlePrevMonth = () => {
    if (selectedMonth > 1) {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth < 12) {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative z-10 p-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/financiers")}
            className="mb-4 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Finansörlere Dön
          </Button>

          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                {hasBlocks ? (
                  <Lock className="h-10 w-10 text-amber-50" />
                ) : (
                  <Wallet className="h-10 w-10 text-amber-50" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{financier.name}</h1>
                <p className="text-amber-100/80 text-lg font-medium">{financier.code}</p>
                {financier.description && (
                  <p className="text-amber-100/60 text-sm mt-2 max-w-2xl">{financier.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
              <p className="text-amber-100/70 text-sm font-bold uppercase tracking-wider mb-2">Toplam Bakiye</p>
              <p className="text-3xl font-bold text-white">{formatMoney(balance)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
              <p className="text-emerald-100/70 text-sm font-bold uppercase tracking-wider mb-2">Müsait Bakiye</p>
              <p className="text-3xl font-bold text-white">{formatMoney(availableBalance)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
              <p className="text-orange-100/70 text-sm font-bold uppercase tracking-wider mb-2">Blokeli Tutar</p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-white">{formatMoney(blockedAmount)}</p>
                {hasBlocks && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-300/30">
                    <AlertTriangle className="h-3 w-3 text-orange-200" />
                    <span className="text-xs font-bold text-orange-100">{financier.active_blocks_count} Bloke</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle & Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white rounded-xl p-1.5 shadow-sm border border-twilight-100">
          <Button
            variant={viewMode === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("monthly")}
            className={`rounded-lg ${viewMode === "monthly" ? "bg-amber-600 text-white hover:bg-amber-700" : "text-twilight-600"}`}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Aylık Görünüm
          </Button>
          <Button
            variant={viewMode === "daily" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("daily")}
            className={`rounded-lg ${viewMode === "daily" ? "bg-amber-600 text-white hover:bg-amber-700" : "text-twilight-600"}`}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Günlük Görünüm
          </Button>
        </div>

        {viewMode === "daily" && (
          <div className="flex items-center gap-3 bg-white rounded-xl p-2 shadow-sm border border-twilight-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              disabled={selectedMonth === 1}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold text-twilight-900 min-w-[100px] text-center">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              disabled={selectedMonth === 12}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards - Only in Daily View */}
      {viewMode === "daily" && (
        <div className="grid grid-cols-6 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Yatırım</p>
              </div>
              <p className="text-2xl font-bold text-emerald-900">{formatMoney(totalDeposit)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-rose-100/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Çekim</p>
              </div>
              <p className="text-2xl font-bold text-rose-900">{formatMoney(totalWithdrawal)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Ödeme</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">{formatMoney(totalPayment)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <ArrowUpFromLine className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Takviye</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatMoney(totalTopup)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
                  <HandCoins className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Komisyon</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">{formatMoney(totalCommission)}</p>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg ${netBalance >= 0 ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50" : "bg-gradient-to-br from-rose-50 to-rose-100/50"}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-xl ${netBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"} flex items-center justify-center`}>
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <p className={`text-xs font-bold ${netBalance >= 0 ? "text-emerald-700" : "text-rose-700"} uppercase tracking-wider`}>Bakiye</p>
              </div>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-emerald-900" : "text-rose-900"}`}>{formatMoney(netBalance)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-twilight-50 to-twilight-100/50 border-b-2 border-twilight-200">
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Tarih</span>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Yatırım</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Çekim</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Banknote className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Ödeme</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Takviye</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <HandCoins className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Komisyon</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Lock className="h-4 w-4 text-amber-700" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Blokeli</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Wallet className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Bakiye</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-twilight-100">
              {viewMode === "monthly" ? (
                monthlyData.map((row, idx) => (
                  <motion.tr
                    key={row.month}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-amber-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleMonthClick(row.month)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-twilight-900 group-hover:text-amber-700 transition-colors">
                        {row.monthName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">{formatMoney(row.deposit)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-rose-600">{formatMoney(row.withdrawal)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-purple-600">{formatMoney(row.payment)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-blue-600">{formatMoney(row.topup)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-orange-600">{formatMoney(row.commission)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-amber-700">{formatMoney(blockedAmount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${row.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatMoney(row.balance)}
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                dailyData.map((row, idx) => (
                  <motion.tr
                    key={row.day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className="hover:bg-amber-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-twilight-900">{row.date}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">{formatMoney(row.deposit)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-rose-600">{formatMoney(row.withdrawal)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-purple-600">{formatMoney(row.payment)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-blue-600">{formatMoney(row.topup)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-orange-600">{formatMoney(row.commission)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-amber-700">{formatMoney(blockedAmount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${row.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatMoney(row.balance)}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Active Blocks Section */}
      {hasBlocks && blocksData?.items && blocksData.items.length > 0 && (
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-twilight-900">Aktif Blokeler</h3>
                  <p className="text-sm text-twilight-500">Bekleyen işlemler için ayrılmış tutarlar</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-twilight-500 font-medium">Toplam Bloke</p>
                <p className="text-2xl font-bold text-orange-600">{formatMoney(blockedAmount)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {blocksData.items
                .filter((block: any) => !block.resolved_at)
                .map((block: any) => {
                  const startDate = new Date(block.started_at);
                  const daysPassed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 border border-orange-100 hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-orange-600">
                            {formatMoney(parseFloat(block.amount))}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                            {daysPassed} gün önce
                          </span>
                        </div>
                        {block.reason && (
                          <p className="text-sm text-twilight-600">{block.reason}</p>
                        )}
                        <p className="text-xs text-twilight-400 mt-1">
                          Başlangıç: {startDate.toLocaleDateString('tr-TR')}
                          {block.estimated_days && ` • Tahmini süre: ${block.estimated_days} gün`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Unlock className="h-5 w-5 text-orange-400" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold text-twilight-900 mb-4 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-amber-600"></span>
            Açıklama
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <HandCoins className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Komisyon:</span>
                <span className="text-twilight-600 ml-1">Finansörün deposit/withdrawal işlemlerinden kazandığı komisyon</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Banknote className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Ödeme:</span>
                <span className="text-twilight-600 ml-1">Finansöre yapılan ödemeler (bakiyeyi azaltır)</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Takviye:</span>
                <span className="text-twilight-600 ml-1">Finansörün kasaya yaptığı takviye (bakiyeyi artırır)</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Teslimat:</span>
                <span className="text-twilight-600 ml-1">Finansörün sitelere yaptığı teslimatlar</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Percent className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Tes.Komis.:</span>
                <span className="text-twilight-600 ml-1">Teslimat işlemlerinden kazanılan komisyon</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Blokeli:</span>
                <span className="text-twilight-600 ml-1">Bekleyen işlemler için ayrılmış tutar (anlık)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
