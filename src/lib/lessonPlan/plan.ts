/**
 * El armado de la clase (PED-09): las palabras, el foco y los cuatro momentos con
 * sus ideas. Es lo que se guarda en `LessonPlan`.
 *
 * Vive en un módulo sin `prisma` porque lo usan los dos lados: la página para
 * dibujar y sumar minutos, y el servidor para validar lo que llega a guardarse y
 * para dejar en forma lo que devuelve la IA. Lo que se pega en cada herramienta
 * —las preguntas de Kahoot, las tarjetas de Quizlet— se arma acá y no en el
 * prompt: el formato no puede depender de que el modelo lo respete.
 */

export type MomentId = "inicio" | "principal" | "cierre" | "tarea";

export const MOMENT_IDS: MomentId[] = ["inicio", "principal", "cierre", "tarea"];

export const MOMENTS: { id: MomentId; name: string; sub: string; inClass: boolean }[] = [
    { id: "inicio", name: "Inicio", sub: "Para entrar en tema", inClass: true },
    { id: "principal", name: "Actividad principal", sub: "El centro de la clase", inClass: true },
    { id: "cierre", name: "Cierre", sub: "Corto y con energía", inClass: true },
    { id: "tarea", name: "Tarea", sub: "Para seguir en casa", inClass: false },
];

export const FOCUSES = ["Conversación", "Gramática", "Vocabulario", "Pronunciación", "Lectura", "Escucha"] as const;

/**
 * Con qué se hace cada idea. Las siete herramientas son las de la página de
 * recursos menos PlayPhrase y LingoClip: las escenas de películas hay que
 * revisarlas antes de proyectar, y las canciones no tienen de dónde salir sin
 * que la IA invente letras (PED-09). «material» es lo que el docente ya usa
 * —un libro, fotocopias, lo que sea— y
 * «campus» es la práctica de los alumnos.
 */
export const PLAN_TOOLS = ["none", "material", "campus", "kahoot", "wordwall", "quizlet", "youglish", "padlet", "docs", "canva"] as const;
export type PlanTool = (typeof PLAN_TOOLS)[number];

/** Las que tienen guía de «¿Primera vez?» en la página de recursos. */
export const EXTERNAL_TOOLS = ["kahoot", "wordwall", "quizlet", "youglish", "padlet", "docs", "canva"] as const;
export type ExternalTool = (typeof EXTERNAL_TOOLS)[number];

export function isExternalTool(tool: PlanTool): tool is ExternalTool {
    return (EXTERNAL_TOOLS as readonly string[]).includes(tool);
}

// ─── La edad del grupo ───────────────────────────────────────────────────────

/** El rango de edad de los alumnos del curso, calculado de sus fechas de nacimiento. */
export type AgeRange = { min: number; max: number };

/**
 * Una fecha de nacimiento que da menos de 4 o más de 99 años está mal cargada
 * —el año de ingreso en vez del de nacimiento, por ejemplo— y no cuenta.
 */
const MIN_PLAUSIBLE_AGE = 4;
const MAX_PLAUSIBLE_AGE = 99;

/**
 * YouGlish trae videos de YouTube, que pide 13 años, y la guía de recursos ya
 * avisa que no están pensados para chicos.
 */
const YOUTUBE_MIN_AGE = 13;

/**
 * Google Docs y Padlet son para escribir y publicar en un dispositivo: antes de
 * los 10 casi no escriben en inglés, y menos en una pantalla.
 */
const WRITING_ONLINE_MIN_AGE = 10;

/** Años cumplidos a `today`, contados en UTC como el resto de las fechas. */
export function ageOn(birthDate: Date, today: Date): number {
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const beforeBirthday =
        today.getUTCMonth() < birthDate.getUTCMonth() ||
        (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());
    if (beforeBirthday) age -= 1;
    return age;
}

/**
 * El rango con los alumnos que tienen la fecha cargada. Si no hay ninguno —un
 * curso sin inscriptos, o sin fechas—, `null`: la IA sigue con el nivel y el
 * tema, como antes.
 */
export function ageRangeOf(birthDates: (Date | null)[], today: Date = new Date()): AgeRange | null {
    const ages = birthDates
        .filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()))
        .map((d) => ageOn(d, today))
        .filter((age) => age >= MIN_PLAUSIBLE_AGE && age <= MAX_PLAUSIBLE_AGE);
    if (ages.length === 0) return null;
    return { min: Math.min(...ages), max: Math.max(...ages) };
}

