"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function switchRoleAction(role: string) {
    const cookieStore = await cookies();
    
    // Guardar el rol seleccionado por 30 días
    cookieStore.set("lingua_current_role", role, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    
    // Redirigir siempre al dashboard para asegurar que las vistas se refresquen
    redirect("/dashboard");
}
