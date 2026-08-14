"use server";

import prisma from "@/lib/prisma";
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
 */
export async function generateMonthlyFeesAction(month?: number, year?: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const now = new Date();
    const targetMonth = month ?? (now.getMonth() + 1);
    const targetYear = year ?? now.getFullYear();

    try {
        // 1. Obtener todas las inscripciones activas del instituto (solo modalidad cuotas mensuales)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: "ACTIVE",
                billingMode: "MONTHLY",
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
            return { success: true, count: 0 };
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

        // 3. Filtrar en memoria las inscripciones que necesitan nueva cuota
        const feesToCreate = enrollments
            .filter(enrollment => {
                if (existingEnrollmentIds.has(enrollment.id)) return false;
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
        return { success: true, count: feesToCreate.length };
    } catch (e: any) {
        console.error("Error al generar cuotas masivas:", e);
        return { success: false, error: "Error al generar cuotas" };
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
        // 1. Inscripciones activas de alumnos activos, en cursos activos del instituto
        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: "ACTIVE",
                student: { status: "ACTIVE" },
                course: {
                    instituteId: user.instituteId as string,
                    status: "ACTIVE"
                }
            },
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
