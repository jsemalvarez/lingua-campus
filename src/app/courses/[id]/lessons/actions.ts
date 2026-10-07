"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireCourseWriteAccess } from "@/lib/lessonAccess";
import { SCHEDULED_LESSON_TOPIC } from "@/lib/practice/draft";

/**
 * Crea una clase, un TP o un examen desde el libro de temas.
 *
 * La práctica ya no viaja acá: desde PED-09 la clase se crea con fecha, horario y
 * tema, y lo demás —contenidos, práctica— se carga en la página de la clase, que
 * se abre con el `lessonId` que devuelve esta acción.
 */
export async function createLessonAction(formData: FormData) {

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
        const authorized = await requireCourseWriteAccess(courseId);
        if ("error" in authorized) {
            return { success: false, error: authorized.error };
        }

        // Store as UTC noon to avoid timezone shift on the date boundary anywhere in the world
        const date = new Date(`${dateStr}T12:00:00Z`);

        const lesson = await prisma.lesson.create({
            data: {
                courseId,
                date,
                topic,
                content: content || null,
                type,
                scheduleId: scheduleId || null,
            },
            select: { id: true }
        });

        revalidatePath(`/courses/${courseId}`);
        return { success: true, lessonId: lesson.id };
    } catch (error: any) {
        console.error("Error creating lesson:", error);
        return { success: false, error: error.message || "No se pudo crear la clase" };
    }
}

/**
 * Edita un TP o un examen desde su modal. Las clases se editan en su página
 * (PED-09) y su práctica la guarda `saveLessonPracticeAction`: esta acción ya no
 * toca `LessonPractice`, así que aunque alguien la llamara con una clase, no le
 * vaciaría la práctica.
 */
export async function editLessonAction(formData: FormData) {

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
        const authorized = await requireCourseWriteAccess(courseId);
        if ("error" in authorized) {
            return { success: false, error: authorized.error };
        }

        const date = new Date(`${dateStr}T12:00:00Z`);

        // `courseId` va en el `where`: la clase que se edita tiene que ser del
        // curso que se autorizó. Antes se autorizaba contra el instituto de la
        // clase y `courseId` sólo servía para revalidar, así que el par de ids
        // podía no tener nada que ver entre sí.
        const lesson = await prisma.lesson.findFirst({
            where: { id: lessonId, courseId: courseId },
            select: { id: true, status: true }
        });

        if (!lesson) {
            return { success: false, error: "No autorizado (la clase no pertenece a este curso)" };
        }

        if (lesson.status !== "ACTIVE") {
            return { success: false, error: "La clase fue eliminada" };
        }

        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                date,
                topic,
                content: content || null,
                type,
                scheduleId: scheduleId || null,
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

    try {
        const authorized = await requireCourseWriteAccess(courseId);
        if ("error" in authorized) {
            return { success: false, error: authorized.error };
        }

        const lesson = await prisma.lesson.findFirst({
            where: { id: lessonId, courseId: courseId },
            select: { id: true, status: true }
        });

        if (!lesson || lesson.status !== "ACTIVE") {
            return { success: false, error: "No autorizado" };
        }

        // Borrado lógico. `PracticeSession` apunta a la clase sin cascade, así que
        // un `delete` fallaba en cuanto algún alumno hubiera practicado (BUG-02).
        // Y aunque no fallara, tampoco correspondía: las sesiones de práctica son
        // el historial del alumno, no algo que se lleve puesto el docente al sacar
        // la clase de la lista.
        await prisma.lesson.update({
            where: { id: lessonId },
            data: { status: "DELETED" }
        });

        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting lesson:", error);
        return { success: false, error: error.message || "No se pudo eliminar la clase" };
    }
}

export async function generateLessonsAction(courseId: string, startDate: Date, endDate: Date) {

    try {
        const authorized = await requireCourseWriteAccess(courseId);
        if ("error" in authorized) {
            return { success: false, error: authorized.error };
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { schedules: true }
        });

        if (!course) {
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
                // Check if lesson already exists for this date and schedule.
                //
                // A propósito **sin** filtrar por estado: una clase borrada sigue
                // ocupando su lugar. Filtrarla haría que regenerar el período
                // reviva lo que alguien borró a mano, y encima duplicado — la fila
                // vieja seguiría ahí. Para recuperar una clase borrada hay que
                // reactivarla, no volver a generarla.
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
                        topic: SCHEDULED_LESSON_TOPIC,
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
