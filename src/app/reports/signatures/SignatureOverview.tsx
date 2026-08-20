"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    CalendarOff,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ClipboardCheck,
    Clock,
    PenLine,
    UserX
} from "lucide-react";
import dayjs from "dayjs";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type ReportState = "FIRMADO" | "PENDIENTE" | "SIN_FIRMANTE";

export type ReportRow = {
    reportId: string;
    studentName: string;
    state: ReportState;
    signedAt: string | null;
    editedAfterSignature: boolean;
    missingBirthDate: boolean;
    deliveredOther: boolean;
    lastEditedAt: string | null;
};

export type Batch = {
    key: string;
    courseId: string;
    courseName: string;
    courseLevel: string | null;
    periodLabel: string;
    templateName: string;
    year: number;
    publishedAt: string | null;
    rows: ReportRow[];
};

/**
 * El porcentaje se calcula **sobre los que pueden firmar**. Los "sin firmante"
 * se cuentan al lado y no lo hunden: si se mezclaran, un curso al 60% no
 * distinguiría entre familias desatentas y cuentas que no funcionan, que se
 * resuelven con acciones distintas y de personas distintas.
 */
function tally(rows: ReportRow[]) {
    const firmados = rows.filter(r => r.state === "FIRMADO").length;
    const pendientes = rows.filter(r => r.state === "PENDIENTE").length;
    const sinFirmante = rows.filter(r => r.state === "SIN_FIRMANTE").length;
    const firmables = firmados + pendientes;

    return {
        firmados,
        pendientes,
        sinFirmante,
        firmables,
        pct: firmables === 0 ? null : Math.round((firmados / firmables) * 100)
    };
}

function Pct({ value }: { value: number | null }) {
    if (value === null) {
        return <span className="text-muted-foreground font-bold text-sm">—</span>;
    }
    const tone =
        value === 100 ? "text-emerald-600" : value >= 60 ? "text-amber-600" : "text-red-600";
    return <span className={cn("font-black text-lg tabular-nums", tone)}>{value}%</span>;
}

/** Las dos cosas que piden que alguien haga algo, más allá de reclamar la firma. */
function needsAttention(row: ReportRow) {
    return row.editedAfterSignature || row.missingBirthDate;
}

