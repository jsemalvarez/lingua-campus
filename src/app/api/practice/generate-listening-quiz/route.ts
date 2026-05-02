import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIProvider } from "@/lib/practice/providers/ai";

/**
 * POST /api/practice/generate-listening-quiz
 * 
 * Body: { text: string, language?: string }
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("No autorizado", { status: 401 });
    }

    try {
        const body = await req.json();
        const { text, language } = body;

        if (!text || typeof text !== 'string') {
            return new Response("'text' es requerido", { status: 400 });
        }

        const provider = getAIProvider();
        const questions = await provider.generateListeningQuiz(
            text,
            language ?? "English"
        );

        return Response.json({ questions });
    } catch (error: any) {
        console.error("[GENERATE_LISTENING_QUIZ] Error:", error.message);
        return new Response("Error al generar preguntas de listening", { status: 500 });
    }
}
