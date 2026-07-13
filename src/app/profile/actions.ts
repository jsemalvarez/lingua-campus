"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfileAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { success: false, error: "No autenticado" };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    if (!name) {
        return { success: false, error: "El nombre es obligatorio." };
    }

    const role = (session.user as any).role;

    try {
        if (role === "STUDENT") {
            const student = await prisma.student.findUnique({
                where: { id: (session.user as any).id }
            });
            if (student) {
                const address = formData.get("address") as string;
                await prisma.student.update({
                    where: { id: student.id },
                    data: {
                        name: name.trim(),
                        phone: phone ? phone.trim() : null,
                        address: address ? address.trim() : null,
                    }
                });
            }
        } else {
            const updatedUser = await prisma.user.update({
                where: { id: (session.user as any).id },
                data: {
                    name: name.trim(),
                    phone: phone ? phone.trim() : null,
                },
            });

            // Si el usuario es tutor, sincronizar nombre y teléfono en los Students vinculados
            if ((updatedUser as any).roles?.includes("GUARDIAN") || role === "GUARDIAN") {
                const links = await prisma.guardianStudentLink.findMany({
                    where: { guardianId: updatedUser.id },
                    include: { student: true }
                });

                const guardianEmail = updatedUser.email.toLowerCase().trim();

                for (const link of links) {
                    const student = link.student;
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
            }
        }

        revalidatePath("/profile");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar el perfil" };
    }
}

export async function changePasswordAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { success: false, error: "No autenticado" };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, error: "Todos los campos son obligatorios." };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, error: "Las nuevas contraseñas no coinciden." };
    }

    if (newPassword.length < 6) {
        return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
    }

    const role = (session.user as any).role;

    try {
        let dbUserPasswordHash = "";
        let userId = "";

        if (role === "STUDENT") {
            const student = await prisma.student.findUnique({
                where: { id: (session.user as any).id }
            });
            if (!student) return { success: false, error: "Estudiante no encontrado." };
            // @ts-ignore
            dbUserPasswordHash = student.password || "";
            userId = student.id;
        } else {
            const user = await prisma.user.findUnique({
                where: { id: (session.user as any).id }
            });
            if (!user) return { success: false, error: "Usuario no encontrado." };
            dbUserPasswordHash = user.password;
            userId = user.id;
        }

        // Si no tiene contraseña configurada (por ejemplo un estudiante nuevo), 
        // pasamos directo si no tienen password, pero por seguridad, pedimos la actual
        // En un MVP real podemos permitir setear si no había, pero asumamos que siempre tienen contraseñas seteadas.
        if (dbUserPasswordHash) {
            const isPasswordCorrect = await bcrypt.compare(currentPassword, dbUserPasswordHash);
            if (!isPasswordCorrect) {
                return { success: false, error: "La contraseña actual es incorrecta." };
            }
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        if (role === "STUDENT") {
            await prisma.student.update({
                where: { id: userId },
                // @ts-ignore
                data: { password: hashedNewPassword }
            });
        } else {
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al cambiar la contraseña." };
    }
}
