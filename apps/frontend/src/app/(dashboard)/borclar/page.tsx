"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  HandCoins,
  TrendingDown,
  TrendingUp,
  Scale,
  Activity,
  Plus,
  List,
  Clock,
  Grid3X3,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";
import {
  useDebtSummary,
  useDebtFinancierSummary,
} from "@/hooks/use-api";

export default function BorclarPage() {
  const { data: summary, isLoading: isLoadingSummary } = useDebtSummary();
  const { data: financierSummary, isLoading: isLoadingFinancier } = useDebtFinancierSummary();

  // Calculate totals from financier summary for Toplam Alacak
  const totalReceivable = financierSummary
    ? financierSummary.reduce((acc, f) => acc + f.total_receivable, 0)
    : 0;
  const totalOwed = financierSummary
    ? financierSummary.reduce((acc, f) => acc + f.total_owed, 0)
    : 0;
  const netPosition = totalReceivable - totalOwed;

  const isLoading = isLoadingSummary || isLoadingFinancier;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <HandCoins className="h-6 w-6" />
              Borç/Alacak Yönetimi
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Finansörler arası borç ve alacak takibi
            </p>
          </div>
          <Button
            className="bg-white text-slate-900 hover:bg-slate-100 font-semibold"
            size="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Borç
          </Button>
        </div>
      </div>

      {/* Summary Cards (PAGE-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Borc */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-100 p-3 shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Toplam Borç</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600 font-mono truncate">
                    {formatMoney(summary?.total_active_debt ?? 0)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Toplam Alacak */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-100 p-3 shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Toplam Alacak</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 font-mono truncate">
                    {formatMoney(totalReceivable)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Net Durum */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3 shrink-0">
                  <Scale className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Net Durum</p>
                  <p className={`text-xl sm:text-2xl font-bold font-mono truncate ${
                    netPosition >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatMoney(netPosition)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktif Borc Sayisi */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-amber-100 p-3 shrink-0">
                  <Activity className="h-6 w-6 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Aktif Borç</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono">
                    {summary?.active_debt_count ?? 0}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="open" className="flex items-center gap-1.5 min-h-[44px]">
            <List className="h-4 w-4" />
            <span>Açık Borçlar</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 min-h-[44px]">
            <Clock className="h-4 w-4" />
            <span>İşlem Geçmişi</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-1.5 min-h-[44px]">
            <Grid3X3 className="h-4 w-4" />
            <span>Finansör Matrix</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Açık Borçlar</p>
              <p className="text-sm">Bu sekme bir sonraki güncellemede aktif olacak.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">İşlem Geçmişi</p>
              <p className="text-sm">Bu sekme bir sonraki güncellemede aktif olacak.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Grid3X3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Finansör Matrix</p>
              <p className="text-sm">Bu sekme bir sonraki güncellemede aktif olacak.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
