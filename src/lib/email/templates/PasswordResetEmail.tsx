import type { CSSProperties } from "react";
import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";

/**
 * El cuerpo HTML del correo de recuperación (FEAT-05).
 *
 * **No decide qué dice: recibe el saludo y el motivo ya escritos.** Los arma
 * [`passwordResetEmail`](./passwordReset.tsx), que es también quien arma la
 * versión en texto plano. Que las dos salgan del mismo lugar no es prolijidad:
 * la única vez que este correo salió mal fue porque el HTML resolvía por su
 * cuenta si era para el dueño de la contraseña o para su tutor, y se
 * equivocaba. Acá abajo eso no se puede volver a decidir.
 *
 * **La marca visible es la del instituto, no la de la plataforma.** Es la misma
 * regla que sigue el remitente en [`sender.ts`](../sender.ts): en la bandeja se
 * ve "Modern English School", así que el cuerpo tiene que decir lo mismo. Un
 * correo que llega firmado por el instituto y adentro se presenta como otra
 * empresa es exactamente la forma de un phishing. Lingua Campus queda en el pie,
 * que es donde corresponde a quien pone la infraestructura y no la relación.
 *
 * Los textos no se escapan a mano: React lo hace, y por eso salió del template
 * el `escapeHtml` que hacía falta cuando el HTML era una plantilla de strings.
 */

export interface PasswordResetEmailProps {
    /** Nombre del instituto — la marca que se ve en la bandeja. */
    instituteName: string;
    /** "Hola Fulano", ya resuelto. Vacío cuando no sabemos el nombre. */
    saludo?: string;
    /** Por qué le llega este correo a quien lo abre. */
    motivo: string;
    url: string;
    ttlMinutes: number;
}

// Paleta de marca — Lingua Campus
const colors = {
    bgOuter: "#0B1220",
    bgCard: "#131B2E",
    border: "rgba(245, 200, 66, 0.12)",
    textPrimary: "#F5F5F7",
    textMuted: "#94A3B8",
    accent: "#F5C842",
    accentText: "#0B1220",
};

// Exo 2 no se va a ver en la mayoría de los clientes —Gmail bloquea las fuentes
// remotas—, así que el fallback no es un adorno: es lo que se lee casi siempre.
const fontStack = "'Exo 2', 'Segoe UI', Helvetica, Arial, sans-serif";

export default function PasswordResetEmail({
    instituteName,
    saludo,
    motivo,
    url,
    ttlMinutes,
}: PasswordResetEmailProps) {
    return (
        <Html lang="es">
            <Head />
            <Preview>{motivo}</Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    {/* La marca del instituto, que es la que firma el correo. */}
                    <Section style={styles.logoSection}>
                        <Text style={styles.logoText}>{instituteName}</Text>
                    </Section>

                    <Section style={styles.card}>
                        <Text style={styles.heading}>Restablecer la contraseña</Text>

                        {saludo ? <Text style={styles.paragraph}>{saludo}</Text> : null}
                        <Text style={styles.paragraph}>{motivo}</Text>

                        <Section style={{ textAlign: "center", margin: "32px 0 24px" }}>
                            <Button href={url} style={styles.button}>
                                Elegir una nueva contraseña
                            </Button>
                        </Section>

                        <Text style={styles.muted}>
                            El enlace vence en {ttlMinutes} minutos y se puede usar una sola vez.
                            Si no lo pediste, podés ignorar este correo: la contraseña sigue
                            siendo la misma.
                        </Text>

                        <Hr style={styles.hr} />

                        <Text style={styles.fallback}>
                            ¿El botón no funciona? Copiá y pegá este enlace en tu navegador:
                            <br />
                            <span style={{ color: colors.accent }}>{url}</span>
                        </Text>
                    </Section>

                    <Section style={styles.footerSection}>
                        <Text style={styles.footerText}>
                            {instituteName} · enviado con Lingua Campus
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const styles: Record<string, CSSProperties> = {
    body: {
        backgroundColor: colors.bgOuter,
        fontFamily: fontStack,
        margin: 0,
        padding: "40px 16px",
    },
    container: {
        maxWidth: "480px",
        margin: "0 auto",
    },
    logoSection: {
        textAlign: "center",
        marginBottom: "24px",
    },
    logoText: {
        fontSize: "20px",
        fontWeight: 700,
        color: colors.textPrimary,
        letterSpacing: "-0.02em",
        margin: 0,
    },
    card: {
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        padding: "40px 32px",
    },
    heading: {
        fontSize: "22px",
        fontWeight: 700,
        color: colors.textPrimary,
        margin: "0 0 16px",
        lineHeight: 1.3,
    },
    paragraph: {
        fontSize: "15px",
        lineHeight: 1.6,
        color: colors.textPrimary,
        margin: "0 0 12px",
    },
    button: {
        backgroundColor: colors.accent,
        color: colors.accentText,
        fontSize: "15px",
        fontWeight: 700,
        textDecoration: "none",
        padding: "14px 32px",
        borderRadius: "8px",
        display: "inline-block",
    },
    muted: {
        fontSize: "13px",
        lineHeight: 1.6,
        color: colors.textMuted,
        margin: "0 0 8px",
    },
    hr: {
        borderColor: colors.border,
        margin: "24px 0",
    },
    fallback: {
        fontSize: "12px",
        lineHeight: 1.6,
        color: colors.textMuted,
        wordBreak: "break-all",
        margin: 0,
    },
    footerSection: {
        textAlign: "center",
        marginTop: "24px",
    },
    footerText: {
        fontSize: "12px",
        color: colors.textMuted,
        margin: 0,
    },
};
