// Contrato que deben cumplir todos los providers de correo (FEAT-05).
// Para cambiar de proveedor: implementar esta interfaz y actualizar el factory.

export interface EmailMessage {
    to: string;
    subject: string;
    /**
     * Cuerpo en texto plano. **Obligatorio**, no opcional: es lo que se lee
     * cuando el cliente de correo no carga el HTML, y un correo que sólo trae
     * HTML puntúa peor en los filtros de spam.
     */
    text: string;
    html: string;
    /** Remitente. Tiene que ser de un dominio autenticado en el proveedor. */
    from: string;
    /** Nombre que se ve en la bandeja — el del instituto, no el de la plataforma. */
    fromName: string;
    /** A dónde contesta quien lo recibe, si el instituto tiene un correo cargado. */
    replyTo?: string;
}

export interface IEmailProvider {
    /** Manda el correo, o tira si el proveedor lo rechaza. */
    send(message: EmailMessage): Promise<void>;
}
