"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

        await prisma.lesson.create({
            data: {
                courseId,
                date,
                topic,
                content: content || null,
                type
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

        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                date,
                topic,
                content: content || null,
                type
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
