import { EmailMessage, IEmailProvider } from "./IEmailProvider";

/**
 * Escribe el correo en la consola del servidor en vez de mandarlo.
 *
 * **Es el proveedor por defecto, y eso es a propósito.** En local y en stage no
 * hace falta mandar nada de verdad para probar el flujo entero: el link sale por
 * la terminal y se pega en el navegador. Y sobre todo, evita que un entorno de
 * prueba mal configurado mande correos firmados con la marca del instituto — el
 * remitente es el dominio del cliente, así que un envío de prueba que se escapa
 * no es una molestia interna, la ve alguien de afuera.
 */
export class ConsoleEmailProvider implements IEmailProvider {
    async send(message: EmailMessage): Promise<void> {
        console.log(
            [
                "───────── correo (proveedor: console) ─────────",
                `Para:      ${message.to}`,
                `De:        ${message.fromName} <${message.from}>`,
                ...(message.replyTo ? [`Responder: ${message.replyTo}`] : []),
                `Asunto:    ${message.subject}`,
                "",
                message.text,
                "───────────────────────────────────────────────",
            ].join("\n")
        );
    }
}
