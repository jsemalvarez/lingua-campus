import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/authz";
import { signsForThemselves } from "@/lib/reports/signatures";
import prisma from "@/lib/prisma";
import { Users, UserRound, KeyRound, CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

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
export default async function UsagePage() {
    const auth = await requireRole(["ADMIN"]);
    if (!auth) redirect("/dashboard");

    const { instituteId } = auth;
    const hoy = new Date();

    const [institute, students, guardians] = await Promise.all([
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

                {/* La zona de actividad llega con su propio selector de período. */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <CalendarClock className="text-primary" size={20} />
                        <h2 className="text-lg font-semibold text-muted-foreground">Actividad del período</h2>
                    </div>
                    <Card variant="bordered" className="text-center py-10">
                        <p className="text-sm text-muted-foreground">
                            Las clases con parte de asistencia, el escáner, la práctica y las personas activas por día
                            llegan acá, con su selector de mes.
                        </p>
                    </Card>
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
