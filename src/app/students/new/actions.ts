"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import bcrypt from "bcryptjs";

export async function createStudentAction(formData: FormData) {
    const session = await getServerSession(authOptions);

    // Validamos sesión e instituto del teacher/admin
    if (!session || !session.user) {
        return { success: false, error: "No tienes sesión activa" };
    }

    const instituteId = (session.user as any).instituteId;
    if (!instituteId) {
        return { success: false, error: "No estás asignado a un instituto válido" };
    }

    try {
        // Datos Personales
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const birthDateStr = formData.get("birthDate") as string;
        const customPassword = formData.get("password") as string;
        const dni = formData.get("dni") as string;
        const address = formData.get("address") as string;
        const schoolInfo = formData.get("schoolInfo") as string;
        const registeredLevel = formData.get("registeredLevel") as string;

        // Tutor 1
        const g1Name = formData.get("g1Name") as string;
        const g1Relation = formData.get("g1Relation") as string;
        const g1Phone = formData.get("g1Phone") as string;

        // Tutor 2
        const g2Name = formData.get("g2Name") as string;
        const g2Relation = formData.get("g2Relation") as string;
        const g2Phone = formData.get("g2Phone") as string;

        if (!name) {
            return { success: false, error: "El nombre del estudiante es obligatorio" };
        }

        // Generamos o usamos la contraseña proporcionada
        const finalPassword = customPassword && customPassword.trim() !== "" ? customPassword : "estudiante123";
        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        const newStudent = await prisma.student.create({
            data: {
                name,
                email: email || null,
                password: hashedPassword,
                phone: phone || null,
                birthDate: birthDateStr ? new Date(birthDateStr) : null,
                dni: dni || null,
                address: address || null,
                schoolInfo: schoolInfo || null,
                registeredLevel: registeredLevel || null,

                guardian1Name: g1Name || null,
                guardian1Relation: g1Relation || null,
                guardian1Phone: g1Phone || null,

                guardian2Name: g2Name || null,
                guardian2Relation: g2Relation || null,
                guardian2Phone: g2Phone || null,

                instituteId: instituteId,
            }
        });

        revalidatePath("/students");
        return { success: true, studentId: newStudent.id };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al crear estudiante" };
    }
}
