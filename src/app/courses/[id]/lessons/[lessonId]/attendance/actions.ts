"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveLessonAttendanceAction(
    lessonId: string,
    courseId: string,
    records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" | "JUSTIFIED"; notes?: string }[]
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "No autenticado" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const existingAttendances = await tx.attendance.findMany({
                where: { lessonId: lessonId }
            });

            for (const record of records) {
                const existing = existingAttendances.find(a => a.studentId === record.studentId);

                if (existing) {
                    await tx.attendance.update({
                        where: { id: existing.id },
                        data: {
                            status: record.status,
                            notes: record.notes || null,
                        }
                    });
                } else {
                    await tx.attendance.create({
                        data: {
                            studentId: record.studentId,
                            lessonId: lessonId,
                            status: record.status,
                            notes: record.notes || null,
                        }
                    });
                }
            }
        });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath(`/courses/${courseId}/lessons/${lessonId}/attendance`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al guardar el parte de asistencia." };
    }
}
