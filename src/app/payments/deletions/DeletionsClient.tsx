"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import { formatCurrency, getMonthName } from "@/lib/utils";

type DeletionRow = {
    id: string;
    deletedAt: string;
    studentId: string;
    studentName: string;
    feeLabel: string;
    courseName: string | null;
    amount: number;
    reason: string;
    operatorName: string;
};

export function DeletionsClient({ rows, year, month }: { rows: DeletionRow[]; year: number | null; month: number | null }) {
    const router = useRouter();
    const pathname = usePathname();

    const years: number[] = [];
    const thisYear = new Date().getFullYear();
    for (let y = thisYear - 2; y <= thisYear + 1; y++) years.push(y);

    const applyFilter = (newYear: number | null, newMonth: number | null) => {
        const params = new URLSearchParams();
        if (newYear) params.set("year", newYear.toString());
        // El mes sin año no significa nada: el selector de mes queda deshabilitado
        // mientras el año esté en "Todos".
        if (newYear && newMonth) params.set("month", newMonth.toString());
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    };

    const total = rows.reduce((acc, r) => acc + r.amount, 0);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <p className="text-sm text-muted-foreground">
                    {rows.length === 0 ? (
                        "Sin eliminaciones en el período"
                    ) : (
                        <>
                            <span className="font-bold text-foreground">{rows.length}</span>
                            {rows.length === 1 ? " cuota eliminada" : " cuotas eliminadas"}
                            {" · "}
                            <span className="font-bold text-foreground">${formatCurrency(total)}</span> de deuda
                            dada de baja
                        </>
                    )}
                </p>

                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-border/60 rounded-xl px-3 py-2 shadow-sm font-semibold text-sm">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground whitespace-nowrap">Eliminadas en</span>
                    <span className="text-border">|</span>
                    <select
                        value={year ?? ""}
                        onChange={(e) => applyFilter(e.target.value ? parseInt(e.target.value, 10) : null, month)}
                        className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1"
                    >
                        <option value="" className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                            Todos los años
                        </option>
                        {years.map((y) => (
                            <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                                {y}
                            </option>
                        ))}
                    </select>
                    <span className="text-border">|</span>
                    <select
                        value={month ?? ""}
                        disabled={!year}
                        onChange={(e) => applyFilter(year, e.target.value ? parseInt(e.target.value, 10) : null)}
                        className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <option value="" className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                            Todo el año
                        </option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m} className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                                {getMonthName(m)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <Card className="border-border/40 overflow-hidden">
                {rows.length === 0 ? (
                    <div className="py-16 text-center">
                        <Trash2 className="mx-auto text-muted-foreground/40 mb-3" size={32} />
                        <p className="text-sm font-semibold text-muted-foreground">
                            {year ? "No se eliminó ninguna cuota en el período elegido." : "Todavía no se eliminó ninguna cuota."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/60 text-left">
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Fecha</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alumno</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cuota</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">Importe</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Eliminó</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors align-top">
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            {dayjs(r.deletedAt).format("DD/MM/YYYY HH:mm")}
                                        </td>
                                        <td className="px-4 py-3 font-semibold">
                                            <Link href={`/students/${r.studentId}`} className="hover:text-primary transition-colors">
                                                {r.studentName}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium">{r.feeLabel}</span>
                                            {r.courseName && (
                                                <span className="block text-xs text-muted-foreground">{r.courseName}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black whitespace-nowrap text-rose-600">
                                            ${formatCurrency(r.amount)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{r.operatorName}</td>
                                        {/* El motivo es texto libre: envuelve y tiene ancho máximo. Sin eso
                                            empuja las columnas de la derecha fuera del scroll y parece que
                                            desaparecieron los datos — es lo que pasó en BUG-10. */}
                                        <td className="px-4 py-3 text-muted-foreground max-w-[18rem] break-words">{r.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </>
    );
}
