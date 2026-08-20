"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAuthContext } from "@/lib/authz";
import { reportContentHash } from "@/lib/reports/signatures";

/**
 * Firma de conformidad de un informe (FEAT-09).
 *
 * Es un acuse de lectura: el instituto quiere saber quién vio las notas. No
 * bloquea nada, no invalida nada y no tiene valor probatorio.
 */

/** Tope defensivo: una firma real no pasa de unos cientos de puntos. */
const MAX_POINTS = 10_000;

type StrokeData = { strokes: { x: number; y: number; t: number }[][] };

function isValidStroke(data: unknown): data is StrokeData {
    if (!data || typeof data !== "object") return false;
    const strokes = (data as StrokeData).strokes;
    if (!Array.isArray(strokes) || strokes.length === 0) return false;

    let points = 0;
    for (const stroke of strokes) {
        if (!Array.isArray(stroke)) return false;
        points += stroke.length;
        if (points > MAX_POINTS) return false;
        for (const p of stroke) {
            if (typeof p?.x !== "number" || typeof p?.y !== "number" || typeof p?.t !== "number") {
                return false;
            }
        }
    }

    // Un punto suelto no es una firma.
    return points >= 2;
}

export async function signReportAction(reportId: string, strokeData: unknown) {
    const auth = await getAuthContext();
    if (!auth) return { success: false, error: "No autorizado" };

    if (!isValidStroke(strokeData)) {
        return { success: false, error: "La firma está vacía o no es válida" };
    }

    const report = await prisma.studentReport.findUnique({
        where: { id: reportId },
        select: {
            id: true,
            publishedAt: true,
            teacherComments: true,
            entries: { select: { categoryId: true, value: true } },
            signers: { select: { userId: true, studentId: true } },
            signatures: { select: { userId: true, studentId: true } },
            student: { select: { instituteId: true } }
        }
    });

    if (!report) return { success: false, error: "Informe no encontrado" };

    // Aislamiento de instituto: el id del informe llega del cliente.
    if (report.student.instituteId !== auth.instituteId) {
        return { success: false, error: "Informe no encontrado" };
    }

    if (!report.publishedAt || report.publishedAt > new Date()) {
        return { success: false, error: "El informe todavía no está publicado" };
    }

    const asStudent = auth.isStudent;
    const matches = (row: { userId: string | null; studentId: string | null }) =>
        asStudent ? row.studentId === auth.userId : row.userId === auth.userId;

    // A quién le toca firmar se congeló al publicar. Si no está en esa lista, no
    // le corresponde: puede ser el tutor de un alumno que ya firma solo.
    if (!report.signers.some(matches)) {
        return { success: false, error: "Este informe no requiere tu firma" };
    }

    if (report.signatures.some(matches)) {
        return { success: false, error: "Ya firmaste este informe" };
    }

    const owner = asStudent
        ? { studentId: auth.userId, userId: null }
        : { userId: auth.userId, studentId: null };

    const contentHash = reportContentHash({
        teacherComments: report.teacherComments,
        entries: report.entries
    });

    await prisma.$transaction(async (tx) => {
        await tx.signature.create({
            data: {
                ...owner,
                reportId: report.id,
                instituteId: report.student.instituteId,
                contentHash,
                strokeData: strokeData as object
                // similarityScore queda en null: los trazos se guardan desde el
                // día uno y la comparación va en una segunda pasada, cuando haya
                // firmas reales con las que calibrar el umbral.
            }
        });

        // No hay enrolamiento aparte: la primera firma es la que queda de
        // referencia. Si ya existe, no se toca — se cambia desde el perfil.
        const existing = await tx.signatureReference.findFirst({
            where: asStudent ? { studentId: auth.userId } : { userId: auth.userId },
            select: { id: true }
        });

        if (!existing) {
            await tx.signatureReference.create({
                data: {
                    ...owner,
                    instituteId: report.student.instituteId,
                    strokeData: strokeData as object
                }
            });
        }
    });

    revalidatePath("/guardian/academics");
    revalidatePath("/dashboard");

    return { success: true };
}

/**
 * La firma de referencia de quien está mirando, para mostrársela al lado
 * mientras firma. Es lo que evita el círculo en un informe y el cuadrado en el
 * otro, y hace bastante más que cualquier algoritmo de parecido.
 */
export async function getMySignatureReference() {
    const auth = await getAuthContext();
    if (!auth) return null;

    const reference = await prisma.signatureReference.findFirst({
        where: auth.isStudent ? { studentId: auth.userId } : { userId: auth.userId },
        select: { strokeData: true, createdAt: true }
    });

    return reference;
}
