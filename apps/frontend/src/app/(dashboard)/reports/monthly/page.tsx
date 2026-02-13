"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Wallet,
  Building2,
  Users,
  Search,
  Activity,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar
} from "lucide-react";
import { useTransactions, useFinanciers } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDaysInMonth } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function MonthlyReportPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateFrom = startOfMonth(currentDate).toISOString();
  const dateTo = endOfMonth(currentDate).toISOString();

  // Fetch transactions - sadece COMPLETED olanlar (REVERSED/REVERSAL hariç)
  const { data: transactions, isLoading: isTxLoading } = useTransactions({
    date_from: dateFrom,
    date_to: dateTo,
    status: "COMPLETED",
    limit: 100, // API limit is 100
  });

  // Fetch all financiers to calculate total "Kasa" (cash) balance
  const { data: financiersData, isLoading: isFinanciersLoading } = useFinanciers({ limit: 100 });

  const processedData = useMemo(() => {
    if (!transactions?.items || isFinanciersLoading) return null;

    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });

    // 1. Initialize Daily Map
    const dailyMap = new Map();
    daysInMonth.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd");
      dailyMap.set(dayKey, {
        date: day,
        dayStr: format(day, "d MMM", { locale: tr }),
        deposit: 0,
        withdrawal: 0,
        commission: 0,
        delivery: 0,
        deliveryCommission: 0, // Teslim Kom.
        payment: 0, // Ödeme: Payment + PartnerPayment
        topup: 0, // Takviye
        netChange: 0, // Daily net change for Kasa calculation
        balance: 0, // Will be calculated after processing all txs
      });
    });

    const totals = {
      deposit: 0,
      withdrawal: 0,
      commission: 0,
      delivery: 0,
      deliveryCommission: 0,
      payment: 0,
      topup: 0,
      netChange: 0,
      startBalance: 0, // Devir
      endBalance: 0, // Kasa
    };

    // 2. Aggregate Transactions (skip REVERSAL type - they are cancellation records)
    const activeItems = transactions.items.filter(tx => tx.type !== "REVERSAL");
    activeItems.forEach(tx => {
      const txDate = new Date(tx.transaction_date);
      const dayKey = format(txDate, "yyyy-MM-dd");
      const dayEntry = dailyMap.get(dayKey);

      if (dayEntry) {
        const amount = parseFloat(tx.gross_amount);

        // === KASAYA GİREN (Money IN to Financier) ===
        if (tx.type === "DEPOSIT") {
          dayEntry.deposit += amount;
          totals.deposit += amount;
          dayEntry.netChange += amount;
        }
        else if (tx.type === "TOP_UP" || tx.type === "EXTERNAL_DEBT_IN") {
          // Takviye: Kasaya para girişi (partner, org, dış kaynak) + Dış borç alma
          dayEntry.topup += amount;
          totals.topup += amount;
          dayEntry.netChange += amount;
        }

        // === KASADAN ÇIKAN (Money OUT from Financier) ===
        else if (tx.type === "WITHDRAWAL") {
          dayEntry.withdrawal += amount;
          totals.withdrawal += amount;
          dayEntry.netChange -= amount;
        }
        else if (tx.type === "PAYMENT" || tx.type === "PARTNER_PAYMENT" ||
                 tx.type === "ORG_EXPENSE" || tx.type === "ORG_WITHDRAW" ||
                 tx.type === "ORG_INCOME" || tx.type === "EXTERNAL_PAYMENT" ||
                 tx.type === "EXTERNAL_DEBT_OUT") {
          // Ödeme: Tüm kasadan çıkışlar (partner, org gider/çekim, dış borç verme)
          dayEntry.payment += amount;
          totals.payment += amount;
          dayEntry.netChange -= amount;
        }
        else if (tx.type === "DELIVERY" || tx.type === "SITE_DELIVERY") {
          // Teslim: Kasa → Site
          dayEntry.delivery += amount;
          totals.delivery += amount;
          dayEntry.netChange -= amount;

          // Teslim Komisyonu
          if (tx.delivery_commission_amount) {
            const comm = parseFloat(tx.delivery_commission_amount);
            dayEntry.deliveryCommission += comm;
            totals.deliveryCommission += comm;
          }
        }
        // FINANCIER_TRANSFER: Kasalar arası transfer, toplam kasa değişmez (netChange = 0)

        // Komisyon Geliri (Org'un işlemden aldığı pay - bilgi amaçlı)
        if (tx.commission_snapshot) {
          const comm = parseFloat(tx.commission_snapshot.organization_amount || "0");
          dayEntry.commission += comm;
          totals.commission += comm;
        }
      }
    });

    // 2b. Calculate total netChange from all days
    dailyMap.forEach((day) => {
      totals.netChange += day.netChange;
    });

    // 3. Calculate Balances (Devir & Running Kasa)
    // Kasa = Toplam Finansör Bakiyesi (tüm nakit finansörlerde tutulur)
    const totalFinancierBalance = (financiersData?.items || []).reduce((sum, f) => {
      return sum + parseFloat(f.account?.balance || "0");
    }, 0);

    const isCurrentMonth = isSameDay(startOfMonth(new Date()), startOfMonth(currentDate));

    if (isCurrentMonth) {
      // Back-calculate devir: Devir = Güncel Kasa - Ay İçi Net Değişim
      totals.startBalance = totalFinancierBalance - totals.netChange;
    } else {
      // Geçmiş aylar için snapshot olmadığından 0 göster
      totals.startBalance = 0;
    }

    let runningBalance = totals.startBalance;
    const dailyData = Array.from(dailyMap.values()).map((day: any) => {
      runningBalance += day.netChange;
      day.balance = runningBalance;
      return day;
    });

    totals.endBalance = runningBalance; // Should match currentBalance if current month

    return { dailyData, totals };

  }, [transactions, currentDate, financiersData, isFinanciersLoading]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (isTxLoading || isFinanciersLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-twilight-600" />
      </div>
    );
  }

  const { dailyData, totals } = processedData || {
    dailyData: [],
    totals: { deposit: 0, withdrawal: 0, commission: 0, delivery: 0, deliveryCommission: 0, payment: 0, topup: 0, netChange: 0, startBalance: 0, endBalance: 0 }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-twilight-900 tracking-tight">Aylık Rapor</h1>
          <p className="text-twilight-500">
            Detaylı finansal işlem dökümü ve günlük dağılım.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-twilight-200 shadow-sm">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="hover:bg-twilight-50 text-twilight-600">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[140px] text-center font-bold text-twilight-900">
            {format(currentDate, "MMMM yyyy", { locale: tr })}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="hover:bg-twilight-50 text-twilight-600">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-twilight-200 mx-1" />
          <Button variant="ghost" size="sm" className="text-twilight-600 hover:text-twilight-900 px-3">
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Devir Card */}
        <Card className="border-0 shadow-lg shadow-twilight-100/50 bg-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-twilight-500"></div>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-twilight-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-twilight-500">Devir</span>
            </div>
            <p className="text-xl font-bold text-twilight-900">{formatMoney(totals.startBalance)}</p>
          </CardContent>
        </Card>

        {/* Yatırım Card */}
        <Card className="border-0 shadow-lg shadow-emerald-50/50 bg-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Toplam Yatırım</span>
            </div>
            <p className="text-xl font-bold text-twilight-900">{formatMoney(totals.deposit)}</p>
          </CardContent>
        </Card>

        {/* Çekim Card */}
        <Card className="border-0 shadow-lg shadow-rose-50/50 bg-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Toplam Çekim</span>
            </div>
            <p className="text-xl font-bold text-twilight-900">{formatMoney(totals.withdrawal)}</p>
          </CardContent>
        </Card>

        {/* Komisyon Card */}
        <Card className="border-0 shadow-lg shadow-violet-50/50 bg-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-violet-500">Komisyon</span>
            </div>
            <p className="text-xl font-bold text-twilight-900">{formatMoney(totals.commission)}</p>
          </CardContent>
        </Card>

        {/* Kasa Card */}
        <Card className="border-0 shadow-lg shadow-blue-100/50 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl overflow-hidden relative">
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-100" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Güncel Kasa</span>
            </div>
            <p className="text-xl font-bold text-white">{formatMoney(totals.endBalance)}</p>
          </CardContent>
          <div className="absolute right-0 bottom-0 p-4 opacity-10">
            <Wallet className="h-16 w-16" />
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="rounded-3xl border-0 shadow-xl shadow-twilight-100/50 bg-white ring-1 ring-twilight-100 overflow-hidden">
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-twilight-900 text-white">
                  <th className="py-4 px-4 text-sm font-semibold text-left">Tarih</th>
                  <th className="py-4 px-4 text-sm font-semibold text-right text-emerald-300">Yatırım</th>
                  <th className="py-4 px-4 text-sm font-semibold text-right text-rose-300">Çekim</th>
                  <th className="py-4 px-4 text-sm font-semibold text-right text-violet-300">Komisyon</th>
                  <th className="py-4 px-4 text-sm font-semibold text-right text-orange-200">Teslim</th>
                  <th className="py-4 px-4 text-sm font-semibold text-right text-orange-200">Teslim Kom.</th>
                  <th className="py-4 px-4 text-sm font-semibold text-right text-yellow-200">Ödeme</th>
                  <th className="py-4 px-4 text-sm font-semibold text-right text-cyan-300">Takviye</th>
                  <th className="py-4 px-4 text-sm font-semibold text-right font-bold">Kasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-twilight-50">
                {dailyData.map((day) => (
                  <tr key={day.dayStr} className="hover:bg-twilight-50/50 transition-colors group">
                    <td className="py-3 px-4 text-sm text-twilight-700 font-medium">
                      {format(day.date, "dd.MM.yyyy", { locale: tr })}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-emerald-600 bg-emerald-50/30 group-hover:bg-emerald-50/50 transition-colors">
                      {day.deposit > 0 ? formatMoney(day.deposit) : <span className="text-emerald-300/50">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-rose-600 bg-rose-50/30 group-hover:bg-rose-50/50 transition-colors">
                      {day.withdrawal > 0 ? formatMoney(day.withdrawal) : <span className="text-rose-300/50">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-violet-600">
                      {day.commission > 0 ? formatMoney(day.commission) : <span className="text-twilight-200/50">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-orange-600">
                      {day.delivery > 0 ? formatMoney(day.delivery) : <span className="text-twilight-200/50">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-orange-600">
                      {day.deliveryCommission > 0 ? formatMoney(day.deliveryCommission) : <span className="text-twilight-200/50">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-yellow-600">
                      {day.payment > 0 ? formatMoney(day.payment) : <span className="text-twilight-200/50">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-cyan-600">
                      {day.topup > 0 ? formatMoney(day.topup) : <span className="text-twilight-200/50">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold font-mono text-twilight-900 bg-twilight-50/50">
                      {formatMoney(day.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-twilight-900 border-t border-twilight-200 text-white font-bold">
                <tr>
                  <td className="py-4 px-4 text-sm text-left">TOPLAM</td>
                  <td className="py-4 px-4 text-sm text-right text-emerald-300">{formatMoney(totals.deposit)}</td>
                  <td className="py-4 px-4 text-sm text-right text-rose-300">{formatMoney(totals.withdrawal)}</td>
                  <td className="py-4 px-4 text-sm text-right text-violet-300">{formatMoney(totals.commission)}</td>
                  <td className="py-4 px-4 text-sm text-right text-orange-200">{formatMoney(totals.delivery)}</td>
                  <td className="py-4 px-4 text-sm text-right text-orange-200">{formatMoney(totals.deliveryCommission)}</td>
                  <td className="py-4 px-4 text-sm text-right text-yellow-200">{formatMoney(totals.payment)}</td>
                  <td className="py-4 px-4 text-sm text-right text-cyan-300">{formatMoney(totals.topup)}</td>
                  <td className="py-4 px-4 text-sm text-right">{formatMoney(totals.endBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
