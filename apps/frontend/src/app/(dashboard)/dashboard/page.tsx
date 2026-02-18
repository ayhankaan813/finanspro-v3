"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  Loader2,
  HelpCircle,
  Landmark,
  Users,
  Building2,
  BarChart3,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  useDashboardStats,
  useActiveBlocks,
  useOrganizationStats,
} from "@/hooks/use-api";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: blocks, isLoading: blocksLoading } = useActiveBlocks();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const { data: orgStats, isLoading: orgStatsLoading } = useOrganizationStats(currentYear, currentMonth);

  const isLoading = statsLoading || blocksLoading;
  const yesterdayProfit = orgStats
    ? (orgStats as any).netProfit !== undefined ? parseFloat((orgStats as any).netProfit) : 0
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-twilight-50/50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-twilight-100 border-t-twilight-600 animate-spin"></div>
          <p className="text-twilight-900 font-medium animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-3 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <header className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-twilight-900">Dashboard</h1>
        <p className="text-twilight-400 text-xs sm:text-sm mt-1">
          {now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">

        {/* ==================== LEFT COLUMN ==================== */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">

          {/* Toplam Kasa — full width hero */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-twilight-900 to-twilight-800 text-white p-4 sm:p-6 md:p-8 shadow-xl shadow-twilight-900/20">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-twilight-600/30 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-twilight-400/20 blur-2xl"></div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-twilight-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2 inline-flex items-center gap-1 cursor-help">
                      <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Toplam Kasa
                      <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-twilight-400" />
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tüm finansörlerdeki toplam nakit varlık</p>
                  </TooltipContent>
                </Tooltip>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight font-mono">
                  {formatMoney(stats?.totalCash || 0)}
                </h2>
              </div>
              {(stats?.blockedAmount || 0) > 0 && (
                <div className="text-left sm:text-right mt-1 sm:mt-0">
                  <p className="text-twilight-300 text-[10px] sm:text-xs font-medium">Bloke</p>
                  <p className="text-base sm:text-lg font-bold font-mono text-red-300">{formatMoney(stats?.blockedAmount || 0)}</p>
                  <p className="text-twilight-400 text-[10px] sm:text-xs font-mono">
                    Kullanılabilir: {formatMoney((stats?.totalCash || 0) - (stats?.blockedAmount || 0))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <Card className="border-0 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
              <div>
                <CardTitle className="text-sm sm:text-lg font-bold text-twilight-900">Kasa Hareketi</CardTitle>
                <p className="text-xs sm:text-sm text-twilight-400">Son 7 günlük finansör bakiye değişimi</p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-twilight-300" />
                <span className="text-[10px] sm:text-xs text-twilight-400 font-medium">Günlük</span>
              </div>
            </CardHeader>
            <CardContent className="pl-0 px-2 sm:px-6">
              <div className="h-[220px] sm:h-[300px] w-full mt-2 sm:mt-4">
                <OverviewChart />
              </div>
            </CardContent>
          </Card>

          {/* Finansör Bakiyeleri — display only */}
          <Card className="border-0 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm sm:text-base font-bold text-twilight-900 flex items-center gap-1.5 sm:gap-2">
                  <Landmark className="h-4 w-4 sm:h-5 sm:w-5 text-twilight-600" />
                  <span className="text-sm sm:text-base">Finansör Bakiyeleri</span>
                </CardTitle>
                <Badge variant="outline" className="text-twilight-600 border-twilight-100 bg-twilight-50">
                  {stats?.financiers?.length || 0} Finansör
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {stats?.financiers && stats.financiers.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {stats.financiers.map((f: any) => {
                    const balance = parseFloat(f.account?.balance || "0");
                    const blocked = parseFloat(f.account?.blocked_amount || "0");
                    const available = balance - blocked;

                    return (
                      <div key={f.id} className="rounded-xl sm:rounded-2xl border border-gray-100/80 overflow-hidden">
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-twilight-600 to-twilight-800 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm flex-shrink-0">
                              {f.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-twilight-900 text-xs sm:text-sm truncate">{f.name}</p>
                              {blocked > 0 && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 mt-0.5">
                                  <span className="text-[10px] sm:text-[11px] text-red-500 font-medium flex items-center gap-0.5">
                                    <ShieldAlert className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                    Bloke: {formatMoney(blocked)}
                                  </span>
                                  <span className="text-[10px] sm:text-[11px] text-twilight-500 font-medium">
                                    Müsait: {formatMoney(available)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono font-bold text-twilight-900 text-xs sm:text-base">{formatMoney(balance)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Landmark className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Henüz finansör tanımlı değil</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ==================== RIGHT COLUMN ==================== */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">

          {/* Blokeler — Top of right column */}
          <Card className="rounded-2xl sm:rounded-3xl border-0 shadow-md bg-white overflow-hidden relative">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-bold text-twilight-900 flex items-center gap-1.5 sm:gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  Blokeler
                </CardTitle>
                <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50 text-[10px] sm:text-xs">
                  {blocks?.length || 0} Aktif
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {blocks && blocks.length > 0 ? (
                <div className="space-y-3">
                  {blocks.slice(0, 4).map((block) => (
                    <div
                      key={block.id}
                      className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-red-50/50 border border-red-100/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-red-700 bg-white px-2 py-0.5 rounded-full shadow-sm">
                          {block.financier_name}
                        </span>
                        <span className="text-xs text-red-400 font-medium">
                          {block.estimated_days ? `~${block.estimated_days} gün` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm font-bold text-red-700">
                          {formatMoney(parseFloat(block.amount))}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {(() => {
                            const d = Math.floor((now.getTime() - new Date(block.started_at).getTime()) / (1000 * 60 * 60 * 24));
                            return `${d} gün`;
                          })()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {blocks.length > 4 && (
                    <p className="text-center text-xs text-red-400 pt-1">
                      +{blocks.length - 4} bloke daha
                    </p>
                  )}
                </div>
              ) : (stats?.blockedAmount || 0) > 0 ? (
                <div className="space-y-3">
                  {stats?.financiers
                    ?.filter((f: any) => parseFloat(f.account?.blocked_amount || "0") > 0)
                    .map((f: any) => (
                      <div key={f.id} className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-orange-700 bg-white px-2 py-0.5 rounded-full shadow-sm">
                            {f.name}
                          </span>
                          <span className="text-xs text-orange-400 font-medium">
                            Kayıt Yok
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-sm font-bold text-orange-700">
                            {formatMoney(parseFloat(f.account?.blocked_amount || "0"))}
                          </span>
                          <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            Sistem Blokajı
                          </span>
                        </div>
                      </div>
                    ))}
                  <p className="text-center text-[10px] text-orange-400 px-2 leading-tight">
                    * Toplam bloke tutarı var ancak detaylı blokaj kaydı bulunamadı.
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center bg-green-50/50 rounded-2xl border border-dashed border-green-200">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-green-400 mb-1" />
                  <p className="text-sm text-green-500 font-medium">Aktif bloke yok</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-twilight-500">Toplam Bloke</span>
                <span className="text-sm font-bold text-twilight-900 font-mono">{formatMoney(stats?.blockedAmount || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Aylık Kâr */}
          <Card className="rounded-2xl sm:rounded-3xl border-0 shadow-md bg-white overflow-hidden relative">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg sm:rounded-xl">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-twilight-400 font-semibold uppercase tracking-wider">Aylık Kâr</p>
                  <p className="text-[11px] text-twilight-300">
                    {now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold font-mono ${yesterdayProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {yesterdayProfit >= 0 ? '+' : ''}{formatMoney(yesterdayProfit)}
              </p>
              {orgStatsLoading && (
                <p className="text-xs text-twilight-300 mt-2 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Hesaplanıyor...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Partner Dağılımı */}
          <Card className="rounded-2xl sm:rounded-3xl border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-bold text-twilight-900 flex items-center gap-1.5 sm:gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-twilight-600" />
                  Partner Dağılımı
                </CardTitle>
                <Badge variant="outline" className="text-twilight-500 border-twilight-100 bg-twilight-50 text-xs">
                  {stats?.partners?.length || 0} Partner
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.partners && stats.partners.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.partners.map((p: any) => {
                    const balance = parseFloat(p.account?.balance || "0");
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg bg-twilight-100 flex items-center justify-center text-twilight-700 text-[10px] sm:text-xs font-bold flex-shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-twilight-800 truncate">{p.name}</span>
                        </div>
                        <span className={`font-mono text-xs sm:text-sm font-bold flex-shrink-0 ${balance > 0 ? 'text-twilight-700' : 'text-gray-400'}`}>
                          {formatMoney(balance)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-twilight-500 font-medium">Toplam Hak Ediş</span>
                    <span className="text-xs sm:text-sm font-bold text-twilight-900 font-mono">
                      {formatMoney(stats?.partnerBalance || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Henüz partner yok</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Site Durumu */}
          <Card className="rounded-2xl sm:rounded-3xl border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base font-bold text-twilight-900 flex items-center gap-1.5 sm:gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-twilight-600" />
                Site Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.sites && stats.sites.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.sites.slice(0, 5).map((s: any) => {
                    const balance = parseFloat(s.account?.balance || "0");
                    return (
                      <div key={s.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg bg-red-50 flex items-center justify-center text-red-600 text-[10px] sm:text-xs font-bold flex-shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-twilight-800">{s.name}</span>
                            <span className="text-[9px] sm:text-[10px] text-twilight-300 ml-1 sm:ml-1.5 font-mono">{s.code}</span>
                          </div>
                        </div>
                        <span className={`font-mono text-xs sm:text-sm font-bold flex-shrink-0 ${balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatMoney(Math.abs(balance))}
                        </span>
                      </div>
                    );
                  })}
                  {stats.sites.length > 5 && (
                    <p className="text-center text-xs text-twilight-400 pt-2">
                      +{stats.sites.length - 5} site daha
                    </p>
                  )}
                  <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-twilight-500 font-medium">Toplam Borç</span>
                    <span className="text-xs sm:text-sm font-bold text-red-600 font-mono">
                      {formatMoney(stats?.siteDebt || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Building2 className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Henüz site tanımlı değil</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}
