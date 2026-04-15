"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Retrieves student and institute data associated with a temporary link token.
 */
export async function getStudentByToken(token: string) {
    try {
        const foundToken = await prisma.studentDataToken.findUnique({
            where: { token },
            include: {
                student: {
                    include: {
                        institute: true
                    }
                }
            }
        });

        if (!foundToken) return { success: false, error: "Token inválido" };
        if (foundToken.consumed) return { success: false, error: "Este link ya fue utilizado" };
        if (new Date() > foundToken.expiresAt) return { success: false, error: "El link ha expirado" };

        const student = foundToken.student;
        const institute = student.institute;
        
        const instituteLevels = await prisma.level.findMany({
            where: { instituteId: institute.id },
            orderBy: { name: 'asc' }
        });

        return { 
            success: true, 
            student, 
            institute, 
            instituteLevels 
        };
    } catch (error) {
        console.error("Error getting student by token:", error);
        return { success: false, error: "Error de servidor" };
    }
}

/**
 * Updates student information using a temporary link token and marks the token as consumed.
 */
export async function updateStudentFromTokenAction(formData: FormData, token: string) {
    try {
        const foundToken = await prisma.studentDataToken.findUnique({
            where: { token },
            include: { student: true }
        });

        if (!foundToken || foundToken.consumed || new Date() > foundToken.expiresAt) {
            return { success: false, error: "Link inválido o expirado" };
        }

        const studentId = foundToken.studentId;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const birthDateStr = formData.get("birthDate") as string;
        const dni = formData.get("dni") as string;
        const address = formData.get("address") as string;
        const schoolInfo = formData.get("schoolInfo") as string;
        const registeredLevel = formData.get("registeredLevel") as string;

        const guardian1Name = formData.get("guardian1Name") as string;
        const guardian1Relation = formData.get("guardian1Relation") as string;
        const guardian1Phone = formData.get("guardian1Phone") as string;

        const guardian2Name = formData.get("guardian2Name") as string;
        const guardian2Relation = formData.get("guardian2Relation") as string;
        const guardian2Phone = formData.get("guardian2Phone") as string;

        await prisma.$transaction([
            prisma.student.update({
                where: { id: studentId },
                data: {
                    email: email || null,
                    phone: phone || null,
                    birthDate: birthDateStr ? new Date(birthDateStr) : null,
                    dni: dni || null,
                    address: address || null,
                    schoolInfo: schoolInfo || null,
                    registeredLevel: registeredLevel || null,
                    guardian1Name: guardian1Name || null,
                    guardian1Relation: guardian1Relation || null,
                    guardian1Phone: guardian1Phone || null,
                    guardian2Name: guardian2Name || null,
                    guardian2Relation: guardian2Relation || null,
                    guardian2Phone: guardian2Phone || null,
                }
            }),
            prisma.studentDataToken.update({
                where: { id: foundToken.id },
                data: { consumed: true }
            })
        ]);

        revalidatePath(`/students/${studentId}`);
        revalidatePath("/students");
        return { success: true };
    } catch (error) {
        console.error("Error updating student via token:", error);
        return { success: false, error: "Error al actualizar los datos" };
    }
}
