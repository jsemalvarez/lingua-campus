import { IAIProvider, EvaluationResult, ChatMessage, ListeningQuestion, PracticeDraft, PRONUNCIATION_PASS_SCORE } from "./IAIProvider";

/**
 * Provider de IA usando Gemini de Google — implementación con fetch directo.
 *
 * Usamos fetch en lugar del SDK (@google/generative-ai) para poder controlar
 * la versión del endpoint (v1beta) y el modelo libremente, independientemente
 * de lo que haga la librería internamente.
 *
 * Modelos:
 *   gemini-2.0-flash-lite → free tier (30 req/min, 1500 req/día)
 *   gemini-2.0-flash      → pago (más rápido)
 *
 * Para cambiar de modelo cuando tengas billing, editá GEMINI_MODEL abajo.
 */

// Same model and endpoint that the n8n/Telegram demo uses with this API key.
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Tope de frases del borrador de práctica. Se le piden 6; esto acota el desborde. */
const MAX_DRAFT_PHRASES = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface GeminiContent {
    role: "user" | "model";
    parts: { text: string }[];
}

interface GeminiRequest {
    system_instruction?: { parts: { text: string }[] };
    contents: GeminiContent[];
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        responseMimeType?: string;
    };
}

async function callGemini(apiKey: string, body: GeminiRequest): Promise<string> {
    const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class GeminiProvider implements IAIProvider {
    constructor(private readonly apiKey: string) {}

    async evaluatePronunciation(
        expected: string,
        actual: string,
        language: string = "English"
    ): Promise<EvaluationResult> {
        // 1. Shortcut: Identical strings (ignoring case/punctuation)
        const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:]/g, "").trim();
        if (normalize(expected) === normalize(actual)) {
            return {
                score: 100,
                isCorrect: true,
                feedback: "¡Excelente! Tu pronunciación fue perfecta.",
                weakArea: undefined
            };
        }

        const prompt = `You are a ${language} pronunciation coach evaluating a language learner.

The student was asked to say: "${expected}"
The speech recognition transcribed what they said as: "${actual}"

Evaluate the pronunciation and respond ONLY with a valid JSON object in this exact format:
{
  "score": <number 0-100>,
  "feedback": "<brief encouraging feedback in Spanish, 1-2 sentences>",
  "weakArea": "<specific phoneme or pattern that was wrong, e.g. 'th fricative', 'short i vowel', or null if pronunciation was good>"
}

Rules:
- Be lenient with minor transcription differences (contractions, capitalization)
- Focus on phonetic similarity, not exact word matching
- If the transcription is close enough to understand, score >= ${PRONUNCIATION_PASS_SCORE}
- weakArea must be a specific phoneme/pattern or null, never a full sentence
- feedback must be in Spanish and encouraging even when wrong`;

        const text = await callGemini(this.apiKey, {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { 
                temperature: 0.1, 
                maxOutputTokens: 1024,
                responseMimeType: "application/json"
            },
        });

        // 2. Robust JSON Extraction
        // Find the first '{' and the last '}' to extract the JSON block
        const startIdx = text.indexOf("{");
        const endIdx = text.lastIndexOf("}");

        if (startIdx === -1 || endIdx === -1) {
            console.error("[GEMINI] Invalid response format (no JSON found):", text);
            throw new Error("La respuesta de la IA no tiene un formato válido.");
        }

        const jsonStr = text.substring(startIdx, endIdx + 1);

        try {
            const parsed = JSON.parse(jsonStr);
            const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
            return {
                score,
                isCorrect: score >= PRONUNCIATION_PASS_SCORE,
                feedback: String(parsed.feedback || "¡Bien intento!"),
                weakArea: parsed.weakArea || undefined,
            };
        } catch (err: any) {
            console.error("[GEMINI] JSON Parse error:", err.message, "Raw string:", jsonStr);
            throw new Error("No se pudo procesar la evaluación de la IA.");
        }
    }

    async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
        const history: GeminiContent[] = messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        return callGemini(this.apiKey, {
            system_instruction: {
                parts: [{
                    text: `${systemPrompt}

Important rules:
- Stay strictly in character as described in the scenario
- Respond only in English
- Keep responses short (2-4 sentences max) to encourage back-and-forth conversation
- If the student makes a grammar error, gently correct it naturally within your response
- Never break character or mention that you are an AI`
                }]
            },
            contents: history,
            generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
        });
    }

    async generateVariations(
        seedPhrases: string[],
        count: number,
        language: string = "English"
    ): Promise<string[]> {
        // Add a random seed to the prompt to force variety even if Gemini caches
        const randomSalt = Math.random().toString(36).substring(7);
        
        const prompt = `You are a professional ${language} teacher.
        
I have these seed phrases:
${seedPhrases.map((s) => `- ${s}`).join("\n")}

Task: Create ${count} NEW and ORIGINAL phrases for practice.
Reference ID: ${randomSalt}

CRITICAL CONSTRAINTS:
1. DO NOT REPEAT the seed phrases.
2. Maintain the same level of difficulty.
3. Practise similar grammar points.
4. Respond ONLY with a clean JSON format like this: ["phrase 1", "phrase 2"]
5. Use plain text, no markdown, no comments.`;

        const text = await callGemini(this.apiKey, {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 1.0, maxOutputTokens: 1024, responseMimeType: "application/json" },
        });

        // Extreme JSON cleaning
        let cleanText = text.trim();
        if (cleanText.includes("[") && cleanText.includes("]")) {
            cleanText = cleanText.substring(cleanText.indexOf("["), cleanText.lastIndexOf("]") + 1);
        }

        try {
            const parsed = JSON.parse(cleanText);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Verify they are actually different
                const filtered = parsed.map(p => String(p).trim()).filter(p => !seedPhrases.includes(p));
                if (filtered.length > 0) return filtered.slice(0, count);
            }
            throw new Error("Invalid array or no variations");
        } catch (e) {
            console.error("[GEMINI] Phrase generation failed, attempting manual extraction. Raw:", text);
            
            // Last resort: extract anything that looks like a sentence between quotes or as lines
            const fallbackRegex = /"([^"]{10,})"/g;
            const matches = [];
            let m;
            while ((m = fallbackRegex.exec(text)) !== null) {
                if (!seedPhrases.includes(m[1])) matches.push(m[1]);
            }

            if (matches.length >= 1) return matches.slice(0, count);
            
            // If everything fails, return modified seeds as last resort to at least show change
            return seedPhrases.map(s => `${s}.`).slice(0, count);
        }
    }

    async generateListeningText(
        seedText: string,
        language: string = "English"
    ): Promise<{ text: string, questions: ListeningQuestion[] }> {
        const randomSalt = Math.random().toString(36).substring(7);
        
        const prompt = `You are a professional ${language} teacher.
        
I have this seed text for a listening practice exercise:
"${seedText}"

Task: Create a NEW and ORIGINAL text for listening practice, AND generate a True/False comprehension quiz about the NEW text.
Reference ID: ${randomSalt}

CRITICAL CONSTRAINTS:
1. The new text should be a completely different story, context or sentences. Do not just change a few words.
2. Maintain the same level of difficulty and approximate length as the seed text.
3. Practise similar grammar points and vocabulary level.
4. The quiz must contain exactly 4 to 6 True/False statements about the new text.
5. Respond ONLY with a valid JSON object in this exact format, with no markdown formatting around it:
{
  "text": "The new listening text goes here",
  "questions": [
    { "statement": "Statement 1 goes here", "isTrue": true },
    { "statement": "Statement 2 goes here", "isTrue": false }
  ]
}`;

        const textResponse = await callGemini(this.apiKey, {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 1.0, maxOutputTokens: 2048, responseMimeType: "application/json" },
        });

        const jsonStr = textResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        try {
            const parsed = JSON.parse(jsonStr);
            return {
                text: parsed.text || seedText,
                questions: Array.isArray(parsed.questions) ? parsed.questions : []
            };
        } catch (e) {
            console.error("[GEMINI] Failed to parse generateListeningText response:", jsonStr);
            return { text: seedText, questions: [] };
        }
    }

    async generateListeningQuiz(
        text: string,
        language: string = "English"
    ): Promise<ListeningQuestion[]> {
        const prompt = `You are a professional ${language} teacher.
        
I have this text for a listening practice exercise:
"${text}"

Task: Generate a True/False comprehension quiz about the text.

CRITICAL CONSTRAINTS:
1. The quiz must contain exactly 4 to 6 True/False statements.
2. Mix true and false statements randomly.
3. Respond ONLY with a valid JSON array in this exact format, with no markdown formatting around it:
[
  { "statement": "Statement 1 goes here", "isTrue": true },
  { "statement": "Statement 2 goes here", "isTrue": false }
]`;

        const textResponse = await callGemini(this.apiKey, {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024, responseMimeType: "application/json" },
        });

        const jsonStr = textResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        try {
            const parsed = JSON.parse(jsonStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("[GEMINI] Failed to parse generateListeningQuiz response:", jsonStr);
            return [];
        }
    }

    async generatePracticeDraft(
        topic: string,
        content: string | null,
        language: string = "English"
    ): Promise<PracticeDraft> {
        // El tema y los contenidos los escribe la profesora en castellano; las
        // frases y el texto van en el idioma de la práctica igual. Se le dice
        // explícito porque si no el modelo sigue el idioma de la consigna.
        const prompt = `You are a professional ${language} teacher preparing take-home practice for the class you just taught.

Class topic: "${topic}"
${content ? `What was covered in class:\n"""\n${content}\n"""` : "No further detail was recorded: work from the topic alone."}

The topic and the notes may be written in Spanish, because that is the teacher's language. The practice material itself must still be in ${language}.

Task: write the three practice sections for the students of THAT class, and respond ONLY with a valid JSON object in this exact format, with no markdown formatting around it:
{
  "speakingPhrases": ["phrase 1", "phrase 2"],
  "listeningText": "The listening text goes here",
  "chatScenario": "La consigna del chatbot va acá"
}

CRITICAL CONSTRAINTS:
1. "speakingPhrases": exactly 6 phrases in ${language}, 6 to 12 words each, using the grammar and vocabulary of the class. They are read out loud, so no lists, no parentheses and no abbreviations.
2. "listeningText": a single paragraph in ${language} of 60 to 90 words, at the same level, that reuses the vocabulary of the class in a concrete everyday situation. It is turned into audio, so plain prose only.
3. "chatScenario": 2 or 3 sentences **in Spanish**, written as an instruction for a chatbot that will role-play with the student ("Sos un mozo en un café. El alumno es un turista..."). State the role, the situation and the level. The situation must be one where the content of this class is actually needed.
4. If the topic is too vague to teach anything specific, choose the most common beginner reading of it and stay concrete.
5. Plain text, no markdown, no comments.`;

        const textResponse = await callGemini(this.apiKey, {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 2048, responseMimeType: "application/json" },
        });

        const jsonStr = textResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            console.error("[GEMINI] Failed to parse generatePracticeDraft response:", jsonStr);
            throw new Error("La IA devolvió un borrador con formato inválido.");
        }

        const speakingPhrases = Array.isArray(parsed.speakingPhrases)
            ? parsed.speakingPhrases.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, MAX_DRAFT_PHRASES)
            : [];
        const listeningText = typeof parsed.listeningText === "string" ? parsed.listeningText.trim() : "";
        const chatScenario = typeof parsed.chatScenario === "string" ? parsed.chatScenario.trim() : "";

        // Sin frases no hay práctica: `editLessonAction` no crea el
        // `LessonPractice` si `speakingPhrases` viene vacío. Devolver un borrador
        // así sería el mismo fallo silencioso de PED-05 con otra cara — el
        // docente aprieta el botón, no pasa nada y no sabe por qué.
        if (speakingPhrases.length === 0) {
            console.error("[GEMINI] generatePracticeDraft returned no phrases:", jsonStr);
            throw new Error("La IA no devolvió frases de speaking.");
        }

        return { speakingPhrases, listeningText, chatScenario };
    }
}
