"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/components/ThemeProvider";
import { Gamepad2 } from "lucide-react";

interface CourseDataPoint {
    name: string;
    accuracy: number;
    sessions: number;
    color: string;
}

/**
 * Resumen de práctica del Panel de Control (FEAT-16).
 *
 * **Era un bloque de cuatro gráficos y quedó en uno.** Las sesiones por día, el
 * reparto por tipo y el selector 7d/30d se mudaron al panel de uso: son medidas
 * de uso, y allá viven al lado del mosaico que mide lo que el docente publicó.
 *
 * **Se fue también el selector de período, y eso era parte del punto.** Tenía su
 * propio 7d/30d del lado del cliente; en el panel de uso habría convivido con el
 * selector de mes de la pantalla y serían dos relojes discutiendo. Acá quedó
 * fijo en 30 días, que es lo que decía por defecto.
 *
 * Lo que queda mide aprendizaje y no uso, que es la pregunta de esta pantalla.
 */
export function PlaygroundActivityChart({
    courseData,
    totalSessions,
}: {
    courseData: CourseDataPoint[];
    totalSessions: number;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const axisColor = isDark ? "#94a3b8" : "#64748b";
    const gridColor = isDark ? "#334155" : "#e2e8f0";

    return (
        <Card className="p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-xl flex items-center gap-2">
                        <Gamepad2 className="text-violet-500" size={22} />
                        Práctica del Playground
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Precisión promedio por curso en los últimos 30 días.
                    </p>
                </div>

                <div className="shrink-0 rounded-xl bg-violet-500/10 px-4 py-2.5">
                    <p className="text-xs text-muted-foreground">Sesiones · 30 días</p>
                    <p className="text-2xl font-extrabold text-foreground leading-tight tabular-nums">
                        {totalSessions.toLocaleString("es-AR")}
                    </p>
                </div>
            </div>

            {courseData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                    <Gamepad2 size={40} className="text-muted-foreground/30 mb-3" />
                    <p className="font-semibold text-muted-foreground">Sin actividad aún</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Cuando los alumnos completen sesiones de práctica, los datos aparecerán acá.
                    </p>
                </div>
            ) : (
                <div style={{ height: Math.max(courseData.length * 34, 120) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={courseData}
                            layout="vertical"
                            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                            barSize={18}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
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
                                width={150}
                            />
                            <Tooltip
                                cursor={{ fill: isDark ? "#1e293b80" : "#f1f5f980" }}
                                contentStyle={{
                                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                }}
                                formatter={(value, _name, props) => [
                                    `${value}% · ${props.payload.sessions} sesiones`,
                                    "Precisión",
                                ]}
                            />
                            <Bar dataKey="accuracy" name="Precisión" radius={[0, 6, 6, 0]}>
                                {courseData.map((entry, index) => (
                                    <Cell key={`bar-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
}
