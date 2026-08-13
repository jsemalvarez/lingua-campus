import { getAIProvider } from "@/lib/practice/providers/ai";
import { PRACTICE_LANGUAGE } from "@/lib/practice/providers/ai/IAIProvider";
import { clampText, guardPracticeAi, readJsonBody } from "@/lib/practice/guard";

/**
 * POST /api/practice/evaluate
 *
 * Body: { lessonPracticeId: string, expected: string, actual: string }
 *
 * Compara la transcripción del alumno contra la frase esperada y devuelve
 * una evaluación con score, feedback en español y área de dificultad.
 *
 * `expected` y `actual` son los dos únicos campos de texto libre que quedan en
 * el módulo: `actual` es lo que transcribió el micrófono y `expected` puede ser
 * una frase que generó la IA en esta misma sesión, así que ninguno de los dos
 * está en la base. Van adentro de una plantilla fija, no como system prompt, y
 * se recortan. Ver el riesgo residual en SEC-07.
 */

const MAX_PHRASE_CHARS = 300;

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

        const provider = getAIProvider();
        const result = await provider.evaluatePronunciation(expected, actual, PRACTICE_LANGUAGE);

        return Response.json(result);
    } catch (error: any) {
        console.error("[EVALUATE] Server Error:", error.message || error);
        return new Response("Error al evaluar pronunciación", { status: 500 });
    }
}
