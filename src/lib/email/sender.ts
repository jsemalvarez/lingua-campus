import { EmailMessage } from "./IEmailProvider";

/** Lo que hace falta de la ficha del instituto para armar el remitente. */
export type InstituteSender = {
    name: string;
    email: string | null;
    senderEmail: string | null;
};

/**
 * De qué dirección sale un correo de un instituto (FEAT-05).
 *
 * `senderEmail` es el dominio propio del cliente, ya autenticado en el proveedor
 * de envío. Cuando está vacío se cae al remitente de la plataforma: es lo que
 * usa stage, y lo que va a usar un cliente que todavía no entregó su DNS.
 *
 * **`Institute.email` no se usa como remitente, y la distinción importa.** Ése
 * es el correo de contacto que el instituto cargó en su ficha, y nadie verificó
 * que su dominio nos autorice a mandar en su nombre: ponerlo en el `from` es el
 * camino directo a la carpeta de spam, o al rechazo liso y llano si el dominio
 * tiene DMARC. Donde sí corresponde —y donde se usa acá— es como dirección de
 * respuesta: quien recibe el correo le contesta a una persona del instituto y no
 * a un buzón que nadie lee.
 *
 * El nombre visible es siempre el del instituto. Es lo único que se ve en la
 * bandeja, así que aun saliendo por el remitente de la plataforma, la marca que
 * aparece es la del cliente.
 */
export function resolveSender(
    institute: InstituteSender
): Pick<EmailMessage, "from" | "fromName" | "replyTo"> {
    const platformFrom = process.env.EMAIL_FROM ?? "no-responder@lingua-campus.com.ar";

    return {
        from: institute.senderEmail ?? platformFrom,
        fromName: institute.name,
        replyTo: institute.email ?? undefined,
    };
}
