import { Prisma } from "@prisma/client";

/**
 * A quién le corresponde la cuota mensual de un período (FIN-29).
 *
 * **Una sola regla para los dos caminos que emiten cuotas mensuales**: la corrida
 * del botón *Generar Cuotas*, que la pide para todo el instituto, y el alta de una
 * inscripción, que la pide para una sola. Antes sólo emitía la corrida, y el que
 * se inscribía después de apretar el botón se quedaba sin la cuota de ese mes —
 * sin fila, así que tampoco figuraba en deudores. Las reglas viven acá y en ningún
 * otro lado: si se copiaran, la próxima se agregaría en uno solo de los dos, que
 * es exactamente como nació FIN-16.
 *
 * La cuota va **entera**, sin importar qué día del mes se inscribió el alumno:
 * así cobra el instituto (decidido el 2026-10-22). Si hace un descuento por
 * anotarse tarde, lo carga al cobrar.
 *
 * Le corresponde a una inscripción cuando:
 *
 * - está activa y se cobra por mes (`FULL_COURSE` no lleva mensuales, FIN-07);
 * - el alumno está activo (FIN-16) y el curso está activo;
 * - tiene precio: el propio de la inscripción, o si no hay, el del curso;
 * - todavía no tiene la cuota del período (la restricción única de FIN-06 lo
 *   sostiene igual si dos pedidos se cruzan) — tampoco anulada (FIN-33);
 * - el alumno no tiene una cuota **suelta** del período, sin inscripción (FIN-22);
 * - y **el instituto no le borró la cuota de ese período** (FEAT-10). Borrar es
 *   una decisión —«baja», «becada», «receso invernal»— y volver a apretar el botón
 *   no la puede deshacer. Antes la corrida la deshacía: emitía de nuevo, al precio
 *   de hoy, todo lo que se había borrado. Si se borró por error, el camino es
 *   reponerla (FEAT-26), no regenerar el mes.
 *
 * El borrado se registra por alumno y período, no por inscripción
 * (`FeeDeletion` no guarda `enrollmentId`). Así que al alumno que cursa dos cursos
 * y le borraron la cuota de uno, tampoco se le emite la del otro ese mes. Es raro,
 * queda contado en `skippedDeleted` y se ve.
 *
 * Lo que **no** mira, a propósito: las fechas del curso. El instituto reutiliza
 * cursos y les cambia la fecha de inicio a mitad de año —hay cuotas pagas de
 * marzo en cursos que hoy dicen empezar en agosto—, así que una regla de período
 * lectivo dejaría sin cobrar meses que se dictaron. Es la mitad abierta de FIN-16.
 */
export interface MonthlyFeesToIssue {
    /** Las filas listas para `fee.createMany`. */
    fees: Prisma.FeeCreateManyInput[];
    /** Alumnos que quedaron afuera por tener una cuota suelta del período (FIN-22). */
    skippedLoose: number;
    /** Alumnos que quedaron afuera porque el instituto les borró la cuota del período. */
    skippedDeleted: number;
}

export async function monthlyFeesToIssue(
    db: Prisma.TransactionClient,
    {
        instituteId,
        month,
        year,
        enrollmentId,
    }: {
        instituteId: string;
        month: number;
        year: number;
        /** Para el alta: sólo esta inscripción. Sin él, todo el instituto. */
        enrollmentId?: string;
    }
): Promise<MonthlyFeesToIssue> {
    const enrollments = await db.enrollment.findMany({
        where: {
            ...(enrollmentId ? { id: enrollmentId } : {}),
            status: "ACTIVE",
            billingMode: "MONTHLY",
            student: { status: "ACTIVE" },
            course: { instituteId, status: "ACTIVE" },
        },
        select: {
            id: true,
            studentId: true,
            customMonthlyPrice: true,
            course: { select: { monthlyPrice: true } },
        },
    });

    if (enrollments.length === 0) return { fees: [], skippedLoose: 0, skippedDeleted: 0 };

    const enrollmentIds = enrollments.map(e => e.id);
    const studentIds = [...new Set(enrollments.map(e => e.studentId))];
    const period = { instituteId, type: "MONTHLY" as const, month, year };

    // Tres lecturas del período, independientes entre sí: lo ya emitido por
    // inscripción, lo emitido suelto y lo borrado.
    const [existingFees, looseFees, deletions] = await Promise.all([
        db.fee.findMany({
            where: { ...period, enrollmentId: { in: enrollmentIds } },
            select: { enrollmentId: true, status: true },
        }),
        // Las sueltas no están en el `in` de arriba, y el índice único tampoco las
        // alcanza: Postgres no considera iguales dos NULL (FIN-22).
        db.fee.findMany({
            where: { ...period, enrollmentId: null, studentId: { in: studentIds } },
            select: { studentId: true },
        }),
        db.feeDeletion.findMany({
            where: { ...period, studentId: { in: studentIds } },
            select: { studentId: true },
        }),
    ]);

    // La anulada (FIN-33) también ocupa el período —no se vuelve a emitir—, pero
    // se cuenta con las borradas: para quien regenera, es una cuota que se sacó.
    const issued = new Set(existingFees.filter(f => f.status !== "CANCELLED").map(f => f.enrollmentId));
    const cancelled = new Set(existingFees.filter(f => f.status === "CANCELLED").map(f => f.enrollmentId));
    const withLooseFee = new Set(looseFees.map(f => f.studentId));
    const withDeletedFee = new Set(deletions.map(d => d.studentId));

    // Alumnos, no inscripciones: es el número que el operador tiene que ir a
    // mirar. Si uno tuviera dos inscripciones, sigue siendo un solo caso.
    const skippedLoose = new Set<string>();
    const skippedDeleted = new Set<string>();
    const fees: Prisma.FeeCreateManyInput[] = [];

    for (const enrollment of enrollments) {
        if (issued.has(enrollment.id)) continue;

        if (cancelled.has(enrollment.id)) {
            skippedDeleted.add(enrollment.studentId);
            continue;
        }

        // La cuota suelta es la buena, pero no sabemos de qué inscripción es: ni
        // se emite otra ni se la vincula acá (FIN-22). Se revisa a mano.
        if (withLooseFee.has(enrollment.studentId)) {
            skippedLoose.add(enrollment.studentId);
            continue;
        }

        if (withDeletedFee.has(enrollment.studentId)) {
            skippedDeleted.add(enrollment.studentId);
            continue;
        }

        const price = enrollment.customMonthlyPrice ?? enrollment.course.monthlyPrice;
        if (price <= 0) continue;

        fees.push({
            studentId: enrollment.studentId,
            enrollmentId: enrollment.id,
            type: "MONTHLY",
            originalAmount: price,
            paidAmount: 0,
            status: "PENDING",
            month,
            year,
            instituteId,
        });
    }

    return { fees, skippedLoose: skippedLoose.size, skippedDeleted: skippedDeleted.size };
}