export function SignatureOverview({ batches }: { batches: Batch[] }) {
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [onlyAttention, setOnlyAttention] = useState(false);

    const overall = useMemo(() => tally(batches.flatMap(b => b.rows)), [batches]);
    const sinFecha = useMemo(
        () => batches.flatMap(b => b.rows).filter(r => r.missingBirthDate).length,
        [batches]
    );
    const editados = useMemo(
        () => batches.flatMap(b => b.rows).filter(r => r.editedAfterSignature).length,
        [batches]
    );
    const totalAtencion = editados + sinFecha;

    // Con el filtro puesto se abren todas: si pediste ver los que requieren
    // atención, no tiene sentido que tengas que ir desplegando tanda por tanda.
    const isExpanded = (key: string) => onlyAttention || openKey === key;

    return (
        <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div className="pb-6 border-b border-border/50">
                <span className="text-sm font-bold text-primary/80 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <ClipboardCheck size={16} /> Informes
                </span>
                <h1 className="text-4xl font-extrabold tracking-tight">Firmas de los informes</h1>
                <p className="text-muted-foreground font-medium mt-2 max-w-2xl">
                    Quién confirmó que leyó las notas y quién falta. Los informes publicados antes
                    de que existiera la firma no aparecen acá.
                </p>
            </div>

            {batches.length === 0 ? (
                <Card className="p-10 text-center space-y-3">
                    <PenLine className="mx-auto text-muted-foreground" size={32} />
                    <p className="font-bold">Todavía no hay informes con firma</p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Aparecen acá a partir de la próxima publicación. Los informes ya publicados
                        no piden firma porque nunca se le pidió a nadie.
                    </p>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="p-5 space-y-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Firmado en general
                            </p>
                            <div className="flex items-baseline gap-2">
                                <Pct value={overall.pct} />
                                <span className="text-sm text-muted-foreground font-medium">
                                    {overall.firmados} de {overall.firmables}
                                </span>
                            </div>
                        </Card>

                        <Card className="p-5 space-y-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <Clock size={12} /> Pendientes
                            </p>
                            <p className="text-2xl font-black tabular-nums">{overall.pendientes}</p>
                            <p className="text-xs text-muted-foreground">Esperando que lo confirmen</p>
                        </Card>

                        <Card className="p-5 space-y-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <UserX size={12} /> Sin firmante
                            </p>
                            <p className="text-2xl font-black tabular-nums">
                                {overall.sinFirmante}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Todavía no tienen un tutor cargado en el sistema
                            </p>
                        </Card>

                        <Card
                            className={cn(
                                "p-5 space-y-1 transition-colors",
                                totalAtencion > 0 && "cursor-pointer hover:bg-muted/30",
                                onlyAttention && "ring-2 ring-amber-500/50 bg-amber-500/5"
                            )}
                            onClick={() => totalAtencion > 0 && setOnlyAttention(v => !v)}
                            role={totalAtencion > 0 ? "button" : undefined}
                            tabIndex={totalAtencion > 0 ? 0 : undefined}
                            aria-pressed={totalAtencion > 0 ? onlyAttention : undefined}
                            onKeyDown={e => {
                                if (totalAtencion > 0 && (e.key === "Enter" || e.key === " ")) {
                                    e.preventDefault();
                                    setOnlyAttention(v => !v);
                                }
                            }}
                        >
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <AlertTriangle size={12} /> Requieren atención
                            </p>
                            <p className="text-2xl font-black tabular-nums">{totalAtencion}</p>
                            <p className="text-xs text-muted-foreground">
                                {editados} editados tras firmar · {sinFecha} sin fecha de nacimiento
                            </p>
                            {totalAtencion > 0 && (
                                <p className="text-xs font-bold text-amber-600 pt-1">
                                    {onlyAttention ? "Ver todos de nuevo" : "Tocá para ver cuáles son"}
                                </p>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-3">
                        {batches.map(batch => {
                            // El porcentaje siempre sale de la tanda entera, aunque
                            // el filtro muestre sólo algunas filas.
                            const t = tally(batch.rows);
                            const atencion = batch.rows.filter(needsAttention);

                            if (onlyAttention && atencion.length === 0) return null;

                            const isOpen = isExpanded(batch.key);
                            const rowsToShow = onlyAttention ? atencion : batch.rows;

                            return (
                                <Card key={batch.key} className="overflow-hidden">
                                    <button
                                        onClick={() => setOpenKey(isOpen ? null : batch.key)}
                                        // Con el filtro puesto ya están todas abiertas, así que
                                        // plegarlas no haría nada y el botón parecería roto.
                                        disabled={onlyAttention}
                                        className="w-full p-5 flex items-center gap-4 text-left transition-colors enabled:hover:bg-muted/30"
                                    >
                                        {isOpen ? (
                                            <ChevronDown size={18} className="shrink-0 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">
                                                {batch.courseName}
                                                {batch.courseLevel && (
                                                    <span className="text-muted-foreground font-medium">
                                                        {" "}· {batch.courseLevel}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {batch.periodLabel} {batch.year} · publicado{" "}
                                                {batch.publishedAt
                                                    ? dayjs(batch.publishedAt).format("D [de] MMMM")
                                                    : "—"}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            {/* Con la tanda cerrada esto es lo único que
                                                dice que adentro hay algo que mirar. */}
                                            {atencion.length > 0 && (
                                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700">
                                                    <AlertTriangle size={12} />
                                                    <span className="hidden sm:inline">
                                                        {atencion.length}{" "}
                                                        {atencion.length === 1 ? "requiere" : "requieren"} atención
                                                    </span>
                                                    <span className="sm:hidden">{atencion.length}</span>
                                                </span>
                                            )}
                                            {t.sinFirmante > 0 && (
                                                <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                                    <UserX size={13} /> {t.sinFirmante} sin firmante
                                                </span>
                                            )}
                                            <div className="text-right">
                                                <Pct value={t.pct} />
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {t.firmados} de {t.firmables}
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-border/50 divide-y divide-border/30">
                                            {rowsToShow.map(row => (
                                                <div
                                                    key={row.reportId}
                                                    className="px-5 py-3 flex items-center gap-3 text-sm"
                                                >
                                                    <StateIcon state={row.state} />
                                                    <span className="flex-1 font-medium capitalize truncate">
                                                        {row.studentName}
                                                    </span>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {row.missingBirthDate && (
                                                            <Tag tone="amber" icon={<CalendarOff size={11} />}>
                                                                sin fecha de nacimiento
                                                            </Tag>
                                                        )}
                                                        {row.editedAfterSignature && (
                                                            <Tag tone="red" icon={<AlertTriangle size={11} />}>
                                                                editado tras firmar
                                                            </Tag>
                                                        )}
                                                        {row.deliveredOther && (
                                                            <Tag tone="muted">entregado por otro medio</Tag>
                                                        )}
                                                        <span className="text-xs text-muted-foreground w-32 text-right">
                                                            {row.state === "FIRMADO" && row.signedAt
                                                                ? dayjs(row.signedAt).format("D/M/YYYY")
                                                                : row.state === "SIN_FIRMANTE"
                                                                  ? "sin tutor cargado"
                                                                  : "pendiente"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="px-5 py-3 bg-muted/20">
                                                <Link
                                                    href={`/courses/${batch.courseId}`}
                                                    className="text-sm font-bold text-primary hover:underline"
                                                >
                                                    Ir al curso →
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </>
            )}
        </main>
    );
}

function StateIcon({ state }: { state: ReportState }) {
    if (state === "FIRMADO") {
        return <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />;
    }
    if (state === "SIN_FIRMANTE") {
        return <UserX size={16} className="text-muted-foreground shrink-0" />;
    }
    return <Clock size={16} className="text-amber-600 shrink-0" />;
}

function Tag({
    children,
    tone,
    icon
}: {
    children: React.ReactNode;
    tone: "amber" | "red" | "muted";
    icon?: React.ReactNode;
}) {
    const tones = {
        amber: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        red: "bg-red-500/10 text-red-700 border-red-500/20",
        muted: "bg-muted/40 text-muted-foreground border-border/40"
    };

    // En celular la etiqueta se reduce al ícono —la marca tiene que verse igual,
    // pero el texto completo no entra en la fila—. Una etiqueta sin ícono
    // conserva el texto siempre, o quedaría una píldora vacía.
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide",
                tones[tone]
            )}
            title={typeof children === "string" ? children : undefined}
        >
            {icon}
            <span className={icon ? "hidden md:inline" : undefined}>{children}</span>
        </span>
    );
}
