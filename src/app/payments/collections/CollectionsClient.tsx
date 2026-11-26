"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Banknote, Calendar, ChevronRight, CircleDashed, CreditCard, Landmark, Search, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { dayFromKey, formatDate, instituteMonth } from "@/lib/dates";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { COLLECTION_GROUPS, COLLECTION_GROUP_LABELS, type CollectionGroup } from "@/lib/collections";

export type CollectionRow = {
    id: string;
    group: CollectionGroup;
    /** Cómo se lee la forma de pago: «Efectivo», «Mercado Pago», «Sin registro». */
    method: string;
    amount: number;
    /** `YYYY-MM-DD`. `null` en la carga inicial, cuyo día no es el del pago. */
    day: string | null;
    month: number;
    time: string | null;
    studentId: string | null;
    studentName: string | null;
    concept: string;
    /** El curso de la cuota, o la categoría del ingreso. */
    place: string | null;
    operatorName: string | null;
};

type View = "alumno" | "dia";

const PAGE_STUDENTS = 60;
const PAGE_DAYS = 15;

// Los tonos 700 sobre blanco y los 300/400 en oscuro, para llegar a 4,5:1. El
// verde y el índigo además se distinguen por luminosidad, no sólo por tono.
const HATCH: CSSProperties = { backgroundImage: "repeating-linear-gradient(45deg, rgb(161 161 170 / 0.55) 0 3px, transparent 3px 6px)" };

const STYLE: Record<CollectionGroup, { text: string; chip: string; bar: string; on: string; icon: ReactNode }> = {
    efectivo: {
        text: "text-emerald-700 dark:text-emerald-400",
        chip: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        bar: "bg-emerald-500",
        on: "border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/30",
        icon: <Banknote size={18} />
    },
    transferencia: {
        text: "text-indigo-700 dark:text-indigo-300",
        chip: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
        bar: "bg-indigo-700 dark:bg-indigo-400",
        on: "border-indigo-600 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/30",
        icon: <Landmark size={18} />
    },
    otras: {
        text: "text-amber-700 dark:text-amber-400",
        chip: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        bar: "bg-amber-500",
        on: "border-amber-600 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/30",
        icon: <CreditCard size={18} />
    },
    "sin-registro": {
        text: "text-zinc-600 dark:text-zinc-300",
        chip: "border border-dashed border-zinc-400 text-zinc-700 dark:text-zinc-300",
        bar: "",
        on: "border-zinc-500 bg-zinc-50 dark:bg-zinc-900",
        icon: <CircleDashed size={18} />
    }
};

const money = (n: number) => `$${formatCurrency(n)}`;
const sum = (rows: CollectionRow[]) => rows.reduce((t, r) => t + r.amount, 0);
const studentsIn = (rows: CollectionRow[]) => new Set(rows.map((r) => r.studentId ?? `sin-alumno:${r.concept}`)).size;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function MethodChip({ row }: { row: CollectionRow }) {
    return (
        <span className={`inline-flex items-center whitespace-nowrap text-xs font-semibold rounded-full px-2.5 py-0.5 ${STYLE[row.group].chip}`}>
            {row.method}
        </span>
    );
}

