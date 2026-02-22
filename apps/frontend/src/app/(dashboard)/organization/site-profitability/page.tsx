"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney, cn } from "@/lib/utils";
import { useOrgAnalytics } from "@/hooks/use-api";
import {
    ArrowLeft,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];
const YEARS = [2024, 2025, 2026, 2027];

export default function SiteProfitabilityPage() {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>("all");

    const monthParam = selectedMonth === "all" ? null : parseInt(selectedMonth) + 1;
    const { data: analytics, isLoading } = useOrgAnalytics(selectedYear, monthParam);

    const sites = analytics?.profitBySite || [];
    const totalProfit = sites.reduce((acc: number, s: any) => acc + s.amount, 0);
    const maxAmount = sites.length ? Math.max(...sites.map((s: any) => Math.abs(s.amount))) : 0;

    const periodLabel = selectedMonth === "all"
        ? `${selectedYear} Yılı`
        : `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`;

    return (
        <div className="space-y-3 sm:space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link href="/organization">
                        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-base sm:text-2xl lg:text-3xl font-bold text-[#013a63] flex items-center gap-1.5 sm:gap-3">
                            <div className="p-1 sm:p-2 bg-gradient-to-br from-[#013a63] to-[#2c7da0] rounded-lg sm:rounded-xl text-white shadow-lg shadow-blue-900/10">
                                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            Site Karlılık Analizi
                        </h1>
                    </div>
                </div>
                {/* Date Filter */}
                <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-2xl border border-slate-200 shadow-sm">
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger className="h-7 sm:h-9 w-[70px] sm:w-[100px] border-0 bg-transparent focus:ring-0 font-medium text-xs sm:text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="h-3 sm:h-4 w-px bg-slate-200" />
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-7 sm:h-9 w-[80px] sm:w-[130px] border-0 bg-transparent focus:ring-0 font-medium text-slate-600 text-xs sm:text-sm">
                            <SelectValue placeholder="Ay" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Yıl</SelectItem>
                            {MONTHS.map((m, i) => <SelectItem key={m} value={i.toString()}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-3 sm:gap-4 bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-3 sm:p-5 shadow-sm">
                <div className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center",
                    totalProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                    {totalProfit >= 0 ? <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> : <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />}
                </div>
                <div>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Toplam Net Kar ({periodLabel})</p>
                    <p className={cn(
                        "text-xl sm:text-2xl font-bold font-mono",
                        totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {formatMoney(totalProfit)}
                    </p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-[10px] sm:text-xs text-slate-500">{sites.length} site</p>
                </div>
            </div>

            {/* Sites List */}
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            ) : !sites.length ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <BarChart3 className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm font-medium">Bu dönemde site karlılık verisi bulunamadı</p>
                </div>
            ) : (
                <div className="space-y-1.5 sm:space-y-2">
                    {sites.map((site: any, index: number) => {
                        const barWidth = maxAmount > 0 ? (Math.abs(site.amount) / maxAmount) * 100 : 0;
                        const isPositive = site.amount >= 0;
                        return (
                            <div
                                key={site.name}
                                className="group relative bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className={cn(
                                            "h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold",
                                            isPositive
                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                : site.amount === 0
                                                    ? "bg-slate-50 text-slate-400 border border-slate-100"
                                                    : "bg-rose-50 text-rose-600 border border-rose-100"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm font-semibold text-slate-900">{site.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {isPositive && site.amount > 0 && <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />}
                                        {!isPositive && site.amount < 0 && <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-500" />}
                                        {site.amount === 0 && <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400" />}
                                        <span className={cn(
                                            "text-xs sm:text-sm font-bold font-mono",
                                            isPositive && site.amount > 0 ? "text-emerald-600"
                                                : site.amount === 0 ? "text-slate-400"
                                                    : "text-rose-600"
                                        )}>
                                            {formatMoney(site.amount)}
                                        </span>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            isPositive
                                                ? "bg-gradient-to-r from-sky-400 to-indigo-500"
                                                : "bg-gradient-to-r from-rose-400 to-rose-500"
                                        )}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
