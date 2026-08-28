import { EmailMessage, IEmailProvider } from "./IEmailProvider";

const ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

/**
 * Envío por la API v3 de SendGrid, con `fetch` y sin SDK: es un POST con un
 * JSON, y `@sendgrid/mail` no aporta nada que justifique una dependencia más.
 *
 * **El seguimiento de clics va apagado**, y es la decisión menos obvia de este
 * archivo. Con él prendido, SendGrid reescribe cada enlace para que pase por un
 * dominio suyo, así que el botón de "restablecer tu contraseña" dejaría de
 * apuntar al instituto. En cualquier otro correo eso es una molestia; en uno de
 * recuperación se parece demasiado a un phishing, que es exactamente lo que no
 * queremos que parezca. El de aperturas se apaga por lo mismo: mete un pixel
 * remoto en un correo que no necesita medirse.
 */
export class SendGridEmailProvider implements IEmailProvider {
    constructor(private readonly apiKey: string) {}

    async send(message: EmailMessage): Promise<void> {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: message.to }] }],
                from: { email: message.from, name: message.fromName },
                ...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
                subject: message.subject,
                // El orden importa: SendGrid exige el texto plano antes del HTML.
                content: [
                    { type: "text/plain", value: message.text },
                    { type: "text/html", value: message.html },
                ],
                tracking_settings: {
                    click_tracking: { enable: false, enable_text: false },
                    open_tracking: { enable: false },
                },
            }),
        });

        if (!response.ok) {
            // El cuerpo del error de SendGrid dice cuál es el problema —remitente
            // sin verificar, clave inválida, dominio sin autenticar—. Sin él,
            // "falló el envío" no alcanza para arreglar nada.
            const detail = await response.text().catch(() => "");
            throw new Error(`SendGrid respondió ${response.status}: ${detail}`);
        }
    }
}
