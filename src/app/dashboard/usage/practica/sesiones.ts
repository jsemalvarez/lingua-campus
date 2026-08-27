import prisma from "@/lib/prisma";
import { INSTITUTE_TIME_ZONE } from "@/lib/activity";
import type { Periodo } from "../periodo";

/**
 * Métrica 9 · sesiones de práctica completadas por los alumnos (FEAT-16).
 *
 * **Es la otra mitad de la métrica 3.** Aquélla mide lo que el docente
 * publicó —la oferta—; ésta, lo que los alumnos practicaron —la demanda—.
 * Vivían en pantallas distintas y ninguna de las dos se podía interpretar sola:
 * si nadie practica, no se sabe si es porque no hay nada publicado o porque hay
 * y no llega. Juntas, se sabe.
 *
 * **Sin filtrar por estado de la clase, a propósito.** Acá se mide actividad, y
 * que el docente después borre la clase no hace que el alumno no haya
 * practicado. Se filtran los listados de clases, no las sesiones. Es la misma
 * decisión que ya traía el gráfico del Panel de Control.
 */

export type TipoDePractica = "SPEAKING" | "LISTENING" | "CHAT";

export const TIPOS: { clave: TipoDePractica; etiqueta: string; color: string }[] = [
    { clave: "SPEAKING", etiqueta: "Speaking", color: "#8b5cf6" },
    { clave: "LISTENING", etiqueta: "Listening", color: "#f59e0b" },
    { clave: "CHAT", etiqueta: "Chat con IA", color: "#10b981" },
];

export interface DiaDePractica {
    dia: string; // YYYY-MM-DD
    SPEAKING: number;
    LISTENING: number;
    CHAT: number;
}

export interface Sesiones {
    dias: DiaDePractica[];
    total: number;
    porTipo: Record<TipoDePractica, number>;
    /** Alumnos distintos que practicaron al menos una vez en el período. */
    alumnos: number;
}

export async function cargarSesiones(
    instituteId: string,
    periodo: Periodo
): Promise<Sesiones> {
    // El día se corta con el calendario del instituto, no con el del servidor.
    // `completedAt` es `timestamp without time zone` con la hora en UTC, así que
    // la conversión pasa por dos husos: primero se le dice a Postgres que lo que
    // hay guardado es UTC, y recién después se lo lleva a la hora de Argentina.
    // Sin el primer paso, una práctica de las 22:00 caería en el día siguiente —
    // que es el mismo casillero corrido que el registro de actividad ya evita.
    const local = `"completedAt" AT TIME ZONE 'UTC' AT TIME ZONE '${INSTITUTE_TIME_ZONE}'`;

    // Las fechas viajan como texto `YYYY-MM-DD` y se comparan como `date`: el
    // período son días de calendario, y mandarlos como marca de tiempo dejaría
    // el resultado a merced del huso de la conexión.
    const desde = periodo.desde.toISOString().slice(0, 10);
    const hasta = periodo.hasta.toISOString().slice(0, 10);

    // Se agrupa en la base: traer una fila por sesión para contarlas es lo que
    // hacía el gráfico del Panel de Control, que además pedía dos veces las
    // mismas sesiones para calcular dos cosas distintas.
    const [filas, distintos] = await Promise.all([
        prisma.$queryRawUnsafe<{ dia: Date; tipo: TipoDePractica; n: number }[]>(
            `SELECT (ps.${local})::date AS dia,
                    ps.type::text      AS tipo,
                    COUNT(*)::int      AS n
               FROM "PracticeSession" ps
               JOIN "Lesson" l ON l.id = ps."lessonId"
               JOIN "Course" c ON c.id = l."courseId"
              WHERE c."instituteId" = $1
                AND (ps.${local})::date BETWEEN $2::date AND $3::date
              GROUP BY 1, 2
              ORDER BY 1`,
            instituteId,
            desde,
            hasta
        ),
        prisma.$queryRawUnsafe<{ n: number }[]>(
            `SELECT COUNT(DISTINCT ps."studentId")::int AS n
               FROM "PracticeSession" ps
               JOIN "Lesson" l ON l.id = ps."lessonId"
               JOIN "Course" c ON c.id = l."courseId"
              WHERE c."instituteId" = $1
                AND (ps.${local})::date BETWEEN $2::date AND $3::date`,
            instituteId,
            desde,
            hasta
        ),
    ]);

    const porDia = new Map<string, DiaDePractica>();
    const porTipo: Record<TipoDePractica, number> = { SPEAKING: 0, LISTENING: 0, CHAT: 0 };

    for (const f of filas) {
        const dia = f.dia.toISOString().slice(0, 10);
        const actual = porDia.get(dia) ?? { dia, SPEAKING: 0, LISTENING: 0, CHAT: 0 };
        actual[f.tipo] = f.n;
        porDia.set(dia, actual);
        porTipo[f.tipo] += f.n;
    }

    return {
        dias: [...porDia.values()],
        total: porTipo.SPEAKING + porTipo.LISTENING + porTipo.CHAT,
        porTipo,
        alumnos: distintos[0]?.n ?? 0,
    };
}
