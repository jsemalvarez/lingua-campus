import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/authz";
import { signsForThemselves } from "@/lib/reports/signatures";
import { instituteToday } from "@/lib/activity";
import { getMonthName } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { Users, UserRound, KeyRound, CalendarClock, ClipboardCheck, QrCode, Sparkles, Info } from "lucide-react";
import { PeriodSelector } from "./PeriodSelector";
import { PISO_QR, PISO_REGISTRO, pisoCorto } from "./piso";
import { cargarActividad, DIAS_PARA_GRAFICAR } from "./actividad";
import { ActividadDiaria } from "./ActividadDiaria";
import { TutoresList } from "./TutoresList";

export const dynamic = "force-dynamic";

/** Un día de calendario del instituto, a medianoche UTC. */
function diaUTC(anio: number, mes1: number, dia: number): Date {
    return new Date(Date.UTC(anio, mes1 - 1, dia));
}

function formatoCorto(d: Date): string {
    return `${d.getUTCDate()} ${getMonthName(d.getUTCMonth() + 1).slice(0, 3).toLowerCase()}`;
}

interface Periodo {
    clave: string;
    desde: Date;
    hasta: Date;
    etiqueta: string;
}

/**
 * Resuelve el período elegido. El `hasta` nunca pasa de hoy: una clase que
 * todavía no se dictó no puede estar sin parte de asistencia.
 */
function resolverPeriodo(p: string | undefined, hoy: Date): Periodo {
    const mes = /^(\d{4})-(\d{2})$/.exec(p ?? "");

    if (mes) {
        const anio = Number(mes[1]);
        const m = Number(mes[2]);
        if (m >= 1 && m <= 12) {
            const desde = diaUTC(anio, m, 1);
            const finDeMes = new Date(Date.UTC(anio, m, 0));
            return {
                clave: `${mes[1]}-${mes[2]}`,
                desde,
                hasta: finDeMes > hoy ? hoy : finDeMes,
                etiqueta: `${getMonthName(m)} ${anio}`,
            };
        }
    }

    const desde = new Date(hoy);
    desde.setUTCDate(desde.getUTCDate() - 29);
    return {
        clave: "30d",
        desde,
        hasta: hoy,
        etiqueta: `${formatoCorto(desde)} – ${formatoCorto(hoy)}`,
    };
}

/**
 * Los años que se pueden elegir: desde el de la clase más vieja hasta el
 * actual, del más nuevo al más viejo. Se calculan de los datos y no de una
 * ventana fija, así el instituto puede mirar todo su historial y la lista crece
 * de a un año en vez de acumular meses.
 */
function aniosDisponibles(primeraClase: Date | null, hoy: Date): number[] {
    const actual = hoy.getUTCFullYear();
    const primero = primeraClase ? primeraClase.getUTCFullYear() : actual;
    const anios: number[] = [];
    for (let a = actual; a >= Math.min(primero, actual); a--) anios.push(a);
    return anios;
}

/**
 * Panel de uso del sistema (FEAT-11).
 *
 * **Es una pantalla aparte del Panel de Control a propósito.** Contesta otra
 * pregunta —"¿se usa el sistema?" en vez de "¿cómo va el instituto?"— y se mira
 * en otro momento. Meterla en el dashboard mezclaba las dos y le sumaba
 * consultas a una pantalla que ya hace siete en serie.
 *
 * **Sólo ADMIN.** La secretaría aparece *adentro* de varias de estas métricas,
 * así que no es quien las mira. Es el mismo criterio de SEC-03 con egresos y
 * sueldos.
 *
 * Esta primera entrega trae la zona **"Estado de hoy"**, que es una foto y no
 * depende de ningún período. La zona de actividad, con su selector de mes,
 * viene aparte.
 */
