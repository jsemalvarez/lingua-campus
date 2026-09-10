import { render } from "@react-email/components";
import PreEnrollmentReceivedEmail from "./PreEnrollmentReceivedEmail";

export type PreEnrollmentReceivedEmailParams = {
    instituteName: string;
    /** De quién es la preinscripción que llegó. */
    studentName: string;
    /** Si el instituto tiene un correo de contacto al que se pueda responder. */
    puedeResponder: boolean;
};

/**
 * El acuse de preinscripción (FEAT-20).
 *
 * Devuelve las tres partes y no manda nada: quién lo manda es el proveedor, y
 * así esto se puede leer de un vistazo sin mirar la infraestructura. Es el mismo
 * reparto que [`passwordReset.tsx`](./passwordReset.tsx).
 *
 * **Está escrito en tercera persona a propósito.** El mismo cuerpo le llega al
 * alumno y a su tutor —cuando los dos dejaron correo—, así que no puede decir
 * "tu preinscripción". Con eso alcanza para no necesitar la maquinaria de
 * `esParaOtro` que sí tiene el correo de recuperación.
 *
 * **El texto plano se escribe a mano y no con `render(..., { plainText: true })`**,
 * que aplana el HTML y devuelve algo legible pero desprolijo. Es el único cuerpo
 * que ve quien tiene el HTML desactivado, y no es opcional: un correo que sólo
 * trae HTML puntúa peor en los filtros de spam, y éste sale de un formulario
 * público — justo donde no conviene arriesgar reputación de dominio.
 *
 * Es asíncrona porque `render` lo es.
 */
export async function preEnrollmentReceivedEmail(
    params: PreEnrollmentReceivedEmailParams
): Promise<{ subject: string; text: string; html: string }> {
    const { instituteName, studentName, puedeResponder } = params;

    const subject = `Recibimos la preinscripción de ${studentName}`;
    const preview = "Queda en revisión hasta que el instituto se comunique.";

    const parrafos = [
        `Recibimos la preinscripción de ${studentName} a ${instituteName}.`,
        // El punto entero del correo: que quede claro que esto no es una vacante
        // confirmada sino un trámite abierto, y que no hay nada más que hacer.
        "Todavía no es una inscripción confirmada: queda en revisión hasta que el instituto se comunique para continuar. No hace falta volver a completar el formulario.",
    ];

    // Sólo cuando hay a dónde responder. El `replyTo` sale del correo de contacto
    // de la ficha del instituto, que es opcional y puede estar vacío.
    const nota = puedeResponder
        ? "Si algún dato de la inscripción no es correcto, respondé este correo."
        : undefined;

    const text = [...parrafos, ...(nota ? [nota] : []), instituteName].join("\n\n");

    const html = await render(
        <PreEnrollmentReceivedEmail
            instituteName={instituteName}
            preview={preview}
            parrafos={parrafos}
            nota={nota}
        />
    );

    return { subject, text, html };
}
