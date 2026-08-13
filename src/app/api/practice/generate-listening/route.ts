import { getAIProvider } from "@/lib/practice/providers/ai";
import { PRACTICE_LANGUAGE } from "@/lib/practice/providers/ai/IAIProvider";
import { guardPracticeAi, readJsonBody } from "@/lib/practice/guard";

/**
 * POST /api/practice/generate-listening
 *
 * Body: { lessonPracticeId: string }
 *
 * El `seedText` sale de `LessonPractice.listeningText`, no del body (SEC-07).
 * Igual que generate-phrases, lo usa el alumno desde `ListeningLab`.
 */
export async function POST(req: Request) {
    const body = await readJsonBody(req);
    const guard = await guardPracticeAi(body.lessonPracticeId);
    if (!guard.ok) return guard.response;

    const seedText = guard.practice.listeningText?.trim();
    if (!seedText) {
        return new Response("La práctica no tiene texto de listening", { status: 409 });
    }

    try {
        const provider = getAIProvider();
        const result = await provider.generateListeningText(seedText, PRACTICE_LANGUAGE);

        return Response.json(result);
    } catch (error: any) {
        console.error("[GENERATE_LISTENING] Error:", error.message);
        return new Response("Error al generar texto de listening", { status: 500 });
    }
}
