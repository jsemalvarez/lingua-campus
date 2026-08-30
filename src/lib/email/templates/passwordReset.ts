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
    const { subjectName, recipientName, esParaOtro, instituteName, url, ttlMinutes } = params;

    // Sin nombre no hay saludo. Pasa con el tutor cuyo correo está en la ficha y
    // el nombre no: "Hola:" a secas se lee peor que empezar por el motivo.
    const saludo = esParaOtro ? recipientName?.trim() : subjectName;

    const subject = esParaOtro
        ? `Restablecé la contraseña de ${subjectName}`
        : `Restablecé tu contraseña de ${instituteName}`;

    const motivo = esParaOtro
        ? `Pediste restablecer la contraseña de ${subjectName} en ${instituteName}. Recibís este correo porque figurás como su tutor.`
        : `Pediste restablecer tu contraseña de ${instituteName}.`;

    const text = [
        ...(saludo ? [`Hola ${saludo}:`, ""] : []),
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

    const saludoHtml = saludo
        ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hola ${escapeHtml(saludo)}:</p>`
        : "";

    const html = `
<div style="margin:0;padding:24px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 24px;font-size:20px;line-height:1.3;font-weight:700;color:#0f172a;">${escapeHtml(instituteName)}</h1>

    ${saludoHtml}
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
