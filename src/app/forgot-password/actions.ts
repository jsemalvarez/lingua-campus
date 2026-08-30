"use server";

import prisma from "@/lib/prisma";
import { getEmailProvider } from "@/lib/email";
import { resolveSender } from "@/lib/email/sender";
import { passwordResetEmail } from "@/lib/email/templates/passwordReset";
import { instituteBaseUrl } from "@/lib/tenant";
import { issueResetToken, RESET_TOKEN_TTL_MINUTES, type ResetSubject } from "@/lib/passwordReset";

type InstitutoDelCorreo = {
    name: string;
    email: string | null;
    senderEmail: string | null;
    subdomain: string;
    customDomain: string | null;
};

/** Una dirección a la que sale el enlace, con el nombre de quien la lee. */
type Destinatario = {
    email: string;
    name: string;
    /**
     * Si quien recibe es el dueño de la contraseña.
     *
     * Se lleva explícito hasta el correo en vez de deducirlo comparando nombres:
     * hay tutores cargados en la ficha con el correo y sin el nombre, y ahí la
     * comparación diría que es la misma persona.
     */
    esElSujeto: boolean;
};

type CuentaEncontrada = {
    subject: ResetSubject;
    /** De quién es la contraseña que se va a cambiar. */
    subjectName: string;
    /**
     * A qué direcciones sale el enlace.
     *
     * Casi siempre es una. Son dos cuando el alumno no tiene correo propio y
     * tiene dos tutores cargados: el enlace es uno solo y lo gasta el primero
     * que lo use.
     */
    destinatarios: Destinatario[];
    institute: InstitutoDelCorreo;
};

const INSTITUTO_DEL_CORREO = {
    name: true,
    email: true,
    senderEmail: true,
    subdomain: true,
    customDomain: true,
} as const;

/**
 * A qué direcciones se le manda el enlace de un alumno.
 *
 * **El alumno con correo propio lo recibe él.** Es el de 20 años que se
 * inscribió solo, y su cuenta es suya.
 *
 * **El que no tiene, lo recibe su tutor**, y ése es el caso que este ítem
 * existía para resolver: el instituto tiene chicos de 6, 7 y 8 años cuyo
 * identificador es el DNI porque no tienen correo ([BUG-01](#bug-01)). Un flujo
 * que exigiera dirección propia dejaría afuera a una franja entera.
 *
 * Se juntan las dos fuentes de tutor que tiene el sistema —las cuentas
 * vinculadas por `GuardianStudentLink` y los correos sueltos de la ficha— porque
 * ninguna de las dos está garantizada: hay fichas con el correo del padre
 * cargado a mano y sin cuenta creada, y cuentas de tutor creadas después sin que
 * nadie volviera a tocar la ficha. Mandar a las dos y descartar repetidos cuesta
 * una consulta y evita el caso de "el tutor existe pero por el otro lado".
 */
async function destinatariosDeAlumno(student: {
    id: string;
    name: string;
    email: string | null;
    guardian1Name: string | null;
    guardian1Email: string | null;
    guardian2Name: string | null;
    guardian2Email: string | null;
}): Promise<Destinatario[]> {
    if (student.email) {
        return [{ email: student.email, name: student.name, esElSujeto: true }];
    }

    const links = await prisma.guardianStudentLink.findMany({
        where: { studentId: student.id },
        select: { guardian: { select: { email: true, name: true, status: true } } },
    });

    const candidatos = [
        ...links
            .filter((l) => l.guardian && l.guardian.status === "ACTIVE")
            .map((l) => ({ email: l.guardian.email, name: l.guardian.name })),
        ...(student.guardian1Email
            ? [{ email: student.guardian1Email, name: student.guardian1Name ?? "" }]
            : []),
        ...(student.guardian2Email
            ? [{ email: student.guardian2Email, name: student.guardian2Name ?? "" }]
            : []),
    ];

    const vistos = new Set<string>();
    const unicos: Destinatario[] = [];

    for (const candidato of candidatos) {
        const clave = candidato.email.trim().toLowerCase();
        if (!clave || vistos.has(clave)) continue;
        vistos.add(clave);
        unicos.push({ email: clave, name: candidato.name.trim(), esElSujeto: false });
    }

    return unicos;
}

/**
 * A qué cuenta corresponde lo que escribió la persona.
 *
 * **Devuelve una sola cuenta o ninguna: si el identificador resuelve a más de
 * una, no se manda nada.** Para un `User` no puede pasar —`email` es único en
 * todo el sistema, y por eso la recuperación de tutores y docentes nunca
 * necesitó que se arreglara [SEC-05](#sec-05)—. Para un alumno sí puede: su
 * correo y su DNI son únicos **por instituto**, así que dos institutos con el
 * mismo chico anotado dan dos candidatos. En ese caso no se manda nada, que es
 * el lado correcto para fallar: mejor que no llegue el correo a restablecerle la
 * contraseña a otra persona.
 *
 * `instituteId` sale del host desde el que se pidió y **sólo achica la
 * búsqueda de alumnos**. Viene del navegador, así que no se le confía nada más
 * que eso: no abre ningún acceso, y el enlace igual sale hacia la dirección que
 * el instituto tenga en la ficha. En el dominio raíz y en `localhost` no
 * resuelve ningún instituto y la búsqueda queda abierta, apoyada en la regla del
 * candidato único.
 *
 * **Por DNI se buscan sólo alumnos**, aunque `User` también tenga la columna: es
 * lo mismo que hace el login ([`auth.ts`](../../lib/auth.ts)), donde el DNI es
 * la vía de acceso del alumno y el personal entra por correo.
 */
