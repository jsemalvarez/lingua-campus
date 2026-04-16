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
        const g1Name = formData.get("g1Name") as string;
        const g1Relation = formData.get("g1Relation") as string;
        const g1Phone = formData.get("g1Phone") as string;
        const g1Email = formData.get("g1Email") as string;

        // Tutor 2 (Opcional)
        const g2Name = formData.get("g2Name") as string;
        const g2Relation = formData.get("g2Relation") as string;
        const g2Phone = formData.get("g2Phone") as string;
        const g2Email = formData.get("g2Email") as string;

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
                guardian1Email: g1Email || null,

                guardian2Name: g2Name || null,
                guardian2Relation: g2Relation || null,
                guardian2Phone: g2Phone || null,
                guardian2Email: g2Email || null,

                instituteId: instituteId,
            }
        });

        revalidatePath("/students");

        // 🔔 Crear notificación en DB
        const levelLabel = registeredLevel ? ` — Nivel: ${registeredLevel}` : "";
        const notifTitle = "Nueva pre-inscripción recibida";
        const notifBody = `${name}${levelLabel} se pre-inscribió al instituto`;

        const newNotif = await prisma.notification.create({
            data: {
                instituteId,
                type: "NEW_ENROLLMENT",
                title: notifTitle,
                body: notifBody,
                link: "/students",
            },
        });

        // 📡 Broadcast en tiempo real via Supabase (más confiable que postgres_changes)
        try {
            const { createClient } = await import("@supabase/supabase-js");
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            await supabase.channel(`institute:${instituteId}`).send({
                type: "broadcast",
                event: "new_notification",
                payload: {
                    id: newNotif.id,
                    type: newNotif.type,
                    title: notifTitle,
                    body: notifBody,
                    read: false,
                    link: "/students",
                    createdAt: newNotif.createdAt,
                },
            });
        } catch (broadcastErr) {
            // No bloqueante — la notificación ya está en DB, solo falla el push en tiempo real
            console.error("[Broadcast] Error sending realtime event:", broadcastErr);
        }

        return { success: true };
    } catch (e: any) {
        console.error("Error in pre-enrollment:", e);
        return { success: false, error: "Error al procesar la inscripción. Intente nuevamente." };
    }
}
