"use server";

import prisma from "@/lib/prisma";
import { getEmailProvider } from "@/lib/email";
import { resolveSender } from "@/lib/email/sender";
import { passwordResetEmail } from "@/lib/email/templates/passwordReset";
import { instituteBaseUrl } from "@/lib/tenant";
import { issueResetToken, RESET_TOKEN_TTL_MINUTES, type ResetSubject } from "@/lib/passwordReset";

type CuentaEncontrada = {
    subject: ResetSubject;
    name: string;
    email: string;
    institute: {
        name: string;
        email: string | null;
        senderEmail: string | null;
        subdomain: string;
        customDomain: string | null;
    };
};

/**
 * A qué cuenta corresponde lo que escribió la persona.
 *
 * **Devuelve una sola cuenta o ninguna: si el identificador resuelve a más de
 * una, no se manda nada.** Hoy no puede pasar —`User.email` es único en todo el
 * sistema—, y por eso el `findMany` con corte parece de más. El día que entren
 * los alumnos sí va a poder: su correo es único sólo por instituto, y su DNI
 * también. Escrito así, esa segunda entrega agrega ramas acá adentro y no
 * cambia nada de la pantalla ni arriesga restablecer la cuenta equivocada.
 *
 * Esto es también lo que hace que la recuperación no dependa de arreglar el
 * alcance de instituto del login (SEC-05): no se pregunta desde qué host se
 * pidió, se busca la cuenta y se sale por el instituto al que pertenece.
 */
async function resolveAccount(identifier: string): Promise<CuentaEncontrada | null> {
    const candidatos = await prisma.user.findMany({
        where: { email: identifier, status: "ACTIVE" },
        select: {
            id: true,
            name: true,
            email: true,
            instituteId: true,
            institute: {
                select: { name: true, email: true, senderEmail: true, subdomain: true, customDomain: true },
            },
        },
        take: 2,
    });

    if (candidatos.length !== 1) return null;

    const user = candidatos[0];

    // Sin instituto no hay a dónde mandar el enlace: la dirección del campus sale
    // de la ficha del instituto. El único caso es SUPERADMIN, que no pertenece a
    // ninguno y no se recupera por esta vía.
    if (!user.institute || !user.instituteId) return null;

    return {
        subject: { type: "USER", id: user.id, instituteId: user.instituteId },
        name: user.name,
        email: user.email,
        institute: user.institute,
    };
}

/**
 * Pedido de recuperación de contraseña (FEAT-05).
 *
 * **La respuesta es siempre la misma**, exista o no la dirección, esté o no
 * pasada de límite, y aunque el envío falle. Si contestara distinto, el
 * formulario sería una forma de averiguar quién tiene cuenta en el instituto.
 *
 * El precio de eso es que un envío caído se ve en los logs del servidor y no en
 * la pantalla de quien lo pidió. Es la contrapartida buscada: mejor que el
 * instituto se entere por el log a que cualquiera pueda enumerar a sus tutores.
 */
export async function requestPasswordResetAction(formData: FormData) {
    const identifier = ((formData.get("identifier") as string) ?? "").trim().toLowerCase();

    const respuesta = { success: true as const };

    if (!identifier || !identifier.includes("@")) return respuesta;

    try {
        const cuenta = await resolveAccount(identifier);
        if (!cuenta) return respuesta;

        const token = await issueResetToken(cuenta.subject);
        if (!token) return respuesta;

        const { subject, text, html } = passwordResetEmail({
            subjectName: cuenta.name,
            instituteName: cuenta.institute.name,
            url: `${instituteBaseUrl(cuenta.institute)}/reset-password/${token}`,
            ttlMinutes: RESET_TOKEN_TTL_MINUTES,
        });

        await getEmailProvider().send({
            to: cuenta.email,
            subject,
            text,
            html,
            ...resolveSender(cuenta.institute),
        });
    } catch (error) {
        // Sin el token ni el enlace: un log no es lugar para algo que sirve para
        // entrar. Con la dirección alcanza para saber a quién reclamarle.
        console.error(`[forgot-password] falló el envío a ${identifier}:`, error);
    }

    return respuesta;
}
