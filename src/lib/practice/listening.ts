import type { ListeningQuestion } from "@/lib/practice/providers/ai/IAIProvider";

/**
 * El cuestionario de Listening tal como lo devuelve la IA, limpio.
 *
 * Al corregir, cada frase errada muestra la oración del audio que la decide
 * («En el audio: …»). Esa oración la propone el modelo, y un modelo puede
 * inventarla: por eso se queda sólo si está de verdad en el texto. Si no está, la
 * frase se corrige igual, sin la cita.
 */

const MAX_QUESTIONS = 8;

/** Minúsculas, comillas rectas y un solo espacio: para buscar sin fijarse en eso. */
function normalize(s: string): string {
    return s
        .toLowerCase()
        .replace(/[’‘`´]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/\s+/g, " ")
        .trim();
}

/** Lo que va pegado al principio y al final de una cita: comillas, espacios, puntos suspensivos. */
const QUOTE_EDGES = /^[\s"'«»“”.…]+|[\s"'«»“”…]+$/g;

/**
 * La cita tal como está escrita en el texto, o `undefined` si no aparece. Se
 * devuelve la del texto (con sus mayúsculas y su puntuación), no la del modelo.
 */
export function findInText(text: string, quote: unknown): string | undefined {
    if (typeof quote !== "string") return undefined;
    const needle = normalize(quote.replace(QUOTE_EDGES, ""));
    if (needle.length < 3) return undefined;

    // Se busca sobre el texto normalizado y se recupera el tramo original. Como
    // normalizar sólo junta espacios, se recorre el original contando caracteres.
    const haystack = normalize(text);
    const at = haystack.indexOf(needle);
    if (at === -1) return undefined;

    let start = -1;
    let end = text.length;
    let seen = 0;
    let lastWasSpace = true;
    for (let i = 0; i < text.length; i++) {
        const isSpace = /\s/.test(text[i]);
        if (isSpace && lastWasSpace) continue;
        lastWasSpace = isSpace;
        if (seen === at && start === -1) start = i;
        seen++;
        if (seen === at + needle.length) {
            end = i + 1;
            break;
        }
    }
    return start === -1 ? undefined : text.slice(start, end).trim();
}

/** Deja sólo preguntas bien formadas, y la cita sólo si está en el texto. */
export function cleanListeningQuestions(raw: unknown, text: string): ListeningQuestion[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((q): ListeningQuestion | null => {
            if (!q || typeof q !== "object") return null;
            const { statement, isTrue, evidence } = q as Record<string, unknown>;
            if (typeof statement !== "string" || !statement.trim()) return null;
            const truth = isTrue === true || isTrue === "true" ? true : isTrue === false || isTrue === "false" ? false : null;
            if (truth === null) return null;
            const found = findInText(text, evidence);
            return { statement: statement.trim(), isTrue: truth, ...(found ? { evidence: found } : {}) };
        })
        .filter((q): q is ListeningQuestion => q !== null)
        .slice(0, MAX_QUESTIONS);
}
