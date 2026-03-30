"use client";

import { useTheme } from "@/components/ThemeProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card } from "@/components/ui/Card";
import { DollarSign } from "lucide-react";

interface FinanceData {
    name: string;
    ingresos: number;
    gastos: number;
    rentabilidad: number;
}

interface AnnualFinanceChartProps {
    data: FinanceData[];
    year: number;
}

export function AnnualFinanceChart({ data, year }: AnnualFinanceChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const formatCurrency = (value: number) => 
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

    return (
        <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <DollarSign className="text-emerald-500" size={20} />
                        Balance Financiero {year}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ingresos, gastos y rentabilidad neta por mes.
                    </p>
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barGap={2}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false} 
                            stroke={isDark ? "#334155" : "#e2e8f0"} 
                        />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `$${(val / 1000)}k`}
                            tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                            dx={-10}
                        />
                        <Tooltip 
                            cursor={{ fill: isDark ? "#1e293b" : "#f1f5f9" }}
                            contentStyle={{ 
                                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                                borderRadius: '8px',
                                padding: '12px'
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                        />
                        <ReferenceLine y={0} stroke={isDark ? "#475569" : "#cbd5e1"} />
                        <Bar 
                            dataKey="ingresos" 
                            name="Ingresos Totales" 
                            fill="#3b82f6" // Blue
                            radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                            dataKey="gastos" 
                            name="Gastos Operativos" 
                            fill="#f43f5e" // Rose
                            radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                            dataKey="rentabilidad" 
                            name="Rentabilidad Neta" 
                            fill="#10b981" // Emerald
                            radius={[4, 4, 0, 0]} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
