import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/authz";
import { instituteToday } from "@/lib/activity";
import { getMonthName } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { CalendarClock, QrCode } from "lucide-react";
import { PeriodSelector } from "../PeriodSelector";
import { aniosDisponibles, clasesDelPeriodo, resolverPeriodo } from "../periodo";
import { estadoDelParte, type EstadoParte } from "../metricas";
import { CabeceraListado, Filtros, ListaVacia, Th } from "../Listado";

export const dynamic = "force-dynamic";

/**
 * El listado detrás de las métricas 1 y 2 del panel de uso (FEAT-11).
 *
 * **Las dos miran las mismas clases**, una por el estado del parte y otra por
 * cómo se cargó, así que una sola lista con dos filtros contesta las dos. La
 * columna de origen convierte "¿se usa el escáner?" en "¿en qué clases?", que es
 * la pregunta que se puede seguir.
 *
 * **Es una lista de pendientes, no un puntaje de docentes.** El docente aparece
 * porque es a quien hay que avisarle de esta clase, no para sumar un porcentaje
 * al lado de su nombre: ese número se convierte en una discusión y esta lista se
 * convierte en un mensaje.
 *
 * **Ordenadas de la más vieja a la más nueva**, que es el orden en que hay que
 * resolverlas — y hace que la que el panel nombra como "la más vieja sin parte"
 * sea la primera que se ve.
 */

