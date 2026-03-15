"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function activateStudentAction(studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { instituteId: true }
    });

    if (!admin || !admin.instituteId) return { success: false, error: "Usuario no pertenece a ningún instituto" };

    try {
        await prisma.student.update({
            where: { 
                id: studentId,
                instituteId: admin.instituteId // Aislamiento multi-tenancy
            },
            data: { status: "ACTIVE" }
        });

        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al activar estudiante o permisos insuficientes" };
    }
}
