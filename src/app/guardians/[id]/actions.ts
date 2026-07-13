"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateGuardianAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const adminUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true, roles: true }
    }) as any;

    const isAdmin = adminUser?.roles?.includes("ADMIN") || adminUser?.roles?.includes("SUPERADMIN") || adminUser?.role === "ADMIN" || adminUser?.role === "SUPERADMIN";

    if (!adminUser || !isAdmin || !adminUser.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const guardianId = formData.get("guardianId") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    if (!guardianId || !name) {
        return { success: false, error: "Faltan datos obligatorios" };
    }

    try {
        const targetGuardian = await prisma.user.findUnique({
            where: { id: guardianId }
        });

        if (!targetGuardian || targetGuardian.instituteId !== adminUser.instituteId) {
            return { success: false, error: "Tutor no encontrado o sin permisos" };
        }

        await prisma.user.update({
            where: { id: guardianId },
            data: {
                name: name.trim(),
                phone: phone ? phone.trim() : null
            }
        });

        // Sincronizar los campos del Student con el nuevo nombre/teléfono del tutor.
        // Buscamos todos los students vinculados y actualizamos el slot que corresponde
        // comparando el email del User con guardian1Email o guardian2Email del Student.
        const links = await prisma.guardianStudentLink.findMany({
            where: { guardianId },
            include: { guardian: true, student: true }
        });

        for (const link of links) {
            const student = link.student;
            const guardianEmail = link.guardian.email.toLowerCase().trim();

            if (student.guardian1Email?.toLowerCase().trim() === guardianEmail) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: {
                        guardian1Name: name.trim(),
                        guardian1Phone: phone ? phone.trim() : student.guardian1Phone
                    }
                });
            } else if (student.guardian2Email?.toLowerCase().trim() === guardianEmail) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: {
                        guardian2Name: name.trim(),
                        guardian2Phone: phone ? phone.trim() : student.guardian2Phone
                    }
                });
            }
        }

        revalidatePath(`/guardians/${guardianId}`);
        revalidatePath("/students/[id]", "page");
        return { success: true };
    } catch (e: any) {
        console.error("Error updating guardian:", e);
        return { success: false, error: "Error de base de datos" };
    }
}

export async function resetGuardianPassword(guardianId: string, customPassword?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const adminUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true, roles: true }
    }) as any;

    const isAdmin = adminUser?.roles?.includes("ADMIN") || adminUser?.roles?.includes("SUPERADMIN") || adminUser?.role === "ADMIN" || adminUser?.role === "SUPERADMIN";

    if (!adminUser || !isAdmin || !adminUser.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    try {
        const guardian = await prisma.user.findUnique({
            where: { id: guardianId }
        });

        if (!guardian || guardian.instituteId !== adminUser.instituteId) {
            return { success: false, error: "Tutor no encontrado o sin permisos" };
        }

        const newPassword = customPassword || "tutor1234";
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: guardianId },
            data: { password: hashedPassword }
        });

        revalidatePath(`/guardians/${guardianId}`);
        return { success: true, newPassword };
    } catch (e) {
        console.error("Error resetting guardian password:", e);
        return { success: false, error: "Error al restablecer la contraseña" };
    }
}
