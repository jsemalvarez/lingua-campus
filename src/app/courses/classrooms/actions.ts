"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";

async function getAuthAndInstitute() {
    const auth = await requireRole(INSTITUTE_STAFF);
    if (!auth) return null;
    return { id: auth.userId, instituteId: auth.instituteId };
}

export async function getClassroomsAction() {
    const user = await getAuthAndInstitute();
    if (!user) return [];

    return await prisma.classroom.findMany({
        where: { instituteId: user.instituteId as string },
        orderBy: { name: 'asc' }
    });
}

export async function createClassroomAction(data: { name: string; capacity?: number }) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (!data.name.trim()) {
        return { success: false, error: "El nombre del aula es obligatorio" };
    }

    try {
        await prisma.classroom.create({
            data: {
                name: data.name.trim(),
                capacity: data.capacity || null,
                instituteId: user.instituteId as string
            }
        });

        revalidatePath("/courses/classrooms");
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') {
            return { success: false, error: "Ya existe un aula con ese nombre" };
        }
        return { success: false, error: "Error al crear el aula" };
    }
}

export async function updateClassroomAction(id: string, data: { name: string; capacity?: number }) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (!data.name.trim()) {
        return { success: false, error: "El nombre del aula es obligatorio" };
    }

    try {
        const classroom = await prisma.classroom.findUnique({ where: { id } });
        if (!classroom || classroom.instituteId !== user.instituteId) {
            return { success: false, error: "Aula no encontrada" };
        }

        await prisma.classroom.update({
            where: { id },
            data: {
                name: data.name.trim(),
                capacity: data.capacity || null
            }
        });

        revalidatePath("/courses/classrooms");
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') {
            return { success: false, error: "Ya existe un aula con ese nombre" };
        }
        return { success: false, error: "Error al actualizar el aula" };
    }
}

export async function deleteClassroomAction(id: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const classroom = await prisma.classroom.findUnique({ where: { id } });
        if (!classroom || classroom.instituteId !== user.instituteId) {
            return { success: false, error: "Aula no encontrada" };
        }

        await prisma.classroom.delete({ where: { id } });

        revalidatePath("/courses/classrooms");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al eliminar el aula" };
    }
}
