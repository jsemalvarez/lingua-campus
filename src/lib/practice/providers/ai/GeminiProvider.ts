import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIProvider, EvaluationResult, ChatMessage } from "./IAIProvider";

/**
 * Provider de IA usando Gemini de Google.
 * Modelo: gemini-1.5-flash (rápido y económico para estas tareas)
 *
 * Para activar: AI_PROVIDER=gemini en .env + GEMINI_API_KEY=...
 */
export class GeminiProvider implements IAIProvider {
    private readonly client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    async evaluatePronunciation(
        expected: string,
        actual: string,
        language: string = "English"
    ): Promise<EvaluationResult> {
        const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a ${language} pronunciation coach evaluating a language learner.

The student was asked to say: "${expected}"
The speech recognition transcribed what they said as: "${actual}"

Evaluate the pronunciation and respond ONLY with a valid JSON object in this exact format:
{
  "score": <number 0-100>,
  "isCorrect": <true if score >= 70>,
  "feedback": "<brief encouraging feedback in Spanish, 1-2 sentences>",
  "weakArea": "<specific phoneme or pattern that was wrong, e.g. 'th fricative', 'short i vowel', or null if pronunciation was good>"
}

Rules:
- Be lenient with minor transcription differences (contractions, capitalization)
- Focus on phonetic similarity, not exact word matching
- If the transcription is close enough to understand, score >= 70
- weakArea must be a specific phoneme/pattern or null, never a full sentence
- feedback must be in Spanish and encouraging even when wrong`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Strip markdown code blocks if present
        const json = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        try {
            const parsed = JSON.parse(json);
            return {
                score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
                isCorrect: Boolean(parsed.isCorrect),
                feedback: String(parsed.feedback || "¡Bien intento!"),
                weakArea: parsed.weakArea || undefined,
            };
        } catch {
            // Fallback if JSON parsing fails
            return {
                score: 50,
                isCorrect: false,
                feedback: "No pude evaluar la pronunciación. ¡Intentá de nuevo!",
            };
        }
    }

    async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
        const model = this.client.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `${systemPrompt}

Important rules:
- Stay strictly in character as described in the scenario
- Respond only in English
- Keep responses short (2-4 sentences max) to encourage back-and-forth conversation
- If the student makes a grammar error, gently correct it naturally within your response
- Never break character or mention that you are an AI`,
        });

        // Convert our message format to Gemini's format
        const history = messages.slice(0, -1).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const lastMessage = messages[messages.length - 1];

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage.content);

        return result.response.text();
    }
}
