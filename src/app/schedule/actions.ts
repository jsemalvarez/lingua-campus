"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createScheduleAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const courseId = formData.get("courseId") as string;
    const dayOfWeek = parseInt(formData.get("dayOfWeek") as string, 10);
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const room = formData.get("room") as string;

    if (!courseId || isNaN(dayOfWeek) || !startTime || !endTime) {
        return { success: false, error: "Faltan datos obligatorios (Curso, día u horarios)" };
    }

    try {
        // Verificar que el curso pertenece al instituto del usuario
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado o sin permisos" };
        }

        // Prevenir solapamiento de aulas en el mismo horario (Opcional, pero ideal)
        // Por simplicidad, en este MVP se registra directamente. Se puede agregar lógica extra aquí.

        await prisma.schedule.create({
            data: {
                courseId,
                dayOfWeek,
                startTime,
                endTime,
                room: room || "Sin asignar"
            }
        });

        revalidatePath("/schedule");
        return { success: true };
    } catch (e: any) {
        console.error("Error creating schedule:", e);
        return { success: false, error: "Error de base de datos al crear horario" };
    }
}

export async function deleteScheduleAction(scheduleId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    try {
        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
            include: { course: true }
        });

        if (!schedule) return { success: false, error: "Horario no encontrado" };

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || schedule.course.instituteId !== user.instituteId) {
            return { success: false, error: "Sin permisos para eliminar" };
        }

        await prisma.schedule.delete({
            where: { id: scheduleId }
        });

        revalidatePath("/schedule");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al eliminar" };
    }
}
