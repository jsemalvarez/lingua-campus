import { getAIProvider } from "@/lib/practice/providers/ai";
import { PRACTICE_LANGUAGE } from "@/lib/practice/providers/ai/IAIProvider";
import { guardPracticeAi, readJsonBody } from "@/lib/practice/guard";

/**
 * POST /api/practice/generate-phrases
 *
 * Body: { lessonPracticeId: string, count?: number }
 *
 * Las `seedPhrases` salen de `LessonPractice.speakingPhrases`. Antes venían del
 * body, que es lo mismo que dejar escribir el prompt (SEC-07).
 *
 * **No está restringido al docente**, aunque la ficha lo planteaba: el botón
 * "Generar más frases" es del alumno, dentro de su práctica de speaking
 * (`SpeakingHub`). No es una herramienta de preparación de clase.
 */

const MAX_COUNT = 10;
const DEFAULT_COUNT = 5;

export async function POST(req: Request) {
    const body = await readJsonBody(req);
    const guard = await guardPracticeAi(body.lessonPracticeId);
    if (!guard.ok) return guard.response;

    const seedPhrases = guard.practice.speakingPhrases;
    if (seedPhrases.length === 0) {
        return new Response("La práctica no tiene frases de speaking", { status: 409 });
    }

    try {
        const requested = Number(body.count);
        const count = Number.isFinite(requested)
            ? Math.max(1, Math.min(MAX_COUNT, Math.floor(requested)))
            : DEFAULT_COUNT;

        const provider = getAIProvider();
        const phrases = await provider.generateVariations(seedPhrases, count, PRACTICE_LANGUAGE);

        return Response.json({ phrases });
    } catch (error: any) {
        console.error("[GENERATE_PHRASES] Error:", error.message);
        return new Response("Error al generar frases dinámicas", { status: 500 });
    }
}
