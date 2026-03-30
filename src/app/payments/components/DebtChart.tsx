"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DebtChartProps {
  historicalDebt: number;
  currentMonthDebt: number;
}

export function DebtChart({ historicalDebt, currentMonthDebt }: DebtChartProps) {
  const total = historicalDebt + currentMonthDebt;
  
  const data = [
    { name: 'Histórico', value: historicalDebt, color: '#e11d48' }, // rose-600
    { name: 'Mes Actual', value: currentMonthDebt, color: '#f59e0b' }, // amber-500
  ];

  const historicalPercentage = total > 0 
    ? Math.round((historicalDebt / total) * 100) 
    : 0;

  return (
    <div className="h-40 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: any) => [`$${(value || 0).toLocaleString()}`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-xl font-black text-rose-600">{historicalPercentage}%</span>
        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Mora Hist.</span>
      </div>
    </div>
  );
}