export function ageLabel(range: AgeRange): string {
    return range.min === range.max ? `${range.min} años` : `${range.min} a ${range.max} años`;
}

/**
 * Las herramientas que la IA puede proponer para el grupo. Manda el más chico:
 * una idea que no sirve para uno de los alumnos no sirve para la clase. Lo
 * decide el sistema y no el prompt, para no depender de que el modelo se acuerde.
 */
export function toolsForAges(range: AgeRange | null): PlanTool[] {
    const youngest = range?.min ?? null;
    return PLAN_TOOLS.filter((tool) => {
        if (tool === "campus") return false; // la práctica la agrega el sistema
        if (youngest === null) return true;
        if (tool === "youglish") return youngest >= YOUTUBE_MIN_AGE;
        if (tool === "docs" || tool === "padlet") return youngest >= WRITING_ONLINE_MIN_AGE;
        return true;
    });
}

export const GROUPINGS = ["Toda la clase", "De a dos", "Grupos de 3", "Equipos", "Cada uno"] as const;

export type PlanWord = { text: string; on: boolean; own?: boolean };

export type PlanIdea = {
    id: string;
    title: string;
    description: string;
    tool: PlanTool;
    minutes: number;
    grouping: string;
    /** El contenido listo: lo que se dice, se proyecta o se pega. */
    lines: string[];
    note?: string;
    /** Las palabras con que se abre YouGlish. */
    words?: string[];
    /** Escrita por el docente con «Escribir la mía». */
    own?: boolean;
};

export type PlanMoment = { ideas: PlanIdea[]; selectedId: string | null };
export type PlanMoments = Record<MomentId, PlanMoment>;

export type PlanData = {
    focus: string | null;
    words: PlanWord[];
    moments: PlanMoments | null;
    ideasBasis: string | null;
};

// ─── Topes ───────────────────────────────────────────────────────────────────
// Lo que se guarda llega desde el navegador: se recorta a lo que una clase
// puede necesitar, con aire, para que nadie guarde un megabyte en una fila.

export const MAX_WORDS = 40;
export const MAX_WORD_CHARS = 60;
const MAX_IDEAS_PER_MOMENT = 8;
const MAX_LINES = 24;
const MAX_LINE_CHARS = 400;
const MAX_TITLE_CHARS = 120;
const MAX_DESCRIPTION_CHARS = 600;
const MAX_MINUTES = 240;

// ─── Lecturas ────────────────────────────────────────────────────────────────

export function emptyMoments(): PlanMoments {
    return { inicio: emptyMoment(), principal: emptyMoment(), cierre: emptyMoment(), tarea: emptyMoment() };
}

function emptyMoment(): PlanMoment {
    return { ideas: [], selectedId: null };
}

export function selectedIdea(moment: PlanMoment | undefined): PlanIdea | null {
    if (!moment?.selectedId) return null;
    return moment.ideas.find((idea) => idea.id === moment.selectedId) ?? null;
}

/** Cuántos momentos tienen una idea elegida. Es `LessonPlan.chosen`. */
export function countChosen(moments: PlanMoments | null): number {
    if (!moments) return 0;
    return MOMENT_IDS.filter((id) => selectedIdea(moments[id]) !== null).length;
}

/** Una clase está armada cuando los cuatro momentos tienen idea elegida. */
export function isPlanComplete(chosen: number): boolean {
    return chosen >= MOMENT_IDS.length;
}

/** Lo que dura una clase según su horario («18:00» a «19:00» son 60). */
export function durationMinutes(start: string, end: string): number | null {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
    const minutes = eh * 60 + em - (sh * 60 + sm);
    return minutes > 0 ? minutes : null;
}

export function selectedWords(words: PlanWord[]): string[] {
    return words.filter((w) => w.on).map((w) => w.text);
}

/**
 * La huella del foco y las palabras con que se pidieron las ideas. Si la de
 * ahora no coincide, las ideas de abajo ya no usan lo que el docente eligió.
 */
export function ideasBasisOf(focus: string | null, words: PlanWord[]): string {
    return JSON.stringify({ focus: focus ?? null, words: [...selectedWords(words)].map((w) => w.toLowerCase()).sort() });
}

export function newIdeaId(): string {
    return Math.random().toString(36).slice(2, 10);
}

// ─── Cómo se muestra cada herramienta ────────────────────────────────────────

