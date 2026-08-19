"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireLessonWriteAccess } from "@/lib/lessonAccess";

/** Estados de matrícula que la pantalla de notas lista como alumnos del curso. */
const ENROLLED_STATUSES = ["ACTIVE", "FINISHED"];

export async function saveLessonGradesAction(
    lessonId: string,
    courseId: string,
    records: { studentId: string; score: string; feedback?: string }[]
) {
    // Hasta acá esta acción sólo pedía que hubiera sesión: cualquier usuario
    // autenticado —un tutor, un alumno, un docente de otro instituto— podía
    // escribir las notas de cualquier clase mandando los ids. La pantalla sí
    // exigía ser el docente del curso, pero la pantalla no es la que decide.
    const authorized = await requireLessonWriteAccess(lessonId, courseId, "las notas");
    if ("error" in authorized) {
        return { success: false, error: authorized.error };
    }

    if (records.length === 0) {
        return { success: true };
    }

    try {
        // Igual que en asistencia: sólo se le pone nota a quien está matriculado
        // en el curso. Sin esto, la nota de un alumno de otro curso entra por el
        // body y queda colgada de una clase que no le corresponde.
        const enrolled = await prisma.enrollment.findMany({
            where: {
                courseId: courseId,
                studentId: { in: records.map(r => r.studentId) },
                status: { in: ENROLLED_STATUSES }
            },
            select: { studentId: true }
        });

        const enrolledIds = new Set(enrolled.map(e => e.studentId));
        const validRecords = records.filter(r => enrolledIds.has(r.studentId));

        if (validRecords.length === 0) {
            return { success: false, error: "Ninguno de los alumnos enviados está matriculado en el curso." };
        }

        await prisma.$transaction(async (tx) => {
            const existingGrades = await tx.grade.findMany({
                where: { lessonId: lessonId }
            });

            for (const record of validRecords) {
                const existing = existingGrades.find(g => g.studentId === record.studentId);

                // Ignore completely empty records if no previous entry exists
                if (!existing && !record.score && !record.feedback) {
                    continue;
                }

                if (existing) {
                    await tx.grade.update({
                        where: { id: existing.id },
                        data: {
                            score: record.score || null,
                            feedback: record.feedback || null,
                        }
                    });
                } else {
                    await tx.grade.create({
                        data: {
                            studentId: record.studentId,
                            lessonId: lessonId,
                            score: record.score || null,
                            feedback: record.feedback || null,
                        }
                    });
                }
            }
        });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath(`/courses/${courseId}/lessons/${lessonId}/grades`);
        return { success: true };
    } catch (error: any) {
        // El error crudo de Prisma va al log del servidor, no a la pantalla del
        // docente. Es el mismo criterio que se adoptó en asistencia (BUG-07).
        console.error("Error guardando notas:", { lessonId, courseId, error });
        return { success: false, error: "Error al guardar las notas." };
    }
}
