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
import {
    similarityBand,
    strokeToPath,
    type SimilarityBand,
    type StrokeData
} from "@/lib/reports/signatureCompare";
import type { BatchSignerRole } from "@/lib/reports/batchSignatures";

export type ReportState = "FIRMADO" | "PENDIENTE" | "SIN_FIRMANTE";

export type ReportRow = {
    reportId: string;
    studentName: string;
    state: ReportState;
    signedAt: string | null;
    signatureStroke: StrokeData | null;
    similarityScore: number | null;
    editedAfterSignature: boolean;
    missingBirthDate: boolean;
    deliveredOther: boolean;
    lastEditedAt: string | null;
};

/** Una firma del instituto sobre la tanda entera (FEAT-21). */
export type StaffSignature = {
    role: BatchSignerRole;
    signerName: string;
    signedAt: string;
    strokeData: StrokeData | null;
    /** Alumnos cuya nota se tocó después de firmar: ahí la firma dejó de valer. */
    fallenCount: number;
};

export type Batch = {
    key: string;
    courseId: string;
    courseName: string;
    courseLevel: string | null;
    templateId: string;
    periodIndex: number;
    periodLabel: string;
    templateName: string;
    year: number;
    published: boolean;
    publishedAt: string | null;
    staffSignatures: StaffSignature[];
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

    /**
     * Lo que la dirección está esperando. El docente firma cuando terminó de
     * cargar —esa firma *es* el aviso—, así que "firmada por el docente y no
     * por mí" es exactamente la cola de trabajo de ella.
     */
    const listasParaFirmar = useMemo(
        () =>
            batches.filter(
                b =>
                    b.staffSignatures.some(s => s.role === "TEACHER") &&
                    !b.staffSignatures.some(s => s.role === "ADMIN")
            ).length,
        [batches]
    );
    const firmadasPorDireccion = useMemo(
        () =>
            batches.filter(b =>
                b.staffSignatures.some(s => s.role === "ADMIN" && s.fallenCount === 0)
            ).length,
        [batches]
    );

    // Con el filtro puesto se abren todas: si pediste ver los que requieren
    // atención, no tiene sentido que tengas que ir desplegando tanda por tanda.
    const isExpanded = (key: string) => onlyAttention || openKey === key;

    return (
        <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div className="pb-6 border-b border-border/50">
                {/* Ya no está en el menú: sin esto la pantalla es un callejón. */}
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                    <Link href="/dashboard" className="hover:text-primary transition-colors">
                        Dashboard
                    </Link>
                    <ChevronRight size={12} />
                    <Link
                        href="/dashboard/settings/reports"
                        className="hover:text-primary transition-colors"
                    >
                        Plantillas de Informes
                    </Link>
                    <ChevronRight size={12} />
                    <span className="text-foreground">Firmas</span>
                </div>

                <span className="text-sm font-bold text-primary/80 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <ClipboardCheck size={16} /> Informes
                </span>
                <h1 className="text-4xl font-extrabold tracking-tight">Firmas de los informes</h1>
                <p className="text-muted-foreground font-medium mt-2 max-w-2xl">
                    Qué tandas faltan firmar del lado del instituto, y qué familias confirmaron que
                    leyeron las notas. Los informes publicados antes de que existiera la firma no
                    aparecen acá hasta que alguien los firme.
                </p>
            </div>

            {batches.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 -mt-4">
                    <span
                        className={cn(
                            "px-3 py-1.5 rounded-xl border text-sm font-bold",
                            listasParaFirmar > 0
                                ? "bg-violet-500/10 border-violet-500/25 text-violet-700"
                                : "bg-muted/30 border-border/40 text-muted-foreground"
                        )}
                    >
                        {listasParaFirmar} {listasParaFirmar === 1 ? "lista" : "listas"} para que
                        firme la dirección
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                        {firmadasPorDireccion} de {batches.length}{" "}
                        {batches.length === 1 ? "tanda firmada" : "tandas firmadas"}
                    </span>
                </div>
            )}

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
                                                {batch.periodLabel} {batch.year} ·{" "}
                                                {batch.publishedAt
                                                    ? `publicado ${dayjs(batch.publishedAt).format("D [de] MMMM")}`
                                                    : "sin publicar"}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <StaffSignatures batch={batch} />
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
                                            {batch.published ? (
                                                <div className="text-right">
                                                    <Pct value={t.pct} />
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                        {t.firmados} de {t.firmables}
                                                    </p>
                                                </div>
                                            ) : (
                                                // Sin publicar no hay firmas de familia que
                                                // contar: la tanda está acá por la del instituto.
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                                    Sin publicar
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-border/50 divide-y divide-border/30">
                                            {rowsToShow.length === 0 && (
                                                <p className="px-5 py-3 text-sm text-muted-foreground">
                                                    {batch.published
                                                        ? "Esta plantilla no pide firma de la familia."
                                                        : "Todavía sin publicar: la firma de las familias se pide al publicar."}
                                                </p>
                                            )}
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
                                                        {row.signatureStroke && (
                                                            <SignatureThumb
                                                                stroke={row.signatureStroke}
                                                                score={row.similarityScore}
                                                            />
                                                        )}
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

                                            <div className="px-5 py-3 bg-muted/20 flex flex-wrap items-center gap-4">
                                                {/* Con año y período en la URL la planilla abre
                                                    en la tanda que hay que firmar, sin buscarla. */}
                                                <Link
                                                    href={`/courses/${batch.courseId}/reports/${batch.templateId}?year=${batch.year}&period=${batch.periodIndex}`}
                                                    className="text-sm font-bold text-primary hover:underline"
                                                >
                                                    Abrir la planilla y firmar →
                                                </Link>
                                                <Link
                                                    href={`/courses/${batch.courseId}`}
                                                    className="text-sm font-medium text-muted-foreground hover:underline"
                                                >
                                                    Ir al curso
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

/**
 * La firma tal como la dibujó la persona.
 *
 * Es la comparación que sirve: viendo las firmas de un mismo tutor a lo largo de
 * los informes, cualquiera nota si una no se parece a las otras. Un porcentaje
 * en pantalla se sobreinterpreta y se empiezan a tomar decisiones que el dato no
 * aguanta, así que el puntaje va sólo en el `title`.
 */
const BANDS: Record<SimilarityBand, { label: string; className: string }> = {
    SIN_REFERENCIA: {
        label: "Primera firma",
        className: "bg-muted/40 text-muted-foreground border-border/40"
    },
    POCO: { label: "Poco similar", className: "bg-red-500/10 text-red-700 border-red-500/20" },
    CASI: { label: "Casi similar", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
    SIMILAR: {
        label: "Similar",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
    }
};

function SignatureThumb({ stroke, score }: { stroke: StrokeData; score: number | null }) {
    const W = 84;
    const H = 28;
    const band = BANDS[similarityBand(score)];

    return (
        <span className="flex items-center gap-2 shrink-0">
            <svg
                width={W}
                height={H}
                viewBox={`0 0 ${W} ${H}`}
                className="shrink-0 rounded border border-border/40 bg-muted/20 text-foreground"
                role="img"
                aria-label="Firma registrada"
            >
                <path
                    d={strokeToPath(stroke, W, H)}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            <span
                className={cn(
                    "px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide whitespace-nowrap",
                    band.className
                )}
                title={
                    score === null
                        ? "Es la primera firma de esta persona: no hay otra con la cual compararla"
                        : `Parecido con su firma de referencia: ${score} de 100`
                }
            >
                {band.label}
                {score !== null && <span className="hidden lg:inline"> · {score}</span>}
            </span>
        </span>
    );
}

/**
 * Las firmas del instituto sobre la tanda (FEAT-21).
 *
 * Van en la fila cerrada porque son el estado que la dirección viene a mirar:
 * qué le falta firmar y qué se le cayó. La firma del docente no lleva marca de
 * caída porque no se cae — es autoría, no revisión.
 */
function StaffSignatures({ batch }: { batch: Batch }) {
    const docente = batch.staffSignatures.find(s => s.role === "TEACHER");
    const direccion = batch.staffSignatures.find(s => s.role === "ADMIN");

    const chip = (
        label: string,
        tone: "ok" | "warn" | "off",
        title: string,
        icon: React.ReactNode
    ) => (
        <span
            title={title}
            className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide whitespace-nowrap",
                tone === "ok" && "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
                tone === "warn" && "bg-amber-500/10 text-amber-700 border-amber-500/20",
                tone === "off" && "bg-muted/40 text-muted-foreground border-border/40 border-dashed"
            )}
        >
            {icon}
            <span className="hidden lg:inline">{label}</span>
        </span>
    );

    return (
        <span className="hidden sm:flex items-center gap-1.5">
            {docente
                ? chip(
                      "Docente",
                      "ok",
                      `Firmado por ${docente.signerName} el ${dayjs(docente.signedAt).format("D/M/YYYY")}`,
                      <PenLine size={11} />
                  )
                : chip("Docente", "off", "El docente todavía no firmó", <PenLine size={11} />)}

            {direccion
                ? direccion.fallenCount > 0
                    ? chip(
                          `Dirección · ${direccion.fallenCount}`,
                          "warn",
                          `La firma de ${direccion.signerName} dejó de valer para ${direccion.fallenCount} alumno(s): se les modificó la nota después`,
                          <AlertTriangle size={11} />
                      )
                    : chip(
                          "Dirección",
                          "ok",
                          `Firmado por ${direccion.signerName} el ${dayjs(direccion.signedAt).format("D/M/YYYY")}`,
                          <CheckCircle2 size={11} />
                      )
                : chip("Dirección", "off", "La dirección todavía no firmó", <PenLine size={11} />)}
        </span>
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
