"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { INSTITUTE_ADMINS, requireRole } from "@/lib/authz";

export async function activateStudentAction(studentId: string) {
    const user = await requireRole(INSTITUTE_ADMINS);
    if (!user) {
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
