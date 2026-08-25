"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import bcrypt from "bcryptjs";
import { DEFAULT_PASSWORDS, isDefaultForStudent } from "@/lib/defaultPasswords";
import { INSTITUTE_ADMINS, requireRole } from "@/lib/authz";

export async function createStudentAction(formData: FormData) {
    // El instituto salía del JWT, que dura 30 días; ahora sale de la base junto
    // con los roles.
    const auth = await requireRole(INSTITUTE_ADMINS);
    if (!auth) {
        return { success: false, error: "No tienes permisos para registrar alumnos en este instituto" };
    }
    const instituteId = auth.instituteId;

    try {
        // Datos Personales
        const name = formData.get("name") as string;
        const email = formData.get("email")?.toString().toLowerCase().trim();
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
        const g1Email = formData.get("g1Email")?.toString().toLowerCase().trim();

        // Tutor 2
        const g2Name = formData.get("g2Name") as string;
        const g2Relation = formData.get("g2Relation") as string;
        const g2Phone = formData.get("g2Phone") as string;
        const g2Email = formData.get("g2Email")?.toString().toLowerCase().trim();

        if (!name) {
            return { success: false, error: "El nombre del estudiante es obligatorio" };
        }

        // Generamos o usamos la contraseña proporcionada
        const finalPassword = customPassword && customPassword.trim() !== "" ? customPassword : DEFAULT_PASSWORDS.STUDENT_NEW;
        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        const newStudent = await prisma.student.create({
            data: {
                name,
                email: email || null,
                password: hashedPassword,
                hasDefaultPassword: isDefaultForStudent(finalPassword, dni),
                phone: phone || null,
                birthDate: birthDateStr ? new Date(birthDateStr) : null,
                dni: dni || null,
                address: address || null,
                schoolInfo: schoolInfo || null,
                registeredLevel: registeredLevel || null,

                guardian1Name: g1Name || null,
                guardian1Relation: g1Relation || null,
                guardian1Phone: g1Phone || null,
                guardian1Email: g1Email || null,

                guardian2Name: g2Name || null,
                guardian2Relation: g2Relation || null,
                guardian2Phone: g2Phone || null,
                guardian2Email: g2Email || null,

                instituteId: instituteId,
            }
        });

        revalidatePath("/students");
        return { success: true, studentId: newStudent.id };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al crear estudiante" };
    }
}
