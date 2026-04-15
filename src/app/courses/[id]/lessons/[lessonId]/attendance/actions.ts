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

export async function scanAttendanceQRAction(
    lessonId: string,
    courseId: string,
    studentId: string
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "No autenticado" };
    }

    try {
        // 1. Validar que el alumno pertenece al curso
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: studentId,
                    courseId: courseId
                }
            },
            include: { student: true }
        });

        if (!enrollment || enrollment.status !== "ACTIVE") {
            return { 
                success: false, 
                error: "El estudiante no pertenece a este curso o no está activo." 
            };
        }

        // 2. Marcar presente
        await prisma.$transaction(async (tx) => {
            const existing = await tx.attendance.findUnique({
                where: {
                    studentId_lessonId: {
                        studentId: studentId,
                        lessonId: lessonId
                    }
                }
            });

            if (existing) {
                // Solo pisarlo si no era PRESENT (quizás le habían puesto Ausente por error)
                if (existing.status !== "PRESENT") {
                    await tx.attendance.update({
                        where: { id: existing.id },
                        data: { status: "PRESENT", notes: "Marcado vía QR Kiosk" }
                    });
                }
            } else {
                await tx.attendance.create({
                    data: {
                        studentId: studentId,
                        lessonId: lessonId,
                        status: "PRESENT",
                        notes: "Marcado vía QR Kiosk"
                    }
                });
            }
        });

        // 3. Revalidar cache suavemente
        revalidatePath(`/courses/${courseId}`);
        revalidatePath(`/courses/${courseId}/lessons/${lessonId}/attendance`);

        return { 
            success: true, 
            studentName: enrollment.student.name 
        };

    } catch (error: any) {
        console.error("QR Scan Error:", error);
        return { success: false, error: "Error interno al procesar el código QR." };
    }
}
