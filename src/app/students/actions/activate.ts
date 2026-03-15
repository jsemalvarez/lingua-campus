"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function activateStudentAction(studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autorizado" };

    try {
        await prisma.student.update({
            where: { id: studentId },
            data: { status: "ACTIVE" }
        });

        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al activar estudiante" };
    }
}
