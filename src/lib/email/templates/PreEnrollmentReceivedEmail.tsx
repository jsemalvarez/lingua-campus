import { Text } from "@react-email/components";
import { EmailShell } from "./EmailShell";
import { styles } from "./theme";

/**
 * El cuerpo HTML del acuse de preinscripción (FEAT-20).
 *
 * **No decide qué dice: recibe los párrafos ya escritos**, igual que
 * [`PasswordResetEmail`](./PasswordResetEmail.tsx) y por el mismo motivo. Los
 * arma [`preEnrollmentReceived`](./preEnrollmentReceived.tsx), que es también
 * quien arma la versión en texto plano: si cada uno redactara la suya, tarde o
 * temprano dicen cosas distintas.
 *
 * **Lo que no dice, y conviene no volver a agregar desde acá:** este correo no
 * copia la ficha. El pedido original era mandarle a la familia los datos que
 * había cargado, y se descartó porque el alumno queda `PRE_INSCRIBED` —o sea
 * aspirante, no inscripto— y porque la dirección de destino no está verificada:
 * la escribió quien llenó un formulario público. El razonamiento completo está
 * en FEAT-20, en el backlog.
 */

export interface PreEnrollmentReceivedEmailProps {
    /** Nombre del instituto — la marca que se ve en la bandeja. */
    instituteName: string;
    /** El renglón que se ve al lado del asunto, antes de abrir. */
    preview: string;
    /** El cuerpo, un párrafo por elemento. */
    parrafos: string[];
    /** El renglón chico del final, si corresponde. */
    nota?: string;
}

export default function PreEnrollmentReceivedEmail({
    instituteName,
    preview,
    parrafos,
    nota,
}: PreEnrollmentReceivedEmailProps) {
    return (
        <EmailShell instituteName={instituteName} preview={preview}>
            <Text style={styles.heading}>Preinscripción recibida</Text>

            {parrafos.map((parrafo) => (
                <Text key={parrafo} style={styles.paragraph}>
                    {parrafo}
                </Text>
            ))}

            {nota ? <Text style={styles.muted}>{nota}</Text> : null}
        </EmailShell>
    );
}
