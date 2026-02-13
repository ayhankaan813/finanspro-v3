"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, cn } from "@/lib/utils";
import {
  Calendar,
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
  Send,
  MoreHorizontal,
  ArrowRight,
  BarChart3,
  PieChart,
  Landmark,
  UserCircle
} from "lucide-react";
import { useDashboardStats, useTransactions } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  // Fetch transactions for the selected day
  const { data: transactions, isLoading: txLoading } = useTransactions({
    date_from: selectedDate,
    date_to: selectedDate,
    limit: 200,
  });

  const isLoading = statsLoading || txLoading;

  // Process data for charts and stats
  const { dailyStats, hourlyData, topSites, topPartners, financierStats, externalStats } = useMemo(() => {
    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      depositCount: 0,
      withdrawalCount: 0,
      netFlow: 0,
      avgTransaction: 0,
      totalCommission: 0,
    };

    const hourlyMap = new Map<number, { hour: string; deposit: number; withdrawal: number }>();
    const siteMap = new Map<string, { name: string; volume: number; count: number }>();
    const partnerMap = new Map<string, { name: string; volume: number; count: number }>();
    const financierMap = new Map<string, { name: string; volume: number; count: number }>();
    const externalMap = new Map<string, { name: string; volume: number; count: number }>();

    // Initialize hourly map
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { hour: `${i}:00`, deposit: 0, withdrawal: 0 });
    }

    if (transactions?.items) {
      transactions.items.forEach((tx) => {
        const amount = parseFloat(tx.gross_amount);
        const date = new Date(tx.transaction_date);
        const hour = date.getHours();

        // Hourly Data
        const hourEntry = hourlyMap.get(hour)!;

        // Commission
        if (tx.commission_snapshot) {
          stats.totalCommission += parseFloat(tx.commission_snapshot.organization_amount || "0");
        }

        if (tx.type === "DEPOSIT") {
          stats.totalDeposits += amount;
          stats.depositCount++;
          hourEntry.deposit += amount;
        } else if (tx.type === "WITHDRAWAL") {
          stats.totalWithdrawals += amount;
          stats.withdrawalCount++;
          hourEntry.withdrawal += amount;
        }

        // Site Performance
        if (tx.site) {
          const entry = siteMap.get(tx.site.id) || { name: tx.site.name, volume: 0, count: 0 };
          entry.volume += amount;
          entry.count++;
          siteMap.set(tx.site.id, entry);
        }

        // Partner Performance
        if (tx.partner) {
          const entry = partnerMap.get(tx.partner.id) || { name: tx.partner.name, volume: 0, count: 0 };
          entry.volume += amount;
          entry.count++;
          partnerMap.set(tx.partner.id, entry);
        }

        // Financier Performance
        if (tx.financier) {
          const entry = financierMap.get(tx.financier.id) || { name: tx.financier.name, volume: 0, count: 0 };
          entry.volume += amount;
          entry.count++;
          financierMap.set(tx.financier.id, entry);
        }

        // External Party Performance
        if (tx.external_party) {
          const entry = externalMap.get(tx.external_party.id) || { name: tx.external_party.name, volume: 0, count: 0 };
          entry.volume += amount;
          entry.count++;
          externalMap.set(tx.external_party.id, entry);
        }
      });
      stats.netFlow = stats.totalDeposits - stats.totalWithdrawals;
      const totalCount = stats.depositCount + stats.withdrawalCount;
      stats.avgTransaction = totalCount > 0 ? (stats.totalDeposits + stats.totalWithdrawals) / totalCount : 0;
    }

    // Convert maps to arrays
    const hourlyData = Array.from(hourlyMap.values());
    const topSites = Array.from(siteMap.values()).sort((a, b) => b.volume - a.volume);
    const topPartners = Array.from(partnerMap.values()).sort((a, b) => b.volume - a.volume);
    const financierStats = Array.from(financierMap.values()).sort((a, b) => b.volume - a.volume);
    const externalStats = Array.from(externalMap.values()).sort((a, b) => b.volume - a.volume);

    return { dailyStats: stats, hourlyData, topSites, topPartners, financierStats, externalStats };
  }, [transactions]);

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DEPOSIT: 'Yatırım',
      WITHDRAWAL: 'Çekim',
      PAYMENT: 'Ödeme',
      TOP_UP: 'Takviye',
      DELIVERY: 'Teslimat',
      PARTNER_PAYMENT: 'Partner Ödemesi',
      EXTERNAL_DEBT_IN: 'Borç Alındı',
      EXTERNAL_DEBT_OUT: 'Borç Verildi',
      EXTERNAL_PAYMENT: 'Dış Ödeme',
      ORG_EXPENSE: 'Org. Gideri',
      ORG_INCOME: 'Org. Geliri',
      ORG_WITHDRAW: 'Hak Ediş',
      FINANCIER_TRANSFER: 'Kasa Transferi',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">Tamamlandı</Badge>;
      case 'REVERSED':
        return <Badge className="bg-rose-100 text-rose-700 border-0">İptal Edildi</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-0">Bekliyor</Badge>;
      case 'FAILED':
        return <Badge className="bg-gray-100 text-gray-700 border-0">Başarısız</Badge>;
      default:
        return <Badge className="bg-twilight-100 text-twilight-700 border-0">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-twilight-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-twilight-900 tracking-tight">Günlük Özet</h1>
          <p className="text-twilight-500">
            {format(new Date(selectedDate), "d MMMM yyyy, EEEE", { locale: tr })} tarihli finansal rapor.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-twilight-200 shadow-sm">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto border-none shadow-none focus-visible:ring-0 bg-transparent font-medium text-twilight-700"
          />
          <div className="h-6 w-px bg-twilight-200" />
          <Button variant="ghost" size="sm" className="text-twilight-600 hover:text-twilight-900 hover:bg-twilight-50 px-3">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Left Column: Hero & Key Metrics (Span 3) */}
        <div className="xl:col-span-3 space-y-6">

          {/* Top Row: Hero Stats & Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Net Flow Hero (Span 2) */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-twilight-900 to-twilight-800 text-white p-6 shadow-xl shadow-twilight-900/20">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-twilight-600/30 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-twilight-400/20 blur-2xl"></div>

              <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                    <Activity className="h-6 w-6 text-twilight-200" />
                  </div>
                  <Badge className={cn(
                    "border-0 backdrop-blur-md",
                    dailyStats.netFlow >= 0 ? "bg-emerald-500/20 text-emerald-100" : "bg-rose-500/20 text-rose-100"
                  )}>
                    {dailyStats.netFlow >= 0 ? "Pozitif Akış" : "Negatif Akış"}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-end gap-3 mb-1">
                    <h2 className="text-4xl font-bold tracking-tight font-mono">
                      {formatMoney(dailyStats.netFlow)}
                    </h2>
                    <p className="text-twilight-300 mb-2 text-sm font-medium">Net Günlük Akış</p>
                  </div>
                  <div className="flex gap-4 text-xs text-twilight-300/80">
                    <span>Ort. İşlem: <strong className="text-white">{formatMoney(dailyStats.avgTransaction)}</strong></span>
                    <span>•</span>
                    <span>Komisyon: <strong className="text-white">{formatMoney(dailyStats.totalCommission)}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Stack (Span 1) */}
            <div className="space-y-4">
              {/* Deposits */}
              <Card className="border-0 shadow-lg shadow-emerald-100/50 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl overflow-hidden relative group h-[calc(50%-8px)]">
                <CardContent className="p-5 flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">Yatırım</p>
                    <h3 className="text-xl font-bold tracking-tight">{formatMoney(dailyStats.totalDeposits)}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <ArrowDownLeft className="h-5 w-5 text-white" />
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawals */}
              <Card className="border-0 shadow-lg shadow-rose-100/50 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl overflow-hidden relative group h-[calc(50%-8px)]">
                <CardContent className="p-5 flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-rose-100 text-xs font-medium uppercase tracking-wider mb-1">Çekim</p>
                    <h3 className="text-xl font-bold tracking-tight">{formatMoney(dailyStats.totalWithdrawals)}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-white" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Hourly Chart Section */}
          <Card className="rounded-3xl border-0 shadow-xl shadow-twilight-100/50 bg-white ring-1 ring-twilight-100 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-twilight-50">
              <div>
                <CardTitle className="text-lg font-bold text-twilight-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-twilight-500" />
                  Saatlik İşlem Hacmi
                </CardTitle>
                <p className="text-sm text-twilight-400 mt-1">Gün içindeki yatırım ve çekim hareketleri</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorWithdraw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatMoney(value)}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area
                      type="monotone"
                      dataKey="deposit"
                      name="Yatırım"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorDeposit)"
                    />
                    <Area
                      type="monotone"
                      dataKey="withdrawal"
                      name="Çekim"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorWithdraw)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="rounded-3xl border-0 shadow-xl shadow-twilight-100/50 bg-white ring-1 ring-twilight-100 overflow-hidden">
            <CardHeader className="border-b border-twilight-100 bg-twilight-50/50 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-twilight-900">Günün İşlemleri</CardTitle>
              <Button variant="ghost" className="text-twilight-600 hover:bg-white hover:text-twilight-900 text-sm font-medium h-8">
                Tümünü Gör <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <div className="p-0">
              {transactions?.items && transactions.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-twilight-50/30 text-left border-b border-twilight-100">
                        <th className="py-3 px-6 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Saat</th>
                        <th className="py-3 px-6 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Tür</th>
                        <th className="py-3 px-6 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Site/Partner</th>
                        <th className="py-3 px-6 text-xs font-semibold text-twilight-500 uppercase tracking-wider text-right">Tutar</th>
                        <th className="py-3 px-6 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-twilight-50">
                      {transactions.items.slice(0, 8).map((tx) => (
                        <tr key={tx.id} className="hover:bg-twilight-50/50 transition-colors">
                          <td className="py-4 px-6 text-sm text-twilight-600 font-medium">
                            {new Date(tx.transaction_date).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-4 px-6">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              tx.type === "DEPOSIT"
                                ? "bg-emerald-100 text-emerald-700"
                                : tx.type === "WITHDRAWAL"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-slate-100 text-slate-700"
                            )}>
                              {tx.type === "DEPOSIT" ? "Yatırım" : tx.type === "WITHDRAWAL" ? "Çekim" : tx.type}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-twilight-900">
                            {tx.site ? (
                              <span className="font-medium">{tx.site.name}</span>
                            ) : tx.partner ? (
                              <span className="text-indigo-600 font-medium">{tx.partner.name}</span>
                            ) : "-"}
                          </td>
                          <td className="py-4 px-6 text-right font-amount font-bold text-twilight-900">
                            {formatMoney(parseFloat(tx.gross_amount))}
                          </td>
                          <td className="py-4 px-6">
                            {getStatusBadge(tx.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-twilight-50 flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-twilight-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-twilight-900">İşlem Bulunamadı</h3>
                </div>
              )}
            </div>
          </Card>

          {/* Entity Analysis Grid (New Section) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financiers */}
            <Card className="rounded-3xl border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-twilight-50">
                <CardTitle className="text-base font-bold text-twilight-900 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-emerald-600" />
                  Finansör Performansı
                </CardTitle>
              </CardHeader>
              <div className="p-0">
                {financierStats.length > 0 ? (
                  <div className="divide-y divide-twilight-50">
                    {financierStats.slice(0, 5).map((fin, i) => (
                      <div key={i} className="p-3 flex items-center justify-between hover:bg-twilight-50/50">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-twilight-900">{fin.name}</p>
                            <p className="text-xs text-twilight-500">{fin.count} işlem</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold font-mono text-twilight-700">
                          {formatMoney(fin.volume)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-twilight-400">İşlem yok</div>
                )}
              </div>
            </Card>

            {/* External Parties */}
            <Card className="rounded-3xl border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-twilight-50">
                <CardTitle className="text-base font-bold text-twilight-900 flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-orange-600" />
                  Dış Kişiler / 3. Şahıslar
                </CardTitle>
              </CardHeader>
              <div className="p-0">
                {externalStats.length > 0 ? (
                  <div className="divide-y divide-twilight-50">
                    {externalStats.slice(0, 5).map((ext, i) => (
                      <div key={i} className="p-3 flex items-center justify-between hover:bg-twilight-50/50">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-twilight-900">{ext.name}</p>
                            <p className="text-xs text-twilight-500">{ext.count} işlem</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold font-mono text-twilight-700">
                          {formatMoney(ext.volume)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-twilight-400">İşlem yok</div>
                )}
              </div>
            </Card>
          </div>

        </div>

        {/* Right Column: Sidebar (Span 1) */}
        <div className="space-y-6">

          {/* Top Sites Widget */}
          <Card className="rounded-3xl border-0 shadow-lg bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-twilight-50">
              <CardTitle className="text-base font-bold text-twilight-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-twilight-500" />
                En Aktif Siteler
              </CardTitle>
            </CardHeader>
            <div className="p-0">
              {topSites.length > 0 ? (
                <div className="divide-y divide-twilight-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {topSites.map((site, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-twilight-50/50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-twilight-100 text-twilight-600 font-bold flex items-center justify-center text-xs">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-twilight-900">{site.name}</p>
                          <p className="text-xs text-twilight-500">{site.count} işlem</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono text-twilight-700">
                        {formatMoney(site.volume)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-twilight-400">Veri yok</div>
              )}
            </div>
          </Card>

          {/* Top Partners Widget */}
          <Card className="rounded-3xl border-0 shadow-lg bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-twilight-50">
              <CardTitle className="text-base font-bold text-twilight-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-twilight-500" />
                En Aktif Partnerler
              </CardTitle>
            </CardHeader>
            <div className="p-0">
              {topPartners.length > 0 ? (
                <div className="divide-y divide-twilight-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {topPartners.map((partner, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-twilight-50/50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-violet-100 text-violet-600 font-bold flex items-center justify-center text-xs">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-twilight-900">{partner.name}</p>
                          <p className="text-xs text-twilight-500">{partner.count} işlem</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono text-twilight-700">
                        {formatMoney(partner.volume)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-twilight-400">Veri yok</div>
              )}
            </div>
          </Card>

          {/* Balances Widget (Moved to bottom of sidebar) */}
          <Card className="rounded-3xl border-0 shadow-lg bg-twilight-950 text-white overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-twilight-400" />
                Güncel Durum
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                <div className="p-5 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-twilight-300">Toplam Kasa</span>
                    <Wallet className="h-4 w-4 text-twilight-500" />
                  </div>
                  <p className="text-xl font-bold font-mono tracking-tight">
                    {formatMoney(stats?.totalCash || 0)}
                  </p>
                </div>
                <div className="p-5 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-twilight-300">Site Borcu</span>
                    <Building2 className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="text-xl font-bold font-mono tracking-tight text-indigo-200">
                    {formatMoney(stats?.siteDebt || 0)}
                  </p>
                </div>
                <div className="p-5 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-twilight-300">Partner Hak Ediş</span>
                    <Users className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="text-xl font-bold font-mono tracking-tight text-violet-200">
                    {formatMoney(stats?.partnerBalance || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
