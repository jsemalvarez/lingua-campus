import { getAuthContext, requireRole, INSTITUTE_STAFF } from "@/lib/authz";
import prisma from "@/lib/prisma";
import { consumeAiQuota, QuotaResult } from "@/lib/practice/quota";

/**
 * Puerta de entrada única a los endpoints de IA de `/api/practice` (SEC-07).
 *
 * Antes de esto los seis endpoints hacían `if (!session) return 401` y nada más.
 * Eso dejaba dos agujeros distintos:
 *
 * 1. **El prompt venía del cliente.** `/chat` recibía el `scenario` en el body y
 *    lo usaba como system prompt. Cualquiera con sesión —de cualquier instituto,
 *    con cualquier rol, incluido un tutor— tenía una API de Gemini gratis a
 *    nombre del proyecto. Acá el contenido se lee de `LessonPractice`, que es
 *    donde lo dejó el profesor.
 * 2. **No se verificaba nada sobre la práctica.** Ni que estuviera publicada, ni
 *    que fuera del instituto del alumno, ni que el alumno estuviera inscripto en
 *    el curso. Los tres chequeos están abajo.
 *
 * El costo es una query, la misma que ya hacía `/session` para lo mismo.
 */

/** Lo que el profesor cargó, leído del servidor. Nunca llega del body. */
export type PracticeContent = {
    id: string;
    lessonId: string;
    speakingPhrases: string[];
    listeningText: string | null;
    chatScenario: string | null;
};

export type PracticeGuard =
    | { ok: true; practice: PracticeContent }
    | { ok: false; response: Response };

const SELECT = {
    id: true,
    lessonId: true,
    speakingPhrases: true,
    listeningText: true,
    chatScenario: true,
} as const;

export type GuardOptions = {
    /**
     * Si la llamada consume cuota. Sólo `/tts` lo pone en falso, y únicamente
     * cuando el proveedor configurado es el del navegador: ahí el servidor
     * responde 204 y sintetiza el cliente, así que no hay nada que facturar y
     * cobrarle la cuota al alumno le comería el tope con cada repetición del
     * audio, que es la operación más repetida del módulo.
     */
    meter?: boolean;
};

/**
 * Autoriza una llamada de IA sobre una práctica y consume una unidad de cuota.
 *
 * Se le pasa el `lessonPracticeId` tal como vino del body, sin validar: el
 * chequeo de tipo es parte de lo que hace esta función.
 *
 * ```ts
 * const guard = await guardPracticeAi(body?.lessonPracticeId);
 * if (!guard.ok) return guard.response;
 * ```
 */
export async function guardPracticeAi(
    lessonPracticeId: unknown,
    { meter = true }: GuardOptions = {}
): Promise<PracticeGuard> {
    const auth = await getAuthContext();
    if (!auth) {
        return { ok: false, response: new Response("No autorizado", { status: 401 }) };
    }

    if (typeof lessonPracticeId !== "string" || lessonPracticeId.trim().length === 0) {
        return { ok: false, response: new Response("'lessonPracticeId' es requerido", { status: 400 }) };
    }

    const practice = auth.isStudent
        ? await findForStudent(lessonPracticeId, auth.userId, auth.instituteId)
        : await findForStaff(lessonPracticeId, auth.activeRole, auth.instituteId);

    if (!practice) {
        // Mismo mensaje para "no existe" y para "no te corresponde": distinguirlos
        // le confirmaría a quien prueba ids ajenos cuáles existen.
        return { ok: false, response: new Response("Práctica no disponible", { status: 404 }) };
    }

    if (!meter) return { ok: true, practice };

    const quota = await consumeAiQuota(auth.userId, auth.instituteId);
    if (!quota.allowed) return { ok: false, response: quotaResponse(quota) };

    return { ok: true, practice };
}

/** El 429 del tope de uso. Es el único error de esta capa que lee un humano. */
function quotaResponse(quota: Extract<QuotaResult, { allowed: false }>): Response {
    const message = quota.scope === "user"
        ? "Alcanzaste el límite de práctica con IA por ahora. Probá de nuevo más tarde."
        : "El instituto alcanzó el límite de práctica con IA por hoy.";

    return new Response(message, {
        status: 429,
        headers: { "Retry-After": String(quota.retryAfterSeconds) },
    });
}

/**
 * El alumno sólo llega a prácticas publicadas, de una clase activa, de un curso
 * de su instituto **en el que esté inscripto**. La inscripción es la que faltaba
 * en todos lados, incluido `/session`, que sí miraba `isPublished`.
 */
function findForStudent(id: string, studentId: string, instituteId: string | null) {
    if (!instituteId) return null;

    return prisma.lessonPractice.findFirst({
        where: {
            id,
            isPublished: true,
            lesson: {
                status: "ACTIVE",
                course: {
                    instituteId,
                    enrollments: { some: { studentId, status: "ACTIVE" } },
                },
            },
        },
        select: SELECT,
    });
}

