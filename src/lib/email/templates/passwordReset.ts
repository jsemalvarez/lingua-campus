export type PasswordResetEmailParams = {
    /** De quién es la contraseña que este enlace cambia. */
    subjectName: string;
    /**
     * Quién recibe el correo, cuando no es la misma persona.
     *
     * Hoy siempre es la misma —cada cuenta pide por su propia dirección—, pero
     * con los alumnos el correo le llega al tutor: son dos datos distintos y el
     * cuerpo tiene que decirlo, porque un tutor con dos hijos en el instituto
     * recibe dos correos casi iguales.
     */
    recipientName?: string;
    instituteName: string;
    url: string;
    ttlMinutes: number;
};

/** Los nombres salen de la base y se meten en el HTML: hay que escaparlos. */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * El correo de recuperación de contraseña (FEAT-05).
 *
 * Devuelve las tres partes y no manda nada: quién lo manda es el proveedor, y
 * así esto se puede leer de un vistazo sin mirar la infraestructura.
 */
export function passwordResetEmail(params: PasswordResetEmailParams): {
    subject: string;
    text: string;
    html: string;
} {
    const { subjectName, recipientName, instituteName, url, ttlMinutes } = params;

    const esPropia = !recipientName || recipientName === subjectName;
    const saludo = esPropia ? subjectName : recipientName;

    const subject = esPropia
        ? `Restablecé tu contraseña de ${instituteName}`
        : `Restablecé la contraseña de ${subjectName}`;

    const motivo = esPropia
        ? `Pediste restablecer tu contraseña de ${instituteName}.`
        : `Pediste restablecer la contraseña de ${subjectName} en ${instituteName}. Recibís este correo porque figurás como su tutor.`;

    const text = [
        `Hola ${saludo}:`,
        "",
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

    const html = `
<div style="margin:0;padding:24px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 24px;font-size:20px;line-height:1.3;font-weight:700;color:#0f172a;">${escapeHtml(instituteName)}</h1>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hola ${escapeHtml(saludo)}:</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(motivo)}</p>

    <p style="margin:0 0 28px;">
      <a href="${encodeURI(url)}" style="display:inline-block;padding:13px 26px;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">Elegir una nueva contraseña</a>
    </p>

    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">Si el botón no funciona, copiá y pegá esta dirección en el navegador:</p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#4f46e5;word-break:break-all;">${escapeHtml(url)}</p>

    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#64748b;">El enlace vence en ${ttlMinutes} minutos y se puede usar una sola vez.</p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />

    <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">Si no lo pediste, podés ignorar este correo: la contraseña sigue siendo la misma.</p>
  </div>
</div>`.trim();

    return { subject, text, html };
}