export function CollectionsClient({
    rows,
    year,
    month,
    initialGroup,
    recordedSince
}: {
    rows: CollectionRow[];
    year: number;
    month: number;
    initialGroup: CollectionGroup | null;
    recordedSince: string | null;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [group, setGroup] = useState<CollectionGroup | null>(initialGroup);
    const [view, setView] = useState<View>("alumno");
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState<string | null>(null);
    const [studentLimit, setStudentLimit] = useState(PAGE_STUDENTS);
    const [dayLimit, setDayLimit] = useState(PAGE_DAYS);

    const periodLabel = month ? getMonthName(month) : String(year);

    const years: number[] = [];
    const thisYear = instituteMonth().year;
    for (let y = thisYear - 2; y <= thisYear + 1; y++) years.push(y);

    const goToPeriod = (next: { year?: number; month?: number }) => {
        const params = new URLSearchParams();
        params.set("year", String(next.year ?? year));
        params.set("month", String(next.month ?? month));
        if (group) params.set("group", group);
        router.push(`${pathname}?${params.toString()}`);
    };

    // El filtro va en la URL sin volver a pedir la página: los datos ya están.
    const pickGroup = (next: CollectionGroup | null) => {
        setGroup(next);
        setStudentLimit(PAGE_STUDENTS);
        setDayLimit(PAGE_DAYS);
        const params = new URLSearchParams(window.location.search);
        if (next) params.set("group", next);
        else params.delete("group");
        window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    };

    const byGroup = useMemo(() => {
        const map = Object.fromEntries(COLLECTION_GROUPS.map((g) => [g, [] as CollectionRow[]])) as Record<CollectionGroup, CollectionRow[]>;
        rows.forEach((r) => map[r.group].push(r));
        return map;
    }, [rows]);

    const total = sum(rows);
    const recorded = rows.filter((r) => r.group !== "sin-registro");
    const onlyUnrecorded = rows.length > 0 && recorded.length === 0;
    // Efectivo y transferencia siempre, aunque estén en cero: son la pregunta. Las
    // otras dos, sólo si el período las tiene.
    const groupsShown = COLLECTION_GROUPS.filter((g) => g === "efectivo" || g === "transferencia" || byGroup[g].length > 0);
    const otherLabels = Array.from(new Set(byGroup.otras.map((r) => r.method)));
    const groupLabel = (g: CollectionGroup) =>
        g === "otras" && otherLabels.length === 1 ? otherLabels[0] : COLLECTION_GROUP_LABELS[g];

    const q = normalize(query.trim());
    const visible = rows.filter((r) =>
        (!group || r.group === group) &&
        (!q || normalize(`${r.studentName ?? ""} ${r.place ?? ""} ${r.concept}`).includes(q))
    );

    // Las columnas de la lista por alumno: las del filtro, o las que tienen algo.
    // Efectivo y transferencia van aunque estén vacías, salvo en un período que es
    // todo de la carga inicial: ahí serían dos columnas de rayas.
    const columns = group ? [group] : COLLECTION_GROUPS.filter((g) =>
        byGroup[g].length > 0 || (!onlyUnrecorded && (g === "efectivo" || g === "transferencia"))
    );
    // El nombre no se achica de 200 px: con tres o cuatro columnas de importes, en
    // una pantalla angosta la lista se desplaza de costado en vez de cortar nombres.
    const gridColumns = `minmax(200px,1fr) ${columns.map(() => "minmax(96px,124px)").join(" ")} 64px`;
    const listMinWidth = 200 + columns.length * 96 + 64 + (columns.length + 1) * 16 + 40;

    const students = useMemo(() => {
        const map = new Map<string, CollectionRow[]>();
        visible.forEach((r) => {
            const key = r.studentId ?? "sin-alumno";
            map.set(key, [...(map.get(key) ?? []), r]);
        });
        return Array.from(map.entries())
            .map(([key, items]) => ({
                key,
                name: items[0].studentName ?? "Ingresos sin alumno",
                items,
                last: items.map((i) => i.day).filter(Boolean).sort().at(-1) ?? null
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "es"));
    }, [visible]);

    const days = useMemo(() => {
        const map = new Map<string, CollectionRow[]>();
        visible.forEach((r) => {
            const key = r.day ?? "sin-dia";
            map.set(key, [...(map.get(key) ?? []), r]);
        });
        // Lo último arriba, y la carga inicial, sin día, al final.
        return Array.from(map.entries()).sort(([a], [b]) => (a === "sin-dia" ? 1 : b === "sin-dia" ? -1 : b.localeCompare(a)));
    }, [visible]);

    const monthly = useMemo(() => {
        if (month) return [];
        return Array.from({ length: 12 }, (_, i) => {
            const items = rows.filter((r) => r.month === i + 1);
            return { month: i + 1, total: sum(items), parts: COLLECTION_GROUPS.map((g) => ({ g, value: sum(items.filter((r) => r.group === g)) })) };
        }).filter((m) => m.total > 0);
    }, [rows, month]);
    const monthlyMax = Math.max(1, ...monthly.map((m) => m.total));

    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

    return (
        <div className="space-y-5">
            {/* Período */}
            <div className="flex justify-end">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-border/60 rounded-xl px-3 py-2 shadow-sm font-semibold text-sm">
                    <Calendar size={14} className="text-muted-foreground" />
                    <label htmlFor="cobros-mes" className="text-muted-foreground whitespace-nowrap">Cobros de</label>
                    <span className="text-border">|</span>
                    <select
                        id="cobros-mes"
                        value={month}
                        onChange={(e) => goToPeriod({ month: parseInt(e.target.value, 10) })}
                        className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1"
                    >
                        <option value={0} className="bg-white dark:bg-zinc-900">Todo el año</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m} className="bg-white dark:bg-zinc-900">{getMonthName(m)}</option>
                        ))}
                    </select>
                    <span className="text-border">|</span>
                    <select
                        aria-label="Año"
                        value={year}
                        onChange={(e) => goToPeriod({ year: parseInt(e.target.value, 10) })}
                        className="bg-transparent text-sm font-semibold font-sans focus:outline-none cursor-pointer text-foreground pr-1"
                    >
                        {years.map((y) => (
                            <option key={y} value={y} className="bg-white dark:bg-zinc-900">{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Totales: cada tarjeta filtra la lista */}
            <section aria-label={`Cobrado en ${periodLabel}`} className="space-y-3">
                {/* En el celular, el total a lo ancho y las formas de pago de a dos. */}
                <div className={`grid grid-cols-2 gap-3 ${onlyUnrecorded ? "" : groupsShown.length > 2 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
                    <button
                        type="button"
                        aria-pressed={group === null}
                        onClick={() => pickGroup(null)}
                        className={`text-left rounded-xl border-2 p-4 sm:p-5 transition-colors flex flex-col gap-1.5 col-span-2 ${onlyUnrecorded ? "sm:col-span-1" : "lg:col-span-1"} ${group === null ? "border-foreground/70 bg-muted/40" : "border-border hover:border-foreground/30"}`}
                    >
                        <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Wallet size={18} /> Cobrado en {periodLabel}</span>
                        <span className="text-2xl sm:text-[28px] leading-tight font-bold tracking-tight tabular-nums">{money(total)}</span>
                        <span className="text-[13px] text-muted-foreground">{plural(rows.length, "cobro", "cobros")} · {plural(studentsIn(rows), "alumno", "alumnos")}</span>
                    </button>

                    {onlyUnrecorded ? (
                        <div className="col-span-2 sm:col-span-1 rounded-xl border border-dashed border-zinc-400 p-4 sm:p-5 flex flex-col justify-center gap-1">
                            <span className="font-semibold">La forma de pago se registra desde el {recordedSince ?? "primer cobro hecho en el campus"}</span>
                            <span className="text-[13px] text-muted-foreground">De {periodLabel.toLowerCase()} se ve quién pagó, qué pagó y cuánto.</span>
                        </div>
                    ) : groupsShown.map((g) => {
                        const items = byGroup[g];
                        const on = group === g;
                        return (
                            <button
                                key={g}
                                type="button"
                                aria-pressed={on}
                                onClick={() => pickGroup(on ? null : g)}
                                className={`text-left rounded-xl border-2 p-3.5 sm:p-5 transition-colors flex flex-col gap-1 sm:gap-1.5 min-w-0 ${on ? STYLE[g].on : "border-border hover:border-foreground/30"} ${g === "sin-registro" && !on ? "border-dashed" : ""}`}
                            >
                                {/* En el celular el porcentaje baja a la última línea: arriba
                                    no entra al lado de «Transferencia». */}
                                <span className="flex items-center justify-between gap-2">
                                    <span className={`text-[13px] sm:text-sm font-semibold flex items-center gap-2 min-w-0 ${STYLE[g].text}`}><span className="hidden sm:inline-flex">{STYLE[g].icon}</span> {groupLabel(g)}</span>
                                    <span className="hidden sm:inline text-xs font-semibold text-muted-foreground tabular-nums whitespace-nowrap">{pct(sum(items))} %</span>
                                </span>
                                <span className="text-xl sm:text-[28px] leading-tight font-bold tracking-tight tabular-nums">{money(sum(items))}</span>
                                <span className="text-xs sm:text-[13px] text-muted-foreground">
                                    <span className="sm:hidden font-semibold">{pct(sum(items))} % · </span>
                                    {g === "sin-registro" ? `${plural(items.length, "cobro", "cobros")} de la carga inicial` : `${plural(items.length, "cobro", "cobros")} · ${plural(studentsIn(items), "alumno", "alumnos")}`}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {!onlyUnrecorded && total > 0 && (
                    <div
                        role="img"
                        aria-label={groupsShown.map((g) => `${groupLabel(g)} ${pct(sum(byGroup[g]))} %`).join(", ")}
                        className="flex gap-[3px] h-3 rounded-md overflow-hidden"
                    >
                        {groupsShown.filter((g) => sum(byGroup[g]) > 0).map((g) => (
                            <span key={g} className={STYLE[g].bar} style={{ width: `${(sum(byGroup[g]) / total) * 100}%`, ...(g === "sin-registro" ? HATCH : {}) }} />
                        ))}
                    </div>
                )}

                {byGroup["sin-registro"].length > 0 && !onlyUnrecorded && (
                    <p className="text-[13px] text-muted-foreground">
                        La forma de pago se registra desde el {recordedSince ?? "primer cobro hecho en el campus"}. Los cobros sin forma de pago vienen de la carga inicial, que tampoco tiene el día en que se pagó.
                    </p>
                )}
            </section>

            {/* Todo el año: mes por mes */}
            {!month && monthly.length > 0 && (
                <Card className="p-5 sm:p-6">
                    <h2 className="text-base font-bold mb-4">Cobrado por mes</h2>
                    <div className="overflow-x-auto">
                        <div className="min-w-[560px] flex items-end gap-3 h-56">
                            {monthly.map((m) => (
                                <div key={m.month} className="flex-1 flex flex-col items-stretch justify-end gap-1.5 h-full">
                                    <span className="text-[11px] font-semibold text-center tabular-nums whitespace-nowrap">
                                        {m.total >= 1_000_000
                                            ? `$${(m.total / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`
                                            : `$${formatCurrency(Math.round(m.total / 1000))} mil`}
                                    </span>
                                    <div
                                        role="img"
                                        aria-label={`${getMonthName(m.month)}: ${m.parts.filter((p) => p.value > 0).map((p) => `${COLLECTION_GROUP_LABELS[p.g]} ${money(p.value)}`).join(", ")}`}
                                        className="flex flex-col-reverse gap-[2px] rounded-t-md overflow-hidden"
                                        style={{ height: `${(m.total / monthlyMax) * 150}px` }}
                                    >
                                        {m.parts.filter((p) => p.value > 0).map((p) => (
                                            <span key={p.g} className={STYLE[p.g].bar} style={{ flexGrow: p.value, ...(p.g === "sin-registro" ? HATCH : {}) }} />
                                        ))}
                                    </div>
                                    <span className="border-t border-border pt-1.5 text-xs font-semibold text-center text-muted-foreground">{getMonthName(m.month).slice(0, 3)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* La lista */}
            <Card className="p-0 sm:p-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-border">
                    <div className="inline-flex gap-1 p-1 bg-muted/60 rounded-lg self-start">
                        {(["alumno", "dia"] as View[]).map((v) => (
                            <button
                                key={v}
                                type="button"
                                aria-pressed={view === v}
                                onClick={() => setView(v)}
                                className={`px-4 min-h-10 rounded-md text-sm font-semibold transition-colors ${view === v ? "bg-card text-emerald-700 dark:text-emerald-400 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {v === "alumno" ? "Por alumno" : "Por día"}
                            </button>
                        ))}
                    </div>
                    <label className="relative w-full sm:max-w-xs">
                        <span className="sr-only">Buscar alumno, curso o concepto</span>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar alumno, curso o concepto"
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </label>
                </div>

                {visible.length === 0 ? (
                    <p className="py-14 px-4 text-center text-sm font-semibold text-muted-foreground">
                        {rows.length === 0
                            ? `No hay cobros en ${month ? `${getMonthName(month).toLowerCase()} de ${year}` : year}.`
                            : query ? `Ningún cobro coincide con «${query}».` : `No hay cobros de ${groupLabel(group!).toLowerCase()} en el período.`}
                    </p>
                ) : view === "alumno" ? (
                    <>
                    {/* Celular: una fila por alumno, con lo que pagó de cada forma apilado
                        a la derecha. La tabla de columnas no entra sin correrse de costado. */}
                    <ul className="sm:hidden">
                        {students.slice(0, studentLimit).map((s) => {
                            const isOpen = open === s.key;
                            const courses = Array.from(new Set(s.items.map((i) => i.place).filter(Boolean)));
                            return (
                                <li key={s.key} className="border-b border-border/50 last:border-0">
                                    <button
                                        type="button"
                                        aria-expanded={isOpen}
                                        onClick={() => setOpen(isOpen ? null : s.key)}
                                        className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 min-h-14"
                                    >
                                        <span className="flex flex-col min-w-0">
                                            <span className="font-semibold text-foreground truncate">{s.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">{courses.join(", ") || plural(s.items.length, "cobro", "cobros")}</span>
                                        </span>
                                        <span className="flex flex-col items-end gap-1 shrink-0">
                                            {columns.filter((g) => s.items.some((i) => i.group === g)).map((g) => (
                                                <span key={g} className="flex items-center gap-2">
                                                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${STYLE[g].chip}`}>{groupLabel(g)}</span>
                                                    <span className="font-semibold tabular-nums">{money(sum(s.items.filter((i) => i.group === g)))}</span>
                                                </span>
                                            ))}
                                        </span>
                                    </button>
                                    {isOpen && (
                                        <ul className="bg-muted/25 px-4 py-1.5">
                                            {s.items.map((i) => (
                                                <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                                                    <span className="min-w-0">
                                                        <span className="block text-foreground">{i.concept}</span>
                                                        <span className="block text-xs text-muted-foreground">
                                                            {[i.day ? formatDate(dayFromKey(i.day), "day", "numericDayMonth") : null, i.method, i.operatorName ? `cargó ${i.operatorName}` : null].filter(Boolean).join(" · ")}
                                                        </span>
                                                    </span>
                                                    <span className="font-semibold tabular-nums shrink-0">{money(i.amount)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                        <li className="px-4 py-3 bg-muted/30 font-bold flex items-start justify-between gap-3">
                            <span>{plural(students.length, "alumno", "alumnos")}</span>
                            <span className="flex flex-col items-end gap-0.5 tabular-nums">
                                {columns.filter((g) => visible.some((r) => r.group === g)).map((g) => (
                                    <span key={g}><span className={`text-xs ${STYLE[g].text}`}>{groupLabel(g)}</span> {money(sum(visible.filter((r) => r.group === g)))}</span>
                                ))}
                            </span>
                        </li>
                    </ul>
                    <div className="hidden sm:block overflow-x-auto">
                        <div style={{ minWidth: listMinWidth }}>
                            <div className="grid gap-4 px-4 sm:px-5 py-2.5 bg-muted/30 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground" style={{ gridTemplateColumns: gridColumns }}>
                                <span>Alumno</span>
                                {columns.map((g) => <span key={g} className="text-right">{groupLabel(g)}</span>)}
                                <span className="text-right">Último</span>
                            </div>
                            {students.slice(0, studentLimit).map((s) => {
                                const isOpen = open === s.key;
                                const courses = Array.from(new Set(s.items.map((i) => i.place).filter(Boolean)));
                                const concepts = Array.from(new Set(s.items.map((i) => i.concept)));
                                return (
                                    <div key={s.key} className="border-b border-border/50 last:border-0">
                                        <div className="grid gap-4 items-center px-4 sm:px-5 py-1.5" style={{ gridTemplateColumns: gridColumns }}>
                                            <button
                                                type="button"
                                                aria-expanded={isOpen}
                                                onClick={() => setOpen(isOpen ? null : s.key)}
                                                className="text-left flex items-center gap-2.5 min-h-11 min-w-0"
                                            >
                                                <ChevronRight size={16} className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                                <span className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-foreground truncate">{s.name}</span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {[courses.join(", "), concepts.length <= 2 ? concepts.join(" y ") : plural(s.items.length, "cobro", "cobros")].filter(Boolean).join(" · ")}
                                                    </span>
                                                </span>
                                            </button>
                                            {columns.map((g) => {
                                                const value = sum(s.items.filter((i) => i.group === g));
                                                return (
                                                    <span key={g} className={`text-right font-semibold tabular-nums ${value ? STYLE[g].text : "text-muted-foreground/70"}`}>
                                                        {value ? money(value) : "—"}
                                                    </span>
                                                );
                                            })}
                                            <span className="text-right text-[13px] text-muted-foreground tabular-nums">
                                                {s.last ? formatDate(dayFromKey(s.last), "day", "numericDayMonth") : "—"}
                                            </span>
                                        </div>
                                        {isOpen && (
                                            <ul className="bg-muted/25 pl-11 pr-4 sm:pr-5 py-1.5">
                                                {s.items.map((i) => (
                                                    <li key={i.id} className="grid grid-cols-[64px_minmax(0,1fr)_auto_96px] gap-3 items-center py-2 text-[13px]">
                                                        <span className="text-muted-foreground tabular-nums">{i.day ? formatDate(dayFromKey(i.day), "day", "numericDayMonth") : "—"}</span>
                                                        <span className="min-w-0">
                                                            <span className="text-foreground">{i.concept}</span>
                                                            {i.operatorName && <span className="text-muted-foreground"> · cargó {i.operatorName}</span>}
                                                        </span>
                                                        <MethodChip row={i} />
                                                        <span className="text-right font-semibold tabular-nums">{money(i.amount)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="grid gap-4 px-4 sm:px-5 py-3 bg-muted/30 font-bold tabular-nums" style={{ gridTemplateColumns: gridColumns }}>
                                <span>{plural(students.length, "alumno", "alumnos")}</span>
                                {columns.map((g) => <span key={g} className="text-right">{money(sum(visible.filter((r) => r.group === g)))}</span>)}
                                <span />
                            </div>
                        </div>
                    </div>
                    {students.length > studentLimit && (
                        <div className="p-3 border-t border-border text-center">
                            <button type="button" onClick={() => setStudentLimit((n) => n + PAGE_STUDENTS)} className="min-h-11 px-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                                Mostrar {Math.min(PAGE_STUDENTS, students.length - studentLimit)} alumnos más
                            </button>
                        </div>
                    )}
                    </>
                ) : (
                    <div>
                        <div>
                            {days.slice(0, dayLimit).map(([key, items]) => (
                                <div key={key}>
                                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 sm:px-5 py-2.5 bg-muted/30 border-b border-border/50">
                                        <span className="font-bold">
                                            {key === "sin-dia" ? "Carga inicial, sin día" : capitalize(formatDate(dayFromKey(key), "day", "weekdayDayMonth"))}
                                        </span>
                                        <span className="flex flex-wrap justify-end gap-x-4 text-[13px] font-semibold tabular-nums">
                                            {COLLECTION_GROUPS.filter((g) => items.some((i) => i.group === g)).map((g) => (
                                                <span key={g} className={STYLE[g].text}>{groupLabel(g)} {money(sum(items.filter((i) => i.group === g)))}</span>
                                            ))}
                                        </span>
                                    </div>
                                    {items.map((i) => (
                                        // En el celular la hora se va y la forma de pago queda arriba del importe.
                                        <div key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[52px_minmax(0,1fr)_auto_104px] gap-3 items-center px-4 sm:px-5 py-2.5 border-b border-border/50">
                                            <span className="hidden sm:block text-[13px] text-muted-foreground tabular-nums">{i.time ?? ""}</span>
                                            <span className="flex flex-col min-w-0">
                                                <span className="font-semibold truncate">{i.studentName ?? i.concept}</span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {[i.studentName ? i.concept : null, i.place, i.operatorName ? `cargó ${i.operatorName}` : null].filter(Boolean).join(" · ")}
                                                </span>
                                            </span>
                                            <span className="flex flex-col items-end gap-1 sm:contents">
                                                <MethodChip row={i} />
                                                <span className="text-right font-semibold tabular-nums">{money(i.amount)}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {days.length > dayLimit && (
                            <div className="p-3 border-t border-border text-center">
                                <button type="button" onClick={() => setDayLimit((n) => n + PAGE_DAYS)} className="min-h-11 px-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                                    Mostrar {Math.min(PAGE_DAYS, days.length - dayLimit)} días más
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <p className="text-xs text-muted-foreground">
                El total es el mismo que muestra «Cobrado en {month ? getMonthName(month) : "el mes"}» en Finanzas. Los cobros
                anulados no se cuentan, y el saldo a favor aplicado a una cuota tampoco: esa plata entró cuando se cobró.
            </p>
        </div>
    );
}
