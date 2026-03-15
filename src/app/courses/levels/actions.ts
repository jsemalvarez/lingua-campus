"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function createLevelAction(data: { name: string }) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (!data.name.trim()) {
        return { success: false, error: "El nombre del nivel es obligatorio" };
    }

    try {
        await prisma.level.create({
            data: {
                name: data.name.trim(),
                instituteId: user.instituteId
            }
        });

        revalidatePath("/courses/levels");
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') {
            return { success: false, error: "Ya existe un nivel con ese nombre" };
        }
        return { success: false, error: "Error al crear el nivel" };
    }
}

export async function updateLevelAction(id: string, data: { name: string }) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (!data.name.trim()) {
        return { success: false, error: "El nombre del nivel es obligatorio" };
    }

    try {
        const level = await prisma.level.findUnique({ where: { id } });
        if (!level || level.instituteId !== user.instituteId) {
            return { success: false, error: "Nivel no encontrado" };
        }

        await prisma.level.update({
            where: { id },
            data: {
                name: data.name.trim()
            }
        });

        revalidatePath("/courses/levels");
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') {
            return { success: false, error: "Ya existe un nivel con ese nombre" };
        }
        return { success: false, error: "Error al actualizar el nivel" };
    }
}

export async function deleteLevelAction(id: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const level = await prisma.level.findUnique({ where: { id } });
        if (!level || level.instituteId !== user.instituteId) {
            return { success: false, error: "Nivel no encontrado" };
        }

        await prisma.level.delete({ where: { id } });

        revalidatePath("/courses/levels");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al eliminar el nivel" };
    }
}
