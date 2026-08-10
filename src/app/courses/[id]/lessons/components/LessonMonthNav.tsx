import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    courseId: string;
    /** Meses con clases, ordenados cronológicamente. `key` con formato "YYYY-MM". */
    months: { key: string; count: number }[];
    selectedMonth: string;
    /** Mes que contiene el día de hoy, sólo si tiene clases cargadas. */
    todayMonth: string | null;
}

function monthLabel(key: string): string {
    const [year, month] = key.split("-").map(Number);
    // Mediodía UTC para que el formateo no se corra de mes por zona horaria
    return format(new Date(Date.UTC(year, month - 1, 1, 12)), "MMM yyyy", { locale: es });
}

export function LessonMonthNav({ courseId, months, selectedMonth, todayMonth }: Props) {
    if (months.length <= 1) return null;

    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 min-w-0 overflow-x-auto">
                <div className="flex items-center gap-1.5 w-max pb-1">
                    {months.map(({ key, count }) => {
                        const isActive = key === selectedMonth;
                        return (
                            <Link
                                key={key}
                                href={`/courses/${courseId}?mes=${key}`}
                                scroll={false}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border whitespace-nowrap",
                                    isActive
                                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                        : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <span className="capitalize">{monthLabel(key)}</span>
                                <span className="ml-1.5 opacity-60 font-semibold">{count}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {todayMonth && todayMonth !== selectedMonth && (
                <Link
                    href={`/courses/${courseId}?mes=${todayMonth}`}
                    scroll={false}
                    title="Ir al mes actual"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border/60 bg-background hover:bg-muted transition-colors whitespace-nowrap"
                >
                    <CalendarDays size={14} />
                    Hoy
                </Link>
            )}
        </div>
    );
}
