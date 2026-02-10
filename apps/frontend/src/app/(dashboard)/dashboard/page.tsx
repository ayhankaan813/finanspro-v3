"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatMoney } from "@/lib/utils";
import {
  Wallet,
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Search,
  Bell,
  MoreVertical,
  ChevronRight,
  CreditCard,
  PieChart,
  Activity,
  ArrowRight
} from "lucide-react";
import {
  useDashboardStats,
  useRecentTransactions,
  useActiveBlocks,
} from "@/hooks/use-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTx, isLoading: txLoading } = useRecentTransactions(6);
  const { data: blocks, isLoading: blocksLoading } = useActiveBlocks();

  const isLoading = statsLoading || txLoading || blocksLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-twilight-50/50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-twilight-100 border-t-twilight-600 animate-spin"></div>
          </div>
          <p className="text-twilight-900 font-medium animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const getTransactionLabel = (tx: any) => {
    if (tx.site) return tx.site.name;
    return tx.type;
  };

  const getTransactionAmount = (tx: any) => {
    const amount = parseFloat(tx.gross_amount);
    const isPositive = ["DEPOSIT", "SITE_DELIVERY", "PARTNER_DEPOSIT"].includes(tx.type);
    return isPositive ? amount : -amount;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Navigation Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-twilight-900">Genel Bakış</h1>
          <p className="text-twilight-600/70 text-sm mt-1">Hoşgeldin, finansal durumun kontrol altında.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-twilight-400" />
            <Input
              placeholder="İşlemlerde ara..."
              className="pl-10 w-[280px] bg-white border-none shadow-sm shadow-twilight-900/5 focus-visible:ring-1 focus-visible:ring-twilight-200 rounded-full"
            />
          </div>
          <Button size="icon" variant="ghost" className="relative text-twilight-600 hover:bg-white hover:text-twilight-900 rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </Button>
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-twilight-100 cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* Left Column: Stats & Charts */}
        <div className="lg:col-span-8 space-y-8">

          {/* Hero Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Total Card */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-twilight-900 to-twilight-800 text-white p-6 shadow-xl shadow-twilight-900/20">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-twilight-600/30 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-twilight-400/20 blur-2xl"></div>

              <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                    <Wallet className="h-6 w-6 text-twilight-200" />
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">
                    +12.5% artış
                  </Badge>
                </div>
                <div>
                  <p className="text-twilight-200 text-sm font-medium mb-1">Toplam Kasa</p>
                  <h2 className="text-4xl font-bold tracking-tight font-mono">
                    {formatMoney(stats?.totalCash || 0)}
                  </h2>
                </div>
              </div>
            </div>

            {/* Secondary Stats Vertical Stack */}
            <div className="space-y-4">
              {/* Partner Balance */}
              <Card className="rounded-3xl border-0 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                <CardContent className="p-5 flex flex-col justify-center h-full relative">
                  <div className="absolute right-0 top-0 h-16 w-16 bg-twilight-50 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-twilight-400"></div>
                      <span className="text-xs font-semibold text-twilight-400 uppercase tracking-wider">Partner Hak Ediş</span>
                    </div>
                    <div className="text-xl font-bold text-twilight-900 font-mono">
                      {formatMoney(stats?.partnerBalance || 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Site Debt */}
              <Card className="rounded-3xl border-0 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                <CardContent className="p-5 flex flex-col justify-center h-full relative">
                  <div className="absolute right-0 top-0 h-16 w-16 bg-red-50 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-red-400"></div>
                      <span className="text-xs font-semibold text-twilight-400 uppercase tracking-wider">Site Borcu</span>
                    </div>
                    <div className="text-xl font-bold text-twilight-900 font-mono">
                      {formatMoney(stats?.siteDebt || 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Chart Section */}
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold text-twilight-900">Finansal Genel Bakış</CardTitle>
                <p className="text-sm text-twilight-400">Son 7 günlük kasa hareketi</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full border-twilight-100 text-twilight-600 text-xs h-8">
                Haftalık
              </Button>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-[300px] w-full mt-4">
                <OverviewChart />
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-twilight-900">Son İşlemler</h3>
              <Button variant="link" className="text-twilight-600 hover:text-twilight-900 p-0 h-auto font-semibold">
                Tümünü Gör <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                {recentTx?.items && recentTx.items.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {recentTx.items.map((tx) => {
                      const amount = getTransactionAmount(tx);
                      const isPositive = amount > 0;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${isPositive ? "bg-white text-twilight-600 ring-1 ring-twilight-100 group-hover:bg-twilight-600 group-hover:text-white" : "bg-white text-red-500 ring-1 ring-red-100 group-hover:bg-red-500 group-hover:text-white"
                              }`}>
                              {isPositive ? (
                                <ArrowUpRight className="h-5 w-5" />
                              ) : (
                                <ArrowDownRight className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-twilight-900 text-sm group-hover:text-twilight-700 transition-colors">
                                {getTransactionLabel(tx)}
                              </p>
                              <p className="text-xs text-twilight-400 font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(tx.transaction_date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono font-bold text-sm ${isPositive ? "text-twilight-700" : "text-red-600"
                              }`}>
                              {isPositive ? "+" : ""}
                              {formatMoney(amount)}
                            </div>
                            <div className="text-[10px] text-twilight-300 font-medium uppercase tracking-wide">
                              {tx.type.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Clock className="mx-auto h-12 w-12 text-twilight-100 mb-3" />
                    <p className="text-twilight-400 font-medium">Henüz işlem bulunmuyor</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">

          {/* Active Blocks Widget */}
          <Card className="rounded-3xl border-0 shadow-md bg-white overflow-hidden relative">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-twilight-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Blokeler
                </CardTitle>
                <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50">
                  {blocks?.length || 0} Aktif
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {blocks && blocks.length > 0 ? (
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="p-3 rounded-2xl bg-red-50/50 border border-red-100/50 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-red-700 bg-white px-2 py-0.5 rounded-full shadow-sm">
                          {block.financier_name}
                        </span>
                        <span className="text-xs text-red-400 font-medium">
                          {block.estimated_days ? `${block.estimated_days} gün` : "?"}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="w-full bg-red-200/50 h-1.5 rounded-full overflow-hidden mr-3">
                          <div className="bg-red-500 h-full rounded-full w-2/3"></div>
                        </div>
                        <span className="font-mono text-sm font-bold text-red-700 whitespace-nowrap">
                          {formatMoney(parseFloat(block.amount))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 font-medium">Aktif bloke yok</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-twilight-500">Toplam Bloke</span>
                <span className="text-sm font-bold text-twilight-900">{formatMoney(stats?.blockedAmount || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Transfer Widget (Mockup) */}
          <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-b from-twilight-600 to-twilight-700 text-white overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 h-24 w-24 bg-white/10 rounded-full blur-xl"></div>
              <h3 className="font-bold text-lg mb-1 relative z-10">Hızlı Transfer</h3>
              <p className="text-twilight-100 text-xs mb-6 relative z-10">Son transfer edilen kişilere hızlı gönderim yap.</p>

              <div className="flex gap-2 mb-6 relative z-10">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer flex items-center justify-center transition-colors border border-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                      <AvatarFallback className="bg-twilight-800 text-xs">U{i}</AvatarFallback>
                    </Avatar>
                  </div>
                ))}
                <div className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer flex items-center justify-center transition-colors border border-dashed border-white/30">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              <Button className="w-full bg-white text-twilight-700 hover:bg-twilight-50 font-bold rounded-xl h-12 shadow-lg shadow-black/10">
                Yeni Transfer Başlat
              </Button>
            </CardContent>
          </Card>

          {/* System Status / Mini Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Sistem</span>
              <span className="text-xs font-bold text-green-600">Aktif</span>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <PieChart className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Rapor</span>
              <span className="text-xs font-bold text-blue-600">Hazır</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
