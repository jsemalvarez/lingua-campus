import { ITTSProvider, TTSOptions } from "./ITTSProvider";

/**
 * Provider de TTS usando la API de Eleven Labs.
 * Calidad de voz muy alta — la mejor opción para aprendizaje de idiomas.
 * Costo: Capa gratuita limitada, luego de pago.
 *
 * Para activar: TTS_PROVIDER=elevenlabs en .env + ELEVENLABS_API_KEY=...
 */
export class ElevenLabsTTSProvider implements ITTSProvider {
    // Voice IDs de Eleven Labs para inglés nativo con buena dicción
    private readonly defaultVoiceId = "21m00Tcm4TlvDq8ikWAM"; // "Rachel" — clara, natural

    constructor(
        private readonly apiKey: string,
        private readonly voiceId?: string
    ) {}

    async synthesize(text: string, options?: TTSOptions): Promise<ArrayBuffer> {
        const voice = options?.voice ?? this.voiceId ?? this.defaultVoiceId;

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        speaking_rate: options?.speed ?? 1.0,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Eleven Labs TTS error: ${response.status} — ${error}`);
        }

        return response.arrayBuffer();
    }
}
