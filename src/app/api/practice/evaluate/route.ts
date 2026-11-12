import { getAIProvider } from "@/lib/practice/providers/ai";
import { PRACTICE_LANGUAGE } from "@/lib/practice/providers/ai/IAIProvider";
import { clampText, guardPracticeAi, readJsonBody } from "@/lib/practice/guard";
import { splitWords } from "@/lib/practice/words";

/**
 * POST /api/practice/evaluate
 *
 * Body: { lessonPracticeId: string, expected: string, actual: string, missing?: string[] }
 *
 * Compara la transcripción del alumno contra la frase esperada y devuelve
 * una evaluación con score, feedback en español y área de dificultad.
 *
 * El Speaking ya no decide con esto si la frase está bien: lo resuelve el campus
 * de a una palabra (`src/lib/practice/words.ts`) y llama acá sólo para el
 * comentario cuando falta alguna, con `missing`. Si esto falla, sigue igual.
 *
 * `expected` y `actual` son los dos únicos campos de texto libre que quedan en
 * el módulo: `actual` es lo que transcribió el micrófono y `expected` puede ser
 * una frase que generó la IA en esta misma sesión, así que ninguno de los dos
 * está en la base. Van adentro de una plantilla fija, no como system prompt, y
 * se recortan. Ver el riesgo residual en SEC-07.
 */

const MAX_PHRASE_CHARS = 300;
const MAX_MISSING_WORDS = 30;

export async function POST(req: Request) {
    const body = await readJsonBody(req);
    const guard = await guardPracticeAi(body.lessonPracticeId);
    if (!guard.ok) return guard.response;

    try {
        const expected = clampText(body.expected, MAX_PHRASE_CHARS);
        const actual = clampText(body.actual, MAX_PHRASE_CHARS);

        if (!expected || !actual) {
            return new Response("'expected' y 'actual' son requeridos", { status: 400 });
        }

        // Las palabras que el campus vio que no salieron. Sólo pasan las que están
        // en la frase: así no son una vía más para escribirle al modelo.
        const expectedWords = new Set(splitWords(expected).map((w) => w.text.toLowerCase()));
        const missing = (Array.isArray(body.missing) ? body.missing : [])
            .filter((w: unknown): w is string => typeof w === "string" && expectedWords.has(w.toLowerCase()))
            .slice(0, MAX_MISSING_WORDS);

        const provider = getAIProvider();
        const result = await provider.evaluatePronunciation(expected, actual, PRACTICE_LANGUAGE, missing);

        return Response.json(result);
    } catch (error: any) {
        console.error("[EVALUATE] Server Error:", error.message || error);
        return new Response("Error al evaluar pronunciación", { status: 500 });
    }
}
