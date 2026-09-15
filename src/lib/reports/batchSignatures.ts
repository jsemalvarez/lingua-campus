/**
 * Reglas de la firma del instituto en el boletín (FEAT-21).
 *
 * Son dos firmas con significados distintos, y la diferencia es la que explica
 * todo lo que sigue:
 *
 * - **La dirección revisa.** Su firma dice "leí estas notas y estos
 *   comentarios". Es una revisión del trabajo de otro, así que si el contenido
 *   cambia, deja de cubrirlo.
 * - **El docente firma autoría.** Las notas son suyas. Si corrige una nota que
 *   él mismo puso, sigue siendo el autor: no hay nada que volver a declarar y
 *   su firma no se cae.
 *
 * Vive aparte de `signatures.ts` porque aquel usa `crypto` de Node y no puede
 * entrar en un componente de cliente; esto sí, porque la planilla y el boletín
 * necesitan las mismas reglas.
 */

import type { StrokeData } from "./signatureCompare";

/** Quién firma. Texto y no enum, igual que en la base. */
export type BatchSignerRole = "ADMIN" | "TEACHER";

/** Las cuatro claves que definen una tanda de informes. */
export type BatchKey = {
    courseId: string;
    templateId: string;
    year: number;
    periodIndex: number;
};

/**
 * Cuándo salió esta funcionalidad.
 *
 * Un boletín publicado antes **no pudo firmarse**, así que sigue imprimiendo la
 * raya y el nombre como lo venía haciendo. Sin este corte, aplicarle la regla
 * nueva —sin firma no hay línea— haría que una familia que vuelve a bajar el
 * boletín de marzo lo viera perder las dos líneas que hoy tiene, que es
 * exactamente lo contrario de lo que esta ficha viene a hacer.
 */
export const BATCH_SIGNATURES_SINCE = new Date("2026-09-10T00:00:00.000Z");

/** Si a esa tanda le corresponde el comportamiento viejo: raya y nombre impreso. */
export function isLegacyBatch(publishedAt: Date | string | null | undefined): boolean {
    if (!publishedAt) return false;
    return new Date(publishedAt) < BATCH_SIGNATURES_SINCE;
}

export function batchKeyOf(key: BatchKey): string {
    return `${key.courseId}|${key.templateId}|${key.year}|${key.periodIndex}`;
}

/** El mapa `{ studentId: contentHash }` que quedó congelado al firmar. */
export type SignedHashes = Record<string, string>;

export function asSignedHashes(value: unknown): SignedHashes {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const out: SignedHashes = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === "string") out[k] = v;
    }
    return out;
}

/**
 * Si la firma sigue cubriendo el boletín de ese alumno.
 *
 * Compara contra la foto que se tomó al firmar. Un alumno que no está en la
 * foto —se inscribió después— **no está cubierto**: la persona que firmó nunca
 * vio sus notas, y no hay diferencia entre eso y una nota modificada.
 */
export function coversStudent(
    hashes: SignedHashes,
    studentId: string,
    currentHash: string | null | undefined
): boolean {
    const signed = hashes[studentId];
    if (!signed || !currentHash) return false;
    return signed === currentHash;
}

/** Los alumnos de la foto que ya no coinciden con el contenido actual. */
export function fallenStudentIds(
    hashes: SignedHashes,
    current: { studentId: string; contentHash: string | null }[]
): string[] {
    const byId = new Map(current.map(r => [r.studentId, r.contentHash]));
    return Object.keys(hashes).filter(id => hashes[id] !== byId.get(id));
}

/** Lo que el boletín y la planilla necesitan saber de una firma. */
export type BatchSignatureView = {
    signerRole: BatchSignerRole;
    signerName: string;
    signedAt: string;
    strokeData: StrokeData | null;
    /** Cuántos alumnos de la tanda dejaron de estar cubiertos. */
    fallenCount: number;
};
