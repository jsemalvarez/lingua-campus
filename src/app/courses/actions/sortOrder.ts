"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function updateCourseSortOrderAction(sortedCourseIds: string[]) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return { success: false, error: "No autorizado" };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, preferences: true }
        });

        if (!user) {
            return { success: false, error: "Usuario no encontrado" };
        }

        // Recuperar las preferencias actuales (si existen) o iniciar objeto limpio
        const currentPrefs = user.preferences && typeof user.preferences === 'object' && !Array.isArray(user.preferences)
            ? user.preferences as Record<string, any>
            : {};

        // Merge del order dentro del objeto de preferencias
        const newPrefs = {
            ...currentPrefs,
            courseOrder: sortedCourseIds
        };

        await prisma.user.update({
            where: { id: user.id },
            data: { preferences: newPrefs }
        });

        return { success: true };

    } catch (error) {
        console.error("Error updating course sort order:", error);
        return { success: false, error: "Error interno al guardar el nuevo orden" };
    }
}
