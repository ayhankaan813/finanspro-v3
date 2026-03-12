"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import {
  PieChart,
  BarChart3,
  RefreshCw,
  Wallet,
  Building,
  Users,
  Lock,
  TrendingUp,
  Download,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-api";
import { exportToExcel, formatDateForExport } from "@/lib/export-utils";
import { motion } from "framer-motion";

export default function AnalysisPage() {
  const { data: stats, isLoading, refetch } = useDashboardStats();

  const totalCash = stats?.totalCash || 0;
  const siteDebt = stats?.siteDebt || 0;
  const partnerBalance = stats?.partnerBalance || 0;
  const blockedAmount = stats?.blockedAmount || 0;

  // Distribution percentages
  const totalBalance = totalCash + siteDebt + partnerBalance;
  const cashPercent = totalBalance > 0 ? (totalCash / totalBalance) * 100 : 0;
  const sitePercent = totalBalance > 0 ? (siteDebt / totalBalance) * 100 : 0;
  const partnerPercent = totalBalance > 0 ? (partnerBalance / totalBalance) * 100 : 0;
  const blockedPercent = totalCash > 0 ? (blockedAmount / totalCash) * 100 : 0;

  // Top sites
  const topSites = stats?.sites
    ?.map((s: { name: string; account?: { balance: string } | null }) => ({
      name: s.name,
      balance: Math.abs(parseFloat(s.account?.balance || "0")),
    }))
    .sort((a: { balance: number }, b: { balance: number }) => b.balance - a.balance)
    .slice(0, 5) || [];

  // Top partners
  const topPartners = stats?.partners
    ?.map((p: { name: string; account?: { balance: string } | null }) => ({
      name: p.name,
      balance: parseFloat(p.account?.balance || "0"),
    }))
    .sort((a: { balance: number }, b: { balance: number }) => b.balance - a.balance)
    .slice(0, 5) || [];

  // Financier utilization
  const financierUtilization = stats?.financiers?.map((f: { name: string; account?: { balance: string; blocked_amount: string } | null }) => {
    const balance = parseFloat(f.account?.balance || "0");
    const blocked = parseFloat(f.account?.blocked_amount || "0");
    const available = balance - blocked;
    return {
      name: f.name,
      balance,
      blocked,
      available,
      utilizationRate: balance > 0 ? ((balance - blocked) / balance) * 100 : 0,
    };
  }) || [];

  if (isLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin text-amber-500 rounded-full border-2 border-current border-t-transparent" />
          <p className="text-slate-400 dark:text-slate-500 font-medium animate-pulse">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Finansal Analiz</h1>
              <p className="text-slate-300 text-sm mt-0.5">Performans ve dağılım analizi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const today = formatDateForExport(new Date());
                exportToExcel([
                  {
                    name: "Genel Özet",
                    data: [
                      { kalem: "Toplam Kasa (Finansör)", deger: totalCash },
                      { kalem: "Site Borçları", deger: siteDebt },
                      { kalem: "Partner Hak Edişleri", deger: partnerBalance },
                      { kalem: "Bloke Tutar", deger: blockedAmount },
                    ],
                    columns: [
                      { header: "Kalem", key: "kalem", width: 28 },
                      { header: `Tutar (₺) - ${today}`, key: "deger", width: 20 },
                    ],
                  },
                  {
                    name: "Site Sıralaması",
                    data: topSites.map((s: any, i: number) => ({ sira: i + 1, ad: s.name, bakiye: s.balance })),
                    columns: [
                      { header: "#", key: "sira", width: 6 },
                      { header: "Site Adı", key: "ad", width: 20 },
                      { header: "Bakiye (₺)", key: "bakiye", width: 18 },
                    ],
                  },
                  {
                    name: "Partner Sıralaması",
                    data: topPartners.map((p: any, i: number) => ({ sira: i + 1, ad: p.name, bakiye: p.balance })),
                    columns: [
                      { header: "#", key: "sira", width: 6 },
                      { header: "Partner Adı", key: "ad", width: 20 },
                      { header: "Hak Ediş (₺)", key: "bakiye", width: 18 },
                    ],
                  },
                  {
                    name: "Finansör Kullanımı",
                    data: financierUtilization.map((f: any) => ({
                      ad: f.name,
                      toplam: f.balance,
                      bloke: f.blocked,
                      musait: f.available,
                      kullanim: `%${f.utilizationRate.toFixed(1)}`,
                    })),
                    columns: [
                      { header: "Finansör Adı", key: "ad", width: 20 },
                      { header: "Toplam (₺)", key: "toplam", width: 16 },
                      { header: "Bloke (₺)", key: "bloke", width: 16 },
                      { header: "Müsait (₺)", key: "musait", width: 16 },
                      { header: "Kullanım", key: "kullanim", width: 12 },
                    ],
                  },
                ], `analiz_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`);
              }}
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs sm:text-sm h-9 sm:h-10"
            >
              <Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Excel
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs sm:text-sm h-9 sm:h-10"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam Varlık</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white font-amount">
                {formatMoney(totalCash)}
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                %{cashPercent.toFixed(1)} toplam
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="h-full border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                  <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Site Hacmi</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 font-amount">
                {formatMoney(siteDebt)}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stats?.sites?.length || 0} aktif site
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Partner Hacmi</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-amount">
                {formatMoney(partnerBalance)}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stats?.partners?.length || 0} aktif partner
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="h-full border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Bloke Oranı</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                %{blockedPercent.toFixed(1)}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-amount">
                {formatMoney(blockedAmount)} bloke
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Distribution + Financier Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Balance Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                <PieChart className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                Bakiye Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-5">
                {/* Kasa */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-slate-700 dark:text-slate-300">Kasa</span>
                    </span>
                    <span className="font-amount font-medium text-slate-900 dark:text-white">{formatMoney(totalCash)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${cashPercent}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-12 text-right">%{cashPercent.toFixed(1)}</span>
                  </div>
                </div>

                {/* Site Borcu */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-slate-700 dark:text-slate-300">Site Borcu</span>
                    </span>
                    <span className="font-amount font-medium text-slate-900 dark:text-white">{formatMoney(siteDebt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${sitePercent}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-12 text-right">%{sitePercent.toFixed(1)}</span>
                  </div>
                </div>

                {/* Partner Hak Ediş */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-700 dark:text-slate-300">Partner Hak Ediş</span>
                    </span>
                    <span className="font-amount font-medium text-slate-900 dark:text-white">{formatMoney(partnerBalance)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${partnerPercent}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-12 text-right">%{partnerPercent.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Financier Utilization */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="h-full border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                <BarChart3 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                Finansör Kullanım Oranı
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Kullanılabilir bakiye / Toplam bakiye</p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-5">
                {financierUtilization.map((f: { name: string; balance: number; blocked: number; available: number; utilizationRate: number }) => (
                  <div key={f.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{f.name}</span>
                      <span className={`font-bold text-sm ${
                        f.utilizationRate >= 70
                          ? "text-emerald-600 dark:text-emerald-400"
                          : f.utilizationRate >= 40
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                      }`}>
                        %{f.utilizationRate.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          f.utilizationRate >= 70
                            ? "bg-emerald-500"
                            : f.utilizationRate >= 40
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                        style={{ width: `${f.utilizationRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <span>Bloke: <span className="font-amount">{formatMoney(f.blocked)}</span></span>
                      <span>Kullanılabilir: <span className="font-amount">{formatMoney(f.available)}</span></span>
                    </div>
                  </div>
                ))}
                {financierUtilization.length === 0 && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Finansör bulunamadı</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Sites */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                <Building className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                En Yüksek Hacimli Siteler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {topSites.map((site: { name: string; balance: number }, index: number) => (
                  <div key={site.name} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/40 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{site.name}</span>
                    <span className="font-amount font-semibold text-sm text-blue-600 dark:text-blue-400 shrink-0">
                      {formatMoney(site.balance)}
                    </span>
                  </div>
                ))}
                {topSites.length === 0 && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">Veri bulunamadı</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Partners */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="h-full border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                <Users className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                En Yüksek Hak Edişli Partnerler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {topPartners.map((partner: { name: string; balance: number }, index: number) => (
                  <div key={partner.name} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{partner.name}</span>
                    <span className="font-amount font-semibold text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                      {formatMoney(partner.balance)}
                    </span>
                  </div>
                ))}
                {topPartners.length === 0 && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">Veri bulunamadı</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
