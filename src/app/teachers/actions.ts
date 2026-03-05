"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createTeacherAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { success: false, error: "Nombre, Email y Contraseña son obligatorios" };
    }

    try {
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (existingEmail) {
            return { success: false, error: "El correo electrónico ya está registrado." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            // @ts-ignore: Prisma dll locked in Windows, type not generated but table exists
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone || null,
                role: "TEACHER",
                instituteId: user.instituteId
            }
        });

        revalidatePath("/teachers");
        revalidatePath("/courses/new");
        revalidatePath("/courses");
        return { success: true };
    } catch (e: any) {
        console.error("Error creating teacher:", e);
        return { success: false, error: "Error de base de datos al crear profesor." };
    }
}
