/**
 * Mensaje de error para las llamadas a `/api/practice`.
 *
 * El 429 del límite de uso (SEC-07) es el único caso en el que el servidor
 * manda un texto pensado para el alumno —dice si el tope es suyo o del
 * instituto—, así que se muestra tal cual. El resto son fallas técnicas y va el
 * mensaje que ya tenía cada pantalla.
 */
export async function practiceApiError(res: Response, fallback: string): Promise<string> {
    if (res.status !== 429) return fallback;

    const message = await res.text().catch(() => "");
    return message.trim() || "Alcanzaste el límite de práctica con IA por ahora. Probá de nuevo más tarde.";
}