/**
 * El personal entra por la vista previa del profesor, que existe justamente para
 * probar la práctica **antes** de publicarla: acá no se exige `isPublished`.
 *
 * El alcance es el instituto y no el curso propio, que es lo mismo que ya
 * permite `practice-preview/page.tsx`. Cerrarlo al profesor del curso sería otra
 * discusión — la de esta ficha es que no entre cualquiera con sesión.
 */
function findForStaff(id: string, activeRole: string, instituteId: string | null) {
    // SUPERADMIN no pertenece a ningún instituto; la vista previa ya lo deja pasar.
    if (activeRole === "SUPERADMIN") {
        return prisma.lessonPractice.findFirst({
            where: { id, lesson: { status: "ACTIVE" } },
            select: SELECT,
        });
    }

    // Los tutores caen acá: tienen sesión y no son alumnos, pero no son personal.
    if (!instituteId || !INSTITUTE_STAFF.includes(activeRole as typeof INSTITUTE_STAFF[number])) {
        return null;
    }

    return prisma.lessonPractice.findFirst({
        where: { id, lesson: { status: "ACTIVE", course: { instituteId } } },
        select: SELECT,
    });
}

/** La clase de la que se redacta el borrador, leída del servidor. */
export type DraftSource = {
    lessonId: string;
    topic: string;
    content: string | null;
};

export type DraftGuard =
    | { ok: true; lesson: DraftSource }
    | { ok: false; response: Response };

/**
 * `Lesson.content` es un `@db.Text` sin tope, y entra a un prompt. Setecientas
 * palabras de contenidos alcanzan y sobran para redactar la práctica de una
 * clase; lo que venga después no mejora el borrador, sólo agranda la llamada.
 */
const MAX_TOPIC_CHARS = 200;
const MAX_CONTENT_CHARS = 4000;

/**
 * Autoriza la generación del borrador de práctica de una clase (PED-01).
 *
 * Distinta puerta que `guardPracticeAi` porque es otra operación: no la ejecuta
 * el alumno sobre una práctica publicada, sino el docente sobre una clase que
 * todavía no tiene material. El permiso es el mismo que el de `editLessonAction`
 * —personal del instituto dueño del curso—, y por la misma razón: quien puede
 * guardar la práctica es quien puede pedir el borrador. SUPERADMIN queda afuera
 * por `requireRole`, igual que en la edición de clases.
 *
 * El `topic` y el `content` se leen de la base y no del body. Acá no es una
 * defensa contra el que escribe —el docente puede guardar en `topic` lo que
 * quiera— sino contra el resto: si el texto viajara en la request, cualquiera
 * con una sesión de profesor tendría un prompt libre a nombre del proyecto, que
 * es exactamente el agujero que cerró SEC-07.
 *
 * Consume una unidad de cuota, como cualquier otra llamada al proveedor.
 */
export async function guardPracticeDraft(lessonId: unknown): Promise<DraftGuard> {
    const auth = await requireRole(INSTITUTE_STAFF);
    if (!auth) {
        return { ok: false, response: new Response("No autorizado", { status: 401 }) };
    }

    if (typeof lessonId !== "string" || lessonId.trim().length === 0) {
        return { ok: false, response: new Response("'lessonId' es requerido", { status: 400 }) };
    }

    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
            status: "ACTIVE",
            // Sólo las clases tienen práctica: el modal esconde la sección en
            // los TP y los exámenes, y `editLessonAction` no la guardaría.
            type: "CLASS",
            course: { instituteId: auth.instituteId },
        },
        select: { id: true, topic: true, content: true },
    });

    if (!lesson) {
        return { ok: false, response: new Response("Clase no disponible", { status: 404 }) };
    }

    const quota = await consumeAiQuota(auth.userId, auth.instituteId);
    if (!quota.allowed) return { ok: false, response: quotaResponse(quota) };

    return {
        ok: true,
        lesson: {
            lessonId: lesson.id,
            topic: lesson.topic.slice(0, MAX_TOPIC_CHARS),
            content: lesson.content?.slice(0, MAX_CONTENT_CHARS) || null,
        },
    };
}

/** Lee el body sin romper si viene vacío o mal formado. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
    try {
        const body = await req.json();
        return body && typeof body === "object" ? body as Record<string, unknown> : {};
    } catch {
        return {};
    }
}

/**
 * Recorta el texto libre que sí o sí viaja desde el cliente.
 *
 * Queda texto del cliente en tres campos que no se pueden leer de la base: la
 * transcripción de lo que dijo el alumno, la frase generada por IA que se está
 * evaluando y el texto de listening generado. Ninguno es un system prompt —van
 * adentro de una plantilla fija— pero igual llegan al modelo, así que se acotan
 * en longitud. Lo que queda expuesto es una completion corta por unidad de
 * cuota, que es el riesgo residual anotado en SEC-07.
 */
export function clampText(value: unknown, maxChars: number): string {
    return typeof value === "string" ? value.trim().slice(0, maxChars) : "";
}
