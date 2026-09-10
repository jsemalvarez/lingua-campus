import { Button, Hr, Section, Text } from "@react-email/components";
import { EmailShell } from "./EmailShell";
import { colors, styles } from "./theme";

/**
 * El cuerpo HTML del aviso al instituto (FEAT-12).
 *
 * **No decide qué dice: recibe el título, los párrafos y la nota ya escritos.**
 * Los arma [`preEnrollmentAlert`](./preEnrollmentAlert.tsx), que es también quien
 * arma la versión en texto plano. Acá adentro hay tres situaciones que se
 * parecen —una preinscripción nueva, y alguien que ya está en la base volviendo a
 * anotarse— y decidir cuál es desde el HTML es la forma exacta en que este tipo
 * de correo sale mal.
 *
 * **No copia los datos del aspirante: manda a la aplicación.** Es la decisión de
 * FEAT-12 y no cambió: hay datos de menores de por medio, y la ficha completa ya
 * está del otro lado del botón, donde quien la mira está autenticado.
 */

export interface PreEnrollmentAlertEmailProps {
    /** Nombre del instituto — la marca que se ve en la bandeja. */
    instituteName: string;
    /** El renglón que se ve al lado del asunto, antes de abrir. */
    preview: string;
    heading: string;
    /** El cuerpo, un párrafo por elemento. */
    parrafos: string[];
    /** El renglón chico del final, si corresponde. */
    nota?: string;
    /** La etiqueta del botón, que no dice lo mismo según a dónde lleve. */
    boton: string;
    /** A dónde lleva: la pestaña de preinscriptos, o la ficha del que ya estaba. */
    url: string;
}

export default function PreEnrollmentAlertEmail({
    instituteName,
    preview,
    heading,
    parrafos,
    nota,
    boton,
    url,
}: PreEnrollmentAlertEmailProps) {
    return (
        <EmailShell instituteName={instituteName} preview={preview}>
            <Text style={styles.heading}>{heading}</Text>

            {parrafos.map((parrafo) => (
                <Text key={parrafo} style={styles.paragraph}>
                    {parrafo}
                </Text>
            ))}

            <Section style={{ textAlign: "center", margin: "32px 0 24px" }}>
                <Button href={url} style={styles.button}>
                    {boton}
                </Button>
            </Section>

            {nota ? <Text style={styles.muted}>{nota}</Text> : null}

            <Hr style={styles.hr} />

            <Text style={styles.fallback}>
                ¿El botón no funciona? Copiá y pegá este enlace en tu navegador:
                <br />
                <span style={{ color: colors.link }}>{url}</span>
            </Text>
        </EmailShell>
    );
}
