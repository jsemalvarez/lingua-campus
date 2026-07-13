"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createPreEnrollmentAction(formData: FormData, instituteId: string) {
    if (!instituteId) {
        return { success: false, error: "ID de instituto no proporcionado" };
    }

    try {
        const formType = formData.get("formType") as string;
        
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
        const g1Name = formData.get("guardian1Name") as string || formData.get("g1Name") as string;
        const g1Relation = formData.get("guardian1Relation") as string || formData.get("g1Relation") as string;
        const g1Phone = formData.get("guardian1Phone") as string || formData.get("g1Phone") as string;
        const g1Email = formData.get("guardian1Email") as string || formData.get("g1Email") as string;

        // Tutor 2 (Opcional)
        const g2Name = formData.get("guardian2Name") as string || formData.get("g2Name") as string;
        const g2Relation = formData.get("guardian2Relation") as string || formData.get("g2Relation") as string;
        const g2Phone = formData.get("guardian2Phone") as string || formData.get("g2Phone") as string;
        const g2Email = formData.get("guardian2Email") as string || formData.get("g2Email") as string;

        if (!name) {
            return { success: false, error: "El nombre es obligatorio" };
        }

        if (!dni) {
            return { success: false, error: "El DNI es obligatorio" };
        }

        if (formType === "minor") {
            if (!g1Name || !g1Phone) {
                return { success: false, error: "Para inscripciones de menores, los datos del tutor son obligatorios" };
            }
        }

        // Para pre-inscripciones públicas, usamos una contraseña genérica
        const hashedPassword = await bcrypt.hash("inscripcion123", 10);

        const parsedBirthDate = (birthDateStr && !isNaN(Date.parse(birthDateStr))) ? new Date(birthDateStr) : null;

        await prisma.student.create({
            data: {
                name,
                email: email || null,
                password: hashedPassword,
                phone: phone || null,
                birthDate: parsedBirthDate,
                dni: dni || null,
                address: address || null,
                schoolInfo: schoolInfo || null,
                registeredLevel: registeredLevel || null,
                status: "PRE_INSCRIBED",

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

        // 🔔 Crear notificación en DB usando el nuevo sistema para Roles
        try {
            const levelLabel = registeredLevel ? ` — Nivel: ${registeredLevel}` : "";
            const notifTitle = "Nueva pre-inscripción recibida";
            const notifBody = `${name}${levelLabel} se pre-inscribió al instituto`;

            const { createNotificationForRoles } = await import("@/app/actions/notifications");
            
            await createNotificationForRoles({
                instituteId,
                roles: ["ADMIN", "SECRETARY"],
                type: "NEW_ENROLLMENT",
                title: notifTitle,
                body: notifBody,
                link: "/students"
            });
        } catch (notifErr) {
            console.error("Error creating pre-enrollment notification:", notifErr);
        }

        return { success: true };
    } catch (e: any) {
        console.error("Error in pre-enrollment:", e);
        if (e.code === 'P2002') {
            const target = e.meta?.target || [];
            if (target.includes('dni')) {
                return { success: false, error: "El DNI del alumno ya se encuentra registrado en este instituto." };
            }
            if (target.includes('email')) {
                return { success: false, error: "El correo electrónico del alumno ya se encuentra registrado en este instituto." };
            }
            return { success: false, error: "El alumno ya se encuentra registrado en el sistema." };
        }
        return { success: false, error: "Error al procesar la inscripción. Intente nuevamente." };
    }
}

