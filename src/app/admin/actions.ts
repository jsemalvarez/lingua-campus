"use server";

import { requireSuperadmin } from "@/lib/authz";
import { CreateInstituteWithAdmin } from "@/features/superadmin/application/use-cases/CreateInstituteWithAdmin";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { DEFAULT_PASSWORDS } from "@/lib/defaultPasswords";
import { uniqueViolationFields, userMessageFor } from "@/lib/errors/report";

export async function createInstituteAction(formData: FormData) {
    // Protección: solo SUPERADMIN puede ejecutar esta acción
    if (!await requireSuperadmin()) {
        return { success: false, error: "No autorizado" };
    }

    const instituteName = formData.get("instituteName") as string;
    const subdomain = formData.get("subdomain") as string;
    const adminName = formData.get("adminName") as string;
    const adminEmail = formData.get("adminEmail") as string;
    const plan = formData.get("plan") as string;
    const customDomain = formData.get("customDomain") as string;
    const pwaIcon192 = formData.get("pwaIcon192") as string;
    const pwaIcon512 = formData.get("pwaIcon512") as string;

    if (!instituteName || !subdomain || !adminName || !adminEmail) {
        return { success: false, error: "Todos los campos son requeridos" };
    }

    const useCase = new CreateInstituteWithAdmin();

    try {
        const result = await useCase.execute({
            instituteName,
            subdomain,
            adminName,
            adminEmail,
            plan,
            customDomain,
            pwaIcon192,
            pwaIcon512,
        });

        revalidatePath("/admin/institutes");
        return { success: true, data: result };
    } catch (error) {
        if (uniqueViolationFields(error)) return { success: false, error: "Ese subdominio, dominio o correo ya lo usa otro instituto o usuario." };
        return { success: false, error: await userMessageFor(error, "No se pudo crear el instituto.", { action: "plataforma.crear-instituto" }) };
    }
}

export async function editInstituteAction(formData: FormData) {
    if (!await requireSuperadmin()) {
        return { success: false, error: "No autorizado" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const status = formData.get("status") as string;
    const subdomain = formData.get("subdomain") as string;
    const plan = formData.get("plan") as string;
    const customDomain = formData.get("customDomain") as string;
    const pwaIcon192 = formData.get("pwaIcon192") as string;
    const pwaIcon512 = formData.get("pwaIcon512") as string;

    if (!id || !name || !subdomain) {
        return { success: false, error: "El ID, nombre y subdominio son obligatorios" };
    }

    try {
        // Chequear unicidad del subdominio si lo cambió
        const existing = await prisma.institute.findUnique({ where: { subdomain: subdomain.trim().toLowerCase() } });
        if (existing && existing.id !== id) {
            return { success: false, error: "Ese subdominio ya está en uso por otro instituto." };
        }
        await prisma.institute.update({
            where: { id },
            data: {
                name: name.trim(),
                subdomain: subdomain.trim().toLowerCase(),
                phone: phone ? phone.trim() : null,
                address: address ? address.trim() : null,
                status: status === "ACTIVE" || status === "INACTIVE" ? status : "ACTIVE",
                plan: (plan as any) || "BASIC",
                customDomain: customDomain ? customDomain.trim() : null,
                pwaIcon192: pwaIcon192 ? pwaIcon192.trim() : null,
                pwaIcon512: pwaIcon512 ? pwaIcon512.trim() : null,
            }
        });

        revalidatePath("/admin/institutes");
        revalidatePath(`/admin/institutes/${id}`);
        return { success: true };
    } catch (error) {
        if (uniqueViolationFields(error)) return { success: false, error: "Ese dominio ya lo usa otro instituto." };
        return { success: false, error: await userMessageFor(error, "No se pudo actualizar el instituto.", { action: "plataforma.editar-instituto" }) };
    }
}

export async function addInstituteAdminAction(formData: FormData) {
    if (!await requireSuperadmin()) return { success: false, error: "No autorizado" };

    const instituteId = formData.get("instituteId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!instituteId || !name || !email) return { success: false, error: "Faltan campos" };

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return { success: false, error: "El email ya está registrado" };

        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORDS.ADMIN_NEW, 10);
        await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                hasDefaultPassword: true,
                roles: ["ADMIN"],
                instituteId: instituteId
            }
        });

        revalidatePath(`/admin/institutes/${instituteId}`);
        return { success: true };
    } catch (e) {
        if (uniqueViolationFields(e)) return { success: false, error: "El email ya está registrado" };
        return { success: false, error: await userMessageFor(e, "No se pudo agregar el administrador.", { action: "plataforma.agregar-admin" }) };
    }
}

export async function removeInstituteAdminAction(adminId: string, instituteId: string) {
    if (!await requireSuperadmin()) return { success: false, error: "No autorizado" };

    try {
        await prisma.user.delete({
            where: { id: adminId }
        });

        revalidatePath(`/admin/institutes/${instituteId}`);
        return { success: true };
    } catch (e) {
        return { success: false, error: await userMessageFor(e, "No se pudo eliminar el administrador.", { action: "plataforma.eliminar-admin" }) };
    }
}
