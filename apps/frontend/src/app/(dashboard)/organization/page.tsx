"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney, cn, formatTurkeyDate, formatTurkeyDateTime } from "@/lib/utils";
import {
    useOrganizationStats,
    useOrganizationTransactions,
    useOrganizationAccount,
    useOrgAnalytics
} from "@/hooks/use-api";

// Icons
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Building2,
    Calendar,
    BarChart3,
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    ChevronRight,
    FileText,
    Users
} from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

// Recharts
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

import { Badge } from "@/components/ui/badge";

// Constants
const MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const YEARS = [2024, 2025, 2026, 2027];

// Deep Space Palette
const COLORS = [
    "#0EA5E9", // Sky Blue
    "#38BDF8", // Light Sky
    "#0284C7", // Dark Sky
    "#6366F1", // Indigo
    "#818CF8", // Light Indigo
    "#4F46E5"  // Dark Indigo
];

export default function OrganizationPage() {
    // State
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());

    // Queries
    const monthParam = selectedMonth === "all" ? null : parseInt(selectedMonth) + 1;

    const { data: stats, isLoading: statsLoading } = useOrganizationStats(selectedYear, monthParam);
    const { data: account, isLoading: accountLoading } = useOrganizationAccount();
    const { data: analytics, isLoading: analyticsLoading } = useOrgAnalytics(selectedYear, monthParam);
    const { data: transactions, isLoading: txLoading } = useOrganizationTransactions({ limit: 5, year: selectedYear, month: monthParam });

    // Loading State
    const isLoading = statsLoading || accountLoading || analyticsLoading || txLoading;

    // Derived Data
    const formattedDate = selectedMonth === "all"
        ? `${selectedYear} Yılı`
        : `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`;

    // Handlers
    const handleMonthChange = (val: string) => setSelectedMonth(val);
    const handleYearChange = (val: string) => setSelectedYear(parseInt(val));

    // --- Modern Components ---

    const StatsCard = ({ title, value, subtext, icon: Icon, trend, colorClass }: any) => (
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg hover:-translate-y-1 h-full">
            {/* Background Blob/Splash */}
            <div className={cn("absolute -right-6 -top-6 h-16 w-16 sm:h-24 sm:w-24 rounded-full opacity-10 blur-2xl transition-all group-hover:scale-150", colorClass)} />

            <div className="relative flex justify-between items-start">
                <div>
                    <h3 className="text-xs sm:text-sm font-medium text-slate-500">{title}</h3>
                    {isLoading ? (
                        <Skeleton className="my-2 h-8 w-32" />
                    ) : (
                        <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] font-mono">
                            {value}
                        </div>
                    )}
                </div>
                <div className={cn("rounded-lg sm:rounded-xl p-2 sm:p-2.5 bg-slate-50 ring-1 ring-slate-100", colorClass.replace('bg-', 'text-'))}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs">
                {trend === "up" && <ArrowUpRight className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />}
                {trend === "down" && <ArrowDownLeft className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-500" />}
                <span className={cn(
                    "font-medium",
                    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-slate-500"
                )}>
                    {subtext}
                </span>
            </div>
        </div>
    );

    const CustomTooltip = ({ active, payload, label, suffix = "" }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg sm:rounded-xl border border-slate-100 bg-white/95 p-2.5 sm:p-4 shadow-xl backdrop-blur-md">
                    <p className="mb-0.5 sm:mb-1 text-xs sm:text-sm font-medium text-slate-500">{label}</p>
                    <p className="font-mono text-sm sm:text-lg font-bold text-[#0F172A]">
                        {payload[0].value.toLocaleString('tr-TR')} {suffix}
                    </p>
                </div>
            );
        }
        return null;
    };

    const EmptyState = ({ icon: Icon, title, height = "h-full" }: { icon: any, title: string, height?: string }) => (
        <div className={cn("flex flex-col items-center justify-center gap-2 sm:gap-3 text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100 m-2 sm:m-4", height)}>
            <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 opacity-50" />
            </div>
            <p className="text-xs sm:text-sm font-medium">{title}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 font-sans">
            {/* Background Mesh Gradient */}
            <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent" />

            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-base sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#013a63] flex items-center gap-1.5 sm:gap-3">
                        <div className="p-1 sm:p-2 bg-gradient-to-br from-[#013a63] to-[#2c7da0] rounded-lg sm:rounded-xl text-white shadow-lg shadow-blue-900/10">
                            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                        </div>
                        <span className="sm:hidden">Organizasyon</span>
                        <span className="hidden sm:inline">Organizasyon Paneli</span>
                    </h1>
                    <Link href="/organization/personnel">
                        <Button variant="outline" size="sm" className="gap-1 sm:gap-2 rounded-lg sm:rounded-xl border-twilight-200 text-twilight-700 hover:bg-twilight-50 h-7 sm:h-9 text-[11px] sm:text-sm px-2 sm:px-3">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            Personel
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center justify-between mt-2 sm:mt-1">
                    <p className="text-slate-500 text-[11px] sm:text-xs lg:text-sm hidden sm:block ml-12 lg:ml-14">
                        Tüm finansal operasyonların merkezi yönetim paneli.
                    </p>
                    <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-2xl border border-slate-200 shadow-sm">
                        <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                            <SelectTrigger className="h-7 sm:h-9 w-[70px] sm:w-[100px] border-0 bg-transparent focus:ring-0 font-medium text-xs sm:text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="h-3 sm:h-4 w-px bg-slate-200" />
                        <Select value={selectedMonth} onValueChange={handleMonthChange}>
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
            </div>

            {/* Stats Grid */}
            <div className="relative grid grid-cols-2 gap-2.5 sm:gap-4 lg:gap-6 lg:grid-cols-4 z-10">
                <StatsCard
                    title="Mevcut Kasa"
                    value={account ? formatMoney(account.balance) : "₺0,00"}
                    subtext="Toplam bakiye"
                    icon={Wallet}
                    trend="neutral"
                    colorClass="bg-blue-600 text-blue-600"
                />
                <StatsCard
                    title="Toplam Gelir"
                    value={stats ? formatMoney(stats.totalIncome) : "₺0,00"}
                    subtext={formattedDate}
                    icon={TrendingUp}
                    trend="up"
                    colorClass="bg-emerald-500 text-emerald-500"
                />
                <StatsCard
                    title="Toplam Gider"
                    value={stats ? formatMoney(stats.totalExpense) : "₺0,00"}
                    subtext={formattedDate}
                    icon={TrendingDown}
                    trend="down"
                    colorClass="bg-rose-500 text-rose-500"
                />
                <StatsCard
                    title="Net Kar/Zarar"
                    value={stats ? formatMoney(stats.netProfit) : "₺0,00"}
                    subtext="Bu dönem"
                    icon={BarChart3}
                    trend={stats && parseFloat(stats.netProfit) >= 0 ? "up" : "down"}
                    colorClass="bg-violet-500 text-violet-500"
                />
            </div>

            {/* Main Content */}
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 z-10">

                {/* Left Column (Charts) */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">

                    {/* Profit Chart */}
                    {(() => {
                        const topSites = (analytics?.profitBySite || []).slice(0, 5);
                        const barH = Math.max(160, topSites.length * 44);
                        return (
                            <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 flex flex-col">
                                <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                                    <Link href="/organization/site-profitability" className="group">
                                        <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-[#013a63] flex items-center gap-2 group-hover:text-[#2c7da0] transition-colors cursor-pointer">
                                            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-[#2c7da0]" />
                                            Site Karlılık Analizi
                                            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </CardTitle>
                                    </Link>
                                    <CardDescription className="text-[11px] sm:text-sm">İlk 5 sitenin net kar sıralaması</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-0">
                                    {isLoading ? (
                                        <div className="h-[200px] w-full flex items-center justify-center">
                                            <Skeleton className="h-full w-full rounded-xl" />
                                        </div>
                                    ) : (!topSites.length) ? (
                                        <div className="h-[200px]">
                                            <EmptyState icon={BarChart3} title="Görüntülenecek kar verisi yok" />
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ height: barH }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={topSites}
                                                        layout="vertical"
                                                        margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                                                    >
                                                        <defs>
                                                            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                                                <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.8} />
                                                                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.8} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            width={50}
                                                            interval={0}
                                                        />
                                                        <Tooltip cursor={{ fill: '#F8FAFC' }} content={<CustomTooltip suffix="₺" />} />
                                                        <Bar
                                                            dataKey="amount"
                                                            fill="url(#barGradient)"
                                                            radius={[0, 8, 8, 0]}
                                                            barSize={28}
                                                            activeBar={{ fill: '#4F46E5' }}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <Link
                                                href="/organization/site-profitability"
                                                className="w-full flex items-center justify-center gap-1 pt-2 pb-1 text-xs font-medium text-[#2c7da0] hover:text-[#013a63] transition-colors"
                                            >
                                                Tüm Siteleri Gör <ChevronRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })()}

                    {/* Operational Density Chart */}
                    <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 h-[240px] sm:h-[300px] lg:h-[400px] flex flex-col">
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                            <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-[#013a63] flex items-center gap-2">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#2c7da0]" />
                                Operasyonel Yoğunluk
                            </CardTitle>
                            <CardDescription className="text-[11px] sm:text-sm">Haftanın günlerine göre işlem hacmi</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            {!analytics?.busyDays?.length && !isLoading ? (
                                <EmptyState icon={Calendar} title="İşlem verisi bulunamadı" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.busyDays ?? []} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#818CF8" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.3} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="day"
                                            tick={{ fontSize: 9, fill: '#64748B' }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={5}
                                            interval={0}
                                            tickFormatter={(v: string) => {
                                                const map: Record<string, string> = { Pazartesi: "Pzt", Salı: "Sal", Çarşamba: "Çar", Perşembe: "Per", Cuma: "Cum", Cumartesi: "Cmt", Pazar: "Paz" };
                                                return map[v] || v;
                                            }}
                                        />
                                        <Tooltip cursor={{ fill: '#F8FAFC' }} content={<CustomTooltip suffix="İşlem" />} />
                                        <Bar
                                            dataKey="count"
                                            fill="url(#densityGradient)"
                                            radius={[8, 8, 0, 0]}
                                            maxBarSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column */}
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">

                    {/* Expense Chart */}
                    <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 h-[280px] sm:h-[350px] lg:h-[450px] flex flex-col">
                        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                            <CardTitle className="text-sm sm:text-base font-semibold text-[#013a63] flex items-center gap-2">
                                <PieChart className="h-4 w-4 text-[#2c7da0]" />
                                Gider Dağılımı
                            </CardTitle>
                            <CardDescription className="text-[11px] sm:text-sm">Kategori bazlı harcama dağılımı</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            {isLoading ? (
                                <Skeleton className="h-full w-full rounded-full" />
                            ) : (!stats?.breakdown?.length || stats.breakdown.length === 0) ? (
                                <EmptyState icon={PieChart} title="Henüz gider kaydı yok" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={stats.breakdown.map((b: any) => ({ ...b, amount: parseFloat(b.amount) }))}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius="45%"
                                            outerRadius="65%"
                                            paddingAngle={4}
                                            dataKey="amount"
                                            nameKey="categoryName"
                                            stroke="none"
                                            cornerRadius={6}
                                        >
                                            {stats.breakdown.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg sm:rounded-xl border border-slate-100 bg-white/95 p-2.5 sm:p-4 shadow-xl backdrop-blur-md">
                                                        <p className="mb-0.5 sm:mb-1 text-xs sm:text-sm font-medium text-slate-500">{payload[0].name}</p>
                                                        <p className="font-mono text-sm sm:text-lg font-bold text-[#0F172A]">
                                                            {payload[0].value.toLocaleString('tr-TR')} ₺
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            iconSize={6}
                                            wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 overflow-hidden h-[300px] sm:h-[350px] lg:h-[400px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/50 pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6 shrink-0">
                            <CardTitle className="text-sm sm:text-base font-semibold text-[#013a63]">Son İşlemler</CardTitle>
                            <Link href="/transactions?scope=organization">
                                <Button variant="ghost" size="sm" className="text-xs h-8 hover:bg-white hover:text-indigo-600">
                                    Tümü <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
                            {!transactions?.items?.length && !isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                    <FileText className="h-10 w-10 text-slate-300 mb-3" />
                                    <p className="text-sm font-medium text-slate-500">Organizasyon işlemi bulunamadı</p>
                                    <p className="text-xs text-slate-400 mt-1">Gider, gelir veya hak ediş çekimi gibi org işlemleri burada görünecek</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {transactions?.items.map((tx, i) => (
                                        <div
                                            key={i}
                                            className="group flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors cursor-default"
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className={cn(
                                                    "h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110",
                                                    tx.entry_type === "CREDIT"
                                                        ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                                                        : "bg-rose-100 text-rose-600 border border-rose-200"
                                                )}>
                                                    {tx.entry_type === "CREDIT"
                                                        ? <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        : <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate max-w-[120px] sm:max-w-[140px]">
                                                        {tx.description || "İşlem"}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                                                        <Badge variant="outline" className="text-[9px] sm:text-[10px] h-4 sm:h-5 font-normal text-slate-500 border-slate-200 px-1 sm:px-1.5">
                                                            {typeof tx.category === 'object' && tx.category !== null ? tx.category.name : (tx.category || "Genel")}
                                                        </Badge>
                                                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                                                            <span className="sm:hidden">{formatTurkeyDate(tx.date, "d MMM HH:mm")}</span>
                                                            <span className="hidden sm:inline">{formatTurkeyDate(tx.date, "d MMMM HH:mm")}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "text-xs sm:text-sm font-bold font-mono tracking-tight",
                                                tx.entry_type === "CREDIT" ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {tx.entry_type === "CREDIT" ? "+" : "-"}{formatMoney(tx.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Organization Profit Chart */}
            <Card className="relative border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-[#013a63] flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                        Organizasyon Kâr Grafiği
                    </CardTitle>
                    <CardDescription className="text-[11px] sm:text-sm">Aylık net kâr/zarar dağılımı ({selectedYear})</CardDescription>
                </CardHeader>
                <CardContent className="h-[220px] sm:h-[280px] lg:h-[300px] px-1 sm:px-6">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                        </div>
                    ) : (!analytics?.monthlyTrend?.length) ? (
                        <EmptyState icon={TrendingUp} title="Kâr verisi oluşmadı" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={analytics.monthlyTrend.map((m: any) => ({
                                    month: m.month,
                                    profit: parseFloat((m.income - m.expense).toFixed(2)),
                                }))}
                                margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="profitPositive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#34D399" stopOpacity={0.6} />
                                    </linearGradient>
                                    <linearGradient id="profitNegative" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#FB7185" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} width={45} />
                                <Tooltip content={<CustomTooltip suffix="₺" />} />
                                <Bar
                                    dataKey="profit"
                                    name="Net Kâr"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={36}
                                >
                                    {analytics.monthlyTrend.map((m: any, i: number) => (
                                        <Cell
                                            key={`profit-${i}`}
                                            fill={m.income - m.expense >= 0 ? "url(#profitPositive)" : "url(#profitNegative)"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
