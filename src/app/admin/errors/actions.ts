"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/authz";
import { userMessageFor } from "@/lib/errors/report";

/** Marca un problema como resuelto o lo reabre (ARQ-09). */
export async function setIssueStatusAction(issueId: string, status: "OPEN" | "RESOLVED") {
    const auth = await requireSuperadmin();
    if (!auth) return { success: false, error: "No autorizado" };

    try {
        await prisma.errorIssue.update({
            where: { id: issueId },
            data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null },
        });
        revalidatePath("/admin/errors");
        revalidatePath(`/admin/errors/${issueId}`);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: await userMessageFor(error, "No se pudo cambiar el estado del problema.", {
                action: "plataforma.cambiar-estado-error",
                auth,
                context: { issueId },
            }),
        };
    }
}
