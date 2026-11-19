import { getAuthContext } from "@/lib/authz";
import prisma from "@/lib/prisma";
import { reportError } from "@/lib/errors/report";

/**
 * POST /api/practice/session
 *
 * Body:
 * {
 *   lessonId: string,
 *   lessonPracticeId: string,
 *   type: "SPEAKING" | "LISTENING" | "CHAT",
 *   phrasesAttempted: number,
 *   phrasesCorrect: number,
 *   accuracyPct: number,
 *   durationSeconds: number,
 *   weakArea?: string
 * }
 *
 * Guarda una sesión completada. El studentId se extrae de la sesión activa
 * (nunca se confía en el body para esto).
 */
export async function POST(req: Request) {
    // El alumno se identifica por id, no por email: `Student.email` es opcional
    // y el login por DNI existe, así que exigir email dejaba a todo alumno sin
    // correo con un 401 al terminar de practicar (BUG-01). `getAuthContext`
    // además verifica contra la base que la cuenta siga activa.
    const auth = await getAuthContext();
    if (!auth) {
        return new Response("No autorizado", { status: 401 });
    }

    // Todo alumno tiene instituto (el schema lo exige); se comprueba para poder
    // usarlo como filtro más abajo.
    if (!auth.isStudent || !auth.instituteId) {
        return new Response("El usuario no tiene perfil de alumno", { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            lessonId,
            lessonPracticeId,
            type,
            phrasesAttempted,
            phrasesCorrect,
            accuracyPct,
            durationSeconds,
            weakArea,
        } = body;

        if (!lessonId || !lessonPracticeId || !type) {
            return new Response("Faltan campos requeridos", { status: 400 });
        }

        // Verificar que el tipo sea válido
        const validTypes = ["SPEAKING", "LISTENING", "CHAT"];
        if (!validTypes.includes(type)) {
            return new Response("Tipo de sesión inválido", { status: 400 });
        }

        // Verificar que la práctica existe, está publicada y es del instituto
        // del alumno: el id viaja en el body, y sin acotar el instituto una
        // sesión podía quedar colgada de la clase de otro instituto.
        //
        // La inscripción se agregó con SEC-07: el instituto solo no alcanza,
        // porque deja a cualquier alumno guardar progreso en la clase de un
        // curso que no cursa. Es la misma condición que aplica
        // `guardPracticeAi` a los endpoints de IA; acá no se reutiliza el helper
        // porque este endpoint es sólo para alumnos —el `studentId` sale de la
        // sesión— y el de allá también deja pasar al personal para la vista
        // previa.
        const practice = await prisma.lessonPractice.findFirst({
            where: {
                id: lessonPracticeId,
                lessonId,
                isPublished: true,
                lesson: {
                    status: "ACTIVE",
                    course: {
                        instituteId: auth.instituteId,
                        enrollments: { some: { studentId: auth.userId, status: "ACTIVE" } },
                    },
                },
            },
            select: { id: true }
        });

        if (!practice) {
            return new Response("Práctica no encontrada o no publicada", { status: 404 });
        }

        const practiceSession = await prisma.practiceSession.create({
            data: {
                studentId: auth.userId,
                lessonId,
                lessonPracticeId,
                type,
                phrasesAttempted: Math.max(0, Number(phrasesAttempted) || 0),
                phrasesCorrect: Math.max(0, Number(phrasesCorrect) || 0),
                accuracyPct: Math.max(0, Math.min(100, Number(accuracyPct) || 0)),
                durationSeconds: Math.max(0, Number(durationSeconds) || 0),
                weakArea: weakArea ? String(weakArea).trim() : null,
            }
        });

        return Response.json({ success: true, sessionId: practiceSession.id });
    } catch (error) {
        await reportError(error, { action: "practica.guardar-sesion", auth });
        return new Response("Error al guardar sesión", { status: 500 });
    }
}

/** Hasta cuándo se puede completar una sesión con el repaso: la recién hecha, no una vieja. */
const REVIEW_WINDOW_MS = 2 * 60 * 60 * 1000;
/** Tope del tiempo que suma un repaso. */
const MAX_EXTRA_SECONDS = 2 * 60 * 60;

/**
 * PATCH /api/practice/session
 *
 * Body: { sessionId: string, phrasesCorrect: number, extraSeconds: number, weakArea?: string }
 *
 * «Repasar la frase», en el cierre de Speaking, completa la sesión que acaba
 * de terminar en lugar de crear otra (decisión del 17/11/2026): si la frase
 * sale en el repaso, la clase pasa a «3 de 3», igual que con el repaso que el
 * ejercicio ya hace al final. Una sesión aparte dejaba la clase en «1 de 1».
 *
 * Sólo suma: las frases bien no bajan ni pasan de las dichas, y el porcentaje
 * se calcula acá. Sólo la sesión de Speaking del propio alumno, y recién hecha.
 */
export async function PATCH(req: Request) {
    const auth = await getAuthContext();
    if (!auth) {
        return new Response("No autorizado", { status: 401 });
    }
    if (!auth.isStudent) {
        return new Response("El usuario no tiene perfil de alumno", { status: 403 });
    }

    try {
        const body = await req.json();
        const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
        if (!sessionId) {
            return new Response("Falta la sesión", { status: 400 });
        }

        const session = await prisma.practiceSession.findFirst({
            where: { id: sessionId, studentId: auth.userId, type: "SPEAKING" },
            select: { phrasesAttempted: true, phrasesCorrect: true, durationSeconds: true, completedAt: true },
        });
        if (!session) {
            return new Response("Sesión no encontrada", { status: 404 });
        }
        if (Date.now() - session.completedAt.getTime() > REVIEW_WINDOW_MS) {
            return new Response("Esa sesión ya no se puede completar", { status: 409 });
        }

        const asked = Math.floor(Number(body.phrasesCorrect) || 0);
        const phrasesCorrect = Math.min(session.phrasesAttempted, Math.max(session.phrasesCorrect, asked));
        const accuracyPct = session.phrasesAttempted > 0 ? Math.round((phrasesCorrect / session.phrasesAttempted) * 100) : 0;
        const extraSeconds = Math.min(MAX_EXTRA_SECONDS, Math.max(0, Math.round(Number(body.extraSeconds) || 0)));
        const weakArea = typeof body.weakArea === "string" && body.weakArea.trim() ? body.weakArea.trim() : null;

        await prisma.practiceSession.update({
            where: { id: sessionId },
            data: {
                phrasesCorrect,
                accuracyPct,
                durationSeconds: session.durationSeconds + extraSeconds,
                ...(weakArea ? { weakArea } : {}),
            },
        });

        return Response.json({ success: true, phrasesCorrect, accuracyPct });
    } catch (error) {
        await reportError(error, { action: "practica.completar-sesion", auth });
        return new Response("Error al guardar sesión", { status: 500 });
    }
}
