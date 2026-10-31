import { Column, Hr, Row, Section, Text } from "@react-email/components";
import { EmailShell } from "./EmailShell";
import { colors, styles } from "./theme";

/**
 * El cuerpo HTML del aviso de error (ARQ-09).
 *
 * Como el aviso de preinscripción, **no decide qué dice**: recibe las filas ya
 * escritas de [`errorAlert`](./errorAlert.tsx), que arma también el texto plano.
 *
 * Lo lee una sola persona —quien mantiene el campus— y lo lee para contestarle
 * al instituto antes de que pregunte. Por eso es una ficha y no una carta: cada
 * dato en su renglón, para encontrarlo de un vistazo en el celular.
 */

export interface ErrorAlertEmailProps {
    preview: string;
    heading: string;
    /** Qué, quién, dónde, cuándo: un renglón por dato. */
    filas: [etiqueta: string, valor: string][];
    /** Si es la primera vez en el campus o ya pasó en otro instituto. */
    contexto: string;
    nota: string;
}

export default function ErrorAlertEmail({ preview, heading, filas, contexto, nota }: ErrorAlertEmailProps) {
    return (
        <EmailShell instituteName="Registro de errores" preview={preview}>
            <Text style={styles.heading}>{heading}</Text>

            <Section style={{ margin: "8px 0 16px" }}>
                {filas.map(([etiqueta, valor]) => (
                    <Row key={etiqueta} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <Column style={{ ...styles.muted, width: "120px", padding: "8px 0", margin: 0, verticalAlign: "top" }}>
                            {etiqueta}
                        </Column>
                        <Column style={{ ...styles.paragraph, padding: "8px 0", margin: 0, wordBreak: "break-word" }}>
                            {valor}
                        </Column>
                    </Row>
                ))}
            </Section>

            <Text style={styles.paragraph}>{contexto}</Text>

            <Hr style={styles.hr} />

            <Text style={styles.muted}>{nota}</Text>
        </EmailShell>
    );
}
