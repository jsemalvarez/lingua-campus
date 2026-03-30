"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getAuthAndInstitute() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) return null;
    return user;
}

/**
 * Genera las cuotas mensuales para todos los alumnos inscriptos en cursos activos.
 * Evita duplicados para el mismo mes/año/inscripción.
 */
export async function generateMonthlyFeesAction(month?: number, year?: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const now = new Date();
    const targetMonth = month ?? (now.getMonth() + 1);
    const targetYear = year ?? now.getFullYear();

    try {
        // 1. Obtener todas las inscripciones activas del instituto
        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: "ACTIVE",
                course: {
                    instituteId: user.instituteId as string,
                    status: "ACTIVE"
                }
            },
            include: {
                course: true
            }
        });

        let createdCount = 0;

        // 2. Por cada inscripción, crear la cuota si no existe
        for (const enrollment of enrollments) {
            // Verificar si ya existe la cuota para este mes/año/inscripción
            const existing = await prisma.fee.findFirst({
                where: {
                    enrollmentId: enrollment.id,
                    month: targetMonth,
                    year: targetYear,
                    type: "MONTHLY"
                }
            });

            if (!existing) {
                const finalPrice = enrollment.customMonthlyPrice !== null 
                    ? enrollment.customMonthlyPrice 
                    : enrollment.course.monthlyPrice;

                if (finalPrice > 0) {
                    await prisma.fee.create({
                        data: {
                            studentId: enrollment.studentId,
                            enrollmentId: enrollment.id,
                            type: "MONTHLY",
                            originalAmount: finalPrice,
                            paidAmount: 0,
                            status: "PENDING",
                            month: targetMonth,
                            year: targetYear,
                            instituteId: user.instituteId as string
                        }
                    });
                    createdCount++;
                }
            }
        }

        revalidatePath("/payments");
        return { success: true, count: createdCount };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al generar cuotas" };
    }
}

/**
 * Genera matrículas anuales standalone para todos los estudiantes activos del instituto
 * que aún no tengan una matrícula registrada para ese año.
 */
export async function generateYearlyEnrollmentFeesAction(year: number, amount: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (!year || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Datos inválidos para la matrícula masiva" };
    }

    try {
        // Obtenemos a todos los estudiantes activos del instituto
        const students = await prisma.student.findMany({
            where: {
                instituteId: user.instituteId as string,
                status: "ACTIVE"
            },
            select: { id: true }
        });

        let createdCount = 0;

        for (const student of students) {
            // Verificamos si ya existe matrícula para este alumno en este año
            const existing = await prisma.fee.findFirst({
                where: {
                    studentId: student.id,
                    year: year,
                    type: "ENROLLMENT"
                }
            });

            if (!existing) {
                await prisma.fee.create({
                    data: {
                        studentId: student.id,
                        year: year,
                        month: new Date().getMonth() + 1, // Administrativo
                        type: "ENROLLMENT",
                        originalAmount: amount,
                        paidAmount: 0,
                        status: "PENDING",
                        instituteId: user.instituteId as string
                    }
                });
                createdCount++;
            }
        }

        revalidatePath("/payments");
        return { success: true, count: createdCount };
    } catch (e: any) {
        console.error(e);
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
