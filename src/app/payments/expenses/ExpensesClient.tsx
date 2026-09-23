"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Calendar, Tag, ArrowDownLeft, Receipt } from "lucide-react";
import dayjs from "dayjs";
import { formatCurrency, getMonthName } from "@/lib/utils";

type ExpenseRow = {
    id: string;
    date: string;
    category: string;
    description: string;
    recipientName: string | null;
    ticketNumber: string | null;
    amount: number;
    status: string;
    operatorName: string;
};

const CATEGORY_LABELS: Record<string, string> = {
    Payroll: "Sueldos",
    ALQUILER: "Alquiler / Expensas",
    SERVICIOS: "Servicios",
    MANTENIMIENTO: "Mantenimiento / Limpieza",
    MATERIALES: "Material Didáctico",
    PUBLICIDAD: "Publicidad / Marketing",
    OTROS: "Otros"
};

// Lo que no está en el mapa se muestra tal cual está en la base. Es preferible
// un `NOMINA` crudo en pantalla a esconder un gasto que existe. Ver FEAT-31.
const labelFor = (category: string) => CATEGORY_LABELS[category] ?? category;

export function ExpensesClient({
    rows,
    year,
    month,
    category,
    categories
}: {
    rows: ExpenseRow[];
    year: number;
    month: number;
    category: string | null;
    categories: string[];
}) {
    const router = useRouter();
    const pathname = usePathname();

    const years: number[] = [];
    const thisYear = new Date().getFullYear();
    for (let y = thisYear - 2; y <= thisYear + 1; y++) years.push(y);

    const applyFilter = (next: { year?: number; month?: number; category?: string | null }) => {
        const params = new URLSearchParams();
        // El período siempre viaja completo en la URL: el total que se muestra
        // es el de un período, y un link a medias mostraría otro número.
        params.set("year", String(next.year ?? year));
        params.set("month", String(next.month ?? month));
        const nextCategory = next.category !== undefined ? next.category : category;
        if (nextCategory) params.set("category", nextCategory);
        router.push(`${pathname}?${params.toString()}`);
    };

    const periodLabel = month ? `${getMonthName(month)} ${year}` : `todo ${year}`;

    // Ordenadas por lo que se lee y no por el valor de la base: `Payroll` cae
    // entre `OTROS` y `PUBLICIDAD`, y en pantalla eso pone «Sueldos» en medio de
    // la lista sin ninguna razón visible.
    const categoryOptions = [...categories].sort((a, b) => labelFor(a).localeCompare(labelFor(b), "es"));

    // Los anulados se listan pero no suman: el total tiene que poder compararse
    // contra la tarjeta "Gastos Operativos", que también los deja afuera.
    const valid = rows.filter((r) => r.status !== "VOIDED");
    const voided = rows.filter((r) => r.status === "VOIDED");
    const total = valid.reduce((acc, r) => acc + r.amount, 0);
    const voidedTotal = voided.reduce((acc, r) => acc + r.amount, 0);

    const byCategory = Array.from(
        valid.reduce((map, r) => {
            const prev = map.get(r.category) ?? { count: 0, amount: 0 };
            map.set(r.category, { count: prev.count + 1, amount: prev.amount + r.amount });
            return map;
        }, new Map<string, { count: number; amount: number }>())
    ).sort((a, b) => b[1].amount - a[1].amount);

    return (
        <>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-border/60 rounded-xl px-3 py-2 shadow-sm font-semibold text-sm">
                    <Tag size={14} className="text-muted-foreground" />
                    <select
                        value={category ?? ""}
                        onChange={(e) => applyFilter({ category: e.target.value || null })}
                        className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1"
                    >
                        <option value="" className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                            Todas las categorías
                        </option>
                        {categoryOptions.map((c) => (
                            <option key={c} value={c} className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                                {labelFor(c)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-border/60 rounded-xl px-3 py-2 shadow-sm font-semibold text-sm">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground whitespace-nowrap">Gastos de</span>
                    <span className="text-border">|</span>
                    <select
                        value={month}
                        onChange={(e) => applyFilter({ month: parseInt(e.target.value, 10) })}
                        className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1"
                    >
                        <option value={0} className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                            Todo el año
                        </option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m} className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                                {getMonthName(m)}
                            </option>
                        ))}
                    </select>
                    <span className="text-border">|</span>
                    <select
                        value={year}
                        onChange={(e) => applyFilter({ year: parseInt(e.target.value, 10) })}
                        className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1"
                    >
                        {years.map((y) => (
                            <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-foreground font-semibold font-sans">
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Total del período */}
            <Card className="p-6 border-border/40 border-l-4 border-l-rose-500 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Total de {periodLabel}
                            {category ? ` · ${labelFor(category)}` : ""}
                        </p>
                        <h2 className="text-3xl font-bold tracking-tight mt-1 text-rose-600">
                            ${formatCurrency(total)}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {valid.length === 0
                                ? "Sin gastos en el período"
                                : `${valid.length} ${valid.length === 1 ? "gasto" : "gastos"}`}
                            {voided.length > 0 && (
                                <>
                                    {" · "}
                                    <span className="text-amber-600">
                                        {voided.length} {voided.length === 1 ? "anulado" : "anulados"} por $
                                        {formatCurrency(voidedTotal)}, que no suman
                                    </span>
                                </>
                            )}
                        </p>
                    </div>

                    {byCategory.length > 0 && (
                        <div className="w-full sm:w-64 space-y-1.5">
                            {byCategory.map(([cat, data]) => (
                                <div key={cat}>
                                    <div className="flex justify-between items-baseline text-xs gap-2">
                                        <span className="text-muted-foreground truncate" title={labelFor(cat)}>
                                            {labelFor(cat)}
                                            <span className="text-muted-foreground/60"> ({data.count})</span>
                                        </span>
                                        <span className="font-semibold tabular-nums whitespace-nowrap">
                                            ${formatCurrency(data.amount)}
                                        </span>
                                    </div>
                                    <div className="h-1 rounded-full bg-muted mt-0.5">
                                        <div
                                            className="h-1 rounded-full bg-rose-500/70"
                                            style={{ width: `${total > 0 ? (data.amount / total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Detalle */}
            <Card className="border-border/40 overflow-hidden">
                {rows.length === 0 ? (
                    <div className="py-16 text-center">
                        <ArrowDownLeft className="mx-auto text-muted-foreground/40 mb-3" size={32} />
                        <p className="text-sm font-semibold text-muted-foreground">
                            {category
                                ? `No hay gastos de ${labelFor(category)} en ${periodLabel}.`
                                : `No hay gastos cargados en ${periodLabel}.`}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/60 text-left">
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Fecha</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoría</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Concepto</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">Importe</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Cargó</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => {
                                    const isVoided = r.status === "VOIDED";
                                    return (
                                        <tr
                                            key={r.id}
                                            className={`border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors align-top ${isVoided ? "opacity-50" : ""}`}
                                        >
                                            {/* La fecha se corta del ISO y no se convierte a hora local: el
                                                gasto se guarda como medianoche UTC, y en Argentina eso es
                                                el día anterior a las 21:00. Es el mismo recorte que hace la
                                                tabla del libro mayor. */}
                                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                {dayjs(r.date.split("T")[0]).format("DD/MM/YYYY")}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                                    {labelFor(r.category)}
                                                </span>
                                            </td>
                                            {/* Concepto, destinatario y ticket son texto libre: envuelven y
                                                tienen ancho máximo, que es lo que evita que empujen el
                                                importe fuera de la pantalla — ver BUG-10. */}
                                            <td className="px-4 py-3 max-w-[20rem] break-words">
                                                <span className={`font-medium ${isVoided ? "line-through" : ""}`}>{r.description}</span>
                                                {(r.recipientName || r.ticketNumber || isVoided) && (
                                                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                                                        {r.recipientName && <span>Para: {r.recipientName}</span>}
                                                        {r.ticketNumber && (
                                                            <span className="bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">
                                                                TKT: {r.ticketNumber}
                                                            </span>
                                                        )}
                                                        {isVoided && (
                                                            <span className="text-rose-500 border border-rose-500 px-1.5 py-0.5 rounded text-[10px]">
                                                                ANULADO
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-black whitespace-nowrap text-rose-600 ${isVoided ? "line-through" : ""}`}>
                                                ${formatCurrency(r.amount)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{r.operatorName}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <p className="text-xs text-muted-foreground mt-4 flex items-start gap-2">
                <Receipt size={14} className="mt-0.5 shrink-0" />
                Los gastos se cargan desde Finanzas, y los sueldos desde «Pago de Sueldos». La fecha
                que se lista es la del gasto —la del ticket, si se cargó—, no la del día en que se
                registró.
            </p>
        </>
    );
}
