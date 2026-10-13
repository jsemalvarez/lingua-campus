import prisma from "@/lib/prisma";
import { requireLessonWriteAccess } from "@/lib/lessonAccess";
import { consumeAiQuota } from "@/lib/practice/quota";
import { checkDraftInputs } from "@/lib/practice/draft";
import type { LessonPlanContext } from "@/lib/practice/providers/ai/IAIProvider";
import { durationMinutes, sanitizeFocus, sanitizeMoments, sanitizeWords, type PlanMoments, type PlanWord } from "./plan";
import { courseAgeRange } from "./ages";

/**
 * Puerta de los pedidos a la IA del armado de la clase (PED-09): las palabras y
 * las ideas.
 *
 * El permiso es el de escribir la clase —`requireLessonWriteAccess`—, más
 * estricto que el de la práctica (`guardPracticeDraft` deja pasar a cualquier
 * docente del instituto): quien pide ideas es quien después las guarda, y un par
 * del mismo nivel no entra a esta página.
 *
 * Todo lo que va al prompt se lee de la base, como desde SEC-07: el tema, los
 * contenidos, el nivel, los inscriptos y sus edades, la duración y las palabras
 * guardadas. La página guarda antes de pedir, así que la base tiene lo que el
 * docente ve.
 */

/** Los mismos topes que la práctica: lo que pasa de acá no mejora el prompt. */
const MAX_TOPIC_CHARS = 200;
const MAX_CONTENT_CHARS = 4000;

export type PlanSource = {
    context: LessonPlanContext;
    words: PlanWord[];
    moments: PlanMoments | null;
};

export type PlanGuard = { ok: true; source: PlanSource } | { ok: false; response: Response };

function fail(message: string, status: number): PlanGuard {
    return { ok: false, response: new Response(message, { status }) };
}

export async function guardLessonPlan(
    lessonId: unknown,
    courseId: unknown,
    /** Las ideas salen de las palabras: sin ninguna tildada no se piden. */
    { requireWords = false }: { requireWords?: boolean } = {}
): Promise<PlanGuard> {
    if (typeof lessonId !== "string" || !lessonId || typeof courseId !== "string" || !courseId) {
        return fail("'lessonId' y 'courseId' son requeridos", 400);
    }

    const access = await requireLessonWriteAccess(lessonId, courseId, "el armado de la clase");
    if ("error" in access) return fail(access.error, 403);

    const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, courseId, status: "ACTIVE", type: "CLASS" },
        select: {
            topic: true,
            content: true,
            schedule: { select: { startTime: true, endTime: true } },
            course: { select: { level: true } },
            plan: { select: { focus: true, words: true, moments: true } },
        },
    });
    if (!lesson) return fail("Clase no disponible", 404);

    // Antes de la cuota: un pedido que no puede salir bien no se cobra.
    const readiness = checkDraftInputs(lesson.topic, lesson.content);
    if (!readiness.ready) {
        return fail(
            readiness.missing === "topic"
                ? "Poné el tema de la clase para que la IA sepa de qué se trata."
                : "Contá en Contenidos qué se da en la clase: es lo que lee la IA.",
            409
        );
    }

    const words = sanitizeWords(lesson.plan?.words);
    if (requireWords && !words.some((w) => w.on)) {
        return fail("Elegí al menos una palabra de la clase: las ideas salen de ahí.", 409);
    }

    const quota = await consumeAiQuota(access.auth.userId, access.auth.instituteId);
    if (!quota.allowed) {
        const message = quota.scope === "user"
            ? "Alcanzaste el límite de uso de la IA por ahora. Probá de nuevo más tarde."
            : "El instituto alcanzó el límite de uso de la IA por hoy.";
        return { ok: false, response: new Response(message, { status: 429, headers: { "Retry-After": String(quota.retryAfterSeconds) } }) };
    }

    const studentCount = await prisma.enrollment.count({
        where: { courseId, status: "ACTIVE", student: { status: "ACTIVE" } },
    });

    return {
        ok: true,
        source: {
            context: {
                topic: lesson.topic.slice(0, MAX_TOPIC_CHARS),
                content: lesson.content?.slice(0, MAX_CONTENT_CHARS) || null,
                level: lesson.course.level,
                studentCount,
                minutes: lesson.schedule ? durationMinutes(lesson.schedule.startTime, lesson.schedule.endTime) : null,
                focus: sanitizeFocus(lesson.plan?.focus),
                ages: await courseAgeRange(courseId),
            },
            words,
            moments: sanitizeMoments(lesson.plan?.moments),
        },
    };
}
