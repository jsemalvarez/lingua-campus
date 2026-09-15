import { Button, Hr, Section, Text } from "@react-email/components";
import { EmailShell } from "./EmailShell";
import { colors, styles } from "./theme";

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
 * La marca del instituto, la tarjeta y el pie los pone
 * [`EmailShell`](./EmailShell.tsx), y la paleta vive en [`theme.ts`](./theme.ts).
 * Acá queda sólo lo que este correo tiene y los otros no.
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

export default function PasswordResetEmail({
    instituteName,
    saludo,
    motivo,
    url,
    ttlMinutes,
}: PasswordResetEmailProps) {
    return (
        <EmailShell instituteName={instituteName} preview={motivo}>
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
        </EmailShell>
    );
}
