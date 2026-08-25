import prisma from "@/lib/prisma";
import type { Periodo } from "./periodo";

/**
 * Los datos que salen del registro de actividad (FEAT-11, métricas 7 y 8).
 *
 * Van aparte del resto de la pantalla porque comparten una particularidad que
 * las otras no tienen: **empiezan el día que se desplegó el registro**. Todo lo
 * demás del panel se reconstruye hacia atrás sin límite.
 *
 * **Son dos cargas y no una** porque tienen alcances distintos: el gráfico mira
 * el período elegido, la lista de tutores mira todo el historial —"último
 * rastro" no tiene sentido acotado a un mes—. El listado completo de tutores
 * necesita la segunda y no la primera, y juntas lo obligarían a agregar treinta
 * barras que nadie va a mirar.
 */

/**
 * Cómo se llaman en pantalla las secciones del portal del tutor.
 *
 * **Son los rótulos del menú, textuales.** El administrador tiene que poder
 * mirar el distintivo y saber a qué pantalla fue el tutor sin traducir nada; si
 * acá dijera "Portada" y el menú dijera "Resumen", serían dos nombres para lo
 * mismo. Viven en un solo lugar porque los usan la tarjeta del panel y el
 * listado completo, y un rótulo cambiado en uno solo de los dos es una
 * incoherencia que nadie ve hasta que la ve el instituto.
 */
export const NOMBRE_DE_SECCION: Record<string, string> = {
    GUARDIAN_HOME: "Resumen",
    GUARDIAN_ACADEMICS: "Progreso",
    GUARDIAN_PAYMENTS: "Administración",
};

/** Cómo agrupa el gráfico diario. */
export type Bucket = "alumno" | "tutor" | "staff";

export interface DiaActivo {
    dia: string; // YYYY-MM-DD
    alumno: number;
    tutor: number;
    staff: number;
}

export interface AlumnoDelTutor {
    id: string;
    nombre: string;
}

export interface RastroDeTutor {
    id: string;
    nombre: string;
    email: string;
    telefono: string | null;
    alumnos: AlumnoDelTutor[];
    /** `null` = sin ningún rastro. */
    visto: Date | null;
    /** `true` cuando el rastro sale del registro; `false` si es indirecto. */
    esIngreso: boolean;
    /** Secciones del portal abiertas el último día registrado. */
    secciones: string[];
}

export interface GraficoDiario {
    dias: DiaActivo[];
    diasConDatos: number;
}

export interface Tutores {
    lista: RastroDeTutor[];
    sinRastro: number;
    total: number;
}

/** Cuántos días de historia hacen falta antes de dibujar la curva diaria. */
export const DIAS_PARA_GRAFICAR = 30;

/** Métrica 7 · personas distintas con actividad cada día, por rol. */
export async function cargarGraficoDiario(
    instituteId: string,
    periodo: Periodo
): Promise<GraficoDiario> {
    // Se agrupa en la base y no en memoria: traer una fila por persona y por día
    // serían decenas de miles de filas para dibujar treinta barras.
    //
    // El orden de la clasificación importa: quien es tutor **y** además trabaja
    // en el instituto cuenta como staff. Es personal que además tiene un hijo
    // anotado, y contarlo entre los tutores inflaría la adopción de las familias
    // con gente que entra por su trabajo.
    const filas = await prisma.$queryRaw<{ dia: Date; bucket: Bucket; n: number }[]>`
        SELECT a.day AS dia,
               (CASE
                   WHEN a."subjectType" = 'STUDENT' THEN 'alumno'
                   WHEN a.roles && ARRAY['ADMIN','TEACHER','SECRETARY']::text[] THEN 'staff'
                   ELSE 'tutor'
                END) AS bucket,
               COUNT(*)::int AS n
          FROM "ActivityDay" a
         WHERE a."instituteId" = ${instituteId}
           AND a.day BETWEEN ${periodo.desde} AND ${periodo.hasta}
         GROUP BY a.day, bucket
         ORDER BY a.day ASC
    `;

    const porDia = new Map<string, DiaActivo>();
    for (const f of filas) {
        const dia = f.dia.toISOString().slice(0, 10);
        const actual = porDia.get(dia) ?? { dia, alumno: 0, tutor: 0, staff: 0 };
        actual[f.bucket] = f.n;
        porDia.set(dia, actual);
    }

    // Cuánta historia hay en total, no sólo en el período elegido: es lo que
    // decide si la curva ya significa algo.
    const historia = await prisma.$queryRaw<{ dias: number }[]>`
        SELECT COUNT(DISTINCT a.day)::int AS dias
          FROM "ActivityDay" a
         WHERE a."instituteId" = ${instituteId}
    `;

    return { dias: [...porDia.values()], diasConDatos: historia[0]?.dias ?? 0 };
}

