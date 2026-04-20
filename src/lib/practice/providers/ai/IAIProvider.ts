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
}
