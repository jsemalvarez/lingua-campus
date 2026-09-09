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

/**
 * Paleta — la misma que ve el que recibe cuando hace clic.
 *
 * **El correo es claro porque el resto del recorrido es claro.** El enlace lleva
 * al campus y de ahí al sitio del instituto, y los dos son fondo pálido con
 * tarjeta blanca: un mail de tarjeta oscura hace que el clic se sienta como un
 * salto entre dos productos distintos. En un correo de recuperación eso no es
 * sólo estética — la continuidad visual es la mitad de lo que distingue un
 * correo legítimo de uno que imita a uno.
 *
 * **Copiada a mano y no importada, porque no hay forma de importarla.** El
 * correo viaja con todo el estilo en atributos `style`: no hay hoja de estilos
 * ni cascada, y ningún cliente de correo resuelve un `var(--c-primary)`. Así
 * que esto es una copia, y como toda copia se desincroniza: **si cambian los
 * tokens de `globals.css`, hay que pasar por acá.**
 *
 * Son los tokens de la app y no los del landing del cliente, y la diferencia
 * es sólo de grises. La marca la comparten —`--c-primary` es el mismo verde
 * que `InstituteLanding.tsx` tiene hardcodeado, y `--c-accent` el mismo azul—,
 * pero el landing usa slate azulados y casi negros, que funcionan a 48px sobre
 * un degradé y pesan demasiado a 20px sobre blanco. El correo se lee como un
 * documento, así que sigue la escala de la app, que es además la de la pantalla
 * donde aterriza el enlace.
 *
 * La etiqueta del botón va en blanco porque `--c-primary-fg` es blanco. Da
 * 2,6:1, por debajo del mínimo de accesibilidad, y se acepta a sabiendas: es lo
 * que el instituto publica en su home y lo que la app usa en cada botón
 * primario. Arreglar el contraste sólo acá dejaría al correo siendo el único
 * lugar donde el botón no se ve como el de siempre.
 *
 * El enlace de respaldo va en el azul de `--c-accent` y no en el verde:
 * subrayado y verde se confunde con el botón, y azul es lo que la gente
 * reconoce como algo en lo que se hace clic.
 */
const colors = {
    // El fondo de página no sale de un token: en pantalla la tarjeta se apoya
    // sobre `--c-bg` blanco y se separa con el borde, pero en un correo tiene
    // que flotar. Es un neutro de la misma familia que `--c-muted`.
    bgOuter: "#F5F5F5",
    bgCard: "#FFFFFF", // --c-card
    border: "#E6E6E6", // --c-border
    textPrimary: "#4D4D4D", // --c-fg
    textMuted: "#808080", // --c-muted-fg
    accent: "#38B397", // --c-primary
    accentText: "#FFFFFF", // --c-primary-fg
    link: "#2E3192", // --c-accent
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
                            <span style={{ color: colors.link }}>{url}</span>
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