/**
 * Métricas 5 y 8 · los tutores con cuenta y su último rastro.
 *
 * **No se acota al período** a propósito: la pregunta es "¿cuándo entró por
 * última vez?", y acotarla a agosto convertiría en "nunca" a quien entró en
 * julio. Es el mismo motivo por el que la métrica 5 vive en la zona de estado.
 */
export async function cargarTutores(instituteId: string): Promise<Tutores> {
    const tutores = await prisma.user.findMany({
        where: { instituteId, status: "ACTIVE", roles: { has: "GUARDIAN" } },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            guardianLinks: { select: { student: { select: { id: true, name: true } } } },
        },
    });

    if (tutores.length === 0) return { lista: [], sinRastro: 0, total: 0 };

    const ids = tutores.map((t) => t.id);

    // **Leer no deja rastro.** Cuando un tutor mira las notas o las asistencias,
    // el sistema no escribe nada — por eso existe el registro. Pero para lo
    // anterior al despliegue quedan tres huellas indirectas, que es mejor que
    // mostrar "nunca" a todo el mundo el primer mes.
    const [delRegistro, deMensajes, deFirmas] = await Promise.all([
        prisma.activityDay.groupBy({
            by: ["subjectId"],
            where: { subjectType: "USER", subjectId: { in: ids } },
            _max: { lastSeenAt: true, day: true },
        }),
        prisma.threadParticipant.groupBy({
            by: ["userId"],
            where: { userId: { in: ids }, lastReadAt: { not: null } },
            _max: { lastReadAt: true },
        }),
        prisma.signature.groupBy({
            by: ["userId"],
            where: { userId: { in: ids } },
            _max: { signedAt: true },
        }),
    ]);

    const ingreso = new Map(delRegistro.map((r) => [r.subjectId, r._max.lastSeenAt]));
    const ultimoDia = new Map(delRegistro.map((r) => [r.subjectId, r._max.day]));
    const indirecto = new Map<string, Date>();

    const anotarIndirecto = (id: string | null, fecha: Date | null | undefined) => {
        if (!id || !fecha) return;
        const previo = indirecto.get(id);
        if (!previo || fecha > previo) indirecto.set(id, fecha);
    };
    for (const m of deMensajes) anotarIndirecto(m.userId, m._max.lastReadAt);
    for (const f of deFirmas) anotarIndirecto(f.userId, f._max.signedAt);

    // Las secciones sólo se buscan para los que tienen registro, y sólo del
    // último día: es lo que contesta "¿qué miró?".
    const conRegistro = [...ingreso.keys()];
    const seccionesPorTutor = new Map<string, string[]>();
    if (conRegistro.length > 0) {
        const ultimos = await prisma.activityDay.findMany({
            where: {
                subjectType: "USER",
                subjectId: { in: conRegistro },
                day: { in: [...new Set([...ultimoDia.values()].filter(Boolean) as Date[])] },
            },
            select: { subjectId: true, day: true, sections: true },
        });
        for (const u of ultimos) {
            if (ultimoDia.get(u.subjectId)?.getTime() === u.day.getTime()) {
                seccionesPorTutor.set(u.subjectId, u.sections);
            }
        }
    }

    const lista: RastroDeTutor[] = tutores.map((t) => {
        const real = ingreso.get(t.id) ?? null;
        const otro = indirecto.get(t.id) ?? null;
        const visto = real && otro ? (real > otro ? real : otro) : (real ?? otro);

        return {
            id: t.id,
            nombre: t.name,
            email: t.email,
            telefono: t.phone,
            alumnos: t.guardianLinks.map((l) => ({ id: l.student.id, nombre: l.student.name })),
            visto,
            esIngreso: Boolean(real && visto && real.getTime() === visto.getTime()),
            secciones: seccionesPorTutor.get(t.id) ?? [],
        };
    });

    // Los más rancios primero: sin rastro arriba, después del más viejo al más
    // reciente. Es el orden que convierte la lista en una tanda de llamados.
    lista.sort((a, b) => {
        if (!a.visto && !b.visto) return a.nombre.localeCompare(b.nombre);
        if (!a.visto) return -1;
        if (!b.visto) return 1;
        return a.visto.getTime() - b.visto.getTime();
    });

    return {
        lista,
        sinRastro: lista.filter((t) => !t.visto).length,
        total: lista.length,
    };
}
