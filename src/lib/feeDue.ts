import { Prisma } from "@prisma/client";
import { instituteToday } from "@/lib/activity";

/**
 * Cuándo una cuota es deuda. Dos cosas emitidas todavía no lo son: el derecho de
 * examen antes del examen, y la cuota de un mes que no llegó.
 *
 * El derecho de examen:
 *
 * Vence el día del examen final de su curso (`Course.examDate`). Hasta ese día
 * —incluido— es un **pago futuro**: las familias lo van pagando de a partes
 * durante el año para llegar con el examen cubierto, y mostrarlo como deuda
 * morosa desde que se emite era decirles que debían algo que todavía no debían.
 * Si el curso no tiene fecha cargada, tampoco es deuda: no hay de qué vencer.
 *
 * La regla vive acá y en ningún otro lado. Cada pantalla que suma deuda —el
 * portal de las familias, el campus del alumno, Finanzas, Deudores— la toma de
 * este módulo, para que ninguna diga que debe lo que otra dice que no.
 *
 * Un derecho de examen sin inscripción no tiene curso del que leer la fecha, y
 * queda como estaba: deuda. Hoy no hay ninguno.
 */
export function isUpcomingExamFee(
    fee: { type: string },
    examDate: Date | null | undefined,
    today: Date = instituteToday()
): boolean {
    if (fee.type !== "EXAM") return false;
    if (!examDate) return true;
    return examDate.getTime() >= today.getTime();
}

/**
 * Lo mismo que `feeStanding`, como filtro de Prisma: se suma al `where` de una
 * consulta de cuotas para dejar afuera lo que todavía no es deuda.
 *
 * - el derecho de examen que no venció (`UPCOMING`);
 * - la cuota de un mes que todavía no llegó (`LATER`). Patricia puede generar
 *   noviembre y diciembre por adelantado, y eso no es deber noviembre en octubre.
 *
 * Las dos condiciones son el espejo exacto de `feeStanding`: si se toca una, se
 * toca la otra.
 */
export function excludeNotYetDueFees(today: Date = instituteToday()): Prisma.FeeWhereInput {
    const currentYear = today.getUTCFullYear();
    const currentMonth = today.getUTCMonth() + 1;

    return {
        AND: [
            {
                NOT: {
                    type: "EXAM",
                    enrollment: {
                        course: { OR: [{ examDate: null }, { examDate: { gte: today } }] }
                    }
                }
            },
            {
                NOT: {
                    OR: [
                        { year: { gt: currentYear } },
                        { year: currentYear, month: { gt: currentMonth } }
                    ]
                }
            }
        ]
    };
}

/**
 * Dónde cae una cuota impaga en el estado de cuenta que ven las familias y los
 * alumnos adultos:
 *
 * - `UPCOMING`: derecho de examen que todavía no venció. Pago futuro.
 * - `OVERDUE`: de un mes anterior al actual. Deuda.
 * - `CURRENT`: del mes en curso.
 * - `LATER`: cuota de un mes que todavía no llegó, ya emitida. No es deuda.
 *
 * `Fee.month` va de 1 a 12 —0 para matrículas y exámenes—, y el mes actual se
 * cuenta igual. Antes estas pantallas lo comparaban con `dayjs().month()`, que va
 * de 0 a 11: la cuota impaga del mes anterior figuraba como «del mes en curso» y
 * la del mes en curso no entraba en ninguno de los dos totales.
 */
export type FeeStanding = "UPCOMING" | "OVERDUE" | "CURRENT" | "LATER";

export function feeStanding(
    fee: {
        type: string;
        month: number;
        year: number;
        enrollment?: { course?: { examDate?: Date | null } | null } | null;
    },
    today: Date = instituteToday()
): FeeStanding {
    if (isUpcomingExamFee(fee, fee.enrollment?.course?.examDate, today)) return "UPCOMING";

    const currentYear = today.getUTCFullYear();
    const currentMonth = today.getUTCMonth() + 1;
    if (fee.year < currentYear || (fee.year === currentYear && fee.month < currentMonth)) return "OVERDUE";
    if (fee.year === currentYear && fee.month === currentMonth) return "CURRENT";
    return "LATER";
}

/**
 * Deja la clase del examen final del curso en la fecha del examen.
 *
 * Sin fecha no hace nada: antes la clase se creaba con el día en que se cargaba
 * el examen, que no es cuándo se rinde. Con fecha, la crea si no está o la mueve
 * si cambió. Se identifica por `finalExam` y no por el tipo, porque las
 * evaluaciones de unidad también son `EXAM`.
 */
export async function syncFinalExamLesson(
    tx: Prisma.TransactionClient,
    courseId: string,
    examDate: Date | null
): Promise<void> {
    if (!examDate) return;

    const lesson = await tx.lesson.findFirst({
        where: { courseId, finalExam: true, status: "ACTIVE" }
    });

    if (!lesson) {
        await tx.lesson.create({
            data: {
                courseId,
                type: "EXAM",
                finalExam: true,
                date: examDate,
                topic: "Examen Final",
                content: "Generado automáticamente por el registro de exámenes finales."
            }
        });
    } else if (lesson.date.getTime() !== examDate.getTime()) {
        await tx.lesson.update({ where: { id: lesson.id }, data: { date: examDate } });
    }
}