const TOOL_LABELS: Record<PlanTool, string> = {
    none: "Sin herramienta",
    material: "Tu material",
    campus: "Campus",
    kahoot: "Kahoot",
    wordwall: "Wordwall",
    quizlet: "Quizlet",
    youglish: "YouGlish",
    padlet: "Padlet",
    docs: "Google Docs",
    canva: "Canva",
};

export function toolLabel(tool: PlanTool): string {
    return TOOL_LABELS[tool];
}

/** El rótulo de arriba del contenido listo: para qué es lo que sigue. */
export function contentLabel(idea: PlanIdea, moment: MomentId): string {
    switch (idea.tool) {
        case "material":
            return "Para preparar";
        case "campus":
            return "Se arma más abajo";
        case "kahoot":
            return "Para cargar en Kahoot · la correcta va marcada";
        case "wordwall":
            return "Lista para cargar en Wordwall";
        case "quizlet":
            return "Para importar en Quizlet";
        case "youglish":
            return "Abrí YouGlish con cada palabra";
        case "padlet":
            return "Consigna para pegar en Padlet";
        case "docs":
            return "Consigna para el documento compartido";
        case "canva":
            return "Para armar en Canva";
        default:
            return idea.own ? "Tu idea" : moment === "tarea" ? "Consigna para la casa" : "Para decir en clase";
    }
}

/** Qué copia el botón: es lo que la herramienta acepta pegado. */
export function copyText(idea: PlanIdea): string {
    if (idea.tool === "quizlet") {
        // Quizlet importa un renglón por tarjeta, con tabulador entre el término
        // y la definición: es su formato por defecto al pegar.
        return idea.lines.map((line) => line.replace(QUIZLET_ARROW, "\t")).join("\n");
    }
    return idea.lines.join("\n");
}

export function copyLabel(idea: PlanIdea): string | null {
    switch (idea.tool) {
        case "material":
        case "campus":
        case "youglish":
            return null;
        case "kahoot":
            return "Copiar las preguntas";
        case "quizlet":
            return "Copiar para importar";
        case "wordwall":
            return "Copiar la lista";
        case "padlet":
        case "docs":
            return "Copiar la consigna";
        default:
            return "Copiar";
    }
}

export function youglishUrl(word: string): string {
    return `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`;
}

const QUIZLET_ARROW = " → ";

/** La tarea fija: la práctica del campus, que se arma en la parte 4. */
export function campusIdea(): PlanIdea {
    return {
        id: "campus",
        title: "La práctica del campus",
        description: "Pronunciación, escucha y chat con las palabras de hoy. La hacen desde su cuenta y se arma en la parte 4.",
        tool: "campus",
        minutes: 15,
        grouping: "Cada uno",
        lines: [
            "Las frases, el texto y la conversación salen de las mismas palabras de la clase.",
            "Los alumnos la ven en su campus cuando la publicás.",
        ],
    };
}

/**
 * El título y la descripción de la idea del material propio: los pone el
 * sistema y no la IA. El campus no sabe si el docente usa un libro, fotocopias
 * u otra cosa, y con el título libre el modelo inventaba nombres de libros
 * («Libro: El sueño del dinero») que el docente podía salir a buscar.
 */
export const MATERIAL_TITLE = "Seguir con tu material";
export const MATERIAL_DESCRIPTION = "El libro, las fotocopias o lo que ya tenías preparado, con las palabras de hoy en los ejemplos.";

/**
 * La idea del material de siempre, para cuando la IA no la trae. La actividad
 * principal la ofrece siempre —es lo que el docente ya tenía previsto—, y el
 * pedido la exige, pero el modelo a veces la olvida.
 */
export function materialIdea(): PlanIdea {
    return {
        id: newIdeaId(),
        title: MATERIAL_TITLE,
        description: MATERIAL_DESCRIPTION,
        tool: "material",
        minutes: 20,
        grouping: "Toda la clase",
        lines: MATERIAL_LINES,
    };
}

const MATERIAL_LINES = [
    "Antes de la clase, elegí de tu material el ejercicio que mejor use las palabras de hoy.",
    "Hacelo primero y usá sus respuestas como ejemplos para hablar.",
];

/**
 * Si el consejo cita una unidad o una página que no está en los contenidos, la
 * inventó: con contenidos sin datos del material, el modelo escribía «unidad 7,
 * página 42». Se cambia por el consejo genérico, que no promete nada.
 */
