"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { ENROLLMENT_FEE_MONTH, formatFeeLabel } from "@/lib/utils";

/** Copia textual del helper de `actions.ts`. Ver el comentario de allá. */
async function getAuthAndInstitute() {
    const auth = await requireRole(["ADMIN", "SECRETARY"]);
    if (!auth) return null;
    return { id: auth.userId, instituteId: auth.instituteId };
}

/**
 * Genera las cuotas mensuales para todos los alumnos inscriptos en cursos activos.
 * Evita duplicados para el mismo mes/año/inscripción.
 * Optimizado para ejecuciones en masa de alto rendimiento (1 single SQL bulk insert).
 *
 * Devuelve además `skipped`: los alumnos que quedaron afuera por tener una cuota
 * suelta del período (ver FIN-22, abajo).
 */
export async function generateMonthlyFeesAction(month?: number, year?: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const now = new Date();
    const targetMonth = month ?? (now.getMonth() + 1);
    const targetYear = year ?? now.getFullYear();

    try {
        // 1. Obtener todas las inscripciones activas del instituto (solo modalidad cuotas mensuales)
        //
        // El filtro por `student.status` es de FIN-16: un alumno dado de baja cuya
        // inscripción quedó activa seguía generando cuotas. El generador anual ya lo
        // filtraba desde FIN-12; este se había quedado atrás.
        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: "ACTIVE",
                billingMode: "MONTHLY",
                student: {
                    status: "ACTIVE"
                },
                course: {
                    instituteId: user.instituteId as string,
                    status: "ACTIVE"
                }
            },
            include: {
                course: true
            }
        });

        if (enrollments.length === 0) {
            return { success: true, count: 0, skipped: 0 };
        }

        // 2. Traer en 1 sola query todas las cuotas ya existentes para este periodo
        const existingFees = await prisma.fee.findMany({
            where: {
                instituteId: user.instituteId as string,
                month: targetMonth,
                year: targetYear,
                type: "MONTHLY",
                enrollmentId: {
                    in: enrollments.map(e => e.id)
                }
            },
            select: { enrollmentId: true }
        });

        const existingEnrollmentIds = new Set(
            existingFees.map(f => f.enrollmentId).filter((id): id is string => id !== null)
        );

        // 2b. Las cuotas **sueltas** del período: mismo alumno, mismo mes, sin
        // inscripción. La consulta de arriba no las trae —no están en el `in` de
        // `enrollmentId`— y el índice único de FIN-06 tampoco las alcanza, porque
        // Postgres no considera iguales dos NULL. Sin esto, cada corrida le crea al
        // alumno una segunda cuota del mismo mes: es FIN-22, y es lo que le pasó a
        // los dos alumnos que reportó el instituto.
        //
        // Las hay sobre todo porque **desinscribir a un alumno borra la fila de
        // `Enrollment`** y la clave foránea de `Fee` es ON DELETE SET NULL: le suelta
        // todas las cuotas de golpe, incluidas las pagas (FIN-23, sin arreglar). Mover
        // a alguien de curso por desinscribir + inscribir pasa por ahí. La otra fuente,
        // menor, es la carga inicial de datos por script.
        const looseFees = await prisma.fee.findMany({
            where: {
                instituteId: user.instituteId as string,
                month: targetMonth,
                year: targetYear,
                type: "MONTHLY",
                enrollmentId: null,
                studentId: {
                    in: enrollments.map(e => e.studentId)
                }
            },
            select: { studentId: true }
        });

        const studentsWithLooseFee = new Set(looseFees.map(f => f.studentId));

        // 3. Filtrar en memoria las inscripciones que necesitan nueva cuota
        const feesToCreate = enrollments
            .filter(enrollment => {
                if (existingEnrollmentIds.has(enrollment.id)) return false;
                // El alumno ya tiene la cuota del mes, suelta. No se la generamos de
                // nuevo y **tampoco la vinculamos acá**: si tuviera dos inscripciones
                // activas no hay forma de saber de cuál es, y una corrida masiva no es
                // lugar para reescribir el historial. Queda para normalizar aparte, y
                // el operador se entera por el conteo que devolvemos (FIN-22).
                if (studentsWithLooseFee.has(enrollment.studentId)) return false;
                const finalPrice = enrollment.customMonthlyPrice !== null 
                    ? enrollment.customMonthlyPrice 
                    : enrollment.course.monthlyPrice;
                return finalPrice > 0;
            })
            .map(enrollment => {
                const finalPrice = enrollment.customMonthlyPrice !== null 
                    ? enrollment.customMonthlyPrice 
                    : enrollment.course.monthlyPrice;
                return {
                    studentId: enrollment.studentId,
                    enrollmentId: enrollment.id,
                    type: "MONTHLY" as const,
                    originalAmount: finalPrice,
                    paidAmount: 0,
                    status: "PENDING" as const,
                    month: targetMonth,
                    year: targetYear,
                    instituteId: user.instituteId as string
                };
            });

        // 4. Crear masivamente en 1 sola query SQL
        // El filtro en memoria de arriba se queda porque es lo que hace honesto al
        // contador, pero ya no es lo único que evita duplicados: entre esa consulta y
        // este insert se puede colar otra generación. `skipDuplicates` se apoya en la
        // restricción única de `Fee` para que la segunda no explote ni duplique, y
        // sigue siendo una sola query — que es la razón por la que esto no va dentro
        // de una transacción (ver FIN-06).
        if (feesToCreate.length > 0) {
            await prisma.fee.createMany({
                data: feesToCreate,
                skipDuplicates: true
            });
        }

        revalidatePath("/payments");
        return {
            success: true,
            count: feesToCreate.length,
            // Alumnos, no inscripciones: es el número que el operador tiene que ir a
            // mirar. Si un alumno con cuota suelta tuviera dos inscripciones, las dos
            // quedaron afuera y sigue siendo un solo caso para revisar.
            skipped: studentsWithLooseFee.size
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

    const courseOfTheYear = year === new Date().getFullYear()
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
                    { year: { lt: new Date().getFullYear() } },
                    { 
                        year: new Date().getFullYear(),
                        month: { lte: new Date().getMonth() + 1 }
                    }
                ]
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

