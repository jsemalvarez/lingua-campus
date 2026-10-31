/**
 * Registro de errores desde el navegador (ARQ-09).
 *
 * El navegador no puede escribir en la base: le avisa a `/api/errors`, que
 * registra con el mismo `reportError` que el servidor. Antes, lo que fallaba acá
 * quedaba en la consola del celular del alumno, donde nadie lo iba a ver.
 *
 * ```ts
 * } catch (err) {
 *     reportClientError(err, { action: "practica.audio", context: { lessonPracticeId } });
 * }
 * ```
 *
 * **No espera ni tira.** Se manda y se sigue: el aviso no puede trabar la
 * pantalla ni convertirse en otro error. `keepalive` lo deja salir aunque la
 * persona cierre la pestaña enseguida.
 *
 * **Filtra el ruido antes de mandar**, porque el navegador tira errores que no
 * son nuestros: extensiones, avisos conocidos del navegador, y los cortes de red
 * con el equipo desconectado —ese aviso tampoco llegaría, y no es una falla del
 * campus—.
 */

export type ClientReportOptions = {
    /** Como en el servidor: `area.verbo`. Decide el área y el nombre del aviso. */
    action: string;
    /** Si la persona vio un cartel. Por defecto no: casi todo lo del navegador falla callado. */
    shownToUser?: boolean;
    /** Sólo ids. */
    context?: Record<string, string | number | boolean | null | undefined>;
};

const IGNORED = [
    /ResizeObserver loop/i,
    /^Script error\.?$/i,
    // Se cerró la pestaña o se navegó mientras salía un pedido: no es una falla.
    /AbortError|The user aborted a request|signal is aborted/i,
];

// Un mismo error en loop manda un aviso por carga de página, no cien.
const sent = new Set<string>();

export function reportClientError(error: unknown, { action, shownToUser = false, context }: ClientReportOptions): void {
    if (typeof window === "undefined") return;

    console.error(`[${action}]`, context ?? {}, error);

    const name = error instanceof Error ? error.name : "Error";
    const message = error instanceof Error ? error.message : String(error);

    if (IGNORED.some((re) => re.test(message) || re.test(name))) return;
    // Sin conexión, el aviso tampoco sale. Y un corte de red no es del campus.
    if (!navigator.onLine) return;

    const key = `${action}|${message}`;
    if (sent.has(key)) return;
    sent.add(key);

    try {
        fetch("/api/errors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action,
                name,
                message: message.slice(0, 500),
                shownToUser,
                path: normalizePath(location.pathname),
                context,
            }),
            keepalive: true,
        }).catch(() => {});
    } catch {
        // Si ni siquiera se puede armar el pedido, no hay a quién avisarle.
    }
}

/**
 * Si el error pasó en el navegador y no en el servidor. Para los `catch` que
 * envuelven un pedido a nuestra API y reciben también el `throw` armado con la
 * respuesta: lo que falló en la API ya lo registró el servidor, y registrarlo de
 * nuevo desde acá mandaría dos avisos por lo mismo. Lo que sólo ve el navegador
 * es el pedido que no llegó (`TypeError`) o la respuesta ilegible (`SyntaxError`).
 */
export function failedInBrowser(error: unknown): boolean {
    return error instanceof TypeError || error instanceof SyntaxError;
}

/**
 * La ruta con los ids cambiados por `[id]`: `/courses/cm1a…/lessons/cm2b…` es
 * `/courses/[id]/lessons/[id]`. Así una misma pantalla que se rompe para cien
 * alumnos es un problema y no cien, y el área se deduce igual que en el servidor.
 */
export function normalizePath(path: string): string {
    return path
        .split("/")
        .map((part) => (/^c[a-z0-9]{20,}$/.test(part) || /^[0-9a-f-]{32,36}$/i.test(part) || /^\d+$/.test(part) ? "[id]" : part))
        .join("/");
}