function citesInventedPages(lines: string[], content: string | null): boolean {
    const known = new Set((content ?? "").match(/\d+/g) ?? []);
    const cited = lines.join(" ").match(/\b(?:unit|unidad|units|unidades|page|pages|p\.|pág\.?|página|páginas)\s*\d+(?:\s*(?:y|and|,|-|–|a)\s*\d+)*/gi) ?? [];
    return cited.some((citation) => (citation.match(/\d+/g) ?? []).some((n) => !known.has(n)));
}

/**
 * Kahoot gratis admite hasta 10 jugadores por partida (verificado el
 * 27/09/2026, ver `src/app/resources/tools.ts`). La IA ya recibe el tamaño del
 * grupo, pero el aviso no depende de que lo recuerde.
 */
export const KAHOOT_FREE_PLAYERS = 10;

export function kahootNote(studentCount: number): string | undefined {
    if (studentCount <= KAHOOT_FREE_PLAYERS) return undefined;
    const teams = Math.ceil(studentCount / 3);
    return `Son ${studentCount} alumnos y Kahoot gratis admite hasta ${KAHOOT_FREE_PLAYERS} jugadores por partida: jueguen en ${teams <= KAHOOT_FREE_PLAYERS ? `${teams} equipos de a 3` : "equipos"}, con un dispositivo por equipo.`;
}

// ─── Validación ──────────────────────────────────────────────────────────────

