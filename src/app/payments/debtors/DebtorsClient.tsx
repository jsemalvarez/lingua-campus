"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import {
    AlertTriangle, Phone, Calendar, User, Clock,
    Search, X, ChevronLeft, ChevronRight, FileDown,
    ArrowUpDown, ArrowUp, ArrowDown,
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
};

export function DebtorsClient({ summaryList, currentMonthLabel, currentMonth }: Props) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [sortField, setSortField] = useState<"name" | "debt">("debt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
            doc.text("Reporte de Deudores", 14, 10);
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
            doc.text("Resumen de deudas", 14, 30);

            autoTable(doc, {
                startY: 33,
                head: [["Mora Histórica", `Pendiente ${getMonthName(currentMonth)}`, "Deuda Total Global"]],
                body: [[
                    `$${totalHistorical.toLocaleString()}`,
                    `$${totalCurrent.toLocaleString()}`,
                    `$${totalAll.toLocaleString()}`,
                ]],
                theme: "grid",
                headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold", fontSize: 8 },
                bodyStyles: { fontSize: 9, fontStyle: "bold" },
                columnStyles: { 2: { textColor: [220, 38, 38] } },
                margin: { left: 14, right: 14 },
            });

            // ── Listado de deudores ───────────────────────────────────────────
            const afterSummary = (doc as any).lastAutoTable.finalY + 8;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(`Detalle por alumno (${filtered.length} ${filtered.length === 1 ? "deudor" : "deudores"})`, 14, afterSummary);

            const rows = filtered.map((s) => [
                s.name,
                s.phone || "—",
                `$${s.previousMonthsOwed.toLocaleString()}`,
                `$${s.currentMonthOwed.toLocaleString()}`,
                `$${s.totalOwed.toLocaleString()}`,
                s.months.map((m) => `${m.label}: $${m.amount.toLocaleString()}`).join("\n"),
            ]);

            autoTable(doc, {
                startY: afterSummary + 3,
                head: [["Alumno", "Teléfono", "Mora histórica", getMonthName(currentMonth), "Deuda total", "Cuotas pendientes"]],
                body: rows,
                theme: "striped",
                headStyles: { fillColor: [51, 51, 51], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
                bodyStyles: { fontSize: 7.5, valign: "top" },
                columnStyles: {
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

            doc.save(`deudores_${now.toISOString().slice(0, 10)}.pdf`);
        } finally {
            setExporting(false);
        }
    };

    // ── Filtrado + Ordenamiento ───────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q ? summaryList.filter((s) => s.name.toLowerCase().includes(q)) : [...summaryList];
        list.sort((a, b) => {
            if (sortField === "name") {
                return sortDir === "asc"
                    ? a.name.localeCompare(b.name, "es")
                    : b.name.localeCompare(a.name, "es");
            }
            return sortDir === "asc" ? a.totalOwed - b.totalOwed : b.totalOwed - a.totalOwed;
        });
        return list;
    }, [search, summaryList, sortField, sortDir]);

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
            {/* ── Summary cards ─────────────────────────────────────────────── */}
            {summaryList.length > 0 && (
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
                        Monto de deuda
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
                                        {s.previousMonthsOwed > 0 && (
                                            <div className="bg-rose-50 dark:bg-rose-950/20 px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-center min-w-[140px]">
                                                <p className="text-[10px] uppercase font-black text-rose-600 dark:text-rose-400 tracking-tighter mb-1">
                                                    Vencido (Histórico)
                                                </p>
                                                <h4 className="text-lg font-black text-rose-600">${s.previousMonthsOwed.toLocaleString()}</h4>
                                            </div>
                                        )}
                                        <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-center min-w-[140px]">
                                            <p className="text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 tracking-tighter mb-1">
                                                {getMonthName(currentMonth)}
                                            </p>
                                            <h4 className="text-lg font-black text-amber-600">${s.currentMonthOwed.toLocaleString()}</h4>
                                        </div>
                                        <div className="bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-rose-200 dark:shadow-rose-900/20 text-center min-w-[140px]">
                                            <p className="text-[10px] uppercase font-black text-rose-100 tracking-tighter mb-1">Deuda Total</p>
                                            <h4 className="text-xl font-black">${s.totalOwed.toLocaleString()}</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar size={16} className="text-primary" />
                                        <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Desglose de Cuotas</h5>
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
