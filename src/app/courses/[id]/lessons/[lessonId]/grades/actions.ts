"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function saveLessonGradesAction(
    lessonId: string,
    courseId: string,
    records: { studentId: string; score: string; feedback?: string }[]
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "No autenticado" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const existingGrades = await tx.grade.findMany({
                where: { lessonId: lessonId }
            });

            for (const record of records) {
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
        return { success: false, error: error.message || "Error al guardar las notas." };
    }
}
