/**
 * Lo que dijo el alumno contra el texto, de a una palabra.
 *
 * El Speaking corregía mandando la frase y la transcripción a la IA, y toda frase
 * que no fuera idéntica dependía de esa respuesta: con el JSON cortado o un 503,
 * el alumno se quedaba sin corrección. Esto resuelve en el campus mismo, sin red:
 * qué palabras salieron, cuál toca decir y si la frase está bien, casi o todavía
 * no. La IA queda, como mucho, para el comentario.
 *
 * Sirve igual para una frase que para un texto de varias oraciones: se alinea la
 * secuencia entera (la subsecuencia común más larga), así que las palabras de
 * más que diga el alumno no restan y una que se saltea no corre a las demás.
 *
 * Lo que se tolera, de los dos lados por igual:
 * - mayúsculas, tildes y puntuación;
 * - contracciones: «I'm» es «I am», «don't» es «do not»;
 * - números: el navegador escribe «7» o «7:00» cuando se dice «seven o'clock»;
 * - homófonos comunes («to», «too», «two»): suenan igual, así que no es un error
 *   de pronunciación aunque el navegador elija otra;
 * - algunas grafías británicas («colour» y «color»).
 */

export interface TextWord {
    /** La palabra como está escrita, sin la puntuación de alrededor. */
    text: string;
    /** Lo que va pegado antes y después (comillas, comas, el punto). Se muestra tal cual. */
    before: string;
    after: string;
}

export type ReadingGrade = "bien" | "casi" | "todavia";

/** Desde qué parte de las palabras dichas una frase está «casi». */
export const ALMOST_RATIO = 0.7;

// ─── Partir el texto ─────────────────────────────────────────────────────────

const HAS_LETTER = /[\p{L}\p{N}]/u;
const EDGES = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u;

/** Las palabras de un texto, con su puntuación aparte para mostrarla sin tocar. */
export function splitWords(text: string): TextWord[] {
    const words: TextWord[] = [];
    let pending = "";
    for (const chunk of text.split(/\s+/).filter(Boolean)) {
        if (!HAS_LETTER.test(chunk)) {
            // Un guion largo o unas comillas sueltas: van con la palabra de al lado.
            if (words.length > 0) words[words.length - 1].after += ` ${chunk}`;
            else pending += `${chunk} `;
            continue;
        }
        const [, before = "", core = chunk, after = ""] = chunk.match(EDGES) ?? [];
        words.push({ text: core, before: pending + before, after });
        pending = "";
    }
    return words;
}

// ─── Llevar cada palabra a la forma que se compara ───────────────────────────

const ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numberWords(n: number): string[] {
    if (n < 20) return [ONES[n]];
    if (n < 100) return [TENS[Math.floor(n / 10)], ...(n % 10 ? [ONES[n % 10]] : [])];
    if (n < 1000) return [ONES[Math.floor(n / 100)], "hundred", ...(n % 100 ? numberWords(n % 100) : [])];
    return [...numberWords(Math.floor(n / 1000)), "thousand", ...(n % 1000 ? numberWords(n % 1000) : [])];
}

const IRREGULAR_ORDINALS: Record<string, string> = {
    one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth",
};

function ordinalWords(n: number): string[] {
    const words = numberWords(n);
    const last = words[words.length - 1];
    words[words.length - 1] = IRREGULAR_ORDINALS[last] ?? (last.endsWith("y") ? `${last.slice(0, -1)}ieth` : `${last}th`);
    return words;
}

/** Contracciones que no salen de la regla general. */
const CONTRACTIONS: Record<string, string[]> = {
    "won't": ["will", "not"],
    "can't": ["can", "not"],
    "shan't": ["shall", "not"],
    "ain't": ["is", "not"],
    "let's": ["let", "us"],
    cannot: ["can", "not"],
    alright: ["all", "right"],
};

/** Terminaciones de contracción. `'s` y `'d` admiten dos lecturas. */
const SUFFIXES: [string, string][] = [
    ["n't", "not"],
    ["'re", "are"],
    ["'ve", "have"],
    ["'ll", "will"],
    ["'m", "am"],
    ["'d", "would|had"],
    ["'s", "is|has"],
];

/** Suenan igual: se comparan como si fueran la misma. */
const HOMOPHONES: string[][] = [
    ["to", "too", "two"],
    ["for", "four"],
    ["there", "their"],
    ["no", "know"],
    ["new", "knew"],
    ["right", "write"],
    ["here", "hear"],
    ["by", "buy", "bye"],
    ["see", "sea"],
    ["one", "won"],
    ["our", "hour"],
    ["where", "wear"],
    ["weather", "whether"],
    ["eight", "ate"],
    ["son", "sun"],
    ["meet", "meat"],
    ["week", "weak"],
    ["would", "wood"],
    ["i", "eye"],
    ["okay", "ok"],
];
const HOMOPHONE_OF = new Map(HOMOPHONES.flatMap((group) => group.map((w) => [w, group[0]] as const)));

