"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEnrollmentAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const studentId = formData.get("studentId") as string;
    const courseId = formData.get("courseId") as string;
    const customMonthlyPriceStr = formData.get("customMonthlyPrice") as string;
    const customEnrollmentPriceStr = formData.get("customEnrollmentPrice") as string;

    if (!studentId || !courseId) {
        return { success: false, error: "Debe seleccionar un alumno y un curso" };
    }

    try {
        // Validación extra: Verificar si ya existe esta inscripción concreta en el mundo real
        const existing = await prisma.enrollment.findUnique({
            where: { studentId_courseId: { studentId, courseId } }
        });

        if (existing) {
            return { success: false, error: "El estudiante ya se encuentra inscripto en este curso" };
        }

        // Crear la inscripción oficial
        const enrollment = await prisma.enrollment.create({
            data: {
                studentId,
                courseId,
                status: "ACTIVE",
                customMonthlyPrice: customMonthlyPriceStr ? parseFloat(customMonthlyPriceStr) : null,
                customEnrollmentPrice: customEnrollmentPriceStr ? parseFloat(customEnrollmentPriceStr) : null,
            },
            include: {
                course: true
            }
        });

        // 3. Vincular o Generar la "Matrícula" (Enrollment Fee) automáticamente
        const currentYear = new Date().getFullYear();
        const finalEnrollmentPrice = enrollment.customEnrollmentPrice !== null 
            ? enrollment.customEnrollmentPrice 
            : enrollment.course.enrollmentPrice;

        if (finalEnrollmentPrice > 0) {
            // Buscamos si ya existe una matrícula sin vincular (anticipada) para este alumno y año
            const existingStandaloneFee = await prisma.fee.findFirst({
                where: {
                    studentId,
                    type: "ENROLLMENT",
                    year: currentYear,
                    enrollmentId: null
                }
            });

            if (existingStandaloneFee) {
                // Vincular la existente
                await prisma.fee.update({
                    where: { id: existingStandaloneFee.id },
                    data: { enrollmentId: enrollment.id }
                });
            } else {
                // Crear una nueva
                await prisma.fee.create({
                    data: {
                        studentId,
                        enrollmentId: enrollment.id,
                        type: "ENROLLMENT",
                        originalAmount: finalEnrollmentPrice,
                        paidAmount: 0,
                        status: "PENDING",
                        month: new Date().getMonth() + 1,
                        year: currentYear,
                        instituteId: user.instituteId as string
                    }
                });
            }
        }

        // Revalidamos las pantallas afectadas
        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/courses");
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        // Error de Prisma si falla la constraint única u otro
        return { success: false, error: "Error al inscribir al estudiante. Verifica su estado." };
    }
}
