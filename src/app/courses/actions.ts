"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Función auxiliar para obtener el usuario autenticado y su instituto
async function getAuthAndInstitute() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) return null;
    return user;
}

export async function createCourseAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado o sin instituto asignado" };

    const name = formData.get("name") as string;
    const level = formData.get("level") as string;
    const color = formData.get("color") as string;
    const teacherId = formData.get("teacherId") as string;
    const classroomId = formData.get("classroomId") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;

    if (!name) {
        return { success: false, error: "El nombre del curso es obligatorio" };
    }

    try {
        await prisma.course.create({
            data: {
                name: name.trim(),
                level: level ? level.trim() : null,
                color: color || "#3b82f6",
                teacherId: teacherId || null,
                classroomId: classroomId || null,
                startDate: startDateStr ? new Date(startDateStr) : null,
                endDate: endDateStr ? new Date(endDateStr) : null,
                instituteId: user.instituteId as string,
            }
        });

        revalidatePath("/courses");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al crear curso" };
    }
}

export async function deleteCourseAction(id: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        // Verificar que el curso pertenece al instituto del usuario actual
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado o no pertenece a tu instituto" };
        }

        await prisma.course.delete({ where: { id } });

        revalidatePath("/courses");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "No se puede eliminar el curso. Revisa que no tenga alumnos inscriptos." };
    }
}

export async function addCourseScheduleAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const courseId = formData.get("courseId") as string;
    const dayOfWeekStr = formData.get("dayOfWeek") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    if (!courseId || !dayOfWeekStr || !startTime || !endTime) {
        return { success: false, error: "Todos los campos de horario son requeridos" };
    }

    const dayOfWeek = parseInt(dayOfWeekStr);
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return { success: false, error: "Día de la semana inválido" };
    }

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado o sin acceso" };
        }

        await prisma.schedule.create({
            data: {
                courseId,
                dayOfWeek,
                startTime,
                endTime
            }
        });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath(`/courses`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al agregar horario" };
    }
}

export async function removeCourseScheduleAction(scheduleId: string, courseId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "No autorizado para modificar este curso" };
        }

        await prisma.schedule.delete({ where: { id: scheduleId } });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath(`/courses`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al eliminar horario" };
    }
}

export async function updateCourseTeacherAction(courseId: string, teacherId: string | null) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };
    if (user.role !== "ADMIN") return { success: false, error: "Solo administradores pueden cambiar el profesor" };

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado o no pertenece a tu instituto" };
        }

        // Verify teacher belongs to the same institute (if not clearing)
        if (teacherId) {
            const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
            if (!teacher || teacher.instituteId !== user.instituteId || teacher.role !== "TEACHER") {
                return { success: false, error: "Profesor no válido" };
            }
        }

        await prisma.course.update({
            where: { id: courseId },
            data: { teacherId: teacherId || null }
        });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/courses");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al actualizar el profesor del curso" };
    }
}

export async function updateCourseAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };
    if (user.role !== "ADMIN") return { success: false, error: "Solo administradores pueden editar el curso" };

    const courseId = formData.get("id") as string;
    const name = formData.get("name") as string;
    const level = formData.get("level") as string;
    const color = formData.get("color") as string;
    const classroomId = formData.get("classroomId") as string;
    const teacherId = formData.get("teacherId") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;

    if (!courseId) return { success: false, error: "ID de curso no proporcionado" };
    if (!name?.trim()) {
        return { success: false, error: "El nombre del curso es obligatorio" };
    }

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado o no pertenece a tu instituto" };
        }

        await prisma.course.update({
            where: { id: courseId },
            data: {
                name: name.trim(),
                level: level?.trim() || null,
                color: color || "#3b82f6",
                classroomId: classroomId || null,
                teacherId: teacherId || null,
                startDate: startDateStr ? new Date(startDateStr) : null,
                endDate: endDateStr ? new Date(endDateStr) : null,
            }
        });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/courses");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al actualizar el curso" };
    }
}

export async function removeStudentFromCourseAction(enrollmentId: string, courseId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };
    if (user.role !== "ADMIN") return { success: false, error: "Solo administradores pueden desinscribir alumnos" };

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado o sin acceso" };
        }

        // Hard-delete: used for errors
        await prisma.enrollment.delete({
            where: { id: enrollmentId }
        });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/courses");
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al eliminar la inscripción" };
    }
}

export async function markEnrollmentIncompleteAction(enrollmentId: string, courseId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };
    if (user.role !== "ADMIN") return { success: false, error: "Solo administradores pueden modificar inscripciones" };

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado o sin acceso" };
        }

        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: "INCOMPLETE" }
        });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al marcar como incompleto" };
    }
}

export async function finishCourseAction(courseId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };
    if (user.role !== "ADMIN") return { success: false, error: "Solo administradores pueden finalizar cursos" };

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado o sin acceso" };
        }

        // 1. Mark the course as FINISHED
        // 2. Mark all currently ACTIVE enrollments as FINISHED
        await prisma.$transaction([
            prisma.course.update({
                where: { id: courseId },
                data: { status: "FINISHED" }
            }),
            prisma.enrollment.updateMany({
                where: { courseId: courseId, status: "ACTIVE" },
                data: { status: "FINISHED" }
            })
        ]);

        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/courses");
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al finalizar el curso" };
    }
}
