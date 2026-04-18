"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface PerformanceData {
  date: string;
  score: number;
  topic: string;
}

interface StudentPerformanceChartProps {
  data: any[];
}

export function StudentPerformanceChart({ data }: StudentPerformanceChartProps) {
  // Procesar los datos de calificaciones para el gráfico
  // Como el usuario pidió promedio estático, aquí también usaremos algo que se vea bien
  // pero intentaremos usar los datos reales si existen.
  
  const chartData = data.length > 0 
    ? data.slice().reverse().map(g => ({
        name: g.lesson.topic,
        score: parseFloat(g.score) || 0,
        fullDate: new Date(g.createdAt).toLocaleDateString()
      }))
    : [
        { name: 'Lun', score: 65 },
        { name: 'Mar', score: 75 },
        { name: 'Mié', score: 70 },
        { name: 'Jue', score: 85 },
        { name: 'Vie', score: 80 },
        { name: 'Sáb', score: 90 },
      ];

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--c-primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--c-primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            dy={10}
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                       {payload[0].payload.fullDate || 'Sesión'}
                    </p>
                    <p className="text-sm font-bold text-white">
                      {payload[0].value}% Maestría
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="var(--c-primary)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorScore)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
