import { getAuthContext } from "@/lib/authz";
import prisma from "@/lib/prisma";

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
        const practice = await prisma.lessonPractice.findFirst({
            where: {
                id: lessonPracticeId,
                lessonId,
                isPublished: true,
                lesson: { status: "ACTIVE", course: { instituteId: auth.instituteId } },
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
    } catch (error: any) {
        console.error("[SESSION] Error:", error.message);
        return new Response("Error al guardar sesión", { status: 500 });
    }
}
