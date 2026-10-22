"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { ENROLLMENT_FEE_MONTH } from "@/lib/utils";
import { excludeNotYetDueFees } from "@/lib/feeDue";
import { instituteMonth } from "@/lib/dates";
import { monthlyFeesToIssue } from "@/lib/monthlyFees";

/** Copia textual del helper de `actions.ts`. Ver el comentario de allá. */
async function getAuthAndInstitute() {
    const auth = await requireRole(["ADMIN", "SECRETARY"]);
    if (!auth) return null;
    return { id: auth.userId, instituteId: auth.instituteId };
}

/**
 * Genera las cuotas mensuales del período para todo el instituto.
 *
 * A quién le corresponde lo decide `monthlyFeesToIssue`, la misma regla que usa
 * el alta de una inscripción (FIN-29). Acá queda sólo lo propio de la corrida:
 * el período elegido y el insert en una sola sentencia.
 *
 * Devuelve, además de cuántas emitió, cuántos alumnos quedaron afuera y por qué:
 * `skipped` los que tienen una cuota suelta del período (FIN-22), que hay que
 * revisar a mano, y `skippedDeleted` aquellos a los que el instituto ya les
 * borró la cuota de ese período, que no se vuelve a emitir.
 */
export async function generateMonthlyFeesAction(month?: number, year?: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const now = instituteMonth();
    const targetMonth = month ?? now.month;
    const targetYear = year ?? now.year;

    try {
        const { fees, skippedLoose, skippedDeleted } = await monthlyFeesToIssue(prisma, {
            instituteId: user.instituteId as string,
            month: targetMonth,
            year: targetYear,
        });

        // Una sola sentencia, y por eso fuera de una transacción (ver FIN-06).
        // `monthlyFeesToIssue` ya descartó lo emitido, y es lo que hace honesto al
        // contador; `skipDuplicates` se apoya en la restricción única de `Fee` para
        // que otra generación que se cuele en el medio no explote ni duplique.
        if (fees.length > 0) {
            await prisma.fee.createMany({
                data: fees,
                skipDuplicates: true
            });
        }

        revalidatePath("/payments");
        return {
            success: true,
            count: fees.length,
            skipped: skippedLoose,
            skippedDeleted
        };
    } catch (e: any) {
        console.error("Error al generar cuotas masivas:", e);
        return { success: false, error: "Error al generar cuotas" };
    }
}

/**
 * Las inscripciones que alcanza la matrícula de un año lectivo (FIN-14).
 *
 * El año lo da `course.startDate`, que es el criterio que ya usa
 * `createEnrollmentAction`, y se lee en UTC porque las fechas se guardan a
 * medianoche UTC: un curso que arranca el 1 de enero, leído en hora local, cae
 * en diciembre del año anterior.
 *
 * Los cursos **sin fecha** entran únicamente cuando el año pedido es el de
 * calendario. Si entraran siempre, pedir 2027 volvería a alcanzar a las
 * inscripciones de 2026 — que es exactamente la regresión que esto cierra.
 *
 * Lo usan la corrida y el conteo que la pantalla muestra antes de apretar. Va en
 * un solo lugar a propósito: si el conteo y la corrida usaran criterios
 * distintos, la pantalla prometería un número y el botón haría otro.
 */
function yearlyEnrollmentTargetsWhere(instituteId: string, year: number): Prisma.EnrollmentWhereInput {
    const startsInAcademicYear = {
        startDate: {
            gte: new Date(Date.UTC(year, 0, 1)),
            lt: new Date(Date.UTC(year + 1, 0, 1))
        }
    };

    const courseOfTheYear = year === instituteMonth().year
        ? { OR: [startsInAcademicYear, { startDate: null }] }
        : startsInAcademicYear;

    return {
        status: "ACTIVE",
        student: { status: "ACTIVE" },
        course: {
            instituteId,
            status: "ACTIVE",
            ...courseOfTheYear
        }
    };
}

/**
 * Cuántas inscripciones alcanza la matrícula de un año, para que la pantalla lo
 * diga **antes** de apretar (FIN-14). Con cero, el botón se deshabilita: un
 * botón que se aprieta y no hace nada se lee como una falla del sistema.
 *
 * Es sólo el alcance del año lectivo, no la cuenta de lo que se va a emitir: de
 * esas inscripciones, las que ya tienen su matrícula quedan afuera igual.
 */
export async function countYearlyEnrollmentTargetsAction(year: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (!year) return { success: false, error: "Año inválido" };

    try {
        const reached = await prisma.enrollment.count({
            where: yearlyEnrollmentTargetsWhere(user.instituteId as string, year)
        });
        return { success: true, reached };
    } catch (e: any) {
        console.error("Error al contar inscripciones del año lectivo:", e);
        return { success: false, error: "Error al contar inscripciones" };
    }
}

