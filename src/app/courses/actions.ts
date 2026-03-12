"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
    const teacherId = formData.get("teacherId") as string;
    const classroomId = formData.get("classroomId") as string;

    if (!name) {
        return { success: false, error: "El nombre del curso es obligatorio" };
    }

    try {
        await prisma.course.create({
            data: {
                name: name.trim(),
                level: level ? level.trim() : null,
                teacherId: teacherId || null,
                classroomId: classroomId || null,
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

export async function updateCourseAction(courseId: string, data: { name?: string; level?: string; classroomId?: string; teacherId?: string | null }) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };
    if (user.role !== "ADMIN") return { success: false, error: "Solo administradores pueden editar el curso" };

    if (!data.name?.trim()) {
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
                name: data.name.trim(),
                level: data.level?.trim() || null,
                classroomId: data.classroomId || null,
                teacherId: data.teacherId || null,
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

        // Soft-drop: mark as DROPPED instead of deleting
        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: "DROPPED" }
        });

        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/courses");
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al desinscribir al estudiante" };
    }
}