/**
 * Elimina fisicamente una cuota PENDIENTE. Sólo si no tiene pagos asociados.
 *
 * **Deja asiento de quién la borró.** Es la única acción de plata que no dejaba
 * rastro: anular un pago, un gasto o un ingreso escribe su contra-asiento con
 * `operatorId`, pero acá la fila desaparecía y no quedaba nada. No borra plata
 * cobrada —se niega si la cuota tiene pagos— pero **borra una deuda**, y eso hay
 * que poder reconstruirlo. Ver SEC-03.
 *
 * El asiento va con importe 0 porque no hubo movimiento de dinero, con la misma
 * forma que usa la aplicación de saldo a favor. Dos límites conocidos: hoy **no
 * se ve en la tabla del libro mayor**, que filtra los de importe 0, y es un
 * tercer sentido para `ADJUSTMENT` — los dos los resuelve [FIN-11] cuando se
 * decida qué es esa tabla. El registro queda consultable igual, que es lo que
 * faltaba.
 */
export async function deleteFeeAction(feeId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const fee = await prisma.fee.findUnique({
            where: { id: feeId },
            include: { payments: true, student: { select: { name: true } } }
        });

        if (!fee || fee.instituteId !== user.instituteId) {
            return { success: false, error: "Cuota no encontrada" };
        }

        if (fee.paidAmount > 0 || fee.payments.length > 0) {
            return { success: false, error: "No se puede eliminar una cuota que ya tiene pagos. Anule los pagos primero." };
        }

        // El asiento y el borrado van juntos: si falla el borrado no queremos un
        // asiento de una cuota que sigue existiendo.
        await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    instituteId: fee.instituteId,
                    amount: 0,
                    type: "ADJUSTMENT",
                    method: "N/A",
                    description: `Cuota eliminada — ${formatFeeLabel(fee.type, fee.month, fee.year)} de ${fee.student.name} (importe $${fee.originalAmount.toLocaleString()})`,
                    operatorId: user.id,
                }
            }),
            prisma.fee.delete({ where: { id: feeId } }),
        ]);

        revalidatePath("/payments/debtors");
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
