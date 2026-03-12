"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatTurkeyDateTime } from "@/lib/utils";
import {
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Package,
  ExternalLink,
  Loader2,
  Inbox,
  Wallet,
} from "lucide-react";
import {
  usePendingTransactions,
  usePendingTransactionCount,
  PendingTransaction,
} from "@/hooks/use-api";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Types for the data we fetch
interface SiteData {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  account?: {
    balance: string;
    blocked_amount: string;
  };
}

interface TransactionData {
  id: string;
  type: string;
  status: string;
  gross_amount: string;
  net_amount: string;
  description?: string;
  transaction_date: string;
  site?: { name: string; code: string };
  financier?: { name: string };
}

// Type labels for display
const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  DEPOSIT: { label: "Yatırım", color: "text-emerald-600" },
  WITHDRAWAL: { label: "Çekim", color: "text-rose-600" },
  DELIVERY: { label: "Teslim", color: "text-violet-600" },
  TOP_UP: { label: "Takviye", color: "text-amber-600" },
  PAYMENT: { label: "Ödeme", color: "text-blue-600" },
};

const PENDING_TYPE_LABELS: Record<string, string> = {
  "deposit": "Yatırım",
  "withdrawal": "Çekim",
  "site-delivery": "Site Teslim",
  "delivery": "Teslim",
  "payment": "Ödeme",
  "top-up": "Takviye",
  "partner-payment": "Partner Ödeme",
  "org-expense": "Org Gider",
  "org-income": "Org Gelir",
  "financier-transfer": "Finansör Transfer",
  "external-debt": "Dış Borç",
  "external-payment": "Dış Ödeme",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "Az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay === 1) return "Dün";
  if (diffDay < 7) return `${diffDay} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

export function PartnerDashboard() {
  const { accessToken, user } = useAuthStore();
  const now = new Date();

  // Fetch partner's sites
  const { data: sitesData, isLoading: sitesLoading } = useQuery({
    queryKey: ["partner-sites"],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<{ items: SiteData[] }>("/api/sites?limit=100");
    },
    enabled: !!accessToken,
  });

  // Fetch partner's recent transactions
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["partner-recent-tx"],
    queryFn: async () => {
      api.setToken(accessToken);
      return api.get<{ items: TransactionData[]; total: number }>("/api/transactions?limit=10&sortBy=transaction_date&sortOrder=desc");
    },
    enabled: !!accessToken,
  });

  // Fetch pending transaction count
  const { data: pendingCount } = usePendingTransactionCount();

  // Fetch recent pending transactions
  const { data: pendingData, isLoading: pendingLoading } = usePendingTransactions({
    limit: 5,
  });

  const sites = sitesData?.items || [];
  const transactions = txData?.items || [];
  const totalTx = txData?.total || 0;
  const pendingItems = pendingData?.items || [];
  const pendingNum = pendingCount?.count || 0;

  // Calculate summary stats from transactions
  const totalDeposit = transactions
    .filter((t) => t.type === "DEPOSIT" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + parseFloat(t.gross_amount || "0"), 0);
  const totalWithdrawal = transactions
    .filter((t) => t.type === "WITHDRAWAL" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + parseFloat(t.gross_amount || "0"), 0);
  const totalSiteBalance = sites.reduce(
    (sum, s) => sum + parseFloat(s.account?.balance || "0"),
    0
  );

  const isLoading = sitesLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-twilight-400" />
          <p className="text-twilight-500 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-twilight-900">
          Hoş Geldin, {user?.name?.split(" ")[0] || "Partner"} 👋
        </h1>
        <p className="text-twilight-400 text-xs sm:text-sm mt-1">
          {now.toLocaleDateString("tr-TR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-twilight-400" />
                  <span className="text-[10px] sm:text-xs text-twilight-400 font-medium uppercase">
                    Sitelerim
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-twilight-900">{sites.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-twilight-400" />
                  <span className="text-[10px] sm:text-xs text-twilight-400 font-medium uppercase">
                    Toplam Bakiye
                  </span>
                </div>
                <p className={`text-lg sm:text-xl font-bold font-mono ${totalSiteBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatMoney(totalSiteBalance)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] sm:text-xs text-twilight-400 font-medium uppercase">
                    Son Yatırım
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600">
                  {formatMoney(totalDeposit)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpCircle className="h-4 w-4 text-rose-500" />
                  <span className="text-[10px] sm:text-xs text-twilight-400 font-medium uppercase">
                    Son Çekim
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold font-mono text-rose-600">
                  {formatMoney(totalWithdrawal)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* My Sites */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-bold text-twilight-900">
                <Building2 className="inline h-4 w-4 mr-1.5 text-twilight-400" />
                Sitelerim
              </CardTitle>
              <Link href="/sites">
                <Button variant="ghost" size="sm" className="text-xs text-twilight-400 hover:text-twilight-600">
                  Tümü <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              {sites.length === 0 ? (
                <div className="text-center py-8 text-twilight-400">
                  <Building2 className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Henüz site atanmamış</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sites.map((site) => {
                    const balance = parseFloat(site.account?.balance || "0");
                    return (
                      <div
                        key={site.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-twilight-50/50 hover:bg-twilight-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-twilight-100 flex items-center justify-center text-xs font-bold text-twilight-600">
                            {site.code?.substring(0, 2) || site.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-twilight-900">{site.name}</p>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                {site.code}
                              </Badge>
                              <div className={`h-1.5 w-1.5 rounded-full ${site.is_active ? "bg-emerald-500" : "bg-gray-300"}`} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold font-mono text-sm ${balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatMoney(balance)}
                          </p>
                          <p className="text-[10px] text-twilight-400">Bakiye</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-bold text-twilight-900">
                <TrendingUp className="inline h-4 w-4 mr-1.5 text-twilight-400" />
                Son İşlemler
              </CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-xs text-twilight-400 hover:text-twilight-600">
                  Tümü ({totalTx}) <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-twilight-400">
                  <Inbox className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Henüz işlem yok</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {transactions.slice(0, 7).map((tx) => {
                    const typeInfo = TX_TYPE_LABELS[tx.type] || { label: tx.type, color: "text-gray-600" };
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-twilight-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-semibold ${typeInfo.color} shrink-0`}>
                            {typeInfo.label}
                          </span>
                          {tx.site && (
                            <span className="text-xs text-twilight-400 truncate">{tx.site.name}</span>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-sm font-bold font-mono text-twilight-900">
                            {formatMoney(parseFloat(tx.gross_amount))}
                          </p>
                          <p className="text-[10px] text-twilight-400">{formatTimeAgo(tx.transaction_date)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ==================== RIGHT COLUMN ==================== */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Pending Requests */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-bold text-twilight-900">
                <ClipboardList className="inline h-4 w-4 mr-1.5 text-twilight-400" />
                Taleplerim
              </CardTitle>
              <Link href="/approvals">
                <Button variant="ghost" size="sm" className="text-xs text-twilight-400 hover:text-twilight-600">
                  Tümü <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              {pendingNum > 0 && (
                <div className="mb-3 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">
                    {pendingNum} talep onay bekliyor
                  </span>
                </div>
              )}

              {pendingLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : pendingItems.length === 0 ? (
                <div className="text-center py-6 text-twilight-400">
                  <CheckCircle className="mx-auto h-8 w-8 mb-2 text-emerald-300" />
                  <p className="text-sm">Aktif talep yok</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingItems.map((pt) => {
                    const typeLabel = PENDING_TYPE_LABELS[pt.transaction_type] || pt.transaction_type;
                    const amount = pt.payload?.amount;
                    const statusIcon =
                      pt.status === "PENDING" ? (
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      ) : pt.status === "APPROVED" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      );
                    const statusColor =
                      pt.status === "PENDING"
                        ? "bg-amber-50 border-amber-100"
                        : pt.status === "APPROVED"
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-rose-50 border-rose-100";

                    return (
                      <div
                        key={pt.id}
                        className={`flex items-center justify-between py-2.5 px-3 rounded-xl border ${statusColor} transition-colors`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {statusIcon}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-twilight-800 truncate">{typeLabel}</p>
                            <p className="text-[10px] text-twilight-400">{formatTimeAgo(pt.created_at)}</p>
                          </div>
                        </div>
                        {amount && (
                          <p className="text-sm font-bold font-mono text-twilight-900 shrink-0">
                            {formatMoney(parseFloat(amount))}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-bold text-twilight-900">
                Hızlı Erişim
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 space-y-2">
              <Link href="/transactions" className="block">
                <Button variant="outline" className="w-full justify-start text-sm h-10">
                  <TrendingUp className="mr-2 h-4 w-4 text-twilight-400" />
                  Tüm İşlemler
                </Button>
              </Link>
              <Link href="/sites" className="block">
                <Button variant="outline" className="w-full justify-start text-sm h-10">
                  <Building2 className="mr-2 h-4 w-4 text-twilight-400" />
                  Sitelerim
                </Button>
              </Link>
              <Link href="/approvals" className="block">
                <Button variant="outline" className="w-full justify-start text-sm h-10">
                  <ClipboardList className="mr-2 h-4 w-4 text-twilight-400" />
                  Onay Taleplerim
                  {pendingNum > 0 && (
                    <Badge className="ml-auto bg-amber-500 text-white text-[10px] px-1.5">{pendingNum}</Badge>
                  )}
                </Button>
              </Link>
              <Link href="/borclar" className="block">
                <Button variant="outline" className="w-full justify-start text-sm h-10">
                  <Wallet className="mr-2 h-4 w-4 text-twilight-400" />
                  Borç / Alacak
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