function str(value: unknown, max: number): string {
    return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function int(value: unknown, fallback: number): number {
    const n = Math.round(Number(value));
    return Number.isFinite(n) && n >= 0 ? Math.min(n, MAX_MINUTES) : fallback;
}

function asTool(value: unknown): PlanTool {
    return (PLAN_TOOLS as readonly string[]).includes(value as string) ? (value as PlanTool) : "none";
}

function lines(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((line) => str(line, MAX_LINE_CHARS)).filter(Boolean).slice(0, MAX_LINES);
}

export function sanitizeWords(value: unknown): PlanWord[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const words: PlanWord[] = [];
    for (const raw of value) {
        if (!raw || typeof raw !== "object") continue;
        const w = raw as Record<string, unknown>;
        const text = str(w.text, MAX_WORD_CHARS);
        const key = text.toLowerCase();
        if (!text || seen.has(key)) continue;
        seen.add(key);
        words.push({ text, on: w.on !== false, ...(w.own === true ? { own: true } : {}) });
        if (words.length >= MAX_WORDS) break;
    }
    return words;
}

export function sanitizeIdea(value: unknown): PlanIdea | null {
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    const title = str(v.title, MAX_TITLE_CHARS);
    if (!title) return null;
    const tool = asTool(v.tool);
    const note = str(v.note, MAX_DESCRIPTION_CHARS);
    const words = lines(v.words).map((w) => w.slice(0, MAX_WORD_CHARS)).slice(0, 8);
    return {
        id: str(v.id, 40) || newIdeaId(),
        title,
        description: str(v.description, MAX_DESCRIPTION_CHARS),
        tool,
        minutes: int(v.minutes, 10),
        grouping: str(v.grouping, 40) || "Toda la clase",
        lines: lines(v.lines),
        ...(note ? { note } : {}),
        ...(tool === "youglish" && words.length ? { words } : {}),
        ...(v.own === true ? { own: true } : {}),
    };
}

function sanitizeMoment(value: unknown): PlanMoment {
    if (!value || typeof value !== "object") return emptyMoment();
    const v = value as Record<string, unknown>;
    const seen = new Set<string>();
    const ideas = (Array.isArray(v.ideas) ? v.ideas : [])
        .map(sanitizeIdea)
        .filter((idea): idea is PlanIdea => {
            if (!idea || seen.has(idea.id)) return false;
            seen.add(idea.id);
            return true;
        })
        .slice(0, MAX_IDEAS_PER_MOMENT);
    const selectedId = typeof v.selectedId === "string" && seen.has(v.selectedId) ? v.selectedId : null;
    return { ideas, selectedId };
}

export function sanitizeMoments(value: unknown): PlanMoments | null {
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    return {
        inicio: sanitizeMoment(v.inicio),
        principal: sanitizeMoment(v.principal),
        cierre: sanitizeMoment(v.cierre),
        tarea: sanitizeMoment(v.tarea),
    };
}

export function sanitizeFocus(value: unknown): string | null {
    return (FOCUSES as readonly string[]).includes(value as string) ? (value as string) : null;
}

export function sanitizePlan(value: unknown): PlanData {
    const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    return {
        focus: sanitizeFocus(v.focus),
        words: sanitizeWords(v.words),
        moments: sanitizeMoments(v.moments),
        ideasBasis: typeof v.ideasBasis === "string" ? v.ideasBasis.slice(0, 4000) : null,
    };
}

export function isPlanEmpty(plan: PlanData): boolean {
    const hasIdeas = plan.moments !== null && MOMENT_IDS.some((id) => plan.moments![id].ideas.length > 0);
    return !plan.focus && plan.words.length === 0 && !hasIdeas;
}

// ─── Lo que devuelve la IA ───────────────────────────────────────────────────

/**
 * Deja en forma una idea que escribió la IA. Las preguntas de Kahoot y las
 * tarjetas de Quizlet llegan con estructura y se pasan a renglones acá, con la
 * correcta marcada y la flecha que después se cambia por un tabulador.
 */
export function ideaFromAi(
    raw: unknown,
    moment: MomentId,
    group: {
        studentCount: number;
        classWords: string[];
        /** De `toolsForAges`: una idea con otra herramienta no llega a la página. */
        allowedTools: PlanTool[];
        /** Los contenidos de la clase, contra los que se controla el material. */
        content: string | null;
    }
): PlanIdea | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const { studentCount, classWords, allowedTools, content } = group;
    let tool = asTool(r.tool);
    if (!allowedTools.includes(tool)) return null;
    // El libro va en la principal; en otro momento es una idea sin herramienta.
    if (tool === "material" && moment !== "principal") tool = "none";

    let ideaLines = lines(r.lines);

    if (tool === "kahoot" && Array.isArray(r.questions)) {
        const questions = r.questions
            .map((q) => {
                if (!q || typeof q !== "object") return null;
                const item = q as Record<string, unknown>;
                const question = str(item.question, 200);
                const options = lines(item.options).slice(0, 4);
                const answer = Math.round(Number(item.answer));
                if (!question || options.length < 2 || !(answer >= 0 && answer < options.length)) return null;
                const marked = options.map((option, i) => (i === answer ? `${option} ✓` : option));
                return `${question} · ${marked.join(" · ")}`;
            })
            .filter((q): q is string => q !== null)
            .slice(0, 10);
        if (questions.length) ideaLines = questions.map((q, i) => `${i + 1}. ${q}`);
    }

    if (tool === "quizlet" && Array.isArray(r.cards)) {
        const cards = r.cards
            .map((c) => {
                if (!c || typeof c !== "object") return null;
                const card = c as Record<string, unknown>;
                const term = str(card.term, 100).replace(/\t/g, " ");
                const definition = str(card.definition, 200).replace(/\t/g, " ");
                return term && definition ? `${term}${QUIZLET_ARROW}${definition}` : null;
            })
            .filter((c): c is string => c !== null)
            .slice(0, 20);
        if (cards.length) ideaLines = cards;
    }

    // Si la IA nombra YouGlish pero no dice con qué palabras, se abre con las
    // de la clase: el título ya promete la herramienta.
    let words: string[] = [];
    if (tool === "youglish") {
        words = lines(r.words).map((w) => w.slice(0, MAX_WORD_CHARS)).slice(0, 6);
        if (!words.length) words = classWords.slice(0, 5);
        if (!words.length) tool = "none";
        else
            ideaLines = [
                "Cada botón abre YouGlish con la palabra ya buscada.",
                "Escuchen dos o tres videos por palabra y repitan en voz alta. Los videos son de YouTube: miralos antes de proyectar.",
            ];
    }

    // Sin minutos —a la tarea a veces le pone 0— va un valor razonable.
    const minutes = Math.round(Number(r.minutes));
    const fallbackMinutes = moment === "principal" ? 25 : moment === "tarea" ? 15 : 10;

    const isMaterial = tool === "material";
    if (isMaterial && citesInventedPages(ideaLines, content)) ideaLines = MATERIAL_LINES;

    const grouping = str(r.grouping, 40);
    return sanitizeIdea({
        id: newIdeaId(),
        title: isMaterial ? MATERIAL_TITLE : r.title,
        description: isMaterial ? MATERIAL_DESCRIPTION : r.description,
        tool,
        minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : fallbackMinutes,
        grouping: (GROUPINGS as readonly string[]).includes(grouping) ? grouping : "Toda la clase",
        lines: ideaLines,
        note: tool === "kahoot" ? kahootNote(studentCount) : undefined,
        words,
    });
}
