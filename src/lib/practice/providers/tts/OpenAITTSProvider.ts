import { ITTSProvider, TTSOptions } from "./ITTSProvider";

/**
 * Provider de TTS usando la API de OpenAI (modelo tts-1).
 * Voces disponibles: alloy, echo, fable, onyx, nova, shimmer
 * Costo: ~$15 por millón de caracteres.
 *
 * Para activar: TTS_PROVIDER=openai en .env + OPENAI_API_KEY=...
 */
export class OpenAITTSProvider implements ITTSProvider {
    constructor(private readonly apiKey: string) {}

    async synthesize(text: string, options?: TTSOptions): Promise<ArrayBuffer> {
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: options?.voice ?? "nova",   // nova suena natural para inglés
                speed: options?.speed ?? 1.0,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI TTS error: ${response.status} — ${error}`);
        }

        return response.arrayBuffer();
    }
}
