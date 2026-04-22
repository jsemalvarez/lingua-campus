import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIProvider } from "@/lib/practice/providers/ai";

/**
 * POST /api/practice/generate-listening
 * 
 * Body: { seedText: string, language?: string }
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("No autorizado", { status: 401 });
    }

    try {
        const body = await req.json();
        const { seedText, language } = body;

        if (!seedText || typeof seedText !== 'string') {
            return new Response("'seedText' es requerido", { status: 400 });
        }

        const provider = getAIProvider();
        const result = await provider.generateListeningText(
            seedText,
            language ?? "English"
        );

        return Response.json(result);
    } catch (error: any) {
        console.error("[GENERATE_LISTENING] Error:", error.message);
        return new Response("Error al generar texto de listening", { status: 500 });
    }
}
