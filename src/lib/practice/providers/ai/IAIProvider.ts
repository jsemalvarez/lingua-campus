// Contrato que deben cumplir todos los providers de IA (evaluación + chat)
// Para cambiar de proveedor: implementar esta interfaz y actualizar el factory

export interface EvaluationResult {
    score: number;       // 0-100
    feedback: string;    // Mensaje para el alumno (en español)
    weakArea?: string;   // Área difícil detectada, ej: "th fricative", "short vowels"
    isCorrect: boolean;  // true si la pronunciación fue aceptable (score >= 70)
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ListeningQuestion {
    statement: string;
    isTrue: boolean;
}

export interface IAIProvider {
    /**
     * Evalúa la pronunciación del alumno comparando el texto esperado con lo que transcribió.
     * @param expected - Frase que el alumno debía pronunciar
     * @param actual   - Transcripción de lo que el alumno dijo (via STT)
     * @param language - Idioma del ejercicio (ej: "English")
     */
    evaluatePronunciation(
        expected: string,
        actual: string,
        language?: string
    ): Promise<EvaluationResult>;

    /**
     * Continúa una conversación con el alumno, manteniendo el escenario del profesor.
     * @param messages    - Historial de la conversación
     * @param systemPrompt - Escenario definido por el profesor
     */
    chat(messages: ChatMessage[], systemPrompt: string): Promise<string>;

    /**
     * Genera variaciones de frases basadas en una lista de ejemplos (seeds).
     * @param seedPhrases - Frases de ejemplo del profesor
     * @param count       - Cuántas frases nuevas generar
     * @param language    - Idioma de las frases
     */
    generateVariations(
        seedPhrases: string[],
        count: number,
        language?: string
    ): Promise<string[]>;

    /**
     * Genera un nuevo texto de listening basado en un texto de ejemplo, junto con un cuestionario de V/F.
     * @param seedText - Texto de ejemplo del profesor
     * @param language - Idioma del texto
     */
    generateListeningText(
        seedText: string,
        language?: string
    ): Promise<{ text: string, questions: ListeningQuestion[] }>;

    /**
     * Genera un cuestionario de Verdadero/Falso para un texto de listening existente.
     * @param text - Texto de listening
     * @param language - Idioma del texto
     */
    generateListeningQuiz(
        text: string,
        language?: string
    ): Promise<ListeningQuestion[]>;
}
