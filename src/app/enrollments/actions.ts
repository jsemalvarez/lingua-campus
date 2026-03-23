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
        await prisma.enrollment.create({
            data: {
                studentId,
                courseId,
                status: "ACTIVE"
            }
        });

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