/** Grafías británicas que el navegador (en inglés de EE. UU.) escribe a la americana. */
const SPELLINGS: Record<string, string> = {
    colour: "color", colours: "colors", favourite: "favorite", favourites: "favorites", flavour: "flavor",
    neighbour: "neighbor", neighbours: "neighbors", honour: "honor", behaviour: "behavior", humour: "humor",
    centre: "center", theatre: "theater", metre: "meter", metres: "meters", litre: "liter", grey: "gray",
    programme: "program", travelled: "traveled", travelling: "traveling", cancelled: "canceled",
    organise: "organize", realise: "realize", recognise: "recognize", apologise: "apologize",
    practise: "practice", mum: "mom", pyjamas: "pajamas", jewellery: "jewelry",
};

function canonical(unit: string): string {
    return unit
        .split("|")
        .map((u) => {
            const spelled = SPELLINGS[u] ?? u;
            return HOMOPHONE_OF.get(spelled) ?? spelled;
        })
        .join("|");
}

/**
 * Las unidades con que se compara una palabra: casi siempre una, varias cuando
 * es una contracción, un número o lleva guion. Cada unidad puede tener lecturas
 * alternativas separadas por `|`.
 */
function unitsOf(word: string): string[] {
    const s = word
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[’‘`´]/g, "'");

    const time = s.match(/^(\d{1,2}):(\d{2})$/);
    if (time) {
        const minutes = Number(time[2]);
        return [...numberWords(Number(time[1])), ...(minutes === 0 ? ["oclock"] : numberWords(minutes))].map(canonical);
    }
    const ordinal = s.match(/^(\d{1,4})(st|nd|rd|th)$/);
    if (ordinal) return ordinalWords(Number(ordinal[1])).map(canonical);
    const percent = s.match(/^(\d{1,4})%$/);
    if (percent) return [...numberWords(Number(percent[1])), "percent"].map(canonical);
    if (/^\d{1,4}$/.test(s)) return numberWords(Number(s)).map(canonical);
    if (s === "&") return ["and"];

    return s
        .split(/[-/–]+/)
        .flatMap((part) => {
            if (CONTRACTIONS[part]) return CONTRACTIONS[part];
            for (const [suffix, expansion] of SUFFIXES) {
                if (part.length > suffix.length && part.endsWith(suffix)) {
                    return [part.slice(0, -suffix.length), expansion];
                }
            }
            return [part];
        })
        .map((part) => part.replace(/[^\p{L}\p{N}|]/gu, ""))
        .filter(Boolean)
        .map((part) => (/^\d+$/.test(part) && part.length <= 4 ? numberWords(Number(part)).join(" ") : part))
        .flatMap((part) => part.split(" "))
        .map(canonical);
}

function sameUnit(a: string, b: string): boolean {
    if (a === b) return true;
    if (!a.includes("|") && !b.includes("|")) return false;
    const bs = b.split("|");
    return a.split("|").some((x) => bs.includes(x));
}

// ─── Comparar ────────────────────────────────────────────────────────────────

/**
 * Qué unidades de `target` aparecen en `spoken`, en orden: la subsecuencia común
 * más larga. `dp[i][j]` es el largo de la común entre `target[i:]` y `spoken[j:]`.
 */
function alignUnits(target: string[], spoken: string[]): boolean[] {
    const n = target.length;
    const m = spoken.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i][j] = sameUnit(target[i], spoken[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const matched = new Array<boolean>(n).fill(false);
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (sameUnit(target[i], spoken[j]) && dp[i][j] === dp[i + 1][j + 1] + 1) {
            matched[i] = true;
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            i++;
        } else {
            j++;
        }
    }
    return matched;
}

export interface ReadingCheck {
    /** Una por palabra del texto: si salió. */
    matched: boolean[];
    /** La palabra que toca: la que sigue a la última que salió. Igual a `words.length` si ya no queda ninguna. */
    next: number;
    /** Cuántas salieron. */
    count: number;
}

/** Compara lo que reconoció el navegador contra las palabras del texto. */
export function checkReading(words: TextWord[], spoken: string): ReadingCheck {
    const owner: number[] = [];
    const targetUnits: string[] = [];
    words.forEach((word, index) => {
        for (const unit of unitsOf(word.text)) {
            targetUnits.push(unit);
            owner.push(index);
        }
    });
    const spokenUnits = splitWords(spoken).flatMap((w) => unitsOf(w.text));
    const unitMatched = alignUnits(targetUnits, spokenUnits);

    // Una palabra salió si salieron todas sus unidades («I'm» necesita «I» y «am»).
    const matched = words.map(() => true);
    const touched = words.map(() => false);
    unitMatched.forEach((ok, u) => {
        if (!ok) matched[owner[u]] = false;
        else touched[owner[u]] = true;
    });

    const last = touched.lastIndexOf(true);
    return {
        matched,
        next: last + 1,
        count: matched.filter(Boolean).length,
    };
}

export function gradeReading(check: ReadingCheck, total: number): ReadingGrade {
    if (total === 0 || check.count === total) return "bien";
    return check.count / total >= ALMOST_RATIO ? "casi" : "todavia";
}

/** Palabras para un texto en castellano: «a», «a» y «b», «a», «b» y «c». */
export function listWords(words: string[]): string {
    const quoted = words.map((w) => `«${w}»`);
    return quoted.length <= 1 ? quoted.join("") : `${quoted.slice(0, -1).join(", ")} y ${quoted[quoted.length - 1]}`;
}
