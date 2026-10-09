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

/**
 * Lo que se sabe de una clase para armarla (PED-09). Todo sale de la base: el
 * tema y los contenidos de `Lesson`, el nivel del curso, los inscriptos y la
 * duración del horario. Nada de esto viaja en el body.
 */
export interface LessonPlanContext {
    topic: string;
    content: string | null;
    level: string | null;
    studentCount: number;
    /** Duración del horario; `null` si la clase no tiene horario. */
    minutes: number | null;
    focus: string | null;
}

/** Los momentos de la clase, con los mismos ids que `LessonPlan.moments`. */
export type LessonMomentId = "inicio" | "principal" | "cierre" | "tarea";

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
     * @param extra    - Las palabras y el foco que eligió el docente al armar la
     *                   clase, y el nivel del curso, si los hay (PED-09)
     */
    generatePracticeDraft(
        topic: string,
        content: string | null,
        language?: string,
        extra?: { words?: string[]; focus?: string | null; level?: string | null }
    ): Promise<PracticeDraft>;

    /**
     * Sugiere las palabras de la clase para que el docente las tilde (PED-09).
     * @param avoid - Palabras que ya están en la lista y no hay que repetir
     */
    suggestLessonWords(
        context: LessonPlanContext,
        avoid: string[],
        language?: string
    ): Promise<string[]>;

    /**
     * Escribe ideas para los momentos pedidos, a partir de las palabras que
     * eligió el docente. Devuelve las ideas como las escribió el modelo: las deja
     * en forma `ideaFromAi`, en `src/lib/lessonPlan/plan.ts`.
     * @param avoid - Títulos de ideas que ya tiene la clase y no hay que repetir
     */
    generateLessonIdeas(
        context: LessonPlanContext & { words: string[] },
        moments: LessonMomentId[],
        avoid: string[],
        language?: string
    ): Promise<Partial<Record<LessonMomentId, unknown[]>>>;
}
