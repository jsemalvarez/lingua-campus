"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface GuardianAttendanceChartProps {
    recentAttendances: any[];
}

export function GuardianAttendanceChart({ recentAttendances }: GuardianAttendanceChartProps) {
    if (recentAttendances.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground italic">No hay suficientes datos de asistencia.</p>
            </div>
        );
    }

    // Calcular estadísticas
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let justifiedCount = 0;

    recentAttendances.forEach(att => {
        if (att.status === "PRESENT") presentCount++;
        else if (att.status === "ABSENT") absentCount++;
        else if (att.status === "LATE") lateCount++;
        else if (att.status === "JUSTIFIED") justifiedCount++;
    });

    const data = [];
    if (presentCount > 0) data.push({ name: "Presente", value: presentCount, color: "#10b981" }); // Emerald
    if (lateCount > 0) data.push({ name: "Tarde", value: lateCount, color: "#f59e0b" }); // Amber
    if (justifiedCount > 0) data.push({ name: "Justificado", value: justifiedCount, color: "#3b82f6" }); // Blue
    if (absentCount > 0) data.push({ name: "Ausente", value: absentCount, color: "#ef4444" }); // Red

    const total = recentAttendances.length;
    const rate = Math.round(((presentCount + lateCount) / total) * 100);

    return (
        <div className="relative h-full w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        animationBegin={200}
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', backgroundColor: '#1e293b', color: '#f8fafc' }}
                        itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px', color: '#cbd5e1' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Texto Central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                <span className="text-2xl font-black text-slate-50">{rate}%</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Asistencia</span>
            </div>
        </div>
    );
}
