import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTTSProvider } from "@/lib/practice/providers/tts";

/**
 * POST /api/practice/tts
 *
 * Body: { text: string, language?: string, speed?: number }
 *
 * Respuestas:
 * - 204 No Content → TTS_PROVIDER=browser, el cliente usa window.speechSynthesis
 * - 200 audio/mpeg  → El servidor generó el audio (OpenAI, ElevenLabs, etc.)
 * - 400/401/500     → Errores
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("No autorizado", { status: 401 });
    }

    try {
        const body = await req.json();
        const { text, language, speed } = body;

        if (!text || typeof text !== "string" || text.trim().length === 0) {
            return new Response("El campo 'text' es requerido", { status: 400 });
        }

        const provider = getTTSProvider();
        const audio = await provider.synthesize(text.trim(), { language, speed });

        if (audio === null) {
            // BrowserTTSProvider — el cliente maneja la síntesis con speechSynthesis
            return new Response(null, { status: 204 });
        }

        return new Response(audio, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=3600", // Cache 1 hora — el texto no cambia
            },
        });
    } catch (error: any) {
        console.error("[TTS] Error:", error.message);
        return new Response("Error al generar audio", { status: 500 });
    }
}
