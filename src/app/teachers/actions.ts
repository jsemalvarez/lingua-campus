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

export async function updateTeacherAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN") || !admin.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const teacherId = formData.get("teacherId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    if (!teacherId || !name || !email) {
        return { success: false, error: "ID, Nombre y Email son obligatorios" };
    }

    try {
        // Verificar si el email ya existe en otro usuario
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: { id: teacherId }
            }
        });

        if (existingUser) {
            return { success: false, error: "El correo electrónico ya está registrado por otro usuario." };
        }

        await prisma.user.update({
            where: {
                id: teacherId,
                instituteId: admin.instituteId // Seguridad: solo profesores de su propio instituto
            },
            data: {
                name,
                email,
                phone: phone || null,
            }
        });

        revalidatePath("/teachers");
        revalidatePath(`/teachers/${teacherId}`);
        return { success: true };
    } catch (e: any) {
        console.error("Error updating teacher:", e);
        return { success: false, error: "Error de base de datos al actualizar profesor." };
    }
}

export async function resetTeacherPassword(teacherId: string, customPassword?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN")) {
        return { success: false, error: "Sin permisos" };
    }

    try {
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId }
        });

        if (!teacher || teacher.role !== "TEACHER" || (admin.role === "ADMIN" && teacher.instituteId !== admin.instituteId)) {
            return { success: false, error: "Profesor no encontrado o sin permisos" };
        }

        const newPassword = customPassword || "docente1234";
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: teacherId },
            data: { password: hashedPassword }
        });

        return { success: true, newPassword };
    } catch (e) {
        console.error("Error resetting password:", e);
        return { success: false, error: "Error al restablecer la contraseña" };
    }
}

export async function softDeleteTeacher(teacherId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN")) {
        return { success: false, error: "Sin permisos para eliminar profesores" };
    }

    try {
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId }
        });

        if (!teacher || teacher.role !== "TEACHER" || (admin.role === "ADMIN" && teacher.instituteId !== admin.instituteId)) {
            return { success: false, error: "Profesor no encontrado o sin permisos" };
        }

        await prisma.user.update({
            where: { id: teacherId },
            // @ts-ignore - Prisma type not updated due to windows file lock
            data: { status: "DELETED" }
        });

        revalidatePath("/teachers");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (e) {
        console.error("Error soft deleting teacher:", e);
        return { success: false, error: "Error de base de datos al eliminar el profesor" };
    }
}
