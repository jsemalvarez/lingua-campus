"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import {
    AlertTriangle, Phone, Calendar, User, Clock,
    Search, X, ChevronLeft, ChevronRight, FileDown,
    ArrowUpDown, ArrowUp, ArrowDown, CalendarCheck, CalendarClock,
} from "lucide-react";
import { PendingFeeActions } from "./PendingFeeActions";
import { getMonthName } from "@/lib/utils";

const PAGE_SIZE = 10;

type DebtorMonth = {
    feeId: string;
    label: string;
    isCurrent: boolean;
    amount: number;
    isPaid: boolean;
    month: number;
    year: number;
};

type DebtorSummary = {
    name: string;
    phone: string | null;
    totalOwed: number;
    currentMonthOwed: number;
    previousMonthsOwed: number;
    months: DebtorMonth[];
};

type Props = {
    summaryList: DebtorSummary[];
    currentMonthLabel: string;
    currentMonth: number;
    currentYear: number;
};

export function DebtorsClient({ summaryList, currentMonthLabel, currentMonth, currentYear }: Props) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [sortField, setSortField] = useState<"name" | "debt">("debt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    // ── Filtro por período ────────────────────────────────────────────────────
    // `null` es "todos los períodos" y es el estado de entrada a propósito: es la
    // única vista donde se ven las matrículas y los derechos de examen, que van
    // con `month = 0` (FIN-12, FIN-17) y no caen en ningún mes del selector.
    // Arrancar con el mes actual puesto dejaría esa deuda invisible para quien
    // trabaje siempre filtrando.
    const [filterMonth, setFilterMonth] = useState<number | null>(null);
    const [filterYear, setFilterYear] = useState<number>(currentYear);

    const period = filterMonth ? { month: filterMonth, year: filterYear } : null;
    const periodLabel = period ? `${getMonthName(period.month)} ${period.year}` : "";
    // Un mes que todavía no llegó no es un mes sin deuda: puede tener cuotas
    // emitidas que no se pueden reclamar. La pantalla lo dice distinto.
    const isFuturePeriod = !!period && (period.year > currentYear || (period.year === currentYear && period.month > currentMonth));

    const changePeriod = (month: number | null, year: number) => {
        setFilterMonth(month);
        setFilterYear(year);
        setPage(1);
    };

    // Sólo hasta el año en curso: en un año futuro no puede haber deuda vencida.
    const years = Array.from({ length: 3 }, (_, i) => currentYear - 2 + i);

    const toggleSort = (field: "name" | "debt") => {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir(field === "debt" ? "desc" : "asc");
        }
        setPage(1);
    };

    const SortIcon = ({ field }: { field: "name" | "debt" }) => {
        if (sortField !== field) return <ArrowUpDown size={13} className="opacity-40" />;
        return sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
    };

    // ── Exportar PDF ──────────────────────────────────────────────────────────
    const exportPdf = async () => {
        setExporting(true);
        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");

            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW = doc.internal.pageSize.getWidth();
            const now = new Date();
            const dateStr = now.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

            // ── Encabezado ────────────────────────────────────────────────────
            doc.setFillColor(220, 38, 38); // rose-600
            doc.rect(0, 0, pageW, 22, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(255, 255, 255);
            // El título dice el recorte. Un PDF filtrado por junio que se llame
            // "Reporte de Deudores" se lee como el reporte completo del instituto.
            doc.text(period ? `Deudores de ${periodLabel}` : "Reporte de Deudores", 14, 10);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`Lingua Campus · Generado el ${dateStr}`, 14, 17);
            if (search) {
                doc.text(`Filtro activo: "${search}"`, pageW - 14, 17, { align: "right" });
            }

            // ── Totales ───────────────────────────────────────────────────────
            const totalHistorical = filtered.reduce((a, s) => a + s.previousMonthsOwed, 0);
            const totalCurrent    = filtered.reduce((a, s) => a + s.currentMonthOwed,   0);
            const totalAll        = filtered.reduce((a, s) => a + s.totalOwed,           0);

            doc.setTextColor(30, 30, 30);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(period ? `Resumen de ${periodLabel}` : "Resumen de deudas", 14, 30);

            autoTable(doc, {
                startY: 33,
                head: period
                    ? [[`Deuda de ${periodLabel}`, "Deudores"]]
                    : [["Mora Histórica", `Pendiente ${getMonthName(currentMonth)}`, "Deuda Total Global"]],
                body: period
                    ? [[`$${totalAll.toLocaleString()}`, `${filtered.length}`]]
                    : [[
                        `$${totalHistorical.toLocaleString()}`,
                        `$${totalCurrent.toLocaleString()}`,
                        `$${totalAll.toLocaleString()}`,
                    ]],
                theme: "grid",
                headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold", fontSize: 8 },
                bodyStyles: { fontSize: 9, fontStyle: "bold" },
                columnStyles: period ? { 0: { textColor: [220, 38, 38] } } : { 2: { textColor: [220, 38, 38] } },
                margin: { left: 14, right: 14 },
            });

            // Con período elegido el PDF no lleva la deuda total del alumno, igual
            // que la pantalla. Dicho en el papel para que nadie lo lea como el
            // saldo completo.
            if (period) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(110);
                doc.text(
                    `Sólo las cuotas de ${periodLabel}. Estos alumnos pueden tener deuda de otros períodos.`,
                    14,
                    (doc as any).lastAutoTable.finalY + 4
                );
                doc.setTextColor(30, 30, 30);
            }

            // ── Listado de deudores ───────────────────────────────────────────
            const afterSummary = (doc as any).lastAutoTable.finalY + (period ? 12 : 8);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(`Detalle por alumno (${filtered.length} ${filtered.length === 1 ? "deudor" : "deudores"})`, 14, afterSummary);

            // Las columnas de mora, mes en curso y total no aplican al recorte por
            // período: ahí cada alumno tiene un solo número, el de su cuota.
            const rows = period
                ? filtered.map((s) => [
                    s.name,
                    s.phone || "—",
                    s.months.map((m) => m.label).join("\n"),
                    `$${s.totalOwed.toLocaleString()}`,
                ])
                : filtered.map((s) => [
                    s.name,
                    s.phone || "—",
                    `$${s.previousMonthsOwed.toLocaleString()}`,
                    `$${s.currentMonthOwed.toLocaleString()}`,
                    `$${s.totalOwed.toLocaleString()}`,
                    s.months.map((m) => `${m.label}: $${m.amount.toLocaleString()}`).join("\n"),
                ]);

            autoTable(doc, {
                startY: afterSummary + 3,
                head: period
                    ? [["Alumno", "Teléfono", "Cuota", "Importe"]]
                    : [["Alumno", "Teléfono", "Mora histórica", getMonthName(currentMonth), "Deuda total", "Cuotas pendientes"]],
                body: rows,
                theme: "striped",
                headStyles: { fillColor: [51, 51, 51], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
                bodyStyles: { fontSize: 7.5, valign: "top" },
                columnStyles: period
                    ? {
                        0: { fontStyle: "bold", cellWidth: 45 },
                        1: { cellWidth: 30 },
                        2: { cellWidth: "auto" },
                        3: { cellWidth: 26, fontStyle: "bold", textColor: [190, 18, 60] },
                    }
                    : {
                        0: { fontStyle: "bold", cellWidth: 36 },
                        1: { cellWidth: 24 },
                        2: { cellWidth: 22, textColor: [190, 18, 60] },
                        3: { cellWidth: 22 },
                        4: { cellWidth: 22, fontStyle: "bold", textColor: [190, 18, 60] },
                        5: { cellWidth: "auto" },
                    },
                margin: { left: 14, right: 14 },
                didDrawPage: (data: any) => {
                    // Pie de página
                    const pageCount = (doc as any).internal.getNumberOfPages();
                    doc.setFontSize(7);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(150);
                    doc.text(
                        `Página ${data.pageNumber} de ${pageCount}`,
                        pageW / 2,
                        doc.internal.pageSize.getHeight() - 8,
                        { align: "center" }
                    );
                },
            });

            doc.save(
                period
                    ? `deudores_${getMonthName(period.month).toLowerCase()}-${period.year}_${now.toISOString().slice(0, 10)}.pdf`
                    : `deudores_${now.toISOString().slice(0, 10)}.pdf`
            );
        } finally {
            setExporting(false);
        }
    };

    // ── Recorte por período ───────────────────────────────────────────────────
    // El filtro es fuerte: con un mes elegido, el alumno queda listado sólo si
    // debe *ese* mes, y lo que se muestra es lo que debe de ese mes, no su deuda
    // total. La lista contesta "a quién le reclamo junio"; la deuda completa se
    // ve volviendo a "Todos los períodos".
    const viewList = useMemo(() => {
        if (!period) return summaryList;
        return summaryList.reduce<DebtorSummary[]>((acc, s) => {
            const months = s.months.filter((m) => m.month === period.month && m.year === period.year);
            if (months.length === 0) return acc;
            const owed = months.reduce((a, m) => a + m.amount, 0);
            acc.push({ ...s, months, totalOwed: owed, currentMonthOwed: 0, previousMonthsOwed: 0 });
            return acc;
        }, []);
    }, [summaryList, period?.month, period?.year]);

    // ── Filtrado + Ordenamiento ───────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q ? viewList.filter((s) => s.name.toLowerCase().includes(q)) : [...viewList];
        list.sort((a, b) => {
            if (sortField === "name") {
                return sortDir === "asc"
                    ? a.name.localeCompare(b.name, "es")
                    : b.name.localeCompare(a.name, "es");
            }
            // Con un período elegido, `totalOwed` es lo que se debe de ese mes:
            // el orden es por el valor de esa cuota, que no es el mismo en todos
            // los cursos.
            return sortDir === "asc" ? a.totalOwed - b.totalOwed : b.totalOwed - a.totalOwed;
        });
        return list;
    }, [search, viewList, sortField, sortDir]);

    // Resetear a página 1 cuando cambia la búsqueda
    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    // ── Paginación ────────────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

    // Rango de páginas visible (máx 5 botones)
    const pageRange = useMemo(() => {
        const delta = 2;
        const start = Math.max(1, safePage - delta);
        const end = Math.min(totalPages, safePage + delta);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [safePage, totalPages]);

    // ── Totales sobre la lista filtrada (no paginada) ─────────────────────────
    const totalHistorical = filtered.reduce((acc, s) => acc + s.previousMonthsOwed, 0);
    const totalCurrent    = filtered.reduce((acc, s) => acc + s.currentMonthOwed, 0);
    const totalAll        = filtered.reduce((acc, s) => acc + s.totalOwed, 0);

    return (
        <>
            {/* ── Resumen del período elegido ───────────────────────────────── */}
            {/* Con filtro puesto, las tres tarjetas no aplican: las dos primeras
                se calculan contra el mes en curso y la tercera es la deuda total,
                que esta vista no muestra. Una sola tarjeta, con otro título y
                otra forma, es la señal de que se está mirando un recorte. */}
            {summaryList.length > 0 && period && (
                <Card className="p-5 mb-6 border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                Deuda de {periodLabel}
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Sólo las cuotas de este mes. No incluye lo que estos alumnos deban de otros períodos.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-black text-primary">${totalAll.toLocaleString()}</h2>
                            <p className="text-[10px] text-muted-foreground">Total del mes</p>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground">{filtered.length}</h2>
                            <p className="text-[10px] text-muted-foreground">
                                {filtered.length === 1 ? "deudor" : "deudores"}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* ── Summary cards ─────────────────────────────────────────────── */}
            {summaryList.length > 0 && !period && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card className="p-5 border-rose-200 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10">
                        <div className="flex items-center gap-3 mb-2 text-rose-600">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                                <Clock size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Mora Histórica</span>
                        </div>
                        <h2 className="text-2xl font-black text-rose-600">${totalHistorical.toLocaleString()}</h2>
                        <p className="text-[10px] text-muted-foreground mt-1">Total acumulado de meses anteriores</p>
                    </Card>

                    <Card className="p-5 border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10">
                        <div className="flex items-center gap-3 mb-2 text-amber-600">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                                <Calendar size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Pendiente de {getMonthName(currentMonth)}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-amber-600">${totalCurrent.toLocaleString()}</h2>
                        <p className="text-[10px] text-muted-foreground mt-1">Saldo por cobrar del mes en curso</p>
                    </Card>

                    <Card className="p-5 border-rose-600 bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20">
                        <div className="flex items-center gap-3 mb-2 text-rose-100">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <AlertTriangle size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Deuda Total Global</span>
                        </div>
                        <h2 className="text-2xl font-black">${totalAll.toLocaleString()}</h2>
                        <p className="text-[10px] text-rose-100/70 mt-1">Suma total de deudas en el instituto</p>
                    </Card>
                </div>
            )}

            {/* ── Filtro de período ─────────────────────────────────────────── */}
            {/* Los doce meses, tengan deuda o no: un mes que falta en la lista se
                lee como una pantalla rota, y uno vacío que contesta "sin deudas"
                contesta la pregunta. */}
            {summaryList.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-border/60 rounded-xl px-3 py-2 shadow-sm font-semibold text-sm">
                        <Calendar size={15} className="text-muted-foreground shrink-0" />
                        <select
                            value={filterMonth ?? ""}
                            onChange={(e) => changePeriod(e.target.value ? parseInt(e.target.value, 10) : null, filterYear)}
                            className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-foreground pr-1"
                            aria-label="Filtrar por mes"
                        >
                            <option value="" className="bg-white dark:bg-zinc-900 text-foreground font-semibold">
                                Todos los períodos
                            </option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m} className="bg-white dark:bg-zinc-900 text-foreground font-semibold">
                                    {getMonthName(m)}
                                </option>
                            ))}
                        </select>
                        <span className="text-border">|</span>
                        <select
                            value={filterYear}
                            disabled={!period}
                            onChange={(e) => changePeriod(filterMonth, parseInt(e.target.value, 10))}
                            className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-foreground pr-1 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Filtrar por año"
                        >
                            {years.map((y) => (
                                <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-foreground font-semibold">
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    {period && (
                        <button
                            onClick={() => changePeriod(null, currentYear)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                        >
                            <X size={13} />
                            Ver todos los períodos
                        </button>
                    )}
                </div>
            )}

            {/* ── Buscador + Exportar PDF ───────────────────────────────────── */}
            {summaryList.length > 0 && (
                <div className="flex gap-3 mb-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={16} className="text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar deudor por nombre…"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                        />
                        {search && (
                            <button
                                onClick={() => handleSearch("")}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Limpiar búsqueda"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={exportPdf}
                        disabled={exporting || filtered.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <FileDown size={16} />
                        {exporting ? "Generando…" : "Exportar PDF"}
                    </button>
                </div>
            )}

            {/* ── Ordenamiento ─────────────────────────────────────────────── */}
            {summaryList.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-muted-foreground font-medium mr-1">Ordenar:</span>
                    <button
                        onClick={() => toggleSort("name")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            sortField === "name"
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "border-border text-foreground hover:bg-muted/60"
                        }`}
                    >
                        <SortIcon field="name" />
                        Nombre
                    </button>
                    <button
                        onClick={() => toggleSort("debt")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            sortField === "debt"
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "border-border text-foreground hover:bg-muted/60"
                        }`}
                    >
                        <SortIcon field="debt" />
                        {period ? `Valor de la cuota de ${getMonthName(period.month)}` : "Monto de deuda"}
                    </button>
                </div>
            )}

            {/* ── Info de resultados y paginación ───────────────────────────── */}
            {summaryList.length > 0 && (
                <div className="flex items-center justify-between mb-6 min-h-[24px]">
                    <p className="text-xs text-muted-foreground">
                        {filtered.length === 0
                            ? "Sin resultados para esa búsqueda."
                            : search
                                ? `${filtered.length} ${filtered.length === 1 ? "deudor encontrado" : "deudores encontrados"}`
                                : period
                                    ? `${filtered.length} ${filtered.length === 1 ? "deudor" : "deudores"} de ${periodLabel}`
                                    : `${filtered.length} ${filtered.length === 1 ? "deudor" : "deudores"} en total`}
                    </p>
                    {filtered.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Página {safePage} de {totalPages}
                        </p>
                    )}
                </div>
            )}

            {/* ── Cards de deudores ─────────────────────────────────────────── */}
            <div className="grid gap-8">
                {summaryList.length === 0 ? (
                    <Card className="p-20 text-center flex flex-col items-center justify-center border-dashed bg-muted/10">
                        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <User size={32} />
                        </div>
                        <h2 className="text-xl font-bold">Sin deudas pendientes</h2>
                        <p className="text-muted-foreground mt-2 max-w-xs">¡Excelente! Todos los alumnos están al día con sus pagos.</p>
                    </Card>
                ) : period && viewList.length === 0 ? (
                    /* Un mes sin deuda y un mes que todavía no llegó no son lo
                       mismo, y no pueden decir lo mismo: el segundo puede tener
                       cuotas emitidas que no se reclaman todavía. */
                    isFuturePeriod ? (
                        <Card className="p-16 text-center flex flex-col items-center justify-center border-dashed bg-muted/10">
                            <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mb-4">
                                <CalendarClock size={26} className="text-muted-foreground" />
                            </div>
                            <h2 className="text-lg font-bold">{periodLabel} todavía no venció</h2>
                            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                                Puede haber cuotas emitidas para ese mes, pero no son deuda hasta que el mes llegue.
                                Este reporte sólo lista lo que ya se puede reclamar.
                            </p>
                        </Card>
                    ) : (
                        <Card className="p-16 text-center flex flex-col items-center justify-center border-dashed bg-muted/10">
                            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <CalendarCheck size={26} />
                            </div>
                            <h2 className="text-lg font-bold">Sin deudas de {periodLabel}</h2>
                            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                                Ningún alumno debe la cuota de ese mes. Puede haber deuda de otros períodos:
                                mirala en «Todos los períodos».
                            </p>
                        </Card>
                    )
                ) : filtered.length === 0 ? (
                    <Card className="p-16 text-center flex flex-col items-center justify-center border-dashed bg-muted/10">
                        <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Search size={26} className="text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-bold">Sin resultados</h2>
                        <p className="text-muted-foreground mt-1 max-w-xs text-sm">
                            No se encontró ningún deudor con ese nombre. Intentá con otro término.
                        </p>
                    </Card>
                ) : (
                    paginated.map((s, i) => (
                        <Card key={i} className="overflow-hidden border-border/40 hover:shadow-xl transition-all duration-300">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-4 rounded-2xl text-primary font-bold shadow-sm">
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight">{s.name}</h3>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <Phone size={14} className="text-primary/60" />
                                                    {s.phone || "Sin teléfono"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {/* Con período elegido, las tres cajas serían el mismo
                                            número: lo que este alumno debe de ese mes. */}
                                        {period && (
                                            <div className="bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-rose-200 dark:shadow-rose-900/20 text-center min-w-[160px]">
                                                <p className="text-[10px] uppercase font-black text-rose-100 tracking-tighter mb-1">
                                                    Debe de {periodLabel}
                                                </p>
                                                <h4 className="text-xl font-black">${s.totalOwed.toLocaleString()}</h4>
                                            </div>
                                        )}
                                        {!period && s.previousMonthsOwed > 0 && (
                                            <div className="bg-rose-50 dark:bg-rose-950/20 px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-center min-w-[140px]">
                                                <p className="text-[10px] uppercase font-black text-rose-600 dark:text-rose-400 tracking-tighter mb-1">
                                                    Vencido (Histórico)
                                                </p>
                                                <h4 className="text-lg font-black text-rose-600">${s.previousMonthsOwed.toLocaleString()}</h4>
                                            </div>
                                        )}
                                        {!period && (
                                            <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-center min-w-[140px]">
                                                <p className="text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 tracking-tighter mb-1">
                                                    {getMonthName(currentMonth)}
                                                </p>
                                                <h4 className="text-lg font-black text-amber-600">${s.currentMonthOwed.toLocaleString()}</h4>
                                            </div>
                                        )}
                                        {!period && (
                                            <div className="bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-rose-200 dark:shadow-rose-900/20 text-center min-w-[140px]">
                                                <p className="text-[10px] uppercase font-black text-rose-100 tracking-tighter mb-1">Deuda Total</p>
                                                <h4 className="text-xl font-black">${s.totalOwed.toLocaleString()}</h4>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar size={16} className="text-primary" />
                                        <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                            {period ? `Cuota de ${periodLabel}` : "Desglose de Cuotas"}
                                        </h5>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {s.months.map((m, idx) => (
                                            <div
                                                key={idx}
                                                className={`group p-3 rounded-xl border flex flex-col justify-between gap-1 shadow-sm transition-all hover:bg-muted/10 ${
                                                    m.isCurrent
                                                        ? "bg-amber-50/30 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/20"
                                                        : "bg-rose-50/30 border-rose-200/50 dark:bg-rose-950/10 dark:border-rose-900/20"
                                                }`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className={`text-[10px] sm:text-xs font-bold ${m.isCurrent ? "text-amber-600" : "text-rose-600"}`}>
                                                        {m.label}
                                                    </span>
                                                    {m.isCurrent ? (
                                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black uppercase rounded-md tracking-tighter shrink-0">
                                                            Pendiente
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase rounded-md tracking-tighter shrink-0">
                                                            Vencida
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm font-black text-foreground">${m.amount.toLocaleString()}</div>
                                                <PendingFeeActions feeId={m.feeId} isPaid={m.isPaid} originalAmount={m.amount} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* ── Controles de paginación ───────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10">
                    {/* Anterior */}
                    <button
                        onClick={() => goTo(safePage - 1)}
                        disabled={safePage === 1}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/60 transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Anterior
                    </button>

                    {/* Primera página + ellipsis */}
                    {pageRange[0] > 1 && (
                        <>
                            <button
                                onClick={() => goTo(1)}
                                className="w-9 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/60 transition-colors"
                            >
                                1
                            </button>
                            {pageRange[0] > 2 && (
                                <span className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm">…</span>
                            )}
                        </>
                    )}

                    {/* Rango de páginas */}
                    {pageRange.map((p) => (
                        <button
                            key={p}
                            onClick={() => goTo(p)}
                            className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
                                p === safePage
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "border-border hover:bg-muted/60"
                            }`}
                        >
                            {p}
                        </button>
                    ))}

                    {/* Ellipsis + última página */}
                    {pageRange[pageRange.length - 1] < totalPages && (
                        <>
                            {pageRange[pageRange.length - 1] < totalPages - 1 && (
                                <span className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm">…</span>
                            )}
                            <button
                                onClick={() => goTo(totalPages)}
                                className="w-9 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/60 transition-colors"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    {/* Siguiente */}
                    <button
                        onClick={() => goTo(safePage + 1)}
                        disabled={safePage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/60 transition-colors"
                    >
                        Siguiente
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </>
    );
}
