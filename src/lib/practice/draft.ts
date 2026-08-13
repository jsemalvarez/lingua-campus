/**
 * Condiciones para poder generar la práctica de una clase con IA (PED-01).
 *
 * Vive en un módulo propio, sin `prisma` ni `next-auth`, porque lo usan los dos
 * lados: el modal de clase para no ofrecer un botón que va a fallar, y el
 * endpoint para no gastar una llamada paga aunque la interfaz se equivoque.
 *
 * El caso que esto ataja no es raro, es el normal: `generateLessonsAction` crea
 * todas las clases del período desde los horarios del curso, con el tema en
 * `SCHEDULED_LESSON_TOPIC` y sin contenidos. Sin este chequeo, el botón le pide
 * a la IA una práctica sobre el título "Clase Programada" y la escribe igual.
 */

/** Tema con el que nacen las clases generadas en tanda. No es un tema real. */
export const SCHEDULED_LESSON_TOPIC = "Clase Programada";

/**
 * Mínimo de contenidos. Es bajo a propósito: no mide calidad, sólo evita que se
 * saltee el requisito con un punto. El tema no sirve para llenar este lugar —es
 * el título que ven alumnos y tutores, y es corto por diseño—, así que lo que la
 * IA lee para escribir la práctica es esto.
 */
export const MIN_DRAFT_CONTENT_CHARS = 30;

export type DraftReadiness =
    | { ready: true }
    | { ready: false; reason: string };

/**
 * Dice si una clase está en condiciones de generar su práctica.
 *
 * Se evalúa contra lo que está **guardado**, no contra lo que el docente tenga
 * escrito en pantalla: el borrador lo arma el servidor leyendo la clase de la
 * base. Por eso los mensajes dicen "guardá" y no "cargá".
 */
export function checkDraftInputs(topic: string, content: string | null): DraftReadiness {
    const cleanTopic = topic.trim();

    if (!cleanTopic || cleanTopic.toLowerCase() === SCHEDULED_LESSON_TOPIC.toLowerCase()) {
        return {
            ready: false,
            reason: `Poné el tema real de la clase —no "${SCHEDULED_LESSON_TOPIC}"— y guardá los cambios para poder generar la práctica.`,
        };
    }

    if ((content ?? "").trim().length < MIN_DRAFT_CONTENT_CHARS) {
        return {
            ready: false,
            reason: "Cargá los contenidos de la clase y guardá los cambios: son los que lee la IA para escribir la práctica.",
        };
    }

    return { ready: true };
}
