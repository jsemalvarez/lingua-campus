import { IAIProvider, EvaluationResult, ChatMessage, ListeningQuestion } from "./IAIProvider";

/**
 * Provider de IA usando GPT-4o de OpenAI.
 * Alternativa a Gemini — misma interfaz, intercambiable sin tocar nada más.
 *
 * Para activar: AI_PROVIDER=openai en .env + OPENAI_API_KEY=...
 */
export class OpenAIProvider implements IAIProvider {
    constructor(private readonly apiKey: string) {}

    async evaluatePronunciation(
        expected: string,
        actual: string,
        language: string = "English"
    ): Promise<EvaluationResult> {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `You are a ${language} pronunciation coach. Always respond with JSON only.`,
                    },
                    {
                        role: "user",
                        content: `The student was asked to say: "${expected}"\nThe speech recognition transcribed: "${actual}"\n\nRespond with: {"score": 0-100, "isCorrect": boolean, "feedback": "Spanish feedback", "weakArea": "phoneme or null"}`,
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI evaluation error: ${response.status}`);
        }

        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);

        return {
            score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
            isCorrect: Boolean(parsed.isCorrect),
            feedback: String(parsed.feedback || "¡Bien intento!"),
            weakArea: parsed.weakArea || undefined,
        };
    }

    async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages.map((m) => ({ role: m.role, content: m.content })),
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI chat error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async generateVariations(
        seedPhrases: string[],
        count: number,
        language?: string
    ): Promise<string[]> {
        throw new Error("generateVariations not implemented for OpenAIProvider yet.");
    }

    async generateListeningText(
        seedText: string,
        language?: string
    ): Promise<{ text: string, questions: ListeningQuestion[] }> {
        throw new Error("generateListeningText not implemented for OpenAIProvider yet.");
    }

    async generateListeningQuiz(
        text: string,
        language?: string
    ): Promise<ListeningQuestion[]> {
        throw new Error("generateListeningQuiz not implemented for OpenAIProvider yet.");
    }
}
