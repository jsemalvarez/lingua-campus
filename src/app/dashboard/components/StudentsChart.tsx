"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/Card";

interface CourseData {
    name: string;
    studentCount: number;
    color: string;
}

interface StudentsChartProps {
    data: CourseData[];
    totalActive: number;
}

export function StudentsChart({ data, totalActive }: StudentsChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Si no hay datos, mostramos un estado vacío amable.
    if (!data || data.length === 0 || totalActive === 0) {
        return (
            <Card className="p-6 flex flex-col items-center justify-center h-[400px]">
                <div className="text-muted-foreground w-16 h-16 mb-4 opacity-50">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                    </svg>
                </div>
                <h3 className="font-semibold text-lg">Aún no hay datos</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                    No hay estudiantes activos para graficar.
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-6 col-span-1 md:col-span-2 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700 pointer-events-none" />
            
            <div className="mb-6 relative z-10">
                <h3 className="font-bold text-xl flex items-center gap-2">
                    Distribución de Alumnos
                </h3>
                <p className="text-sm text-muted-foreground">
                    Total: <strong className="text-foreground">{totalActive}</strong> alumnos activos registrados.
                </p>
            </div>

            <div className="h-[350px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80} // Donut shape
                            outerRadius={120}
                            paddingAngle={4}
                            dataKey="studentCount"
                            nameKey="name"
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            stroke="none"
                            cornerRadius={6}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color} 
                                    className="transition-all duration-300"
                                    style={{
                                        filter: activeIndex === index ? `drop-shadow(0px 4px 12px ${entry.color}66)` : 'none',
                                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                                        transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                                        transformOrigin: 'center'
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={{ fill: 'transparent' }}
                            wrapperStyle={{ zIndex: 100, outline: 'none' }}
                        />
                        <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            iconType="circle"
                            formatter={(value, entry: any) => (
                                <span className={`text-sm ${activeIndex === null || entry.payload.name === data[activeIndex]?.name ? 'text-foreground font-medium' : 'text-muted-foreground'} transition-colors`}>
                                    {value}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center text for the donut chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none md:pr-[120px]">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                        {activeIndex !== null ? data[activeIndex].studentCount : totalActive}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">
                        {activeIndex !== null ? "Alumnos" : "Total"}
                    </span>
                </div>
            </div>
        </Card>
    );
}

// Custom tooltip renderer for premium look
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-background/95 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-xl animate-in zoom-in-95 pointer-events-none mt-10 ml-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                    <p className="font-semibold text-sm">{data.name}</p>
                </div>
                <div className="flex flex-col gap-1 text-sm pl-5">
                    <p className="text-muted-foreground">
                        Alumnos: <strong className="text-foreground">{data.studentCount}</strong>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};
