"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
    { name: "Pzt", total: 150000 },
    { name: "Sal", total: 320000 },
    { name: "Çar", total: 240000 },
    { name: "Per", total: 450000 },
    { name: "Cum", total: 380000 },
    { name: "Cmt", total: 520000 },
    { name: "Paz", total: 610000 },
];

export function OverviewChart() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#03045e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#03045e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₺${value / 1000}k`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: '#03045e', fontWeight: 'bold' }}
                    formatter={(value: number) => [`₺${value.toLocaleString()}`, "Toplam"]}
                />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#03045e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
