"use client";

import { useState } from "react";
import { formatMoney, cn } from "@/lib/utils";
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
    Activity,
    Building2,
    Calendar,
    BarChart3,
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    ChevronRight,
    Search,
    FileText
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
    Rectangle,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area
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
    const [selectedMonth, setSelectedMonth] = useState<string>("all");

    // Queries
    const monthParam = selectedMonth === "all" ? null : parseInt(selectedMonth) + 1;

    const { data: stats, isLoading: statsLoading } = useOrganizationStats(selectedYear, monthParam);
    const { data: account, isLoading: accountLoading } = useOrganizationAccount();
    const { data: analytics, isLoading: analyticsLoading } = useOrgAnalytics(selectedYear, monthParam);
    const { data: transactions, isLoading: txLoading } = useOrganizationTransactions({ limit: 5 });

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
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg hover:-translate-y-1 h-full">
            {/* Background Blob/Splash */}
            <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-all group-hover:scale-150", colorClass)} />

            <div className="relative flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                    {isLoading ? (
                        <Skeleton className="my-2 h-8 w-32" />
                    ) : (
                        <div className="mt-2 text-2xl font-bold tracking-tight text-[#0F172A] font-mono">
                            {value}
                        </div>
                    )}
                </div>
                <div className={cn("rounded-xl p-2.5 bg-slate-50 ring-1 ring-slate-100", colorClass.replace('bg-', 'text-'))}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4 flex items-center text-xs">
                {trend === "up" && <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-emerald-500" />}
                {trend === "down" && <ArrowDownLeft className="mr-1 h-3.5 w-3.5 text-rose-500" />}
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
                <div className="rounded-xl border border-slate-100 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                    <p className="mb-1 text-sm font-medium text-slate-500">{label}</p>
                    <p className="font-mono text-lg font-bold text-[#0F172A]">
                        {payload[0].value.toLocaleString('tr-TR')} {suffix}
                    </p>
                </div>
            );
        }
        return null;
    };

    const EmptyState = ({ icon: Icon, title, height = "h-full" }: { icon: any, title: string, height?: string }) => (
        <div className={cn("flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100 m-4", height)}>
            <div className="p-3 bg-white rounded-full shadow-sm">
                <Icon className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-sm font-medium">{title}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 p-6 sm:p-8 space-y-8 font-sans">
            {/* Background Mesh Gradient */}
            <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent" />

            {/* Header */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-[#013a63] flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-[#013a63] to-[#2c7da0] rounded-xl text-white shadow-lg shadow-blue-900/10">
                            <Building2 className="h-6 w-6" />
                        </div>
                        Organizasyon Paneli
                    </h1>
                    <p className="text-slate-500 text-sm ml-14">
                        Tüm finansal operasyonların merkezi yönetim paneli.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                        <SelectTrigger className="h-9 w-[100px] border-0 bg-transparent focus:ring-0 font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="h-4 w-px bg-slate-200" />
                    <Select value={selectedMonth} onValueChange={handleMonthChange}>
                        <SelectTrigger className="h-9 w-[130px] border-0 bg-transparent focus:ring-0 font-medium text-slate-600">
                            <SelectValue placeholder="Ay" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Yıl</SelectItem>
                            {MONTHS.map((m, i) => <SelectItem key={m} value={i.toString()}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4 z-10">
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
                    icon={Activity}
                    trend={stats && parseFloat(stats.netProfit) >= 0 ? "up" : "down"}
                    colorClass="bg-violet-500 text-violet-500"
                />
            </div>

            {/* Main Content */}
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">

                {/* Left Column (Charts) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Profit Chart */}
                    <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 h-[450px] flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold text-[#013a63] flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-[#2c7da0]" />
                                Site Karlılık Analizi
                            </CardTitle>
                            <CardDescription>Sitelerden elde edilen net kar sıralaması</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            {isLoading ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Skeleton className="h-[300px] w-full rounded-xl" />
                                </div>
                            ) : (!analytics?.profitBySite?.length) ? (
                                <EmptyState icon={BarChart3} title="Görüntülenecek kar verisi yok" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics.profitBySite}
                                        layout="vertical"
                                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
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
                                            tick={{ fontSize: 13, fill: '#64748B', fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={100}
                                        />
                                        <Tooltip cursor={{ fill: '#F8FAFC' }} content={<CustomTooltip suffix="₺" />} />
                                        <Bar
                                            dataKey="amount"
                                            fill="url(#barGradient)"
                                            radius={[0, 8, 8, 0]}
                                            barSize={32}
                                            activeBar={{ fill: '#4F46E5' }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Operational Density Chart */}
                    <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 h-[400px] flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold text-[#013a63] flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-[#2c7da0]" />
                                Operasyonel Yoğunluk
                            </CardTitle>
                            <CardDescription>Haftanın günlerine göre işlem hacmi</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            {!analytics?.busyDays?.length && !isLoading ? (
                                <EmptyState icon={Calendar} title="İşlem verisi bulunamadı" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.busyDays ?? []}>
                                        <defs>
                                            <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#818CF8" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.3} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="day"
                                            tick={{ fontSize: 12, fill: '#64748B' }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <Tooltip cursor={{ fill: '#F8FAFC' }} content={<CustomTooltip suffix="İşlem" />} />
                                        <Bar
                                            dataKey="count"
                                            fill="url(#densityGradient)"
                                            radius={[8, 8, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column */}
                <div className="space-y-8">

                    {/* Expense Chart */}
                    <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 h-[450px] flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold text-[#013a63] flex items-center gap-2">
                                <PieChart className="h-4 w-4 text-[#2c7da0]" />
                                Gider Dağılımı
                            </CardTitle>
                            <CardDescription>Kategori bazlı harcama dağılımı</CardDescription>
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
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
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
                                        <Tooltip />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 overflow-hidden h-[400px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/50 pb-4 shrink-0">
                            <CardTitle className="text-base font-semibold text-[#013a63]">Son İşlemler</CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs h-8 hover:bg-white hover:text-indigo-600">
                                Tümü <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
                            {!transactions?.items?.length && !isLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <EmptyState icon={FileText} title="İşlem kaydı bulunamadı" height="h-auto" />
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {transactions?.items.map((tx, i) => (
                                        <div
                                            key={i}
                                            className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-default"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110",
                                                    tx.entry_type === "CREDIT"
                                                        ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                                                        : "bg-rose-100 text-rose-600 border border-rose-200"
                                                )}>
                                                    {tx.entry_type === "CREDIT"
                                                        ? <ArrowDownLeft className="h-5 w-5" />
                                                        : <ArrowUpRight className="h-5 w-5" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">
                                                        {tx.description || "İşlem"}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[10px] h-5 font-normal text-slate-500 border-slate-200 px-1.5">
                                                            {tx.category || "Genel"}
                                                        </Badge>
                                                        <p className="text-xs text-slate-400 font-medium">
                                                            {new Date(tx.date).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "text-sm font-bold font-mono tracking-tight",
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

            {/* Monthly Trend Chart (Restored) */}
            <Card className="border-0 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-[#013a63] flex items-center gap-2">
                        <Activity className="h-5 w-5 text-[#2c7da0]" />
                        Aylık Finansal Trend
                    </CardTitle>
                    <CardDescription>Yıllık gelir ve gider dengesi</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                        </div>
                    ) : (!analytics?.monthlyTrend?.length) ? (
                        <EmptyState icon={Activity} title="Trend verisi oluşmadı" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <Tooltip content={<CustomTooltip suffix="₺" />} />
                                <Area type="monotone" dataKey="income" name="Gelir" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGradient)" />
                                <Area type="monotone" dataKey="expense" name="Gider" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#expenseGradient)" />
                                <Legend iconType="circle" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
