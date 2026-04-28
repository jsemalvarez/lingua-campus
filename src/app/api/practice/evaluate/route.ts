import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIProvider } from "@/lib/practice/providers/ai";

/**
 * POST /api/practice/evaluate
 *
 * Body: { expected: string, actual: string, language?: string }
 *
 * Compara la transcripción del alumno contra la frase esperada y devuelve
 * una evaluación con score, feedback en español y área de dificultad.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("No autorizado", { status: 401 });
    }

    try {
        const body = await req.json();
        const { expected, actual, language } = body;

        if (!expected || !actual) {
            return new Response("'expected' y 'actual' son requeridos", { status: 400 });
        }

        const provider = getAIProvider();
        const result = await provider.evaluatePronunciation(
            String(expected).trim(),
            String(actual).trim(),
            language ?? "English"
        );

        return Response.json(result);
    } catch (error: any) {
        console.error("[EVALUATE] Server Error:", error.message || error);
        return new Response(error.message || "Error al evaluar pronunciación", { status: 500 });
    }
}
