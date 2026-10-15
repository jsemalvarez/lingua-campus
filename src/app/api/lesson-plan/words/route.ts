import { getAIProvider } from "@/lib/practice/providers/ai";
import { PRACTICE_LANGUAGE } from "@/lib/practice/providers/ai/IAIProvider";
import { readJsonBody } from "@/lib/practice/guard";
import { guardLessonPlan } from "@/lib/lessonPlan/guard";

export const maxDuration = 60;

/**
 * POST /api/lesson-plan/words
 *
 * Body: { lessonId: string, courseId: string }
 * Devuelve: { words: string[] }
 *
 * Sugiere las palabras de la clase a partir del tema, los contenidos, el nivel
 * y el foco guardados (PED-09). No repite las que el docente ya tildó o sumó:
 * la página las conserva y agrega éstas. **No guarda nada**: la página guarda
 * sola lo que el docente se queda.
 */
export async function POST(req: Request) {
    const body = await readJsonBody(req);
    const guard = await guardLessonPlan(body.lessonId, body.courseId);
    if (!guard.ok) return guard.response;

    const { context, words } = guard.source;
    const keep = words.filter((w) => w.on || w.own).map((w) => w.text);

    try {
        const suggested = await getAIProvider().suggestLessonWords(context, keep, PRACTICE_LANGUAGE);
        return Response.json({ words: suggested });
    } catch (error) {
        console.error("[LESSON_PLAN_WORDS] Error:", error instanceof Error ? error.message : error);
        return new Response("No pudimos sugerir las palabras. Probá de nuevo en un momento.", { status: 500 });
    }
}
