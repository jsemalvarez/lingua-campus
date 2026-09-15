import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/authz";
import { Info } from "lucide-react";
import { cargarTutores, NOMBRE_DE_SECCION, type RastroDeTutor } from "../actividad";
import { PISO_REGISTRO, pisoCorto } from "../piso";
import { CabeceraListado, Filtros, ListaVacia, Th } from "../Listado";

export const dynamic = "force-dynamic";

/**
 * El listado detrás de las métricas 5 y 8 del panel de uso (FEAT-11).
 *
 * **Las dos métricas comparten universo, así que comparten pantalla.** "Tutores
 * con cuenta" y "últimos ingresos de los tutores" son la misma gente mirada por
 * dos preguntas distintas —si llegan a un alumno, y si entran—, y separarlas en
 * dos listas obligaría a cruzarlas a mano justo cuando se cruzan solas: el tutor
 * sin alumno vinculado es, casi siempre, el mismo que nunca entró.
 *
 * En el panel la tarjeta muestra los ocho más rancios; acá está la lista entera,
 * con el teléfono, que es lo que hace falta para hacer algo con ella.
 */

const FILTROS: { clave: string; etiqueta: string; test: (t: RastroDeTutor) => boolean }[] = [
    { clave: "todos", etiqueta: "Todos", test: () => true },
    { clave: "sin-rastro", etiqueta: "Sin ningún rastro", test: (t) => !t.visto },
    { clave: "sin-alumno", etiqueta: "Sin ningún alumno", test: (t) => t.alumnos.length === 0 },
    { clave: "con-alumno", etiqueta: "Con alumno vinculado", test: (t) => t.alumnos.length > 0 },
];

export default async function TutoresUsagePage({
    searchParams,
}: {
    searchParams: Promise<{ estado?: string; p?: string }>;
}) {
    const auth = await requireRole(["ADMIN"]);
    if (!auth) redirect("/dashboard");

    const { estado, p } = await searchParams;
    const { lista, sinRastro, total } = await cargarTutores(auth.instituteId);

    const elegido = FILTROS.find((f) => f.clave === estado) ?? FILTROS[0];
    const visibles = lista.filter(elegido.test);

    const volverA = p ? `/dashboard/usage?p=${p}` : "/dashboard/usage";
    const base = p ? `/dashboard/usage/tutores?p=${p}` : "/dashboard/usage/tutores";

    const formatear = (d: Date) =>
        `${d.getDate()} ${d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}`;

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={auth.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CabeceraListado
                    titulo="Tutores con cuenta"
                    descripcion={`${total} cuentas de tutor, ${sinRastro} sin ningún rastro. Los más rancios primero.`}
                    volverA={volverA}
                />

                <Filtros
                    base={base}
                    actual={elegido.clave}
                    opciones={FILTROS.map((f) => ({
                        clave: f.clave,
                        etiqueta: f.etiqueta,
                        cantidad: lista.filter(f.test).length,
                    }))}
                />

                <div className="flex items-start gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
                    <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Hasta el <strong className="text-foreground">{pisoCorto(PISO_REGISTRO)}</strong> figura el
                        último rastro indirecto —un mensaje leído, una firma—; desde esa fecha, el ingreso real.{" "}
                        <strong className="text-foreground">Sin rastro no quiere decir que no haya entrado</strong>:
                        quien entraba y sólo miraba no dejaba huella.
                    </p>
                </div>

                <Card className="overflow-hidden">
                    {visibles.length === 0 ? (
                        <ListaVacia>
                            {total === 0
                                ? "Todavía no hay cuentas de tutor en el instituto."
                                : "Ningún tutor está en esa situación."}
                        </ListaVacia>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full min-w-[820px]">
                                <thead>
                                    <tr className="border-b border-border">
                                        <Th>Tutor</Th>
                                        <Th>Alumnos</Th>
                                        <Th>Último rastro</Th>
                                        <Th>Qué miró</Th>
                                        <Th>Teléfono</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibles.map((t) => (
                                        <tr key={t.id} className="border-b border-border/50 last:border-0">
                                            <td className="px-3 py-3">
                                                <Link
                                                    href={`/guardians/${t.id}`}
                                                    className="text-sm font-medium hover:text-primary transition-colors"
                                                >
                                                    {t.nombre}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">{t.email}</p>
                                            </td>
                                            <td className="px-3 py-3 text-sm">
                                                {t.alumnos.length === 0 ? (
                                                    <span className="italic text-muted-foreground/70">
                                                        Sin alumno vinculado
                                                    </span>
                                                ) : (
                                                    <span className="flex flex-wrap gap-x-2 gap-y-1">
                                                        {t.alumnos.map((a) => (
                                                            <Link
                                                                key={a.id}
                                                                href={`/students/${a.id}`}
                                                                className="text-muted-foreground hover:text-primary transition-colors"
                                                            >
                                                                {a.nombre}
                                                            </Link>
                                                        ))}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm">
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
                                                        {!t.esIngreso && (
                                                            <span className="text-[11px] italic"> · indirecto</span>
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                {t.secciones.length === 0 ? (
                                                    <span className="text-sm text-muted-foreground/60">—</span>
                                                ) : (
                                                    <span className="flex flex-wrap gap-1">
                                                        {t.secciones.map((s) => (
                                                            <span
                                                                key={s}
                                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                                                            >
                                                                {NOMBRE_DE_SECCION[s] ?? s}
                                                            </span>
                                                        ))}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm tabular-nums">
                                                {t.telefono || <span className="text-muted-foreground/50">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
