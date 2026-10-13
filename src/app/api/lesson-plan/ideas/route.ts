import { getAIProvider } from "@/lib/practice/providers/ai";
import { PRACTICE_LANGUAGE } from "@/lib/practice/providers/ai/IAIProvider";
import { readJsonBody } from "@/lib/practice/guard";
import { guardLessonPlan } from "@/lib/lessonPlan/guard";
import { bookIdea, campusIdea, ideaFromAi, MOMENT_IDS, selectedWords, toolsForAges, type MomentId, type PlanIdea } from "@/lib/lessonPlan/plan";

export const maxDuration = 60;

/**
 * POST /api/lesson-plan/ideas
 *
 * Body: { lessonId: string, courseId: string, moment?: "inicio" | "principal" | "cierre" | "tarea" }
 * Devuelve: { moments: { [moment]: PlanIdea[] } }
 *
 * Sin `moment`, escribe las ideas de los cuatro momentos de la clase («Proponer
 * ideas»). Con `moment`, sólo las de ese («Otras ideas»), distintas de las que
 * ya tiene. Salen de las palabras y el foco guardados (PED-09).
 *
 * La tarea siempre ofrece la práctica del campus: la agrega este endpoint, no la
 * IA. Las herramientas son sólo las que van con la edad del grupo
 * (`toolsForAges`). Como los otros pedidos de la página, **no guarda nada**.
 */
export async function POST(req: Request) {
    const body = await readJsonBody(req);
    const only = MOMENT_IDS.includes(body.moment as MomentId) ? (body.moment as MomentId) : null;

    const guard = await guardLessonPlan(body.lessonId, body.courseId, { requireWords: true });
    if (!guard.ok) return guard.response;

    const { context, words, moments: current } = guard.source;
    const classWords = selectedWords(words);
    const allowedTools = toolsForAges(context.ages);
    const requested = only ? [only] : MOMENT_IDS;
    const avoid = only && current ? current[only].ideas.map((idea) => idea.title) : [];

    const provider = getAIProvider();
    const ask = (moments: MomentId[]) =>
        provider.generateLessonIdeas({ ...context, words: classWords, tools: allowedTools }, moments, avoid, PRACTICE_LANGUAGE);
    const shape = (raw: Partial<Record<MomentId, unknown[]>>, moment: MomentId) =>
        (raw[moment] ?? [])
            .map((idea) => ideaFromAi(idea, moment, { studentCount: context.studentCount, classWords, allowedTools }))
            .filter((idea): idea is PlanIdea => idea !== null)
            .slice(0, moment === "tarea" ? 2 : 3);

    const fresh: Partial<Record<MomentId, PlanIdea[]>> = {};
    try {
        const raw = await ask(requested);
        for (const moment of requested) fresh[moment] = shape(raw, moment);

        // A veces el modelo deja un momento vacío —pasó con la tarea en las
        // pruebas—: se le vuelve a pedir una vez sólo ése, sin cobrar otra cuota.
        const missing = requested.filter((moment) => fresh[moment]!.length === 0);
        if (missing.length && missing.length < requested.length) {
            try {
                const retry = await ask(missing);
                for (const moment of missing) fresh[moment] = shape(retry, moment);
            } catch {
                // Lo que ya llegó alcanza: el momento queda con «Pedir ideas».
            }
        }
    } catch (error) {
        console.error("[LESSON_PLAN_IDEAS] Error:", error instanceof Error ? error.message : error);
        return new Response("No pudimos escribir las ideas. Probá de nuevo en un momento.", { status: 500 });
    }

    // La principal siempre ofrece el libro. Si el modelo no lo trajo, va el de
    // siempre como tercera opción. En «Otras ideas» la página conserva el que ya
    // estaba, así que sólo hace falta al armar la clase entera.
    if (!only && fresh.principal?.length && !fresh.principal.some((idea) => idea.tool === "material")) {
        fresh.principal = [...fresh.principal.slice(0, 2), bookIdea()];
    }

    const result: Partial<Record<MomentId, PlanIdea[]>> = {};
    for (const moment of requested) {
        const ideas = fresh[moment] ?? [];
        result[moment] = moment === "tarea" && !only ? [campusIdea(), ...ideas] : ideas;
    }

    if (requested.every((moment) => (result[moment] ?? []).filter((idea) => idea.tool !== "campus").length === 0)) {
        return new Response("La IA no devolvió ideas. Probá de nuevo en un momento.", { status: 500 });
    }

    return Response.json({ moments: result });
}
