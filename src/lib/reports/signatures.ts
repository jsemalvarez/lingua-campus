import crypto from "crypto";

/**
 * Reglas de la firma de conformidad de informes (FEAT-09).
 *
 * Es un acuse de lectura, no una firma digital de la Ley 25.506: sirve para que
 * el instituto sepa quién vio las notas.
 */

/** Edad desde la cual el alumno firma su propio informe y no se le pide al tutor. */
export const SELF_SIGNING_AGE = 20;

/**
 * Hash del contenido que la familia efectivamente ve: las notas y el comentario
 * del docente. Se guarda en el informe y en cada firma; si dejan de coincidir,
 * el informe se editó después de que esa persona lo firmó.
 */
export function reportContentHash(input: {
    teacherComments: string | null;
    entries: { categoryId: string; value: string | null }[];
}): string {
    // Ordenado por categoría para que el hash no dependa del orden en que vinieron.
    const entries = [...input.entries]
        .sort((a, b) => a.categoryId.localeCompare(b.categoryId))
        .map((e) => `${e.categoryId}=${e.value ?? ""}`)
        .join("|");

    return crypto
        .createHash("sha256")
        .update(`${entries}::${input.teacherComments ?? ""}`)
        .digest("hex");
}

/**
 * Si la plantilla pide firma del tutor. Reusa `specialFields.parentSignature`,
 * que el instituto ya configura por plantilla desde el manager de plantillas,
 * en vez de agregar una bandera nueva. Ante la duda, pide firma.
 */
export function templateRequiresSignature(specialFields: unknown): boolean {
    if (!specialFields || typeof specialFields !== "object") return true;
    const parent = (specialFields as Record<string, unknown>).parentSignature;
    return parent !== false;
}

/** Edad cumplida a una fecha dada. */
export function ageAt(birthDate: Date, at: Date): number {
    let age = at.getFullYear() - birthDate.getFullYear();
    const monthDiff = at.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * Si el alumno firma su propio informe. **Sin fecha de nacimiento se lo trata
 * como menor** y firma el tutor: es la decisión prudente, y la fecha faltante se
 * muestra en la pantalla del instituto para que alguien la cargue.
 */
export function signsForThemselves(birthDate: Date | null, at: Date): boolean {
    if (!birthDate) return false;
    return ageAt(birthDate, at) >= SELF_SIGNING_AGE;
}

export type ResolvedSigner = { userId: string | null; studentId: string | null };

/**
 * A quiénes les toca firmar un informe.
 *
 * Se resuelve UNA vez, al publicar, y se congela: no se recalcula nunca. Si se
 * recalculara, un alumno que cumple 20 en agosto le cambiaría el firmante al
 * informe de marzo que su madre ya firmó.
 *
 * Devolver una lista vacía es un resultado válido y significativo: es el alumno
 * **sin firmante**, que no se persigue —no hay a quién— y que se cuenta aparte
 * del porcentaje en vez de hundirlo.
 */
export function resolveSigners(input: {
    studentId: string;
    birthDate: Date | null;
    guardianIds: string[];
    publishedAt: Date;
}): ResolvedSigner[] {
    if (signsForThemselves(input.birthDate, input.publishedAt)) {
        return [{ userId: null, studentId: input.studentId }];
    }

    // Alcanza con que firme un tutor, pero se listan todos: cualquiera sirve.
    return input.guardianIds.map((userId) => ({ userId, studentId: null }));
}
