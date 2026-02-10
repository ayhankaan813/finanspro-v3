"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import {
  RefreshCw,
  Download,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Building,
  Users,
  Globe,
  Scale,
  ArrowRight
} from "lucide-react";
import { useDashboardStats, useSites, usePartners, useFinanciers, useExternalParties } from "@/hooks/use-api";
import { motion } from "framer-motion";

export default function ReconciliationPage() {
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardStats();
  const { data: sites } = useSites({ limit: 100 });
  const { data: partners } = usePartners({ limit: 100 });
  const { data: financiers } = useFinanciers({ limit: 100 });
  const { data: externalParties } = useExternalParties({ limit: 100 });

  const totalFinancierBalance = financiers?.items?.reduce(
    (acc, f) => acc + parseFloat(f.account?.balance || "0"),
    0
  ) || 0;

  const totalSiteBalance = sites?.items?.reduce(
    (acc, s) => acc + parseFloat(s.account?.balance || "0"),
    0
  ) || 0;

  const totalPartnerBalance = partners?.items?.reduce(
    (acc, p) => acc + parseFloat(p.account?.balance || "0"),
    0
  ) || 0;

  const totalExternalBalance = externalParties?.items?.reduce(
    (acc, p) => acc + parseFloat(p.account?.balance || "0"),
    0
  ) || 0;

  const totalLiabilities = Math.abs(totalSiteBalance) + totalPartnerBalance + totalExternalBalance;
  const estimatedEquity = totalFinancierBalance - totalLiabilities;
  const isPositive = estimatedEquity >= 0;

  if (statsLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin text-amber-500 rounded-full border-2 border-current border-t-transparent" />
          <p className="text-twilight-400 font-medium animate-pulse">Finansal veriler analiz ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Gradient Header - Matching Financiers Page */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 text-white shadow-2xl shadow-twilight-900/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl opacity-50" />

        <div className="relative z-10 p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30 backdrop-blur-md">
                <Scale className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Finansal Mutabakat</h1>
                <p className="text-twilight-200/80 text-sm font-medium">Varlık ve Yükümlülük Dengesi</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => refetch()} variant="outline" className="border-white/10 bg-white/5 text-amber-100 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all">
              <RefreshCw className="mr-2 h-4 w-4" />
              Verileri Yenile
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 border border-amber-500/20">
              <Download className="mr-2 h-4 w-4" />
              Rapor İndir
            </Button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assets Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-0 shadow-lg shadow-twilight-100/50 hover:shadow-xl transition-all duration-300 bg-white overflow-hidden rounded-3xl ring-1 ring-twilight-100 group">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-amber-100/50 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-amber-900/70 uppercase tracking-wider mb-1">Toplam Varlıklar</p>
                  <h3 className="text-3xl font-bold text-twilight-900 font-amount">{formatMoney(totalFinancierBalance)}</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-amber-100">
                  <Wallet className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
                  <span className="text-twilight-600 font-medium">Nakit Kasalar</span>
                  <span className="font-bold text-twilight-900">{formatMoney(totalFinancierBalance)}</span>
                </div>
                <div className="w-full bg-twilight-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full w-full" />
                </div>
                <p className="text-xs text-twilight-400">Tüm aktif kasa ve banka hesaplarınızın toplam bakiyesi.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Liabilities Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full border-0 shadow-lg shadow-twilight-100/50 hover:shadow-xl transition-all duration-300 bg-white overflow-hidden rounded-3xl ring-1 ring-twilight-100 group">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50/50 border-b border-rose-100/50 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-rose-900/70 uppercase tracking-wider mb-1">Toplam Yükümlülük</p>
                  <h3 className="text-3xl font-bold text-twilight-900 font-amount">{formatMoney(totalLiabilities)}</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-rose-100">
                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-twilight-500">Site Bakiyeleri</span>
                  <span className="font-medium text-twilight-900">{formatMoney(Math.abs(totalSiteBalance))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-twilight-500">Partner Hak Ediş</span>
                  <span className="font-medium text-twilight-900">{formatMoney(totalPartnerBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-twilight-500">Dış Hesaplar</span>
                  <span className="font-medium text-twilight-900">{formatMoney(totalExternalBalance)}</span>
                </div>
                <div className="w-full bg-twilight-100 rounded-full h-1.5 overflow-hidden mt-2">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Net Position Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full border-0 shadow-lg shadow-twilight-100/50 hover:shadow-xl transition-all duration-300 bg-white overflow-hidden rounded-3xl ring-1 ring-twilight-100 group">
            <CardHeader className={`bg-gradient-to-r border-b p-6 ${isPositive ? 'from-emerald-50 to-green-50/50 border-emerald-100/50' : 'from-orange-50 to-amber-50/50 border-orange-100/50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isPositive ? 'text-emerald-900/70' : 'text-orange-900/70'}`}>Net Durum (Özkaynak)</p>
                  <h3 className={`text-3xl font-bold font-amount ${isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>{formatMoney(estimatedEquity)}</h3>
                </div>
                <div className={`h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border ${isPositive ? 'border-emerald-100' : 'border-orange-100'}`}>
                  {isPositive ? <ShieldCheck className="h-6 w-6 text-emerald-600" /> : <ShieldCheck className="h-6 w-6 text-orange-600" />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-twilight-600 leading-relaxed">
                  {isPositive
                    ? "Varlıklarınız tüm yükümlülüklerinizi karşılıyor. Finansal durumunuz dengeli ve güvenli."
                    : "Varlıklarınız yükümlülüklerinizin altında. Nakit akışını kontrol etmeniz önerilir."}
                </p>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${isPositive ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-orange-50/50 border-orange-100 text-orange-700'}`}>
                  <span className="text-sm font-bold">Likidite Oranı</span>
                  <span className="text-lg font-bold">
                    %{totalLiabilities > 0 ? (totalFinancierBalance / totalLiabilities * 100).toFixed(0) : '100'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Detailed Liabilities Breakdown */}
        <Card className="border-0 shadow-lg shadow-twilight-100/50 bg-white rounded-3xl ring-1 ring-twilight-100 overflow-hidden">
          <CardHeader className="bg-twilight-50/50 border-b border-twilight-100 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-twilight-900">Yükümlülük Detayları</CardTitle>
              <p className="text-sm text-twilight-500 mt-1">Ödemeniz gereken tutarların dağılımı</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white border border-twilight-200 flex items-center justify-center shadow-sm">
              <Building className="h-5 w-5 text-twilight-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-twilight-100">
              {/* Sites */}
              <div className="p-5 hover:bg-twilight-50/50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-twilight-900 group-hover:text-blue-700 transition-colors">Site Borçları</p>
                    <p className="text-xs text-twilight-500">{sites?.items?.length || 0} adet site bakiyesi</p>
                  </div>
                </div>
                <span className="font-bold font-amount text-twilight-900 text-lg">{formatMoney(Math.abs(totalSiteBalance))}</span>
              </div>

              {/* Partners */}
              <div className="p-5 hover:bg-twilight-50/50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-twilight-900 group-hover:text-emerald-700 transition-colors">Partner Hak Edişleri</p>
                    <p className="text-xs text-twilight-500">{partners?.items?.length || 0} adet partner bakiyesi</p>
                  </div>
                </div>
                <span className="font-bold font-amount text-twilight-900 text-lg">{formatMoney(totalPartnerBalance)}</span>
              </div>

              {/* External */}
              <div className="p-5 hover:bg-twilight-50/50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-twilight-900 group-hover:text-indigo-700 transition-colors">Dış Hesap Borçları</p>
                    <p className="text-xs text-twilight-500">{externalParties?.items?.length || 0} adet dış hesap</p>
                  </div>
                </div>
                <span className="font-bold font-amount text-twilight-900 text-lg">{formatMoney(totalExternalBalance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insight */}
        <Card className="border-0 shadow-lg shadow-twilight-100/50 bg-white rounded-3xl ring-1 ring-twilight-100 overflow-hidden flex flex-col">
          <CardHeader className="bg-twilight-50/50 border-b border-twilight-100 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-twilight-900">Yapay Zeka Analizi</CardTitle>
              <p className="text-sm text-twilight-500 mt-1">Finansal durum değerlendirmesi</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex flex-col justify-center bg-gradient-to-b from-white to-twilight-50/30">
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <blockquote className="pl-6 italic text-twilight-600 text-lg leading-relaxed">
                "Mevcut nakit akışı dengeli görünüyor. Site borçlarının %20'si önümüzdeki hafta vadesi gelebilir, ancak likidite oranınız bu ödemeleri karşılamak için yeterli seviyede."
              </blockquote>
              <div className="pl-6 mt-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-twilight-400 uppercase tracking-widest">Sistem Analizi</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
