import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Clock, Info } from "lucide-react";
import type { RastroDeTutor } from "./actividad";
import { pisoCorto } from "./piso";

/** Nombres de las secciones del portal, para no mostrar la constante cruda. */
const SECCIONES: Record<string, string> = {
    GUARDIAN_HOME: "Portada",
    GUARDIAN_ACADEMICS: "Progreso",
    GUARDIAN_PAYMENTS: "Administración",
};

/** Cuántos se muestran en la tarjeta. El resto vive en el listado completo. */
const A_LA_VISTA = 8;

/**
 * Últimos ingresos de los tutores (FEAT-11, métrica 8).
 *
 * **Es una lista y no un gráfico, a propósito.** Lo que el instituto quiere
 * hacer con esto es llamar a alguien, y una barra no se puede llamar. Va
 * ordenada por antigüedad, con los que no tienen ningún rastro arriba.
 *
 * **Sin rastro no quiere decir que no haya entrado.** Quien entra y sólo mira no
 * dejaba huella antes del registro; la asimetría está escrita en la pantalla
 * para que nadie tome el "nunca" por una certeza.
 */
export function TutoresList({
    tutores,
    sinRastro,
    total,
    piso,
    verTodos,
}: {
    tutores: RastroDeTutor[];
    sinRastro: number;
    total: number;
    piso: Date;
    /** El listado completo, con teléfono y filtros. */
    verTodos: string;
}) {
    const visibles = tutores.slice(0, A_LA_VISTA);

    const formatear = (d: Date) =>
        `${d.getDate()} ${d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}`;

    return (
        <Card className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                    <Clock className="text-amber-600" size={20} />
                    <h3 className="text-lg font-semibold">Últimos ingresos de los tutores</h3>
                </div>
                <span className="text-sm text-muted-foreground tabular-nums">
                    {sinRastro} de {total} sin ningún rastro
                </span>
            </div>

            <div className="flex items-start gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
                <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Hasta el <strong className="text-foreground">{pisoCorto(piso)}</strong> figura el último rastro
                    indirecto —un mensaje leído, una firma—; desde esa fecha, el ingreso real.{" "}
                    <strong className="text-foreground">Sin rastro no quiere decir que no haya entrado</strong>: quien
                    entraba y sólo miraba no dejaba huella.
                </p>
            </div>

            {total === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                    Todavía no hay cuentas de tutor en el instituto.
                </p>
            ) : (
                <div className="overflow-x-auto -mx-2">
                    <table className="w-full min-w-[560px]">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-2 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Tutor
                                </th>
                                <th className="text-left px-2 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Alumnos
                                </th>
                                <th className="text-left px-2 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Último rastro
                                </th>
                                <th className="text-left px-2 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Qué miró
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map((t) => (
                                <tr key={t.id} className="border-b border-border/50 last:border-0">
                                    <td className="px-2 py-3 text-sm font-medium">
                                        <Link
                                            href={`/guardians/${t.id}`}
                                            className="hover:text-primary transition-colors"
                                        >
                                            {t.nombre}
                                        </Link>
                                    </td>
                                    <td className="px-2 py-3 text-sm text-muted-foreground">
                                        {t.alumnos.length === 0 ? (
                                            <span className="italic text-muted-foreground/70">Sin alumno vinculado</span>
                                        ) : (
                                            t.alumnos.map((a) => a.nombre).join(" · ")
                                        )}
                                    </td>
                                    <td className="px-2 py-3 text-sm">
                                        {!t.visto ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                                                Nunca
                                            </span>
                                        ) : (
                                            <span
                                                className={t.esIngreso ? "" : "text-muted-foreground"}
                                                title={t.esIngreso ? "Ingreso registrado" : "Rastro indirecto"}
                                            >
                                                {formatear(t.visto)}
                                                {!t.esIngreso && " ·"}
                                                {!t.esIngreso && (
                                                    <span className="text-[11px] italic"> indirecto</span>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-2 py-3">
                                        {t.secciones.length === 0 ? (
                                            <span className="text-sm text-muted-foreground/60">—</span>
                                        ) : (
                                            <span className="flex flex-wrap gap-1">
                                                {t.secciones.map((s) => (
                                                    <span
                                                        key={s}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                                                    >
                                                        {SECCIONES[s] ?? s}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {total > 0 && (
                <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                    <p className="text-xs text-muted-foreground">
                        {total > A_LA_VISTA
                            ? `Se muestran los ${A_LA_VISTA} más rancios de ${total}.`
                            : "Están todos."}
                    </p>
                    <Link
                        href={verTodos}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                        Ver la lista completa
                        <ArrowRight size={14} />
                    </Link>
                </div>
            )}
        </Card>
    );
}