const DISTINTIVO: Record<EstadoParte, { texto: string; clases: string }> = {
    completa: {
        texto: "Completa",
        clases: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-500",
    },
    incompleta: {
        texto: "Incompleta",
        clases: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-500",
    },
    "sin-parte": { texto: "Sin registro", clases: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const TIPO: Record<string, string> = { TP: "TP", EXAM: "Examen" };

export default async function ClasesUsagePage({
    searchParams,
}: {
    searchParams: Promise<{ estado?: string; p?: string }>;
}) {
    const auth = await requireRole(["ADMIN"]);
    if (!auth) redirect("/dashboard");

    const { instituteId } = auth;
    const { estado, p } = await searchParams;

    const hoyInstituto = instituteToday();
    const periodo = resolverPeriodo(p, hoyInstituto);
    const dentroDelPeriodo = clasesDelPeriodo(instituteId, periodo);

    const [clases, conEscaner, primeraClase] = await Promise.all([
        prisma.lesson.findMany({
            where: {
                ...dentroDelPeriodo,
                course: { instituteId, enrollments: { some: { status: "ACTIVE" } } },
            },
            select: {
                id: true,
                date: true,
                topic: true,
                type: true,
                courseId: true,
                course: {
                    select: {
                        name: true,
                        level: true,
                        teacher: { select: { name: true } },
                        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
                    },
                },
                _count: { select: { attendances: true } },
            },
            orderBy: { date: "asc" },
        }),

        prisma.attendance.groupBy({
            by: ["lessonId"],
            where: { source: "QR", lesson: dentroDelPeriodo },
            _count: { _all: true },
        }),

        prisma.lesson.aggregate({
            where: { course: { instituteId } },
            _min: { date: true },
        }),
    ]);

    const marcasQr = new Map(conEscaner.map((l) => [l.lessonId, l._count._all]));

    const filas = clases.map((c) => ({
        ...c,
        inscriptos: c.course._count.enrollments,
        marcas: c._count.attendances,
        qr: marcasQr.get(c.id) ?? 0,
        estado: estadoDelParte(c._count.attendances, c.course._count.enrollments),
    }));

    const FILTROS: { clave: string; etiqueta: string; test: (f: (typeof filas)[number]) => boolean }[] = [
        { clave: "todos", etiqueta: "Todas", test: () => true },
        { clave: "sin-parte", etiqueta: "Sin ningún registro", test: (f) => f.estado === "sin-parte" },
        { clave: "incompleta", etiqueta: "Incompletas", test: (f) => f.estado === "incompleta" },
        { clave: "completa", etiqueta: "Completas", test: (f) => f.estado === "completa" },
        { clave: "con-escaner", etiqueta: "Con el escáner", test: (f) => f.qr > 0 },
    ];

    const elegido = FILTROS.find((f) => f.clave === estado) ?? FILTROS[0];
    const visibles = filas.filter(elegido.test);

    // El período viaja en el enlace de vuelta y en el del selector; el filtro
    // viaja en el del selector. Así ninguno de los dos borra al otro.
    const volverA = `/dashboard/usage?p=${periodo.clave}`;
    const base = `/dashboard/usage/clases?p=${periodo.clave}`;
    const baseDelSelector =
        elegido.clave === "todos"
            ? "/dashboard/usage/clases"
            : `/dashboard/usage/clases?estado=${elegido.clave}`;

    const cursosConEscaner = new Set(filas.filter((f) => f.qr > 0).map((f) => f.courseId)).size;

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={auth.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CabeceraListado
                    titulo="Clases y su parte de asistencia"
                    descripcion={`${clases.length} clases dictadas en el período, de cursos con alumnos inscriptos.`}
                    volverA={volverA}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock size={16} className="text-primary" />
                        {periodo.etiqueta}
                    </span>
                    <PeriodSelector
                        valor={periodo.clave}
                        anios={aniosDisponibles(primeraClase._min.date, hoyInstituto)}
                        anioActual={hoyInstituto.getUTCFullYear()}
                        mesActual={hoyInstituto.getUTCMonth() + 1}
                        base={baseDelSelector}
                    />
                </div>

                <Filtros
                    base={base}
                    actual={elegido.clave}
                    opciones={FILTROS.map((f) => ({
                        clave: f.clave,
                        etiqueta: f.etiqueta,
                        cantidad: filas.filter(f.test).length,
                    }))}
                />

                {elegido.clave === "con-escaner" && visibles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {visibles.length} {visibles.length === 1 ? "clase" : "clases"} con al menos una marca del
                        escáner, en {cursosConEscaner} {cursosConEscaner === 1 ? "curso" : "cursos"}.
                    </p>
                )}

                <Card className="overflow-hidden">
                    {visibles.length === 0 ? (
                        <ListaVacia>
                            {clases.length === 0
                                ? "No se dictaron clases en este período."
                                : "Ninguna clase del período está en esa situación."}
                        </ListaVacia>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full min-w-[820px]">
                                <thead>
                                    <tr className="border-b border-border">
                                        <Th>Fecha</Th>
                                        <Th>Curso</Th>
                                        <Th>Tema</Th>
                                        <Th>Docente</Th>
                                        <Th>Marcas</Th>
                                        <Th>Estado</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibles.map((f) => {
                                        const distintivo = DISTINTIVO[f.estado];
                                        return (
                                            <tr key={f.id} className="border-b border-border/50 last:border-0">
                                                <td className="px-3 py-3 text-sm tabular-nums whitespace-nowrap">
                                                    {f.date.getUTCDate()}{" "}
                                                    {getMonthName(f.date.getUTCMonth() + 1)
                                                        .slice(0, 3)
                                                        .toLowerCase()}
                                                </td>
                                                <td className="px-3 py-3 text-sm">
                                                    <Link
                                                        href={`/courses/${f.courseId}`}
                                                        className="hover:text-primary transition-colors"
                                                    >
                                                        {f.course.level || f.course.name}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Link
                                                        href={`/courses/${f.courseId}/lessons/${f.id}/attendance`}
                                                        className="text-sm font-medium hover:text-primary transition-colors"
                                                    >
                                                        {f.topic}
                                                    </Link>
                                                    {TIPO[f.type] && (
                                                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                                            {TIPO[f.type]}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-sm text-muted-foreground">
                                                    {f.course.teacher?.name || (
                                                        <span className="text-muted-foreground/50">Sin asignar</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-sm tabular-nums whitespace-nowrap">
                                                    {f.marcas} de {f.inscriptos}
                                                    {f.qr > 0 && (
                                                        <span
                                                            className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                            title={`${f.qr} con el escáner`}
                                                        >
                                                            <QrCode size={10} />
                                                            {f.qr}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${distintivo.clases}`}
                                                    >
                                                        {distintivo.texto}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
