import { ITTSProvider, TTSOptions } from "./ITTSProvider";

/**
 * Provider que delega la síntesis al browser (window.speechSynthesis).
 * No genera audio en el servidor — devuelve null para indicarle al cliente
 * que debe usar la Web Speech API directamente.
 *
 * Ventaja: Gratis, sin API key, sin latencia de red.
 * Limitación: Calidad de voz básica (depende del OS/browser).
 *
 * Para upgradar: cambiar TTS_PROVIDER en .env a "openai" o "google".
 * Cero cambio de código en el resto de la app.
 */
export class BrowserTTSProvider implements ITTSProvider {
    async synthesize(_text: string, _options?: TTSOptions): Promise<null> {
        // La síntesis la realiza el cliente con window.speechSynthesis
        return null;
    }
}
