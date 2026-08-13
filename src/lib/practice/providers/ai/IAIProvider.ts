// Contrato que deben cumplir todos los providers de IA (evaluación + chat)
// Para cambiar de proveedor: implementar esta interfaz y actualizar el factory

/**
 * Puntaje mínimo para dar una pronunciación por aceptable.
 *
 * `isCorrect` se deriva de acá y nunca se le pide a la IA: si el modelo devuelve
 * el booleano por su cuenta, puede contradecir a su propio puntaje (score 85 con
 * isCorrect false). Ese valor alimenta `phrasesCorrect` y el `accuracyPct` que se
 * guarda en PracticeSession, así que una contradicción ensucia las métricas del
 * alumno, no sólo el cartel en pantalla.
 */
export const PRONUNCIATION_PASS_SCORE = 70;

/**
 * Idioma de todas las prácticas. Es una constante del servidor y no un campo del
 * body: se interpola en los prompts (`You are a ${language} teacher`), así que
 * dejarlo en manos del cliente era una vía más para escribir el prompt (SEC-07).
 * El día que haya institutos con otro idioma, esto sale de la base junto con el
 * curso, no de la request.
 */
export const PRACTICE_LANGUAGE = "English";

export interface EvaluationResult {
    score: number;       // 0-100
    feedback: string;    // Mensaje para el alumno (en español)
    weakArea?: string;   // Área difícil detectada, ej: "th fricative", "short vowels"
    isCorrect: boolean;  // Derivado: score >= PRONUNCIATION_PASS_SCORE
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ListeningQuestion {
    statement: string;
    isTrue: boolean;
}

/**
 * Borrador de las tres secciones de `LessonPractice`, redactado a partir de la
 * clase. No se guarda solo: vuelve al modal para que el docente lo revise y
 * decida si publica (PED-01).
 */
export interface PracticeDraft {
    speakingPhrases: string[];
    listeningText: string;
    chatScenario: string;
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

    /**
     * Redacta las tres secciones de práctica a partir de lo que se dio en clase.
     *
     * Es la única generación que no parte de material que el profesor ya escribió
     * —las otras cuatro necesitan `seedPhrases` o `seedText`—, y por eso es la que
     * cierra el circuito: sin esto, para que exista práctica el docente tiene que
     * cargarla a mano clase por clase (PED-01).
     *
     * @param topic    - `Lesson.topic`, el tema de la clase
     * @param content  - `Lesson.content`, los contenidos dados (puede no estar)
     * @param language - Idioma de la práctica
     */
    generatePracticeDraft(
        topic: string,
        content: string | null,
        language?: string
    ): Promise<PracticeDraft>;
}