export default async function UsagePage({
    searchParams,
}: {
    searchParams: Promise<{ p?: string }>;
}) {
    const auth = await requireRole(["ADMIN"]);
    if (!auth) redirect("/dashboard");

    const { instituteId } = auth;
    const hoy = new Date();

    // El mismo "hoy" con el que se escribe la actividad, para que el último día
    // del rango coincida con el último día registrado.
    const hoyInstituto = instituteToday();
    const { p } = await searchParams;
    const periodo = resolverPeriodo(p, hoyInstituto);

    const [institute, students, guardians, primeraClase] = await Promise.all([
        prisma.institute.findUnique({
            where: { id: instituteId },
            select: { name: true },
        }),

        // Todo lo que hace falta para clasificar al alumno viene en una sola
        // consulta: el vínculo con el tutor se resuelve con un conteo, no
        // trayendo las filas.
        prisma.student.findMany({
            where: { instituteId, status: "ACTIVE" },
            select: {
                birthDate: true,
                guardian1Name: true,
                guardian1Email: true,
                guardian2Name: true,
                guardian2Email: true,
                _count: { select: { guardianLinks: true } },
            },
        }),

        prisma.user.findMany({
            where: { instituteId, status: "ACTIVE", roles: { has: "GUARDIAN" } },
            select: { _count: { select: { guardianLinks: true } } },
        }),

        // Hasta dónde llega el historial, para no ofrecer años vacíos.
        prisma.lesson.aggregate({
            where: { course: { instituteId } },
            _min: { date: true },
        }),
    ]);

    // ── Métrica 4 · Alumnos y su tutor ──
    //
    // Cinco estados excluyentes, y **el orden importa**. Los dos chequeos de
    // tutor van primero para que "mayor de 20" quede sólo con los que no tienen
    // ninguno: ahí es donde sirve, sacando de la lista de faltantes a quien no
    // necesita tutor. Si fuera al revés, un alumno de 22 con su tutor cargado
    // saldría del conteo de vinculados sin motivo.
    const alumnos = {
        conCuenta: 0,
        conDatosSinCuenta: 0,
        firmanSolos: 0,
        sinFechaNacimiento: 0,
        sinNada: 0,
    };

    for (const alumno of students) {
        const tieneDatosDeTutor = Boolean(
            alumno.guardian1Name ||
            alumno.guardian1Email ||
            alumno.guardian2Name ||
            alumno.guardian2Email
        );

        if (alumno._count.guardianLinks > 0) {
            alumnos.conCuenta++;
        } else if (tieneDatosDeTutor) {
            alumnos.conDatosSinCuenta++;
        } else if (signsForThemselves(alumno.birthDate, hoy)) {
            alumnos.firmanSolos++;
        } else if (!alumno.birthDate) {
            alumnos.sinFechaNacimiento++;
        } else {
            alumnos.sinNada++;
        }
    }

    const totalAlumnos = students.length;

    // ── Métrica 5 · Tutores con cuenta ──
    const tutoresConAlumno = guardians.filter((g) => g._count.guardianLinks > 0).length;
    const tutoresSinAlumno = guardians.length - tutoresConAlumno;

    // ── Zona de actividad, acotada al período elegido ──
    //
    // El universo de clases excluye a los cursos **sin ningún inscripto activo**:
    // una clase sin alumnos figuraría "sin parte" para siempre y llenaría la
    // lista de trabajo con algo que nadie puede completar.
    const dentroDelPeriodo = {
        status: "ACTIVE" as const,
        date: { gte: periodo.desde, lte: periodo.hasta },
        course: { instituteId },
    };

    const [clases, marcasPorOrigen, leccionesConEscaner, practicas, cursosActivos] = await Promise.all([
        prisma.lesson.findMany({
            where: {
                ...dentroDelPeriodo,
                course: { instituteId, enrollments: { some: { status: "ACTIVE" } } },
            },
            select: {
                id: true,
                date: true,
                topic: true,
                courseId: true,
                course: {
                    select: {
                        name: true,
                        level: true,
                        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
                    },
                },
                _count: { select: { attendances: true } },
            },
            orderBy: { date: "asc" },
        }),

        prisma.attendance.groupBy({
            by: ["source"],
            where: { lesson: dentroDelPeriodo },
            _count: { _all: true },
        }),

        // Por clase y no por marca: el conteo de clases tiene techo, el de marcas
        // se multiplica por los alumnos de cada una.
        prisma.attendance.groupBy({
            by: ["lessonId"],
            where: { source: "QR", lesson: dentroDelPeriodo },
        }),

        prisma.lessonPractice.findMany({
            where: { isPublished: true, lesson: dentroDelPeriodo },
            select: {
                speakingPhrases: true,
                listeningText: true,
                chatScenario: true,
                lesson: { select: { courseId: true } },
                _count: { select: { sessions: true } },
            },
        }),

        prisma.course.count({ where: { instituteId, status: "ACTIVE" } }),
    ]);

    // ── Métrica 1 · Clases y su parte de asistencia ──
    //
    // Tres estados, no dos. Una clase con algunas marcas y no todas es alguien
    // que empezó y no terminó —o el escáner de la puerta sin que el docente
    // cerrara el parte—, y es el caso que más vale ver.
    let clasesCompletas = 0;
    let clasesIncompletas = 0;
    let clasesSinParte = 0;
    let masViejaSinParte: (typeof clases)[number] | null = null;

    for (const clase of clases) {
        const inscriptos = clase.course._count.enrollments;
        const marcas = clase._count.attendances;

        if (marcas === 0) {
            clasesSinParte++;
            if (!masViejaSinParte) masViejaSinParte = clase;
        } else if (marcas < inscriptos) {
            clasesIncompletas++;
        } else {
            clasesCompletas++;
        }
    }

    const clasesPendientes = clasesSinParte + clasesIncompletas;

    // ── Métrica 2 · Marcas con el escáner ──
    const marcasQr = marcasPorOrigen.find((m) => m.source === "QR")?._count._all ?? 0;
    const marcasAMano = marcasPorOrigen.find((m) => m.source === "MANUAL")?._count._all ?? 0;
    const totalMarcas = marcasQr + marcasAMano;
    const pctQr = totalMarcas === 0 ? 0 : Math.round((marcasQr / totalMarcas) * 100);

    const idsConEscaner = new Set(leccionesConEscaner.map((l) => l.lessonId));
    const cursosConEscaner = new Set(
        clases.filter((c) => idsConEscaner.has(c.id)).map((c) => c.courseId)
    ).size;

    // El período puede empezar antes de que la columna existiera; ahí lo de atrás
    // es aproximado y hay que decirlo (ver `PISO_QR`).
    const qrEsAproximado = periodo.desde < PISO_QR;

    // ── Métrica 3 · Práctica publicada ──
    //
    // La fila puede existir vacía: `speakingPhrases: []` con los otros dos en
    // `null` es una práctica que no existe. Contar la fila sería contar trabajo
    // que nadie hizo.
    const practicasConContenido = practicas.filter(
        (p) => p.speakingPhrases.length > 0 || Boolean(p.listeningText) || Boolean(p.chatScenario)
    );
    const practicasPublicadas = practicasConContenido.length;
    const practicasSinUsar = practicasConContenido.filter((p) => p._count.sessions === 0).length;
    const cursosConPractica = new Set(practicasConContenido.map((p) => p.lesson.courseId)).size;

    // ── Métricas 7 y 8 · lo que sale del registro de actividad ──
    const actividad = await cargarActividad(instituteId, periodo);

    const porcentaje = (valor: number) =>
        totalAlumnos === 0 ? 0 : (valor / totalAlumnos) * 100;

    const franjas = [
        { valor: alumnos.conCuenta, color: "#38b397" },
        { valor: alumnos.conDatosSinCuenta, color: "#f6a138" },
        { valor: alumnos.sinNada, color: "#dc2626" },
        { valor: alumnos.firmanSolos, color: "#2e3192" },
        { valor: alumnos.sinFechaNacimiento, color: "#d4d4d8" },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={auth.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <span className="text-sm font-semibold text-primary/80 uppercase tracking-wider">
                        {institute?.name || "Instituto"}
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight mt-1">Panel de uso</h1>
                    <p className="text-muted-foreground mt-1">
                        Cómo se usa el sistema. Los números del instituto están en el Panel de Control.
                    </p>
                </div>

                {/* ══ Estado de hoy ══ */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Users className="text-blue-600" size={20} />
                        <h2 className="text-lg font-semibold">Estado de hoy</h2>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border bg-muted/40 text-muted-foreground">
                            No depende del período
                        </span>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        {/* Alumnos y su tutor */}
                        <Card className="lg:col-span-1 flex flex-col gap-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Alumnos y su tutor</p>
                                    <h3 className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">
                                        {totalAlumnos}{" "}
                                        <span className="text-sm font-medium text-muted-foreground">activos</span>
                                    </h3>
                                </div>
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl shrink-0">
                                    <Users size={24} />
                                </div>
                            </div>

                            {totalAlumnos > 0 && (
                                <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                                    {franjas
                                        .filter((f) => f.valor > 0)
                                        .map((f, i) => (
                                            <div
                                                key={i}
                                                style={{ width: `${porcentaje(f.valor)}%`, backgroundColor: f.color }}
                                            />
                                        ))}
                                </div>
                            )}

                            <ul className="space-y-2.5">
                                <FilaEstado color="#38b397" etiqueta="Con cuenta de tutor vinculada" valor={alumnos.conCuenta} />
                                <FilaEstado
                                    color="#f6a138"
                                    etiqueta="Con datos, sin cuenta creada"
                                    valor={alumnos.conDatosSinCuenta}
                                    destacada
                                />
                                <FilaEstado color="#dc2626" etiqueta="Sin ningún dato de tutor" valor={alumnos.sinNada} />
                                <FilaEstado color="#2e3192" etiqueta="Mayores de 20, firman solos" valor={alumnos.firmanSolos} />
                                <FilaEstado
                                    color="#d4d4d8"
                                    etiqueta="Sin fecha de nacimiento"
                                    valor={alumnos.sinFechaNacimiento}
                                    apagada
                                />
                            </ul>

                            <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                                {alumnos.conDatosSinCuenta === 0 ? (
                                    "Todos los alumnos que necesitan tutor lo tienen con cuenta."
                                ) : (
                                    <>
                                        Hay <strong className="text-foreground">{alumnos.conDatosSinCuenta}</strong> con
                                        el tutor cargado y sin cuenta creada: se sabe a quién llamar y todavía no puede
                                        entrar.
                                    </>
                                )}
                            </p>
                        </Card>

                        {/* Tutores con cuenta */}
                        <Card className="flex flex-col gap-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tutores con cuenta</p>
                                    <h3 className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">
                                        {guardians.length}
                                    </h3>
                                </div>
                                <div className="bg-purple-50 text-purple-600 p-3 rounded-xl shrink-0">
                                    <UserRound size={24} />
                                </div>
                            </div>

                            <ul className="space-y-2.5">
                                <FilaEstado etiqueta="Con alumno vinculado" valor={tutoresConAlumno} />
                                <FilaEstado etiqueta="Sin ningún alumno" valor={tutoresSinAlumno} destacada />
                            </ul>

                            <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                                {tutoresSinAlumno === 0
                                    ? "Todas las cuentas de tutor llegan a un alumno."
                                    : `Esas ${tutoresSinAlumno} entran y ven el portal vacío.`}
                            </p>
                        </Card>

                        {/* Cuentas que nunca se usaron — todavía sin medir */}
                        <Card variant="bordered" className="flex flex-col gap-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Cuentas que nunca se usaron
                                    </p>
                                    <h3 className="text-xl font-semibold text-muted-foreground mt-2">Sin medir todavía</h3>
                                </div>
                                <div className="bg-muted/60 text-muted-foreground p-3 rounded-xl shrink-0">
                                    <KeyRound size={24} />
                                </div>
                            </div>

                            <div className="flex-1 flex items-center justify-center min-h-[88px]">
                                <div className="flex items-end gap-1.5 h-16 w-full opacity-30">
                                    {[8, 8, 8, 8, 8, 8, 8, 8].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-sm bg-border" style={{ height: h }} />
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                                Se detectan por la contraseña inicial sin cambiar, y eso necesita una pasada única sobre
                                las cuentas. <strong className="text-foreground">Se completa hacia atrás</strong> el día
                                que corra.
                            </p>
                        </Card>
                    </div>
                </section>

                {/* ══ Actividad del período ══ */}
                <section className="space-y-4">
                    {/* El selector vive acá y no en el encabezado de la pantalla:
                        gobierna sólo esta zona, y un control global sobre algo que
                        no es global es justamente la confusión que las dos zonas
                        vienen a evitar. */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <CalendarClock className="text-primary" size={20} />
                            <h2 className="text-lg font-semibold">Actividad del período</h2>
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary">
                                {periodo.etiqueta}
                            </span>
                        </div>
                        <PeriodSelector
                            valor={periodo.clave}
                            anios={aniosDisponibles(primeraClase._min.date, hoyInstituto)}
                            anioActual={hoyInstituto.getUTCFullYear()}
                            mesActual={hoyInstituto.getUTCMonth() + 1}
                        />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        {/* Clases y su parte de asistencia */}
                        <Card className="flex flex-col gap-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Clases sin parte de asistencia
                                    </p>
                                    <h3 className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">
                                        {clasesSinParte}{" "}
                                        <span className="text-sm font-medium text-muted-foreground">
                                            de {clases.length} dictadas
                                        </span>
                                    </h3>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl shrink-0">
                                    <ClipboardCheck size={24} />
                                </div>
                            </div>

                            {clases.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    No se dictaron clases en este período.
                                </p>
                            ) : (
                                <>
                                    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                                        {[
                                            { valor: clasesCompletas, color: "#38b397" },
                                            { valor: clasesIncompletas, color: "#f6a138" },
                                            { valor: clasesSinParte, color: "#dc2626" },
                                        ]
                                            .filter((f) => f.valor > 0)
                                            .map((f, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width: `${(f.valor / clases.length) * 100}%`,
                                                        backgroundColor: f.color,
                                                    }}
                                                />
                                            ))}
                                    </div>

                                    <ul className="space-y-2.5">
                                        <FilaEstado color="#38b397" etiqueta="Completas" valor={clasesCompletas} />
                                        <FilaEstado
                                            color="#f6a138"
                                            etiqueta="Incompletas — faltan alumnos"
                                            valor={clasesIncompletas}
                                            destacada
                                        />
                                        {/* Sin resaltar: este número YA es el titular
                                            de la tarjeta. El ámbar se reserva para
                                            las incompletas, que son las que el
                                            titular no muestra. */}
                                        <FilaEstado
                                            color="#dc2626"
                                            etiqueta="Sin ningún registro"
                                            valor={clasesSinParte}
                                        />
                                    </ul>
                                </>
                            )}

                            <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                                {clasesPendientes === 0 ? (
                                    clases.length === 0
                                        ? "El período no tiene clases para tomar asistencia."
                                        : "Todas las clases del período tienen su parte completo."
                                ) : masViejaSinParte ? (
                                    <>
                                        La más vieja sin parte:{" "}
                                        <strong className="text-foreground">
                                            {masViejaSinParte.date.getUTCDate()} de{" "}
                                            {getMonthName(masViejaSinParte.date.getUTCMonth() + 1).toLowerCase()}
                                        </strong>{" "}
                                        · {masViejaSinParte.course.level || masViejaSinParte.course.name}
                                    </>
                                ) : (
                                    <>
                                        Quedan <strong className="text-foreground">{clasesPendientes}</strong> partes
                                        empezados y sin terminar.
                                    </>
                                )}
                            </p>
                        </Card>

                        {/* Marcas con el escáner */}
                        <Card className="flex flex-col gap-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Asistencia marcada con el escáner
                                    </p>
                                    <h3 className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">
                                        {pctQr}%{" "}
                                        <span className="text-sm font-medium text-muted-foreground">
                                            de {totalMarcas.toLocaleString("es-AR")} marcas
                                        </span>
                                    </h3>
                                </div>
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl shrink-0">
                                    <QrCode size={24} />
                                </div>
                            </div>

                            {totalMarcas === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    No se registró ninguna asistencia en este período.
                                </p>
                            ) : (
                                <>
                                    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                                        {marcasQr > 0 && (
                                            <div style={{ width: `${pctQr}%`, backgroundColor: "#2563eb" }} />
                                        )}
                                        {marcasAMano > 0 && (
                                            <div style={{ width: `${100 - pctQr}%`, backgroundColor: "#d4d4d8" }} />
                                        )}
                                    </div>

                                    <ul className="space-y-2.5">
                                        <FilaEstado color="#2563eb" etiqueta="Con el escáner" valor={marcasQr} />
                                        <FilaEstado color="#d4d4d8" etiqueta="Cargadas a mano" valor={marcasAMano} />
                                        <FilaEstado
                                            etiqueta={`Cursos que lo usaron, de ${cursosActivos} activos`}
                                            valor={cursosConEscaner}
                                        />
                                    </ul>
                                </>
                            )}

                            <div className="flex items-start gap-2 pt-3 border-t border-border/60 mt-auto">
                                <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {qrEsAproximado ? (
                                        <>
                                            El origen se distingue desde el{" "}
                                            <strong className="text-foreground">{pisoCorto(PISO_QR)}</strong>. Lo
                                            anterior se dedujo de un texto que se podía editar, así que es aproximado.
                                        </>
                                    ) : (
                                        "El origen de cada marca se registra en la propia asistencia."
                                    )}
                                </p>
                            </div>
                        </Card>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        {/* Práctica publicada */}
                        <Card className="flex flex-col gap-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Cursos con práctica publicada
                                    </p>
                                    <h3 className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">
                                        {cursosConPractica}{" "}
                                        <span className="text-sm font-medium text-muted-foreground">
                                            de {cursosActivos} activos
                                        </span>
                                    </h3>
                                </div>
                                <div className="bg-purple-50 text-purple-600 p-3 rounded-xl shrink-0">
                                    <Sparkles size={24} />
                                </div>
                            </div>

                            <ul className="space-y-2.5">
                                <FilaEstado etiqueta="Clases con práctica publicada" valor={practicasPublicadas} />
                                <FilaEstado
                                    etiqueta="Publicadas que nadie practicó"
                                    valor={practicasSinUsar}
                                    destacada
                                />
                            </ul>

                            <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                                {practicasPublicadas === 0
                                    ? "Ningún curso publicó práctica en este período."
                                    : practicasSinUsar === 0
                                        ? "Todo lo que se publicó se usó al menos una vez."
                                        : "El docente hizo el trabajo y no llegó a los alumnos: eso se arregla del lado del aviso, no del suyo."}
                            </p>
                        </Card>

                        <ActividadDiaria
                            dias={actividad.dias}
                            diasConDatos={actividad.diasConDatos}
                            piso={PISO_REGISTRO}
                            diasNecesarios={DIAS_PARA_GRAFICAR}
                        />
                    </div>

                    <TutoresList
                        tutores={actividad.tutores}
                        sinRastro={actividad.tutoresSinRastro}
                        total={actividad.totalTutores}
                        piso={PISO_REGISTRO}
                    />
                </section>
            </main>
        </div>
    );
}