/**
 * Genera las matrículas anuales del instituto: **una por inscripción activa** que
 * todavía no tenga la suya. La matrícula es por curso, así que el alumno que hace
 * dos cursos paga dos (FIN-12); si el instituto quiere bonificar la segunda,
 * reparte el descuento al cobrar.
 *
 * El `amount` es el valor base y se aplica a todas, salvo que la inscripción
 * tenga precio propio (`customEnrollmentPrice`), que es como se cargan las becas.
 *
 * Optimizado para ejecuciones en masa de alto rendimiento (1 single SQL bulk insert).
 */
export async function generateYearlyEnrollmentFeesAction(year: number, amount: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (!year || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Datos inválidos para la matrícula masiva" };
    }

    try {
        // 1. Inscripciones activas de alumnos activos, en cursos activos del
        //    instituto **que pertenezcan al año lectivo pedido** (FIN-14).
        //
        //    Sin ese último filtro, pedir 2027 en diciembre de 2026 creaba
        //    matrículas 2027 atadas a las inscripciones de 2026. Después, al
        //    armar los cursos de 2027 e inscribir al alumno,
        //    `createEnrollmentAction` busca una anticipada **sin vincular**, no
        //    encuentra esta porque ya está vinculada, y emite otra: doble cobro.
        const enrollments = await prisma.enrollment.findMany({
            where: yearlyEnrollmentTargetsWhere(user.instituteId as string, year),
            select: { id: true, studentId: true, customEnrollmentPrice: true },
            orderBy: { enrolledAt: "asc" }
        });

        if (enrollments.length === 0) {
            return { success: true, count: 0 };
        }

        // 2. Traer en 1 sola query las matrículas que ya existen ese año para esos alumnos
        const existingFees = await prisma.fee.findMany({
            where: {
                instituteId: user.instituteId as string,
                year: year,
                type: "ENROLLMENT",
                studentId: {
                    in: [...new Set(enrollments.map(e => e.studentId))]
                }
            },
            select: { studentId: true, enrollmentId: true }
        });

        const coveredEnrollmentIds = new Set(
            existingFees.map(f => f.enrollmentId).filter((id): id is string => id !== null)
        );

        // Las matrículas anticipadas (sin `enrollmentId`) no dicen a qué curso van,
        // pero ya son plata facturada: cada una cubre una inscripción del alumno.
        // Sin esto, al alumno con una anticipada sin consumir se le cobraría dos veces.
        const pendingStandaloneByStudent = new Map<string, number>();
        for (const fee of existingFees) {
            if (fee.enrollmentId === null) {
                pendingStandaloneByStudent.set(
                    fee.studentId,
                    (pendingStandaloneByStudent.get(fee.studentId) ?? 0) + 1
                );
            }
        }

        // 3. Filtrar en memoria las inscripciones que necesitan matrícula
        const feesToCreate = [];
        for (const enrollment of enrollments) {
            if (coveredEnrollmentIds.has(enrollment.id)) continue;

            const standalone = pendingStandaloneByStudent.get(enrollment.studentId) ?? 0;
            if (standalone > 0) {
                pendingStandaloneByStudent.set(enrollment.studentId, standalone - 1);
                continue;
            }

            const finalPrice = enrollment.customEnrollmentPrice !== null
                ? enrollment.customEnrollmentPrice
                : amount;
            if (finalPrice <= 0) continue;

            feesToCreate.push({
                studentId: enrollment.studentId,
                enrollmentId: enrollment.id,
                year: year,
                month: ENROLLMENT_FEE_MONTH,
                type: "ENROLLMENT" as const,
                originalAmount: finalPrice,
                paidAmount: 0,
                status: "PENDING" as const,
                instituteId: user.instituteId as string
            });
        }

        // 4. Crear masivamente en 1 sola query SQL
        // Desde que la matrícula va vinculada a la inscripción y con el mes fijo, la
        // restricción única de `Fee` sí la alcanza: `skipDuplicates` deja que dos
        // generaciones simultáneas convivan sin duplicar ni explotar, y sigue siendo
        // una sola query — la razón por la que esto no va en una transacción (FIN-06).
        if (feesToCreate.length > 0) {
            await prisma.fee.createMany({
                data: feesToCreate,
                skipDuplicates: true
            });
        }

        revalidatePath("/payments");
        return { success: true, count: feesToCreate.length };
    } catch (e: any) {
        console.error("Error al generar matrículas masivas:", e);
        return { success: false, error: "Error al generar matrículas masivas" };
    }
}

/**
 * Obtiene el reporte de alumnos deudores
 */
