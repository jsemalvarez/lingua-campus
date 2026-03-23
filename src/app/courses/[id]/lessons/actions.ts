"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createLessonAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "No autenticado" };
    }

    const courseId = formData.get("courseId") as string;
    const dateStr = formData.get("date") as string;
    const topic = formData.get("topic") as string;
    const content = formData.get("content") as string;
    const type = (formData.get("type") as any) || "CLASS";
    const scheduleId = formData.get("scheduleId") as string;

    if (!courseId || !dateStr || !topic) {
        return { success: false, error: "Faltan datos requeridos (Fecha y Tema)" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true, instituteId: true }
        });

        if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
            return { success: false, error: "No autorizado" };
        }

        // Store as UTC noon to avoid timezone shift on the date boundary anywhere in the world
        const date = new Date(`${dateStr}T12:00:00Z`);

        // Verify course belongs to same institute
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { instituteId: true }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "No autorizado (El curso no pertenece a tu instituto)" };
        }

        await prisma.lesson.create({
            data: {
                courseId,
                date,
                topic,
                content: content || null,
                type,
                scheduleId: scheduleId || null
            }
        });

        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error creating lesson:", error);
        return { success: false, error: error.message || "No se pudo crear la clase" };
    }
}

export async function editLessonAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "No autenticado" };
    }

    const lessonId = formData.get("lessonId") as string;
    const courseId = formData.get("courseId") as string;
    const dateStr = formData.get("date") as string;
    const topic = formData.get("topic") as string;
    const content = formData.get("content") as string;
    const type = (formData.get("type") as any) || "CLASS";
    const scheduleId = formData.get("scheduleId") as string;

    if (!lessonId || !courseId || !dateStr || !topic) {
        return { success: false, error: "Faltan datos requeridos (Fecha y Tema)" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true, instituteId: true }
        });

        if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
            return { success: false, error: "No autorizado" };
        }

        // Store as UTC noon
        const date = new Date(`${dateStr}T12:00:00Z`);

        // Verify lesson and course belong to same institute
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { instituteId: true } } }
        });

        if (!lesson || lesson.course.instituteId !== user.instituteId) {
            return { success: false, error: "No autorizado (La clase no pertenece a tu instituto)" };
        }

        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                date,
                topic,
                content: content || null,
                type,
                scheduleId: scheduleId || null
            }
        });

        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error editing lesson:", error);
        return { success: false, error: error.message || "No se pudo editar la clase" };
    }
}

export async function deleteLessonAction(lessonId: string, courseId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "No autenticado" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true, instituteId: true }
        });

        if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
            return { success: false, error: "No autorizado" };
        }

        // Verify lesson belongs to same institute
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { instituteId: true } } }
        });

        if (!lesson || lesson.course.instituteId !== user.instituteId) {
            return { success: false, error: "No autorizado" };
        }

        await prisma.lesson.delete({
            where: { id: lessonId }
        });

        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting lesson:", error);
        return { success: false, error: error.message || "No se pudo eliminar la clase" };
    }
}

export async function generateLessonsAction(courseId: string, startDate: Date, endDate: Date) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "No autenticado" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true, instituteId: true }
        });

        if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
            return { success: false, error: "No autorizado" };
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { schedules: true }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado" };
        }

        const schedules = course.schedules;
        if (schedules.length === 0) {
            return { success: false, error: "El curso no tiene horarios configurados" };
        }

        let current = new Date(startDate);
        // Normalize to UTC Noon to be consistent with other parts of the app
        current.setUTCHours(12, 0, 0, 0);
        
        const last = new Date(endDate);
        last.setUTCHours(12, 0, 0, 0);

        const lessonsToCreate = [];

        while (current <= last) {
            const dayOfWeek = current.getUTCDay();
            const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);

            for (const schedule of daySchedules) {
                // Check if lesson already exists for this date and schedule
                const existing = await prisma.lesson.findFirst({
                    where: {
                        courseId,
                        date: current,
                        scheduleId: schedule.id
                    }
                });

                if (!existing) {
                    lessonsToCreate.push({
                        courseId,
                        date: new Date(current),
                        topic: "Clase Programada",
                        type: "CLASS" as const,
                        scheduleId: schedule.id
                    });
                }
            }
            current.setDate(current.getDate() + 1);
        }

        if (lessonsToCreate.length > 0) {
            await prisma.lesson.createMany({
                data: lessonsToCreate
            });
        }

        revalidatePath(`/courses/${courseId}`);
        return { success: true, count: lessonsToCreate.length };
    } catch (error: any) {
        console.error("Error generating lessons:", error);
        return { success: false, error: error.message || "No se pudieron generar las clases" };
    }
}