/**
 * Una fila del desglose.
 *
 * **En cero, ninguna fila se destaca.** El resaltado ámbar quiere decir "esto
 * hay que resolverlo", y un cero es justamente lo contrario: pintarlo de naranja
 * le pone urgencia a una buena noticia. Por lo mismo la fila en cero se apaga
 * entera —punto incluido—: si no, el rojo de "sin ningún dato de tutor" tira el
 * ojo hacia un problema que no existe. La categoría se sigue mostrando, porque
 * un cero es información y mañana puede no serlo.
 */
function FilaEstado({
    color,
    etiqueta,
    valor,
    destacada = false,
    apagada = false,
}: {
    color?: string;
    etiqueta: string;
    valor: number;
    destacada?: boolean;
    apagada?: boolean;
}) {
    const enCero = valor === 0;
    const resaltar = destacada && !enCero;
    const atenuar = apagada || enCero;

    const tono = resaltar
        ? "font-semibold text-amber-700 dark:text-amber-500"
        : atenuar
            ? "text-muted-foreground"
            : "";

    return (
        <li
            className={`flex items-center justify-between gap-3 ${resaltar ? "bg-amber-500/10 -mx-2.5 px-2.5 py-1.5 rounded-lg" : ""
                }`}
        >
            <span className="flex items-center gap-2.5 min-w-0">
                {color && (
                    <span
                        className={`h-2 w-2 rounded-full shrink-0 ${enCero ? "opacity-30" : ""}`}
                        style={{ backgroundColor: color }}
                    />
                )}
                <span className={`text-sm truncate ${tono}`}>{etiqueta}</span>
            </span>
            <span className={`text-sm font-semibold tabular-nums shrink-0 ${tono}`}>{valor}</span>
        </li>
    );
}
