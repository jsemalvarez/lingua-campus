"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";

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
        if (feesToCreate.length > 0) {
            await prisma.fee.createMany({
                data: feesToCreate
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
 * Genera matrículas anuales standalone para todos los estudiantes activos del instituto
 * que aún no tengan una matrícula registrada para ese año.
 * Optimizado para ejecuciones en masa de alto rendimiento.
 */
export async function generateYearlyEnrollmentFeesAction(year: number, amount: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (!year || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Datos inválidos para la matrícula masiva" };
    }

    try {
        // 1. Obtenemos a todos los estudiantes activos del instituto
        const students = await prisma.student.findMany({
            where: {
                instituteId: user.instituteId as string,
                status: "ACTIVE"
            },
            select: { id: true }
        });

        if (students.length === 0) {
            return { success: true, count: 0 };
        }

        // 2. Traemos en 1 sola query los estudiantes que ya tienen matrícula registrada para este año
        const existingFees = await prisma.fee.findMany({
            where: {
                instituteId: user.instituteId as string,
                year: year,
                type: "ENROLLMENT",
                studentId: {
                    in: students.map(s => s.id)
                }
            },
            select: { studentId: true }
        });

        const existingStudentIds = new Set(existingFees.map(f => f.studentId));
        const currentMonth = new Date().getMonth() + 1;

        // 3. Filtrar en memoria los estudiantes pendientes
        const feesToCreate = students
            .filter(student => !existingStudentIds.has(student.id))
            .map(student => ({
                studentId: student.id,
                year: year,
                month: currentMonth,
                type: "ENROLLMENT" as const,
                originalAmount: amount,
                paidAmount: 0,
                status: "PENDING" as const,
                instituteId: user.instituteId as string
            }));

        // 4. Crear masivamente en 1 sola query SQL
        if (feesToCreate.length > 0) {
            await prisma.fee.createMany({
                data: feesToCreate
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
 */
export async function deleteFeeAction(feeId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const fee = await prisma.fee.findUnique({
            where: { id: feeId },
            include: { payments: true }
        });

        if (!fee || fee.instituteId !== user.instituteId) {
            return { success: false, error: "Cuota no encontrada" };
        }

        if (fee.paidAmount > 0 || fee.payments.length > 0) {
            return { success: false, error: "No se puede eliminar una cuota que ya tiene pagos. Anule los pagos primero." };
        }

        await prisma.fee.delete({
            where: { id: feeId }
        });

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
