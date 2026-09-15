import type { ReactNode } from "react";
import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { styles } from "./theme";

/**
 * La cáscara que comparten todos los correos: marca arriba, tarjeta al medio,
 * pie abajo (FEAT-05, FEAT-20).
 *
 * **La marca visible es la del instituto, no la de la plataforma.** Es la misma
 * regla que sigue el remitente en [`sender.ts`](../sender.ts): en la bandeja se
 * ve "Modern English School", así que el cuerpo tiene que decir lo mismo. Un
 * correo que llega firmado por el instituto y adentro se presenta como otra
 * empresa es exactamente la forma de un phishing. Lingua Campus queda en el pie,
 * que es donde corresponde a quien pone la infraestructura y no la relación.
 *
 * **Y por eso la cáscara es un componente y no una convención.** Que los tres
 * correos se vean iguales no es prolijidad: es lo único que le permite a una
 * familia reconocer que el cuarto correo que le llega también es del instituto.
 * Dejarlo librado a que cada plantilla lo repita bien es dejar librado eso.
 *
 * Los textos no se escapan a mano: React lo hace, y por eso salió de las
 * plantillas el `escapeHtml` que hacía falta cuando el HTML era una plantilla de
 * strings.
 */

export interface EmailShellProps {
    /** Nombre del instituto — la marca que se ve en la bandeja. */
    instituteName: string;
    /**
     * El renglón que muestran Gmail y Outlook al lado del asunto, antes de
     * abrir. Sin esto muestran las primeras palabras del cuerpo, que suelen ser
     * el título repetido.
     */
    preview: string;
    children: ReactNode;
}

export function EmailShell({ instituteName, preview, children }: EmailShellProps) {
    return (
        <Html lang="es">
            <Head />
            <Preview>{preview}</Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    {/* La marca del instituto, que es la que firma el correo. */}
                    <Section style={styles.logoSection}>
                        <Text style={styles.logoText}>{instituteName}</Text>
                    </Section>

                    <Section style={styles.card}>{children}</Section>

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
