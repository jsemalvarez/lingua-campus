import { IAIProvider } from "./IAIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenAIProvider } from "./OpenAIProvider";

/**
 * Factory de IA (evaluación + chatbot).
 *
 * Para cambiar de proveedor: modificar AI_PROVIDER en .env
 * No hay que tocar ningún otro archivo en la aplicación.
 *
 * Valores válidos: "gemini" | "openai"
 */
export function getAIProvider(): IAIProvider {
    const provider = process.env.AI_PROVIDER ?? "gemini";

    switch (provider) {
        case "openai": {
            const key = process.env.OPENAI_API_KEY;
            if (!key) throw new Error("AI_PROVIDER=openai requiere OPENAI_API_KEY en .env");
            return new OpenAIProvider(key);
        }
        case "gemini":
        default: {
            const key = process.env.GEMINI_API_KEY;
            if (!key) throw new Error("AI_PROVIDER=gemini requiere GEMINI_API_KEY en .env");
            return new GeminiProvider(key);
        }
    }
}
