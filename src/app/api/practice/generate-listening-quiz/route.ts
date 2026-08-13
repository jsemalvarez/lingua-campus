import { getAIProvider } from "@/lib/practice/providers/ai";
import { PRACTICE_LANGUAGE } from "@/lib/practice/providers/ai/IAIProvider";
import { guardPracticeAi, readJsonBody } from "@/lib/practice/guard";

/**
 * POST /api/practice/generate-listening-quiz
 *
 * Body: { lessonPracticeId: string }
 *
 * El texto sale de `LessonPractice.listeningText` y no del body (SEC-07).
 *
 * Se puede leer entero del servidor porque este endpoint sólo arma el
 * cuestionario del texto **original**: cuando el alumno genera un texto nuevo,
 * `/generate-listening` ya devuelve el texto y sus preguntas en la misma
 * respuesta, y `ListeningLab` no vuelve a pasar por acá.
 */
export async function POST(req: Request) {
    const body = await readJsonBody(req);
    const guard = await guardPracticeAi(body.lessonPracticeId);
    if (!guard.ok) return guard.response;

    const text = guard.practice.listeningText?.trim();
    if (!text) {
        return new Response("La práctica no tiene texto de listening", { status: 409 });
    }

    try {
        const provider = getAIProvider();
        const questions = await provider.generateListeningQuiz(text, PRACTICE_LANGUAGE);

        return Response.json({ questions });
    } catch (error: any) {
        console.error("[GENERATE_LISTENING_QUIZ] Error:", error.message);
        return new Response("Error al generar preguntas de listening", { status: 500 });
    }
}
