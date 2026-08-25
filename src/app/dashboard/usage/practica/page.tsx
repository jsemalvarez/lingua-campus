import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/authz";
import { instituteToday } from "@/lib/activity";
import { getMonthName } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { CalendarClock } from "lucide-react";
import { PeriodSelector } from "../PeriodSelector";
import { aniosDisponibles, clasesDelPeriodo, resolverPeriodo } from "../periodo";
import { practicaTieneContenido } from "../metricas";
import { CabeceraListado, Filtros, ListaVacia, Th } from "../Listado";

export const dynamic = "force-dynamic";

/**
 * El listado detrás de la métrica 3 del panel de uso (FEAT-11).
 *
 * **Las prácticas vacías no aparecen.** `LessonPractice` puede existir con
 * `speakingPhrases: []` y los otros dos campos en `null`: es una fila que se
 * creó y nunca se llenó, y mostrarla acá haría que el docente figure con trabajo
 * publicado que nadie hizo. Es la misma regla con la que el mosaico las descarta.
 *
 * **De la más nueva a la más vieja**, al revés que el listado de clases. Acá lo
 * accionable no es lo más viejo sino lo más reciente: a la práctica que se
 * publicó ayer y nadie usó todavía se le puede avisar al curso, y a la de marzo
 * ya no.
 */

export default async function PracticaUsagePage({
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

    const [practicas, primeraClase] = await Promise.all([
        prisma.lessonPractice.findMany({
            where: { isPublished: true, lesson: dentroDelPeriodo },
            select: {
                id: true,
                speakingPhrases: true,
                listeningText: true,
                chatScenario: true,
                lesson: {
                    select: {
                        id: true,
                        date: true,
                        topic: true,
                        courseId: true,
                        course: {
                            select: { name: true, level: true, teacher: { select: { name: true } } },
                        },
                    },
                },
                _count: { select: { sessions: true } },
            },
            orderBy: { lesson: { date: "desc" } },
        }),

        prisma.lesson.aggregate({
            where: { course: { instituteId } },
            _min: { date: true },
        }),
    ]);

    const filas = practicas.filter(practicaTieneContenido).map((p) => ({
        ...p,
        sesiones: p._count.sessions,
        partes: [
            p.speakingPhrases.length > 0 ? "Habla" : null,
            p.listeningText ? "Escucha" : null,
            p.chatScenario ? "Chat" : null,
        ].filter(Boolean) as string[],
    }));

    const FILTROS: { clave: string; etiqueta: string; test: (f: (typeof filas)[number]) => boolean }[] = [
        { clave: "todos", etiqueta: "Todas las publicadas", test: () => true },
        { clave: "sin-usar", etiqueta: "Nadie practicó", test: (f) => f.sesiones === 0 },
        { clave: "usada", etiqueta: "Con al menos una sesión", test: (f) => f.sesiones > 0 },
    ];

    const elegido = FILTROS.find((f) => f.clave === estado) ?? FILTROS[0];
    const visibles = filas.filter(elegido.test);

    const volverA = `/dashboard/usage?p=${periodo.clave}`;
    const base = `/dashboard/usage/practica?p=${periodo.clave}`;
    const baseDelSelector =
        elegido.clave === "todos"
            ? "/dashboard/usage/practica"
            : `/dashboard/usage/practica?estado=${elegido.clave}`;

    const cursos = new Set(filas.map((f) => f.lesson.courseId)).size;

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={auth.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CabeceraListado
                    titulo="Práctica publicada"
                    descripcion={`${filas.length} clases con práctica publicada en el período, en ${cursos} ${cursos === 1 ? "curso" : "cursos"}.`}
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

                <Card className="overflow-hidden">
                    {visibles.length === 0 ? (
                        <ListaVacia>
                            {filas.length === 0
                                ? "Ningún curso publicó práctica con contenido en este período."
                                : "Ninguna práctica del período está en esa situación."}
                        </ListaVacia>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full min-w-[760px]">
                                <thead>
                                    <tr className="border-b border-border">
                                        <Th>Fecha</Th>
                                        <Th>Curso</Th>
                                        <Th>Clase</Th>
                                        <Th>Docente</Th>
                                        <Th>Contenido</Th>
                                        <Th>Sesiones</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibles.map((f) => (
                                        <tr key={f.id} className="border-b border-border/50 last:border-0">
                                            <td className="px-3 py-3 text-sm tabular-nums whitespace-nowrap">
                                                {f.lesson.date.getUTCDate()}{" "}
                                                {getMonthName(f.lesson.date.getUTCMonth() + 1)
                                                    .slice(0, 3)
                                                    .toLowerCase()}
                                            </td>
                                            <td className="px-3 py-3 text-sm">
                                                <Link
                                                    href={`/courses/${f.lesson.courseId}`}
                                                    className="hover:text-primary transition-colors"
                                                >
                                                    {f.lesson.course.level || f.lesson.course.name}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3">
                                                <Link
                                                    href={`/courses/${f.lesson.courseId}/lessons/${f.lesson.id}/practice-preview`}
                                                    className="text-sm font-medium hover:text-primary transition-colors"
                                                >
                                                    {f.lesson.topic}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-muted-foreground">
                                                {f.lesson.course.teacher?.name || (
                                                    <span className="text-muted-foreground/50">Sin asignar</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="flex flex-wrap gap-1">
                                                    {f.partes.map((parte) => (
                                                        <span
                                                            key={parte}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20"
                                                        >
                                                            {parte}
                                                        </span>
                                                    ))}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-sm tabular-nums">
                                                {f.sesiones === 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500/20">
                                                        Nadie practicó
                                                    </span>
                                                ) : (
                                                    f.sesiones
                                                )}
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
