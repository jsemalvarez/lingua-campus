"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateInstituteByAdminAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { success: false, error: "No autorizado" };
    }

    const user = session.user as any;
    const isAuthorized = user.role === "ADMIN" || user.role === "SUPERADMIN";

    if (!isAuthorized) {
        return { success: false, error: "No tienes permisos para realizar esta acción" };
    }

    const instituteId = formData.get("id") as string;

    // Si es ADMIN, solo puede editar su propio instituto
    if (user.role === "ADMIN" && user.instituteId !== instituteId) {
        return { success: false, error: "No puedes editar este instituto" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const description = formData.get("description") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const facebookUrl = formData.get("facebookUrl") as string;
    const instagramUrl = formData.get("instagramUrl") as string;
    const whatsappNumber = formData.get("whatsappNumber") as string;

    if (!instituteId || !name) {
        return { success: false, error: "El ID y el nombre son obligatorios" };
    }

    try {
        await prisma.institute.update({
            where: { id: instituteId },
            data: {
                name: name.trim(),
                email: email ? email.trim().toLowerCase() : null,
                phone: phone ? phone.trim() : null,
                address: address ? address.trim() : null,
                description: description ? description.trim() : null,
                logoUrl: logoUrl ? logoUrl.trim() : null,
                facebookUrl: facebookUrl ? facebookUrl.trim() : null,
                instagramUrl: instagramUrl ? instagramUrl.trim() : null,
                whatsappNumber: whatsappNumber ? whatsappNumber.trim() : null,
            }
        });

        revalidatePath("/dashboard/settings/institute");
        revalidatePath("/dashboard"); // Por si se muestra el logo o nombre en el dashboard
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar los datos del instituto" };
    }
}
