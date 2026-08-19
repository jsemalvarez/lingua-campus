import prisma from "@/lib/prisma";

/**
 * Alcance de "los pares del mismo nivel" (FEAT-07).
 *
 * Un docente ve en el calendario las clases de los otros docentes que dan **su
 * mismo nivel**, para saber por dónde van. Es sólo lectura: el alcance de acá
 * abre una vista, nunca un permiso de escritura.
 *
 * **El nivel se compara por texto, a propósito.** `Course.level` es un `String?`
 * y `Level` es una tabla aparte, sin clave foránea que las una (ARQ-01). El
 * formulario de curso elige de la lista, así que en la práctica los textos
 * coinciden — pero renombrar un nivel no actualiza los cursos, y un curso viejo
 * puede quedar con un nombre que ya no existe. Arreglar la relación es ARQ-01 y
 * no entra acá; lo que importa es saber que el día que un docente diga "no veo a
 * mi par", es este texto el que hay que mirar.
 *
 * **Un curso sin nivel no tiene pares ni es par de nadie.** `level` en `null` es
 * un valor permitido hoy, y "mismo nivel" no significa nada cuando no hay nivel.
 */

/** Niveles que dicta un docente hoy. Vacío si no dicta ninguno con nivel cargado. */
export async function getPeerLevels(teacherId: string, instituteId: string): Promise<string[]> {
    const ownCourses = await prisma.course.findMany({
        where: { instituteId, teacherId, status: "ACTIVE" },
        select: { level: true },
        distinct: ["level"],
    });

    return ownCourses
        .map(course => course.level?.trim())
        .filter((level): level is string => !!level);
}

/**
 * Filtro de cursos visibles para un docente: los suyos, más los de sus pares si
 * la vista está encendida. Sin niveles propios no hay pares, y el filtro queda
 * en lo de siempre — que es lo que corresponde: quien no tiene nivel cargado no
 * pasa a ver el instituto entero.
 */
export function visibleCoursesFilter(teacherId: string, peerLevels: string[], includePeers: boolean) {
    if (!includePeers || peerLevels.length === 0) return { teacherId };

    return {
        OR: [
            { teacherId },
            // `teacherId: { not: null }`: un curso que no dicta nadie no es la
            // clase de un par. En producción hoy todos los cursos activos tienen
            // docente, así que esto no saca nada de la vista; lo que evita es que
            // un curso sin asignar aparezca rotulado «Otro docente», que sería
            // falso.
            { level: { in: peerLevels }, teacherId: { not: null } }
        ]
    };
}

/**
 * Si un curso es de un par: lo dicta otro docente y comparte nivel con alguno de
 * los suyos. Lo que **no** es par —otro nivel, sin nivel, o sin docente— no se ve.
 */
export function isPeerCourse(
    course: { teacherId: string | null; level: string | null },
    teacherId: string,
    peerLevels: string[]
): boolean {
    if (!course.teacherId || course.teacherId === teacherId) return false;

    const level = course.level?.trim();
    return !!level && peerLevels.includes(level);
}
