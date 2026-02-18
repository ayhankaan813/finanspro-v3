"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useDailyCashFlow } from "@/hooks/use-api";
import { Loader2 } from "lucide-react";

interface CashFlowData {
    name: string;
    total: number;
    date: string;
}

interface OverviewChartProps {
    data?: CashFlowData[];
}

export function OverviewChart({ data: externalData }: OverviewChartProps) {
    const { data: apiData, isLoading } = useDailyCashFlow(7);

    const chartData = externalData || apiData || [];

    if (isLoading && !externalData) {
        return (
            <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-twilight-300" />
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-twilight-400 text-sm">
                Henüz yeterli veri yok
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#03045e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#03045e" stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                    width={45}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.97)',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 8px 30px rgb(0 0 0 / 0.12)',
                        padding: '12px 16px',
                    }}
                    itemStyle={{ color: '#03045e', fontWeight: 'bold' }}
                    formatter={(value: number) => [`₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, "Kasa"]}
                    labelStyle={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}
                />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#03045e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    dot={{ r: 4, fill: '#03045e', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#03045e', strokeWidth: 3, stroke: '#fff' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
