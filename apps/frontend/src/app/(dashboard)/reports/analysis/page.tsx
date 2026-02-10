"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useDashboardStats, useSites, usePartners, useFinanciers } from "@/hooks/use-api";

export default function AnalysisPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: sites } = useSites({ limit: 100 });
  const { data: partners } = usePartners({ limit: 100 });
  const { data: financiers } = useFinanciers({ limit: 100 });

  const isLoading = statsLoading;

  // Calculate top entities
  const topSites = sites?.items
    ?.map((s) => ({
      name: s.name,
      balance: Math.abs(parseFloat(s.account?.balance || "0")),
    }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5) || [];

  const topPartners = partners?.items
    ?.map((p) => ({
      name: p.name,
      balance: parseFloat(p.account?.balance || "0"),
    }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5) || [];

  const financierUtilization = financiers?.items?.map((f) => {
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
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate percentages for pie chart visualization
  const totalBalance = (stats?.totalCash || 0) + (stats?.siteDebt || 0) + (stats?.partnerBalance || 0);
  const cashPercent = totalBalance > 0 ? ((stats?.totalCash || 0) / totalBalance) * 100 : 0;
  const sitePercent = totalBalance > 0 ? ((stats?.siteDebt || 0) / totalBalance) * 100 : 0;
  const partnerPercent = totalBalance > 0 ? ((stats?.partnerBalance || 0) / totalBalance) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analiz</h1>
        <p className="text-muted-foreground">
          Finansal performans ve dağılım analizi
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Varlık
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-amount">
              {formatMoney(stats?.totalCash || 0)}
            </p>
            <div className="flex items-center text-xs text-success-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>{cashPercent.toFixed(1)}% toplam</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Site Hacmi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-amount text-site">
              {formatMoney(stats?.siteDebt || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sites?.items?.length || 0} aktif site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partner Hacmi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-amount text-partner">
              {formatMoney(stats?.partnerBalance || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {partners?.items?.length || 0} aktif partner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bloke Oranı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning-600">
              {stats?.totalCash && stats.totalCash > 0
                ? (((stats?.blockedAmount || 0) / stats.totalCash) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatMoney(stats?.blockedAmount || 0)} bloke
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Balance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Bakiye Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-4 flex-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary-500"
                    style={{ width: `${cashPercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-16 text-right">
                  {cashPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary-500" />
                  Kasa
                </span>
                <span className="font-amount">{formatMoney(stats?.totalCash || 0)}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-4 flex-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-site"
                    style={{ width: `${sitePercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-16 text-right">
                  {sitePercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-site" />
                  Site Borcu
                </span>
                <span className="font-amount">{formatMoney(stats?.siteDebt || 0)}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-4 flex-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-partner"
                    style={{ width: `${partnerPercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-16 text-right">
                  {partnerPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-partner" />
                  Partner Hak Ediş
                </span>
                <span className="font-amount">{formatMoney(stats?.partnerBalance || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financier Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Finansör Kullanım Oranı
            </CardTitle>
            <CardDescription>
              Kullanılabilir bakiye / Toplam bakiye
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financierUtilization.map((f) => (
                <div key={f.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground">
                      {f.utilizationRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        f.utilizationRate >= 70
                          ? "bg-success-500"
                          : f.utilizationRate >= 40
                          ? "bg-warning-500"
                          : "bg-danger-500"
                      }`}
                      style={{ width: `${f.utilizationRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Bloke: {formatMoney(f.blocked)}</span>
                    <span>Kullanılabilir: {formatMoney(f.available)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Entities */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Sites */}
        <Card>
          <CardHeader>
            <CardTitle>En Yüksek Hacimli Siteler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSites.map((site, index) => (
                <div key={site.name} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-site/10 text-sm font-bold text-site">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{site.name}</p>
                  </div>
                  <span className="font-amount font-semibold text-site">
                    {formatMoney(site.balance)}
                  </span>
                </div>
              ))}
              {topSites.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Veri bulunamadı
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Partners */}
        <Card>
          <CardHeader>
            <CardTitle>En Yüksek Hak Edişli Partnerler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPartners.map((partner, index) => (
                <div key={partner.name} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-partner/10 text-sm font-bold text-partner">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{partner.name}</p>
                  </div>
                  <span className="font-amount font-semibold text-partner">
                    {formatMoney(partner.balance)}
                  </span>
                </div>
              ))}
              {topPartners.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Veri bulunamadı
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
