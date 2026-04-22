import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIProvider } from "@/lib/practice/providers/ai";

/**
 * POST /api/practice/generate-phrases
 * 
 * Body: { seedPhrases: string[], count: number, language?: string }
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("No autorizado", { status: 401 });
    }

    try {
        const body = await req.json();
        const { seedPhrases, count, language } = body;

        if (!Array.isArray(seedPhrases) || seedPhrases.length === 0) {
            return new Response("'seedPhrases' es requerido y debe ser un array", { status: 400 });
        }

        const provider = getAIProvider();
        const phrases = await provider.generateVariations(
            seedPhrases,
            count ?? 5,
            language ?? "English"
        );

        return Response.json({ phrases });
    } catch (error: any) {
        console.error("[GENERATE_PHRASES] Error:", error.message);
        return new Response("Error al generar frases dinámicas", { status: 500 });
    }
}
