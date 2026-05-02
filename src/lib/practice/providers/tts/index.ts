import { ITTSProvider } from "./ITTSProvider";
import { BrowserTTSProvider } from "./BrowserTTSProvider";
import { OpenAITTSProvider } from "./OpenAITTSProvider";
import { ElevenLabsTTSProvider } from "./ElevenLabsTTSProvider";

/**
 * Factory de TTS.
 *
 * Para cambiar de proveedor: modificar TTS_PROVIDER en .env
 * No hay que tocar ningún otro archivo en la aplicación.
 *
 * Valores válidos: "browser" | "openai" | "elevenlabs"
 */
export function getTTSProvider(): ITTSProvider {
    const provider = process.env.TTS_PROVIDER ?? "browser";

    switch (provider) {
        case "openai": {
            const key = process.env.OPENAI_API_KEY;
            if (!key) throw new Error("TTS_PROVIDER=openai requiere OPENAI_API_KEY en .env");
            return new OpenAITTSProvider(key);
        }
        case "elevenlabs": {
            const key = process.env.ELEVENLABS_API_KEY;
            if (!key) throw new Error("TTS_PROVIDER=elevenlabs requiere ELEVENLABS_API_KEY en .env");
            return new ElevenLabsTTSProvider(key);
        }
        case "browser":
        default:
            // Sin API key — la síntesis ocurre en el cliente con window.speechSynthesis
            return new BrowserTTSProvider();
    }
}
