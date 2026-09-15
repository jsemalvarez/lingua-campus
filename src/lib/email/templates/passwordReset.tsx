import { render } from "@react-email/components";
import PasswordResetEmail from "./PasswordResetEmail";

export type PasswordResetEmailParams = {
    /** De quién es la contraseña que este enlace cambia. */
    subjectName: string;
    /** Nombre de quien recibe el correo, si el sistema lo tiene. */
    recipientName?: string;
    /**
     * Si el enlace cambia la contraseña de **otra** persona — el caso del tutor
     * que recibe el de su hijo.
     *
     * **Es un dato explícito y no una comparación de nombres.** El correo del
     * tutor puede estar cargado en la ficha sin el nombre al lado, y adivinando
     * por el nombre ese caso se leería como "es la misma persona": al tutor le
     * llegaría un "restablecé *tu* contraseña" por una contraseña que no es
     * suya, saludándolo por el nombre de su hijo.
     */
    esParaOtro: boolean;
    instituteName: string;
    url: string;
    ttlMinutes: number;
};

/**
 * El correo de recuperación de contraseña (FEAT-05).
 *
 * Devuelve las tres partes y no manda nada: quién lo manda es el proveedor, y
 * así esto se puede leer de un vistazo sin mirar la infraestructura.
 *
 * **El HTML lo arma un componente de React Email** —
 * [`PasswordResetEmail`](./PasswordResetEmail.tsx)— y el texto plano se sigue
 * escribiendo acá. Los dos salen del **mismo** saludo y del mismo motivo, y ésa
 * es la parte que importa: son dos versiones del mismo correo, y la única vez
 * que este mail salió mal fue porque una de las dos decidía por su cuenta si
 * era para el dueño de la contraseña o para su tutor.
 *
 * **El texto plano no se genera con `render(..., { plainText: true })`.** Esa
 * conversión aplana el HTML y devuelve algo legible pero desprolijo — el enlace
 * repetido, el pie pegado al cuerpo. Es el único cuerpo que ve quien tiene el
 * HTML desactivado, así que se escribe a mano.
 *
 * Es asíncrona porque `render` lo es.
 */
export async function passwordResetEmail(params: PasswordResetEmailParams): Promise<{
    subject: string;
    text: string;
    html: string;
}> {
    const { subjectName, recipientName, esParaOtro, instituteName, url, ttlMinutes } = params;

    // Sin nombre no hay saludo. Pasa con el tutor cuyo correo está en la ficha y
    // el nombre no: "Hola:" a secas se lee peor que empezar por el motivo.
    const nombreDelSaludo = esParaOtro ? recipientName?.trim() : subjectName;
    const saludo = nombreDelSaludo ? `Hola ${nombreDelSaludo}:` : undefined;

    const subject = esParaOtro
        ? `Restablecé la contraseña de ${subjectName}`
        : `Restablecé tu contraseña de ${instituteName}`;

    const motivo = esParaOtro
        ? `Pediste restablecer la contraseña de ${subjectName} en ${instituteName}. Recibís este correo porque figurás como su tutor.`
        : `Pediste restablecer tu contraseña de ${instituteName}.`;

    const text = [
        ...(saludo ? [saludo, ""] : []),
        motivo,
        "",
        "Entrá acá y elegí una nueva:",
        url,
        "",
        `El enlace vence en ${ttlMinutes} minutos y se puede usar una sola vez.`,
        "",
        "Si no lo pediste, podés ignorar este correo: la contraseña sigue siendo la misma.",
        "",
        instituteName,
    ].join("\n");

    const html = await render(
        <PasswordResetEmail
            instituteName={instituteName}
            saludo={saludo}
            motivo={motivo}
            url={url}
            ttlMinutes={ttlMinutes}
        />
    );

    return { subject, text, html };
}
