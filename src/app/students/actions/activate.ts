"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function activateStudentAction(studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true, roles: true }
    });

    if (!user || !user.instituteId) return { success: false, error: "Usuario no pertenece a ningún instituto" };

    const userRoles = (user?.roles as string[]) || [user?.role];
    const isAdmin = userRoles.some(r => ["ADMIN", "SUPERADMIN", "SECRETARY"].includes(r));

    if (!isAdmin) {
        return { success: false, error: "No tienes permisos para activar alumnos" };
    }

    try {
        await prisma.student.update({
            where: { 
                id: studentId,
                instituteId: user.instituteId // Aislamiento multi-tenancy
            },
            data: { status: "ACTIVE" }
        });

        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al activar estudiante o permisos insuficientes" };
    }
}
