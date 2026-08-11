import { getTTSProvider } from "@/lib/practice/providers/tts";
import { clampText, guardPracticeAi, readJsonBody } from "@/lib/practice/guard";

/**
 * POST /api/practice/tts
 *
 * Body: { lessonPracticeId: string, text: string, language?: string, speed?: number }
 *
 * Respuestas:
 * - 204 No Content → TTS_PROVIDER=browser, el cliente usa window.speechSynthesis
 * - 200 audio/mpeg  → El servidor generó el audio (OpenAI, ElevenLabs, etc.)
 * - 400/401/404/429/500 → Errores
 *
 * El `text` sigue viniendo del cliente: puede ser una frase o un texto que
 * generó la IA en esta misma sesión, así que no está en la base. Acá no hay
 * prompt que envenenar —esto va a un motor de voz, no a un modelo de lenguaje—;
 * el problema era el costo, y contra eso van el largo máximo y la cuota.
 */

const MAX_TEXT_CHARS = 3000;

/** El módulo es de inglés; el idioma acota qué voz pide el proveedor. */
const ALLOWED_LANGUAGES = ["en-US", "en-GB", "en-AU"] as const;
const DEFAULT_LANGUAGE = "en-US";

export async function POST(req: Request) {
    const body = await readJsonBody(req);

    // Con el proveedor del navegador el servidor no sintetiza nada ni gasta
    // plata, así que no corresponde descontar cuota.
    const metered = (process.env.TTS_PROVIDER ?? "browser") !== "browser";

    const guard = await guardPracticeAi(body.lessonPracticeId, { meter: metered });
    if (!guard.ok) return guard.response;

    try {
        const text = clampText(body.text, MAX_TEXT_CHARS);
        if (!text) {
            return new Response("El campo 'text' es requerido", { status: 400 });
        }

        const language = ALLOWED_LANGUAGES.includes(body.language as typeof ALLOWED_LANGUAGES[number])
            ? body.language as string
            : DEFAULT_LANGUAGE;

        const rawSpeed = Number(body.speed);
        const speed = Number.isFinite(rawSpeed) ? Math.max(0.5, Math.min(2, rawSpeed)) : 1;

        const provider = getTTSProvider();
        const audio = await provider.synthesize(text, { language, speed });

        if (audio === null) {
            // BrowserTTSProvider — el cliente maneja la síntesis con speechSynthesis
            return new Response(null, { status: 204 });
        }

        return new Response(audio, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "private, max-age=3600", // Cache 1 hora — el texto no cambia
            },
        });
    } catch (error: any) {
        console.error("[TTS] Error:", error.message);
        return new Response("Error al generar audio", { status: 500 });
    }
}
