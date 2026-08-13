"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";
import { SCHEDULED_LESSON_TOPIC } from "@/lib/practice/draft";

export async function createLessonAction(formData: FormData) {

    const courseId = formData.get("courseId") as string;
    const dateStr = formData.get("date") as string;
    const topic = formData.get("topic") as string;
    const content = formData.get("content") as string;
    const type = (formData.get("type") as any) || "CLASS";
    const scheduleId = formData.get("scheduleId") as string;

    // Practice fields (only relevant for CLASS type)
    const speakingPhrasesRaw = formData.get("speakingPhrases") as string;
    const listeningText = formData.get("listeningText") as string;
    const chatScenario = formData.get("chatScenario") as string;
    const practicePublished = formData.get("practicePublished") === "true";

    if (!courseId || !dateStr || !topic) {
        return { success: false, error: "Faltan datos requeridos (Fecha y Tema)" };
    }

    try {
        const user = await requireRole(INSTITUTE_STAFF);
        if (!user) {
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

        // Parse speaking phrases: split by newline, trim, remove empty lines
        const speakingPhrases = speakingPhrasesRaw
            ? speakingPhrasesRaw.split("\n").map((p) => p.trim()).filter(Boolean)
            : [];

        // Only create LessonPractice if it's a CLASS and has at least one phrase
        const hasPractice = type === "CLASS" && speakingPhrases.length > 0;

        await prisma.lesson.create({
            data: {
                courseId,
                date,
                topic,
                content: content || null,
                type,
                scheduleId: scheduleId || null,
                ...(hasPractice && {
                    practice: {
                        create: {
                            speakingPhrases,
                            listeningText: listeningText || null,
                            chatScenario: chatScenario || null,
                            isPublished: practicePublished,
                        }
                    }
                })
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

    const lessonId = formData.get("lessonId") as string;
    const courseId = formData.get("courseId") as string;
    const dateStr = formData.get("date") as string;
    const topic = formData.get("topic") as string;
    const content = formData.get("content") as string;
    const type = (formData.get("type") as any) || "CLASS";
    const scheduleId = formData.get("scheduleId") as string;

    // Practice fields
    const speakingPhrasesRaw = formData.get("speakingPhrases") as string;
    const listeningText = formData.get("listeningText") as string;
    const chatScenario = formData.get("chatScenario") as string;
    const practicePublished = formData.get("practicePublished") === "true";

    if (!lessonId || !courseId || !dateStr || !topic) {
        return { success: false, error: "Faltan datos requeridos (Fecha y Tema)" };
    }

    try {
        const user = await requireRole(INSTITUTE_STAFF);
        if (!user) {
            return { success: false, error: "No autorizado" };
        }

        const date = new Date(`${dateStr}T12:00:00Z`);

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { instituteId: true } } }
        });

        if (!lesson || lesson.course.instituteId !== user.instituteId) {
            return { success: false, error: "No autorizado (La clase no pertenece a tu instituto)" };
        }

        if (lesson.status !== "ACTIVE") {
            return { success: false, error: "La clase fue eliminada" };
        }

        // Parse speaking phrases
        const speakingPhrases = speakingPhrasesRaw
            ? speakingPhrasesRaw.split("\n").map((p) => p.trim()).filter(Boolean)
            : [];

        const hasPractice = type === "CLASS" && speakingPhrases.length > 0;

        // Update lesson core fields
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

        if (hasPractice) {
            // Upsert: create if doesn't exist, update if it does
            await prisma.lessonPractice.upsert({
                where: { lessonId },
                create: {
                    lessonId,
                    speakingPhrases,
                    listeningText: listeningText || null,
                    chatScenario: chatScenario || null,
                    isPublished: practicePublished,
                },
                update: {
                    speakingPhrases,
                    listeningText: listeningText || null,
                    chatScenario: chatScenario || null,
                    isPublished: practicePublished,
                }
            });
        } else if (type === "CLASS" && speakingPhrases.length === 0) {
            // El docente vació las frases. Antes se borraba el `LessonPractice`,
            // y eso fallaba en cuanto algún alumno ya lo había practicado
            // (BUG-03): `PracticeSession` lo referencia sin cascade.
            //
            // Se vacía el contenido y se despublica, pero la fila queda. Para el
            // docente el efecto es el mismo —la práctica desaparece del curso—,
            // y las sesiones que los alumnos ya hicieron siguen en pie.
            await prisma.lessonPractice.updateMany({
                where: { lessonId },
                data: {
                    speakingPhrases: [],
                    listeningText: null,
                    chatScenario: null,
                    isPublished: false,
                }
            });
        }

        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error editing lesson:", error);
        return { success: false, error: error.message || "No se pudo editar la clase" };
    }
}


export async function deleteLessonAction(lessonId: string, courseId: string) {

    try {
        const user = await requireRole(INSTITUTE_STAFF);
        if (!user) {
            return { success: false, error: "No autorizado" };
        }

        // Verify lesson belongs to same institute
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { instituteId: true } } }
        });

        if (!lesson || lesson.course.instituteId !== user.instituteId || lesson.status !== "ACTIVE") {
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
        const user = await requireRole(INSTITUTE_STAFF);
        if (!user) {
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
