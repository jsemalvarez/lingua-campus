"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createPreEnrollmentAction(formData: FormData, instituteId: string) {
    if (!instituteId) {
        return { success: false, error: "ID de instituto no proporcionado" };
    }

    try {
        // Datos del Alumno
        const name = formData.get("name") as string;
        const birthDateStr = formData.get("birthDate") as string;
        const dni = formData.get("dni") as string;
        const phone = formData.get("phone") as string;
        const address = formData.get("address") as string;
        const email = formData.get("email") as string;
        const registeredLevel = formData.get("registeredLevel") as string;
        const schoolInfo = formData.get("schoolInfo") as string;

        // Tutor 1 (Opcional)
        const g1Name = formData.get("g1Name") as string;
        const g1Relation = formData.get("g1Relation") as string;
        const g1Phone = formData.get("g1Phone") as string;

        // Tutor 2 (Opcional)
        const g2Name = formData.get("g2Name") as string;
        const g2Relation = formData.get("g2Relation") as string;
        const g2Phone = formData.get("g2Phone") as string;

        if (!name) {
            return { success: false, error: "El nombre es obligatorio" };
        }

        // Para pre-inscripciones públicas, usamos una contraseña genérica
        const hashedPassword = await bcrypt.hash("inscripcion123", 10);

        await prisma.student.create({
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
                status: "PRE_INSCRIBED",

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
        return { success: true };
    } catch (e: any) {
        console.error("Error in pre-enrollment:", e);
        return { success: false, error: "Error al procesar la inscripción. Intente nuevamente." };
    }
}
