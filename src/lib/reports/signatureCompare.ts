/**
 * Trazo de una firma y comparación entre dos (FEAT-09).
 *
 * Vive aparte de `signatures.ts` a propósito: aquel usa `crypto` de Node y no
 * puede entrar en un componente de cliente. Esto sí, porque el canvas y la
 * pantalla del instituto necesitan los mismos tipos y el mismo dibujo.
 */

/**
 * Un punto del trazo. El tiempo va en milisegundos desde que arrancó la firma,
 * no como fecha absoluta: lo que sirve para comparar dos firmas es la dinámica
 * —el orden, la velocidad, las pausas—, no cuándo se hicieron.
 */
export type StrokePoint = { x: number; y: number; t: number };

/** Una firma es una lista de trazos, y cada trazo una lista de puntos. */
export type StrokeData = { strokes: StrokePoint[][]; width: number; height: number };

/** Cuántos puntos se usan para comparar, repartidos a lo largo del recorrido. */
const RESAMPLE = 64;

function totalPoints(data: StrokeData): number {
    return data.strokes.reduce((acc, s) => acc + s.length, 0);
}

/**
 * Reparte `RESAMPLE` puntos a lo largo del recorrido completo, uniendo los
 * trazos en una sola línea. Así dos firmas con distinta cantidad de puntos
 * —una hecha rápido y otra despacio— se pueden comparar punto contra punto.
 */
function resample(data: StrokeData): { x: number; y: number }[] {
    const path = data.strokes.flat();
    if (path.length < 2) return [];

    let length = 0;
    for (let i = 1; i < path.length; i++) {
        length += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    }
    if (length === 0) return [];

    const step = length / (RESAMPLE - 1);
    const out: { x: number; y: number }[] = [{ x: path[0].x, y: path[0].y }];
    let walked = 0;

    for (let i = 1; i < path.length; i++) {
        const seg = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
        if (seg === 0) continue;

        while (walked + seg >= out.length * step && out.length < RESAMPLE) {
            const need = out.length * step - walked;
            const r = need / seg;
            out.push({
                x: path[i - 1].x + (path[i].x - path[i - 1].x) * r,
                y: path[i - 1].y + (path[i].y - path[i - 1].y) * r
            });
        }
        walked += seg;
    }

    while (out.length < RESAMPLE) out.push({ ...out[out.length - 1] });
    return out;
}

/**
 * Centra en el origen y escala para que el tamaño no cuente. Firmar más grande
 * o más chico no debería dar dos firmas distintas: lo que se compara es la
 * forma, no cuánto espacio ocupó en la pantalla.
 */
function normalize(points: { x: number; y: number }[]) {
    const cx = points.reduce((a, p) => a + p.x, 0) / points.length;
    const cy = points.reduce((a, p) => a + p.y, 0) / points.length;
    const centered = points.map(p => ({ x: p.x - cx, y: p.y - cy }));

    const rms = Math.sqrt(
        centered.reduce((a, p) => a + p.x * p.x + p.y * p.y, 0) / centered.length
    );
    if (rms === 0) return centered;

    return centered.map(p => ({ x: p.x / rms, y: p.y / rms }));
}

/**
 * Cuánto se parecen dos firmas, de 0 a 100. Devuelve `null` si alguna no tiene
 * trazo suficiente para comparar.
 *
 * **Esto no bloquea nada y no decide nada.** Es una señal de seriedad —que el
 * tutor no haya hecho un palito para sacarse el cartel de encima—, no de
 * seguridad: acá nadie está falsificando. Se guarda desde el día uno para poder
 * calibrar más adelante con firmas reales, que es lo único que puede decir a
 * partir de qué número vale la pena avisarle a alguien.
 *
 * Limitación conocida: une los trazos en un solo recorrido, así que una firma
 * hecha de cinco trazos y otra de uno se comparan por su forma total. La
 * cantidad de trazos entra aparte, como penalización suave.
 */
export function compareSignatures(a: StrokeData, b: StrokeData): number | null {
    if (totalPoints(a) < 2 || totalPoints(b) < 2) return null;

    const pa = normalize(resample(a));
    const pb = normalize(resample(b));
    if (pa.length !== RESAMPLE || pb.length !== RESAMPLE) return null;

    let distance = 0;
    for (let i = 0; i < RESAMPLE; i++) {
        distance += Math.hypot(pa[i].x - pb[i].x, pa[i].y - pb[i].y);
    }
    const mean = distance / RESAMPLE;

    // Con las firmas normalizadas, una distancia media de 2 ya es "no se parecen
    // en nada". Por encima de eso el número deja de aportar y se corta en 0.
    const shape = Math.max(0, 1 - mean / 2);

    // Levantar el lápiz una cantidad muy distinta de veces también es señal.
    // Pesa poco: la misma persona no siempre corta igual.
    const strokeRatio =
        Math.min(a.strokes.length, b.strokes.length) /
        Math.max(a.strokes.length, b.strokes.length);
    const penalty = 0.85 + 0.15 * strokeRatio;

    return Math.round(shape * penalty * 100);
}

/**
 * Cortes para traducir el puntaje a palabras.
 *
 * **Son provisionales.** Salieron de un solo caso real —dos firmas
 * visiblemente distintas de la misma persona dieron 48—, no de mirar una
 * distribución. Se mueven acá y en ningún otro lado; `scripts/check-similarity.ts`
 * sirve para revisarlos cuando haya suficientes firmas.
 */
export const SIMILARITY_BANDS = { poco: 40, casi: 70 } as const;

export type SimilarityBand = "SIN_REFERENCIA" | "POCO" | "CASI" | "SIMILAR";

/**
 * En qué banda cae un puntaje. `null` es la primera firma de esa persona: no
 * hay contra qué compararla todavía, y decir "poco similar" ahí sería acusar a
 * alguien de algo que no hizo.
 */
export function similarityBand(score: number | null): SimilarityBand {
    if (score === null) return "SIN_REFERENCIA";
    if (score <= SIMILARITY_BANDS.poco) return "POCO";
    if (score <= SIMILARITY_BANDS.casi) return "CASI";
    return "SIMILAR";
}

/** El trazo como path de SVG, para dibujar la firma guardada. */
export function strokeToPath(data: StrokeData, width: number, height: number): string {
    return data.strokes
        .filter(s => s.length > 0)
        .map(stroke => {
            const [first, ...rest] = stroke;
            const move = `M ${(first.x * width).toFixed(2)} ${(first.y * height).toFixed(2)}`;
            const lines = rest
                .map(p => `L ${(p.x * width).toFixed(2)} ${(p.y * height).toFixed(2)}`)
                .join(" ");
            return `${move} ${lines}`.trim();
        })
        .join(" ");
}
