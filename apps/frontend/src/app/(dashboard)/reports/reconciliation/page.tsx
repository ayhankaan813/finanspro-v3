"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import {
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Building,
  Users,
  Globe,
  Scale,
  Landmark,
} from "lucide-react";
import { useDashboardStats, useExternalParties, useOrganizationAccount } from "@/hooks/use-api";
import { motion } from "framer-motion";

export default function ReconciliationPage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: externalParties, refetch: refetchExternal } = useExternalParties({ limit: 100 });
  const { data: orgAccount, refetch: refetchOrg } = useOrganizationAccount();

  const totalFinancierBalance = stats?.totalCash || 0;
  const totalSiteBalance = stats?.siteDebt || 0;
  const totalPartnerBalance = stats?.partnerBalance || 0;

  const totalExternalBalance = externalParties?.items?.reduce(
    (acc: number, p: { account?: { balance: string } | null }) => acc + parseFloat(p.account?.balance || "0"),
    0
  ) || 0;

  const orgBalance = parseFloat(orgAccount?.balance || "0");

  const totalLiabilities = totalSiteBalance + totalPartnerBalance + Math.abs(totalExternalBalance) + Math.abs(orgBalance);
  const estimatedEquity = totalFinancierBalance - totalLiabilities;
  const isPositive = estimatedEquity >= 0;

  const assetPercent = totalFinancierBalance + totalLiabilities > 0
    ? (totalFinancierBalance / (totalFinancierBalance + totalLiabilities)) * 100
    : 50;

  const handleRefresh = () => {
    refetchStats();
    refetchExternal();
    refetchOrg();
  };

  if (statsLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin text-amber-500 rounded-full border-2 border-current border-t-transparent" />
          <p className="text-slate-400 dark:text-slate-500 font-medium animate-pulse">Finansal veriler analiz ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header — consistent with kasa-raporu */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Scale className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Finansal Mutabakat</h1>
              <p className="text-slate-300 text-sm mt-0.5">Varlık ve Yükümlülük Dengesi</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs sm:text-sm h-9 sm:h-10"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Verileri Yenile
          </Button>
        </div>
      </div>

      {/* 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Assets Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-amber-100/50 dark:border-amber-800/30 p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-900/70 dark:text-amber-300/80 uppercase tracking-wider mb-1">Toplam Varlıklar</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-amount">{formatMoney(totalFinancierBalance)}</h3>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center border border-amber-100 dark:border-amber-800/30">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-800/20">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Finansör Kasaları</span>
                  <span className="font-bold text-slate-900 dark:text-white font-amount">{formatMoney(totalFinancierBalance)}</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Tüm aktif finansör hesaplarının toplam bakiyesi.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Liabilities Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50/50 dark:from-rose-950/30 dark:to-red-950/20 border-b border-rose-100/50 dark:border-rose-800/30 p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-rose-900/70 dark:text-rose-300/80 uppercase tracking-wider mb-1">Toplam Yükümlülük</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-amount">{formatMoney(totalLiabilities)}</h3>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center border border-rose-100 dark:border-rose-800/30">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Site Bakiyeleri</span>
                  <span className="font-medium text-slate-900 dark:text-white font-amount">{formatMoney(totalSiteBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Partner Hak Ediş</span>
                  <span className="font-medium text-slate-900 dark:text-white font-amount">{formatMoney(totalPartnerBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Dış Hesaplar</span>
                  <span className="font-medium text-slate-900 dark:text-white font-amount">{formatMoney(Math.abs(totalExternalBalance))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Organizasyon</span>
                  <span className="font-medium text-slate-900 dark:text-white font-amount">{formatMoney(Math.abs(orgBalance))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Net Position Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
            <CardHeader className={`bg-gradient-to-r border-b p-4 sm:p-6 ${
              isPositive
                ? "from-emerald-50 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/20 border-emerald-100/50 dark:border-emerald-800/30"
                : "from-orange-50 to-amber-50/50 dark:from-orange-950/30 dark:to-amber-950/20 border-orange-100/50 dark:border-orange-800/30"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 ${isPositive ? "text-emerald-900/70 dark:text-emerald-300/80" : "text-orange-900/70 dark:text-orange-300/80"}`}>
                    Net Durum
                  </p>
                  <h3 className={`text-2xl sm:text-3xl font-bold font-amount ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
                    {formatMoney(estimatedEquity)}
                  </h3>
                </div>
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center border ${isPositive ? "border-emerald-100 dark:border-emerald-800/30" : "border-orange-100 dark:border-orange-800/30"}`}>
                  <ShieldCheck className={`h-5 w-5 sm:h-6 sm:w-6 ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isPositive
                    ? "Varlıklarınız tüm yükümlülüklerinizi karşılıyor."
                    : "Varlıklarınız yükümlülüklerinizin altında. Nakit akışını kontrol edin."}
                </p>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isPositive
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-800/30 text-orange-700 dark:text-orange-300"
                }`}>
                  <span className="text-sm font-bold">Likidite Oranı</span>
                  <span className="text-lg font-bold font-amount">
                    %{totalLiabilities > 0 ? (totalFinancierBalance / totalLiabilities * 100).toFixed(0) : "100"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Balance Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="font-medium text-amber-700 dark:text-amber-300">Varlıklar</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Denge Çubuğu</span>
              <span className="font-medium text-rose-700 dark:text-rose-300">Yükümlülükler</span>
            </div>
            <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out rounded-l-full"
                style={{ width: `${Math.max(assetPercent, 2)}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700 ease-out rounded-r-full"
                style={{ width: `${Math.max(100 - assetPercent, 2)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
              <span className="font-amount">{formatMoney(totalFinancierBalance)}</span>
              <span className="font-amount">{formatMoney(totalLiabilities)}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-4 sm:p-6">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Hesap Detayları</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tüm hesap bakiyelerinin dökümü</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Financiers (Asset side) */}
              <div className="border-b border-slate-100 dark:border-slate-700">
                <div className="px-4 sm:px-6 py-3 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100/30 dark:border-amber-800/20">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Finansörler (Varlık)</span>
                    <span className="text-xs text-amber-600/60 dark:text-amber-400/60 ml-auto font-amount">{formatMoney(totalFinancierBalance)}</span>
                  </div>
                </div>
                {stats?.financiers?.map((f: { id: string; name: string; account?: { balance: string } | null }) => (
                  <div key={f.id} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{f.name}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white font-amount">{formatMoney(parseFloat(f.account?.balance || "0"))}</span>
                  </div>
                ))}
                {(!stats?.financiers || stats.financiers.length === 0) && (
                  <div className="px-4 sm:px-6 py-3 text-sm text-slate-400 dark:text-slate-500">Finansör bulunamadı</div>
                )}
              </div>

              {/* Sites (Liability side) */}
              <div className="border-b border-slate-100 dark:border-slate-700">
                <div className="px-4 sm:px-6 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100/30 dark:border-blue-800/20">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Siteler (Yükümlülük)</span>
                    <span className="text-xs text-blue-600/60 dark:text-blue-400/60 ml-auto font-amount">{formatMoney(totalSiteBalance)}</span>
                  </div>
                </div>
                {stats?.sites?.map((s: { id: string; name: string; account?: { balance: string } | null }) => (
                  <div key={s.id} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s.name}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white font-amount">{formatMoney(Math.abs(parseFloat(s.account?.balance || "0")))}</span>
                  </div>
                ))}
                {(!stats?.sites || stats.sites.length === 0) && (
                  <div className="px-4 sm:px-6 py-3 text-sm text-slate-400 dark:text-slate-500">Site bulunamadı</div>
                )}
              </div>

              {/* Partners (Liability side) */}
              <div className="border-b border-slate-100 dark:border-slate-700">
                <div className="px-4 sm:px-6 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100/30 dark:border-emerald-800/20">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Partnerler (Yükümlülük)</span>
                    <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60 ml-auto font-amount">{formatMoney(totalPartnerBalance)}</span>
                  </div>
                </div>
                {stats?.partners?.map((p: { id: string; name: string; account?: { balance: string } | null }) => (
                  <div key={p.id} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{p.name}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white font-amount">{formatMoney(parseFloat(p.account?.balance || "0"))}</span>
                  </div>
                ))}
                {(!stats?.partners || stats.partners.length === 0) && (
                  <div className="px-4 sm:px-6 py-3 text-sm text-slate-400 dark:text-slate-500">Partner bulunamadı</div>
                )}
              </div>

              {/* External Parties (Liability side) */}
              <div className="border-b border-slate-100 dark:border-slate-700">
                <div className="px-4 sm:px-6 py-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100/30 dark:border-indigo-800/20">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Dış Kişiler (Yükümlülük)</span>
                    <span className="text-xs text-indigo-600/60 dark:text-indigo-400/60 ml-auto font-amount">{formatMoney(Math.abs(totalExternalBalance))}</span>
                  </div>
                </div>
                {externalParties?.items?.map((p: { id: string; name: string; account?: { balance: string } | null }) => (
                  <div key={p.id} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{p.name}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white font-amount">{formatMoney(parseFloat(p.account?.balance || "0"))}</span>
                  </div>
                ))}
                {(!externalParties?.items || externalParties.items.length === 0) && (
                  <div className="px-4 sm:px-6 py-3 text-sm text-slate-400 dark:text-slate-500">Dış kişi bulunamadı</div>
                )}
              </div>

              {/* Organization (Liability side) */}
              <div>
                <div className="px-4 sm:px-6 py-3 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100/30 dark:border-purple-800/20">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Organizasyon (Yükümlülük)</span>
                    <span className="text-xs text-purple-600/60 dark:text-purple-400/60 ml-auto font-amount">{formatMoney(Math.abs(orgBalance))}</span>
                  </div>
                </div>
                <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Organizasyon Hesabı</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white font-amount">{formatMoney(Math.abs(orgBalance))}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
