"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function editStudentAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const studentId = formData.get("studentId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    const guardian1Name = formData.get("guardian1Name") as string;
    const guardian1Relation = formData.get("guardian1Relation") as string;
    const guardian1Phone = formData.get("guardian1Phone") as string;

    const guardian2Name = formData.get("guardian2Name") as string;
    const guardian2Relation = formData.get("guardian2Relation") as string;
    const guardian2Phone = formData.get("guardian2Phone") as string;

    if (!studentId || !name) {
        return { success: false, error: "Faltan datos obligatorios (nombre)" };
    }

    try {
        // Validación de seguridad para que solo puedan actualizar estudiantes de su mismo instituto
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student || student.instituteId !== user.instituteId) {
            return { success: false, error: "Estudiante no encontrado o sin permisos" };
        }

        await prisma.student.update({
            where: { id: studentId },
            data: {
                name,
                email: email || null,
                phone: phone || null,
                guardian1Name: guardian1Name || null,
                guardian1Relation: guardian1Relation || null,
                guardian1Phone: guardian1Phone || null,
                guardian2Name: guardian2Name || null,
                guardian2Relation: guardian2Relation || null,
                guardian2Phone: guardian2Phone || null,
            }
        });

        revalidatePath(`/students/${studentId}`);
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error de base de datos al actualizar el estudiante" };
    }
}
