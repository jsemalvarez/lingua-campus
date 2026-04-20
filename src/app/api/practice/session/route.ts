import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new Response("No autorizado", { status: 401 });
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

        // Obtener el studentId desde la cuenta autenticada
        const student = await prisma.student.findFirst({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!student) {
            return new Response("El usuario no tiene perfil de alumno", { status: 403 });
        }

        // Verificar que la práctica existe y está publicada
        const practice = await prisma.lessonPractice.findUnique({
            where: { id: lessonPracticeId },
            select: { isPublished: true, lessonId: true }
        });

        if (!practice || !practice.isPublished || practice.lessonId !== lessonId) {
            return new Response("Práctica no encontrada o no publicada", { status: 404 });
        }

        const practiceSession = await prisma.practiceSession.create({
            data: {
                studentId: student.id,
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
