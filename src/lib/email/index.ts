import { IEmailProvider } from "./IEmailProvider";
import { ConsoleEmailProvider } from "./ConsoleEmailProvider";
import { SendGridEmailProvider } from "./SendGridEmailProvider";
import { ResendEmailProvider } from "./ResendEmailProvider";

/**
 * Factory de correo (FEAT-05).
 *
 * Para cambiar de proveedor: modificar EMAIL_PROVIDER en .env
 * No hay que tocar ningún otro archivo en la aplicación.
 *
 * Valores válidos: "console" | "resend" | "sendgrid"
 *
 * **El default es "console" y no "sendgrid"**: un entorno sin configurar no
 * manda correos, los escribe en la terminal. Al revés —default a mandar— una
 * variable que falta en stage saca correos reales firmados con el dominio del
 * cliente.
 */
export function getEmailProvider(): IEmailProvider {
    const provider = process.env.EMAIL_PROVIDER ?? "console";

    switch (provider) {
        case "resend": {
            const key = process.env.RESEND_API_KEY;
            if (!key) throw new Error("EMAIL_PROVIDER=resend requiere RESEND_API_KEY en .env");
            return new ResendEmailProvider(key);
        }
        case "sendgrid": {
            const key = process.env.SENDGRID_API_KEY;
            if (!key) throw new Error("EMAIL_PROVIDER=sendgrid requiere SENDGRID_API_KEY en .env");
            return new SendGridEmailProvider(key);
        }
        case "console":
        default:
            return new ConsoleEmailProvider();
    }
}

export type { EmailMessage, IEmailProvider } from "./IEmailProvider";
