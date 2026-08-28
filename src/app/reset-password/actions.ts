"use server";

import { consumeResetToken } from "@/lib/passwordReset";

/**
 * Escribe la contraseña nueva a partir del enlace del correo (FEAT-05).
 *
 * No hay sesión ni la necesita: quien tiene el token es quien recibió el correo,
 * y ésa es toda la prueba de identidad de este flujo. Por eso la validación del
 * token es lo primero que pasa y vive en el lib, no acá.
 */
export async function resetPasswordAction(token: string, formData: FormData) {
    const newPassword = (formData.get("newPassword") as string) ?? "";
    const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

    if (!newPassword || !confirmPassword) {
        return { success: false as const, error: "Completá los dos campos." };
    }

    if (newPassword !== confirmPassword) {
        return { success: false as const, error: "Las contraseñas no coinciden." };
    }

    return consumeResetToken(token, newPassword);
}
