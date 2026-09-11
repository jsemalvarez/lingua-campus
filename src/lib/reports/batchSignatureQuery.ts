import prisma from "@/lib/prisma";
import type { StrokeData } from "./signatureCompare";
import {
    asSignedHashes,
    batchKeyOf,
    coversStudent,
    type BatchKey,
    type BatchSignerRole
} from "./batchSignatures";

/**
 * Las firmas del instituto que le corresponden a un boletín (FEAT-21).
 *
 * No hay relación de Prisma hacia `ReportBatchSignature`: la tanda se
 * identifica por cuatro columnas y `StudentReport` no tiene una clave única que
 * las agrupe, así que el cruce se hace acá, a mano y en una sola consulta.
 */

export type ReportSignatureLine = {
    role: BatchSignerRole;
    signerName: string;
    signedAt: string;
    strokeData: StrokeData | null;
};

type ReportRef = BatchKey & { studentId: string; contentHash: string | null };

/**
 * Devuelve, por informe, las firmas que **siguen valiendo para ese alumno**.
 *
 * La que se cayó no viaja: para el boletín es como si no estuviera, y así el
 * componente no tiene que volver a decidir nada.
 */
export async function signatureLinesByReport<T extends ReportRef & { id: string }>(
    reports: T[]
): Promise<Map<string, ReportSignatureLine[]>> {
    const result = new Map<string, ReportSignatureLine[]>();
    if (reports.length === 0) return result;

    const keys = new Map<string, BatchKey>();
    for (const r of reports) {
        keys.set(batchKeyOf(r), {
            courseId: r.courseId,
            templateId: r.templateId,
            year: r.year,
            periodIndex: r.periodIndex
        });
    }

    const signatures = await prisma.reportBatchSignature.findMany({
        where: { OR: [...keys.values()] },
        select: {
            courseId: true,
            templateId: true,
            year: true,
            periodIndex: true,
            signerRole: true,
            signerName: true,
            signedAt: true,
            strokeData: true,
            contentHashes: true
        }
    });

    const byBatch = new Map<string, typeof signatures>();
    for (const sig of signatures) {
        const key = batchKeyOf(sig);
        const list = byBatch.get(key) ?? [];
        list.push(sig);
        byBatch.set(key, list);
    }

    for (const report of reports) {
        const lines: ReportSignatureLine[] = [];

        for (const sig of byBatch.get(batchKeyOf(report)) ?? []) {
            const hashes = asSignedHashes(sig.contentHashes);
            if (!coversStudent(hashes, report.studentId, report.contentHash)) continue;

            lines.push({
                role: sig.signerRole as BatchSignerRole,
                signerName: sig.signerName,
                signedAt: sig.signedAt.toISOString(),
                strokeData: (sig.strokeData as StrokeData | null) ?? null
            });
        }

        result.set(report.id, lines);
    }

    return result;
}

/**
 * Pega las firmas sobre los informes que van al visor. Devuelve objetos nuevos:
 * las filas de Prisma se serializan hacia el cliente y conviene no mutarlas.
 */
export async function withSignatureLines<T extends ReportRef & { id: string }>(
    reports: T[]
): Promise<(T & { signatureLines: ReportSignatureLine[] })[]> {
    const lines = await signatureLinesByReport(reports);
    return reports.map(r => ({ ...r, signatureLines: lines.get(r.id) ?? [] }));
}