async function resolveAccount(
    identifier: string,
    instituteId?: string
): Promise<CuentaEncontrada | null> {
    const esCorreo = identifier.includes("@");
    const alcance = instituteId ? { instituteId } : {};

    const datosDelAlumno = {
        id: true,
        name: true,
        email: true,
        instituteId: true,
        guardian1Name: true,
        guardian1Email: true,
        guardian2Name: true,
        guardian2Email: true,
        institute: { select: INSTITUTO_DEL_CORREO },
    } as const;

    if (esCorreo) {
        const [usuarios, alumnos] = await Promise.all([
            prisma.user.findMany({
                where: { email: identifier, status: "ACTIVE" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    instituteId: true,
                    institute: { select: INSTITUTO_DEL_CORREO },
                },
                take: 2,
            }),
            prisma.student.findMany({
                where: { email: identifier, status: "ACTIVE", ...alcance },
                select: datosDelAlumno,
                take: 2,
            }),
        ]);

        if (usuarios.length + alumnos.length !== 1) return null;

        const user = usuarios[0];
        if (user) {
            // Sin instituto no hay a dónde mandar el enlace: la dirección del
            // campus sale de la ficha del instituto. El único caso es SUPERADMIN,
            // que no pertenece a ninguno y no se recupera por esta vía.
            if (!user.institute || !user.instituteId) return null;

            return {
                subject: { type: "USER", id: user.id, instituteId: user.instituteId },
                subjectName: user.name,
                destinatarios: [{ email: user.email, name: user.name, esElSujeto: true }],
                institute: user.institute,
            };
        }

        return alumnoEncontrado(alumnos[0]);
    }

    const alumnos = await prisma.student.findMany({
        where: { dni: identifier, status: "ACTIVE", ...alcance },
        select: datosDelAlumno,
        take: 2,
    });

    if (alumnos.length !== 1) return null;

    return alumnoEncontrado(alumnos[0]);
}

async function alumnoEncontrado(
    student: {
        id: string;
        name: string;
        email: string | null;
        instituteId: string;
        guardian1Name: string | null;
        guardian1Email: string | null;
        guardian2Name: string | null;
        guardian2Email: string | null;
        institute: InstitutoDelCorreo | null;
    }
): Promise<CuentaEncontrada | null> {
    if (!student.institute) return null;

    const destinatarios = await destinatariosDeAlumno(student);

    // El alumno sin correo propio y sin ningún tutor cargado no tiene por dónde
    // recibir nada. Es el agujero que el instituto tiene que cerrar cargando el
    // correo del tutor en la ficha, no algo que el sistema pueda resolver solo.
    if (destinatarios.length === 0) return null;

    return {
        subject: { type: "STUDENT", id: student.id, instituteId: student.instituteId },
        subjectName: student.name,
        destinatarios,
        institute: student.institute,
    };
}

/**
 * Pedido de recuperación de contraseña (FEAT-05).
 *
 * **La respuesta es siempre la misma**, exista o no la cuenta, esté o no pasada
 * de límite, tenga o no un tutor con correo, y aunque el envío falle. Si
 * contestara distinto, el formulario sería una forma de averiguar quién tiene
 * cuenta en el instituto.
 *
 * El precio de eso es que un envío caído se ve en los logs del servidor y no en
 * la pantalla de quien lo pidió. Es la contrapartida buscada: mejor que el
 * instituto se entere por el log a que cualquiera pueda enumerar a sus alumnos.
 */
export async function requestPasswordResetAction(formData: FormData) {
    const identifier = ((formData.get("identifier") as string) ?? "").trim().toLowerCase();
    const instituteId = ((formData.get("instituteId") as string) ?? "").trim() || undefined;

    const respuesta = { success: true as const };

    if (!identifier) return respuesta;

    try {
        const cuenta = await resolveAccount(identifier, instituteId);
        if (!cuenta) return respuesta;

        const token = await issueResetToken(cuenta.subject);
        if (!token) return respuesta;

        const url = `${instituteBaseUrl(cuenta.institute)}/reset-password/${token}`;
        const remitente = resolveSender(cuenta.institute);
        const proveedor = getEmailProvider();

        // Un envío que falla no puede impedir el otro: si el correo del primer
        // tutor rebota, el segundo sigue siendo una vía válida para el mismo
        // enlace.
        const envios = await Promise.allSettled(
            cuenta.destinatarios.map((destinatario) => {
                const { subject, text, html } = passwordResetEmail({
                    subjectName: cuenta.subjectName,
                    recipientName: destinatario.name || undefined,
                    esParaOtro: !destinatario.esElSujeto,
                    instituteName: cuenta.institute.name,
                    url,
                    ttlMinutes: RESET_TOKEN_TTL_MINUTES,
                });

                return proveedor.send({ to: destinatario.email, subject, text, html, ...remitente });
            })
        );

        for (const envio of envios) {
            // Sin el token ni el enlace: un log no es lugar para algo que sirve
            // para entrar.
            if (envio.status === "rejected") {
                console.error(`[forgot-password] falló un envío de "${identifier}":`, envio.reason);
            }
        }
    } catch (error) {
        console.error(`[forgot-password] falló el pedido de "${identifier}":`, error);
    }

    return respuesta;
}
