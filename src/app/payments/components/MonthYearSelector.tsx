'use client';

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar } from "lucide-react";

interface MonthYearSelectorProps {
    currentMonth: number;
    currentYear: number;
}

export function MonthYearSelector({ currentMonth, currentYear }: MonthYearSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const years: number[] = [];
    const activeYear = new Date().getFullYear();
    // Permitir seleccionar desde 2 años anteriores hasta 1 año futuro
    for (let y = activeYear - 2; y <= activeYear + 1; y++) {
        years.push(y);
    }

    const handleChange = (newMonth: number, newYear: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", newMonth.toString());
        params.set("year", newYear.toString());
        // Resetear la paginación al cambiar de mes para evitar desbordamientos
        params.delete("page"); 
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-border/60 rounded-xl px-3 py-2 shadow-sm font-semibold text-sm">
            <span className="text-muted-foreground whitespace-nowrap">Métricas de</span>
            <span className="text-border">|</span>
            <select
                value={currentMonth}
                onChange={(e) => handleChange(parseInt(e.target.value, 10), currentYear)}
                className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1"
            >
                {months.map((m, idx) => (
                    <option key={idx} value={idx + 1} className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                        {m}
                    </option>
                ))}
            </select>
            <span className="text-border">|</span>
            <select
                value={currentYear}
                onChange={(e) => handleChange(currentMonth, parseInt(e.target.value, 10))}
                className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1"
            >
                {years.map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                        {y}
                    </option>
                ))}
            </select>
        </div>
    );
}
