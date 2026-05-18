"use client";

import { useState, useMemo } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/components/ThemeProvider";
import { Gamepad2, Mic, Headphones, MessageSquare } from "lucide-react";

interface DailyDataPoint {
    date: string;
    SPEAKING: number;
    LISTENING: number;
    CHAT: number;
}

interface TypeDataPoint {
    name: string;
    value: number;
    color: string;
}

interface CourseDataPoint {
    name: string;
    accuracy: number;
    sessions: number;
    color: string;
}

interface PlaygroundActivityChartProps {
    dailyData: DailyDataPoint[];
    typeData: TypeDataPoint[];
    courseData: CourseDataPoint[];
    totalSessions: number;
}

type PeriodFilter = "7d" | "30d";

const TYPE_COLORS = {
    SPEAKING: "#8b5cf6",
    LISTENING: "#f59e0b",
    CHAT: "#10b981",
};

const TYPE_LABELS = {
    SPEAKING: "Speaking",
    LISTENING: "Listening",
    CHAT: "Chat",
};

export function PlaygroundActivityChart({
    dailyData,
    typeData,
    courseData,
    totalSessions,
}: PlaygroundActivityChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [period, setPeriod] = useState<PeriodFilter>("30d");
    const [activeTypeIndex, setActiveTypeIndex] = useState<number | null>(null);

    const axisColor = isDark ? "#94a3b8" : "#64748b";
    const gridColor = isDark ? "#334155" : "#e2e8f0";

    const filteredDailyData = useMemo(() => {
        if (period === "7d") return dailyData.slice(-7);
        return dailyData;
    }, [dailyData, period]);

    const totalSessionsInPeriod = useMemo(() => {
        return filteredDailyData.reduce(
            (acc, d) => acc + d.SPEAKING + d.LISTENING + d.CHAT,
            0
        );
    }, [filteredDailyData]);

    const hasNoData = totalSessions === 0;

    return (
        <Card variant="premium-glass" className="p-6 relative overflow-hidden group">
            {/* Ambient glow */}
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-colors duration-700 pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                <div>
                    <h3 className="font-bold text-xl flex items-center gap-2">
                        <Gamepad2 className="text-violet-500" size={22} />
                        Actividad del Playground
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sesiones de práctica completadas por los alumnos.
                    </p>
                </div>

                {/* Period selector */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg self-start sm:self-auto">
                    {(["7d", "30d"] as PeriodFilter[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${period === p
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {p === "7d" ? "7 días" : "30 días"}
                        </button>
                    ))}
                </div>
            </div>

            {hasNoData ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Gamepad2 size={48} className="text-muted-foreground/30 mb-4" />
                    <p className="font-semibold text-muted-foreground">Sin actividad aún</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Cuando los alumnos completen sesiones de práctica, los datos aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="space-y-8 relative z-10">

                    {/* ── SUMMARY PILLS ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <SummaryPill
                            icon={<Gamepad2 size={16} />}
                            label="Total sesiones"
                            value={totalSessionsInPeriod.toString()}
                            type="violet"
                        />
                        <SummaryPill
                            icon={<Mic size={16} />}
                            label="Speaking"
                            value={filteredDailyData.reduce((a, d) => a + d.SPEAKING, 0).toString()}
                            type="purple"
                        />
                        <SummaryPill
                            icon={<Headphones size={16} />}
                            label="Listening"
                            value={filteredDailyData.reduce((a, d) => a + d.LISTENING, 0).toString()}
                            type="amber"
                        />
                        <SummaryPill
                            icon={<MessageSquare size={16} />}
                            label="Chat IA"
                            value={filteredDailyData.reduce((a, d) => a + d.CHAT, 0).toString()}
                            type="emerald"
                        />
                    </div>

                    {/* ── TOP ROW: Line chart + Donut ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Line Chart — 2/3 */}
                        <div className="lg:col-span-2">
                            <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                Sesiones por día
                            </p>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={filteredDailyData}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke={gridColor}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: axisColor, fontSize: 11 }}
                                            interval={period === "7d" ? 0 : 4}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: axisColor, fontSize: 11 }}
                                            allowDecimals={false}
                                            width={30}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: gridColor, strokeWidth: 1.5, strokeDasharray: "4 4" }}
                                            contentStyle={{
                                                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                                                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                                                borderRadius: "10px",
                                                padding: "10px 14px",
                                                fontSize: "13px",
                                            }}
                                            labelStyle={{ fontWeight: 700, marginBottom: 6 }}
                                        />
                                        <Legend
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                                            formatter={(value) =>
                                                TYPE_LABELS[value as keyof typeof TYPE_LABELS] || value
                                            }
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="SPEAKING"
                                            name="SPEAKING"
                                            stroke={TYPE_COLORS.SPEAKING}
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="LISTENING"
                                            name="LISTENING"
                                            stroke={TYPE_COLORS.LISTENING}
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="CHAT"
                                            name="CHAT"
                                            stroke={TYPE_COLORS.CHAT}
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Donut — 1/3 */}
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                Por tipo
                            </p>
                            <div className="h-[260px] relative">
                                {typeData.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                        Sin datos en este período
                                    </div>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={typeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    onMouseEnter={(_, index) => setActiveTypeIndex(index)}
                                                    onMouseLeave={() => setActiveTypeIndex(null)}
                                                    stroke="none"
                                                    cornerRadius={5}
                                                >
                                                    {typeData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                            style={{
                                                                filter:
                                                                    activeTypeIndex === index
                                                                        ? `drop-shadow(0px 4px 10px ${entry.color}88)`
                                                                        : "none",
                                                                opacity:
                                                                    activeTypeIndex === null || activeTypeIndex === index
                                                                        ? 1
                                                                        : 0.4,
                                                            }}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: isDark ? "#0f172a" : "#ffffff",
                                                        borderColor: isDark ? "#1e293b" : "#e2e8f0",
                                                        borderRadius: "10px",
                                                        fontSize: "13px",
                                                    }}
                                                    formatter={(value, name) => [`${value} sesiones`, name]}
                                                />
                                                <Legend
                                                    iconType="circle"
                                                    iconSize={8}
                                                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center label */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: "28px" }}>
                                            <span className="text-2xl font-extrabold text-foreground">
                                                {activeTypeIndex !== null
                                                    ? typeData[activeTypeIndex].value
                                                    : totalSessionsInPeriod}
                                            </span>
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
                                                {activeTypeIndex !== null ? typeData[activeTypeIndex].name : "Total"}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── BOTTOM ROW: Horizontal Bar chart por curso ── */}
                    {courseData.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                Precisión promedio por curso (%)
                            </p>
                            <div className="h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={courseData}
                                        layout="vertical"
                                        margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                                        barSize={18}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                            stroke={gridColor}
                                        />
                                        <XAxis
                                            type="number"
                                            domain={[0, 100]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: axisColor, fontSize: 11 }}
                                            tickFormatter={(v) => `${v}%`}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: axisColor, fontSize: 11 }}
                                            width={110}
                                        />
                                        <Tooltip
                                            cursor={{ fill: isDark ? "#1e293b80" : "#f1f5f980" }}
                                            contentStyle={{
                                                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                                                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                                                borderRadius: "10px",
                                                fontSize: "13px",
                                            }}
                                            formatter={(value: any, name: any, props: any) => [
                                                `${value}% · ${props.payload.sessions} sesiones`,
                                                "Precisión"
                                            ]}
                                        />
                                        <Bar
                                            dataKey="accuracy"
                                            name="Precisión"
                                            radius={[0, 6, 6, 0]}
                                        >
                                            {courseData.map((entry, index) => (
                                                <Cell
                                                    key={`bar-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}

// ── Small helper component ──
const PILL_STYLES = {
    violet: {
        bg: "bg-violet-500/20 dark:bg-violet-950/20",
        border: "border border-violet-500/50 dark:border-violet-500/30",
        text: "text-violet-600 dark:text-violet-400"
    },
    purple: {
        bg: "bg-purple-500/20 dark:bg-purple-950/20",
        border: "border border-purple-500/50 dark:border-purple-500/30",
        text: "text-purple-600 dark:text-purple-400"
    },
    amber: {
        bg: "bg-amber-500/20 dark:bg-amber-950/20",
        border: "border border-amber-500/50 dark:border-amber-500/30",
        text: "text-amber-600 dark:text-amber-400"
    },
    emerald: {
        bg: "bg-emerald-500/20 dark:bg-emerald-950/20",
        border: "border border-emerald-500/50 dark:border-emerald-500/30",
        text: "text-emerald-600 dark:text-emerald-400"
    }
};

function SummaryPill({
    icon,
    label,
    value,
    type,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    type: "violet" | "purple" | "amber" | "emerald";
}) {
    const styles = PILL_STYLES[type];

    return (
        <div className={`flex items-center gap-3 rounded-xl p-3 ${styles.bg} ${styles.border} transition-all duration-300 hover:shadow-sm`}>
            <div className={`${styles.text} shrink-0`}>{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate font-medium">{label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
            </div>
        </div>
    );
}
