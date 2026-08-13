import { getAIProvider } from "@/lib/practice/providers/ai";
import { PRACTICE_LANGUAGE } from "@/lib/practice/providers/ai/IAIProvider";
import { guardPracticeDraft, readJsonBody } from "@/lib/practice/guard";
import { checkDraftInputs } from "@/lib/practice/draft";

/**
 * POST /api/practice/generate-draft
 *
 * Body: { lessonId: string }
 * Devuelve: { speakingPhrases: string[], listeningText: string, chatScenario: string }
 *
 * El botón "Generar práctica" del modal de clase (PED-01). A diferencia de los
 * otros cinco endpoints de `/api/practice`, este lo usa **el docente** y no el
 * alumno: parte de `Lesson.topic` y `Lesson.content` en vez de material de
 * práctica ya cargado, que es justamente el problema que resuelve.
 *
 * **No guarda nada.** El borrador vuelve al formulario, el docente lo corrige y
 * lo guarda con el resto de la clase por `editLessonAction`. Publicar sigue
 * siendo un acto deliberado suyo: `isPublished` existe para eso.
 */
export async function POST(req: Request) {
    const body = await readJsonBody(req);
    const guard = await guardPracticeDraft(body.lessonId);
    if (!guard.ok) return guard.response;

    // El mismo chequeo que deshabilita el botón en el modal. Se repite acá porque
    // este es el lado que gasta plata: la interfaz puede equivocarse, o no ser la
    // que llamó.
    const { topic, content } = guard.lesson;
    const inputs = checkDraftInputs(topic, content);
    if (!inputs.ready) {
        return new Response(inputs.reason, { status: 409 });
    }

    try {
        const provider = getAIProvider();
        const draft = await provider.generatePracticeDraft(topic, content, PRACTICE_LANGUAGE);

        return Response.json(draft);
    } catch (error: any) {
        console.error("[GENERATE_DRAFT] Error:", error.message);
        return new Response("Error al generar el material de práctica", { status: 500 });
    }
}
