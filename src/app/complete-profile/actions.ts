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
        const guardian1Email = formData.get("guardian1Email") as string;

        const guardian2Name = formData.get("guardian2Name") as string;
        const guardian2Relation = formData.get("guardian2Relation") as string;
        const guardian2Phone = formData.get("guardian2Phone") as string;
        const guardian2Email = formData.get("guardian2Email") as string;

        // Obtener el estado actual del student para proteger datos de tutores vinculados
        const currentStudent = foundToken.student;

        // Si un tutor ya tiene cuenta vinculada (GuardianStudentLink), no sobreescribir
        // sus campos con valores vacíos — esos datos solo se editan desde la cuenta del tutor.
        const existingLinks = await prisma.guardianStudentLink.findMany({
            where: { studentId },
            include: { guardian: true }
        });
        const linkedEmails = new Set(existingLinks.map(l => l.guardian.email.toLowerCase().trim()));

        const g1HasLink = currentStudent.guardian1Email
            ? linkedEmails.has(currentStudent.guardian1Email.toLowerCase().trim())
            : false;
        const g2HasLink = currentStudent.guardian2Email
            ? linkedEmails.has(currentStudent.guardian2Email.toLowerCase().trim())
            : false;

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
                    // Solo actualizar campos del tutor si NO tiene cuenta vinculada
                    guardian1Name: g1HasLink ? currentStudent.guardian1Name : (guardian1Name || null),
                    guardian1Relation: g1HasLink ? currentStudent.guardian1Relation : (guardian1Relation || null),
                    guardian1Phone: g1HasLink ? currentStudent.guardian1Phone : (guardian1Phone || null),
                    guardian1Email: g1HasLink ? currentStudent.guardian1Email : (guardian1Email || null),
                    guardian2Name: g2HasLink ? currentStudent.guardian2Name : (guardian2Name || null),
                    guardian2Relation: g2HasLink ? currentStudent.guardian2Relation : (guardian2Relation || null),
                    guardian2Phone: g2HasLink ? currentStudent.guardian2Phone : (guardian2Phone || null),
                    guardian2Email: g2HasLink ? currentStudent.guardian2Email : (guardian2Email || null),
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
