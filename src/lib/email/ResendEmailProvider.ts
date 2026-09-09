import { Resend } from "resend";
import { EmailMessage, IEmailProvider } from "./IEmailProvider";

/**
 * Envío por Resend, con el SDK oficial.
 *
 * A diferencia de [SendGrid](./SendGridEmailProvider.ts) —que se hizo con `fetch`
 * pelado porque su SDK no aportaba nada— acá el paquete sí se justifica: es el
 * que entiende la prop `react`, que es por donde entra una plantilla de React
 * Email si la plantilla se migra a componente.
 *
 * **Resend no tira cuando el envío falla: devuelve `{ data, error }`.** Ésta es
 * la adaptación que hay que hacer sí o sí, y la que rompe el flujo entero si se
 * olvida. El contrato de [`IEmailProvider`](./IEmailProvider.ts) dice "manda o
 * tira", y de ese `throw` cuelga todo lo de arriba: `Promise.allSettled` en
 * `requestPasswordResetAction` cuenta los `rejected` para decidir si le avisa al
 * instituto que no salió nada. Devolviendo el error en vez de tirarlo, un envío
 * rechazado se contaría como exitoso, y un fracaso quedaría invisible para
 * todos: la pantalla contesta siempre lo mismo, así que la campana del instituto
 * es el único lugar donde el problema sale a la superficie.
 *
 * **El seguimiento de clics no se apaga acá, y hay que saberlo.** En SendGrid es
 * una opción por mensaje; en Resend es una configuración **del dominio**. Tiene
 * que quedar apagada por la misma razón de siempre: con el tracking prendido se
 * reescribe cada enlace para que pase por un dominio de Resend, así que el botón
 * de "elegir una nueva contraseña" dejaría de apuntar al instituto — en un
 * correo de recuperación eso se parece demasiado a un phishing, que es
 * exactamente lo que no queremos que parezca. Hoy `lingua-campus.com.ar` tiene
 * open y click tracking en `false`; si alguien los prende desde el panel, esto
 * se rompe en silencio y sin que cambie una línea de código.
 */
export class ResendEmailProvider implements IEmailProvider {
    private readonly client: Resend;

    constructor(apiKey: string) {
        this.client = new Resend(apiKey);
    }

    async send(message: EmailMessage): Promise<void> {
        const { error } = await this.client.emails.send({
            from: formatFrom(message.fromName, message.from),
            to: message.to,
            subject: message.subject,
            // El orden no importa como en SendGrid, pero el texto plano sigue
            // siendo obligatorio: es lo que se lee sin HTML y lo que evita que
            // el correo puntúe peor en los filtros de spam.
            text: message.text,
            html: message.html,
            ...(message.replyTo ? { replyTo: message.replyTo } : {}),
        });

        if (error) {
            // El error de Resend dice cuál es el problema —dominio sin
            // verificar, clave inválida, destinatario suprimido—. Sin eso,
            // "falló el envío" no alcanza para arreglar nada.
            throw new Error(`Resend rechazó el envío (${error.name}): ${error.message}`);
        }
    }
}

/**
 * El remitente en el formato que pide Resend: `Nombre <dirección>`.
 *
 * **El nombre va siempre entre comillas.** Es el del instituto, sale de la base
 * y puede traer una coma, un punto o un guion —"Modern English School, S.A." es
 * un nombre perfectamente normal—, y cualquiera de esos caracteres sin comillas
 * parte el encabezado en dos direcciones. Entre comillas es válido siempre, así
 * que no hace falta decidir cuándo hace falta: se ponen y listo. Adentro se
 * escapan la barra y la comilla, que son lo único que puede cerrar la cadena
 * antes de tiempo.
 */
function formatFrom(name: string, address: string): string {
    const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}" <${address}>`;
}
