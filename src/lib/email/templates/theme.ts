import type { CSSProperties } from "react";

/**
 * La paleta y los estilos que comparten todos los correos (FEAT-05, FEAT-20).
 *
 * **Están acá y no en cada plantilla porque son una decisión, no un detalle de
 * cada correo.** Con una copia por plantilla, el día que cambien los tokens hay
 * que acordarse de todos los archivos, y el que se olvide manda un correo que se
 * ve de otra empresa.
 */

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
 * tokens de `globals.css`, hay que pasar por acá.** Que sea un solo archivo y no
 * uno por plantilla es justamente para que ese "acá" sea un solo lugar.
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
export const colors = {
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
export const fontStack = "'Exo 2', 'Segoe UI', Helvetica, Arial, sans-serif";

export const styles: Record<string, CSSProperties> = {
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