export async function getDebtorsReportAction() {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const debtors = await prisma.fee.findMany({
            where: {
                instituteId: user.instituteId as string,
                status: { in: ["PENDING", "PARTIAL"] },
                originalAmount: { gt: 0 },
                // Filtramos por cuotas que ya deberían haber vencido (meses anteriores o actual)
                OR: [
                    { year: { lt: instituteMonth().year } },
                    { 
                        year: instituteMonth().year,
                        month: { lte: instituteMonth().month }
                    }
                ],
                // El derecho de examen vence con el examen, no con el mes 0.
                ...excludeNotYetDueFees()
            },
            include: {
                student: {
                    select: { name: true, phone: true }
                },
                enrollment: {
                    include: { course: { select: { name: true } } }
                }
            },
            orderBy: [
                { year: "asc" },
                { month: "asc" }
            ]
        });

        return { success: true, data: debtors };
    } catch (e: any) {
        return { success: false, error: "Error al obtener reporte" };
    }
}

/** Tope del motivo. El `input` de la pantalla lleva el mismo número. */
const DELETION_REASON_MAX = 200;

/**
 * Elimina fisicamente una cuota PENDIENTE. Sólo si no tiene pagos asociados.
 *
 * **Deja la foto de lo que borró, con motivo.** Es la única acción de plata que
 * no dejaba rastro: anular un pago, un gasto o un ingreso escribe su
 * contra-asiento con `operatorId`, pero acá la fila desaparecía y no quedaba
 * nada. No borra plata cobrada —se niega si la cuota tiene pagos— pero **borra
 * una deuda**, y eso hay que poder reconstruirlo. Ver SEC-03.
 *
 * SEC-03 lo resolvió con un asiento de importe 0 en `Transaction`, que fue un
 * puente y no la forma definitiva: quedaba **invisible** en la tabla del libro
 * mayor, que filtra los movimientos en cero —filtro que FIN-11 decidió mantener,
 * porque esa pantalla es la caja—, y no tenía dónde guardar el motivo. Desde
 * FEAT-10 el registro va a `FeeDeletion`, que es su propia tabla y tiene
 * pantalla: `/payments/deletions`.
 *
 * El motivo es **obligatorio**. Es más exigente que el de las anulaciones, que
 * es opcional, y es a propósito: al anular queda la fila original para mirar, y
 * acá no queda nada.
 */
export async function deleteFeeAction(feeId: string, reason: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const cleanReason = (reason ?? "").trim();
    if (!cleanReason) {
        return { success: false, error: "Escribí el motivo: sin él queda una fecha, no un rastro." };
    }
    if (cleanReason.length > DELETION_REASON_MAX) {
        return { success: false, error: `El motivo no puede pasar de ${DELETION_REASON_MAX} caracteres.` };
    }

    try {
        const fee = await prisma.fee.findUnique({
            where: { id: feeId },
            include: {
                payments: true,
                student: { select: { id: true, name: true } },
                // El curso es parte de la foto: la inscripción sigue existiendo,
                // pero la cuota que la nombraba no va a estar para preguntarle.
                enrollment: { select: { course: { select: { name: true } } } }
            }
        });

        if (!fee || fee.instituteId !== user.instituteId) {
            return { success: false, error: "Cuota no encontrada" };
        }

        if (fee.paidAmount > 0 || fee.payments.length > 0) {
            return { success: false, error: "No se puede eliminar una cuota que ya tiene pagos. Anule los pagos primero." };
        }

        // El registro y el borrado van juntos: si falla el borrado no queremos el
        // registro de una cuota que sigue existiendo, ni al revés — una cuota
        // borrada sin su motivo es exactamente el agujero que esto cierra.
        await prisma.$transaction([
            prisma.feeDeletion.create({
                data: {
                    instituteId: fee.instituteId,
                    studentId: fee.student.id,
                    studentName: fee.student.name,
                    type: fee.type,
                    year: fee.year,
                    month: fee.month,
                    amount: fee.originalAmount,
                    courseName: fee.enrollment?.course.name ?? null,
                    reason: cleanReason,
                    deletedById: user.id,
                }
            }),
            prisma.fee.delete({ where: { id: feeId } }),
        ]);

        revalidatePath("/payments/debtors");
        revalidatePath("/payments/deletions");
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al eliminar la cuota" };
    }
}

/**
 * Permite cambiar el monto original de una cuota PENDIENTE (sin pagos parciales).
 */
export async function editFeeAmountAction(feeId: string, newAmount: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (isNaN(newAmount) || newAmount <= 0) {
        return { success: false, error: "Monto inválido" };
    }

    try {
        const fee = await prisma.fee.findUnique({
            where: { id: feeId }
        });

        if (!fee || fee.instituteId !== user.instituteId) {
            return { success: false, error: "Cuota no encontrada" };
        }

        if (fee.paidAmount > 0) {
            return { success: false, error: "No se puede editar el monto si la cuota ya tiene pagos parciales." };
        }

        await prisma.fee.update({
            where: { id: feeId },
            data: {
                originalAmount: newAmount
            }
        });

        revalidatePath("/payments/debtors");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al actualizar la cuota" };
    }
}
