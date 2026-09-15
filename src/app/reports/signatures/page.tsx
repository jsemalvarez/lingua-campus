import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { INSTITUTE_ADMINS, requireRole } from "@/lib/authz";
import { templateRequiresSignature } from "@/lib/reports/signatures";
import type { StrokeData } from "@/lib/reports/signatureCompare";
import {
    asSignedHashes,
    batchKeyOf,
    fallenStudentIds,
    type BatchSignerRole
} from "@/lib/reports/batchSignatures";
import { SignatureOverview, type Batch, type ReportRow, type StaffSignature } from "./SignatureOverview";

/**
 * Seguimiento de firmas (FEAT-09 y FEAT-21).
 *
 * Dos cosas distintas en la misma pantalla, porque la pregunta operativa es la
 * misma —"¿qué me falta?"—: qué familias confirmaron que leyeron las notas, y
 * qué tandas faltan firmar del lado del instituto.
 */
export default async function SignaturesPage() {
    const auth = await requireRole(INSTITUTE_ADMINS);
    if (!auth) redirect("/dashboard");

    // Las firmas del instituto se leen primero: son las que hacen entrar a la
    // lista una tanda **todavía sin publicar**, que es donde la dirección firma
    // cuando el circuito va en orden.
    const staffSignatures = await prisma.reportBatchSignature.findMany({
        where: { instituteId: auth.instituteId },
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

    const signedBatchKeys = staffSignatures.map(s => ({
        courseId: s.courseId,
        templateId: s.templateId,
        year: s.year,
        periodIndex: s.periodIndex
    }));

    const reports = await prisma.studentReport.findMany({
        where: {
            course: { instituteId: auth.instituteId },
            OR: [
                {
                    publishedAt: { not: null },
                    // Sin hash es un informe publicado por una versión que no
                    // sabía de firmas —todo el primer trimestre, por ejemplo—.
                    // No es que nadie lo haya firmado: es que nunca se le pidió
                    // a nadie.
                    contentHash: { not: null }
                },
                ...(signedBatchKeys.length > 0 ? [{ OR: signedBatchKeys }] : [])
            ]
        },
        select: {
            id: true,
            studentId: true,
            courseId: true,
            templateId: true,
            year: true,
            periodIndex: true,
            publishedAt: true,
            contentHash: true,
            lastEditedAt: true,
            deliveredOtherAt: true,
            student: { select: { id: true, name: true, birthDate: true } },
            course: { select: { id: true, name: true, level: true } },
            template: { select: { id: true, name: true, periodLabels: true, specialFields: true } },
            signers: { select: { userId: true, studentId: true } },
            signatures: {
                select: {
                    signedAt: true,
                    contentHash: true,
                    strokeData: true,
                    similarityScore: true
                }
            }
        },
        orderBy: [{ year: "desc" }, { periodIndex: "desc" }]
    });

    const firmadasPorTanda = new Map<string, typeof staffSignatures>();
    for (const sig of staffSignatures) {
        const key = batchKeyOf(sig);
        const list = firmadasPorTanda.get(key) ?? [];
        list.push(sig);
        firmadasPorTanda.set(key, list);
    }

    type Acc = Batch & { currentHashes: { studentId: string; contentHash: string | null }[] };
    const groups = new Map<string, Acc>();

    for (const report of reports) {
        const key = batchKeyOf(report);
        const tieneFirmaDelInstituto = firmadasPorTanda.has(key);

        // Una plantilla puede no pedir firma de la familia. Sus informes no
        // entran por ese lado, pero sí si el instituto los firmó: son dos cosas
        // distintas sobre el mismo boletín.
        const pideFirmaFamilia = templateRequiresSignature(report.template.specialFields);
        if (!pideFirmaFamilia && !tieneFirmaDelInstituto) continue;

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                courseId: report.course.id,
                courseName: report.course.name,
                courseLevel: report.course.level,
                templateId: report.template.id,
                periodIndex: report.periodIndex,
                periodLabel:
                    report.template.periodLabels[report.periodIndex] ??
                    `Período ${report.periodIndex + 1}`,
                templateName: report.template.name,
                year: report.year,
                published: Boolean(report.publishedAt),
                publishedAt: report.publishedAt?.toISOString() ?? null,
                staffSignatures: [],
                rows: [],
                currentHashes: []
            });
        }

        const group = groups.get(key)!;
        group.currentHashes.push({ studentId: report.studentId, contentHash: report.contentHash });

        // Las filas de la familia son sólo de lo publicado y con hash. Un
        // borrador no tiene firmantes resueltos, y contarlo como "sin firmante"
        // ensuciaría el número que el instituto usa para perseguir.
        if (!pideFirmaFamilia || !report.publishedAt || !report.contentHash) continue;

        const signed = report.signatures.length > 0;
        const row: ReportRow = {
            reportId: report.id,
            studentName: report.student.name,
            // Cero firmantes es "sin firmante": no hay tutor cargado, o su cuenta
            // no existe. No se persigue, se resuelve cargando al tutor.
            state: signed
                ? "FIRMADO"
                : report.signers.length === 0
                  ? "SIN_FIRMANTE"
                  : "PENDIENTE",
            signedAt: report.signatures[0]?.signedAt?.toISOString() ?? null,
            // El trazo guardado, para que el instituto vea la firma y no un
            // número: en un problema de criterio humano, mirarla dice más que
            // cualquier puntaje.
            signatureStroke: (report.signatures[0]?.strokeData as StrokeData) ?? null,
            similarityScore: report.signatures[0]?.similarityScore ?? null,
            // El informe se editó después de que alguien lo firmó: el contenido
            // actual ya no es el que esa persona vio.
            editedAfterSignature: report.signatures.some(
                s => s.contentHash !== report.contentHash
            ),
            missingBirthDate: !report.student.birthDate,
            deliveredOther: Boolean(report.deliveredOtherAt),
            lastEditedAt: report.lastEditedAt?.toISOString() ?? null
        };

        group.rows.push(row);
    }

    const batches: Batch[] = [...groups.values()].map(({ currentHashes, ...b }) => {
        const staff: StaffSignature[] = (firmadasPorTanda.get(b.key) ?? []).map(sig => ({
            role: sig.signerRole as BatchSignerRole,
            signerName: sig.signerName,
            signedAt: sig.signedAt.toISOString(),
            strokeData: (sig.strokeData as StrokeData) ?? null,
            fallenCount: fallenStudentIds(asSignedHashes(sig.contentHashes), currentHashes).length
        }));

        return {
            ...b,
            staffSignatures: staff,
            rows: b.rows.sort((a, z) => a.studentName.localeCompare(z.studentName))
        };
    });

    /**
     * El orden lo da el circuito real: el docente avisa que terminó firmando, y
     * lo que la dirección está esperando es justamente eso. Arriba van las
     * tandas listas para que firme; después las que ella ya firmó pero se le
     * cayeron; al final, las que todavía está preparando el docente.
     */
    const prioridad = (b: Batch) => {
        const docente = b.staffSignatures.find(s => s.role === "TEACHER");
        const direccion = b.staffSignatures.find(s => s.role === "ADMIN");

        if (direccion && direccion.fallenCount > 0) return 0;
        if (docente && !direccion) return 1;
        if (!docente && !direccion) return 2;
        return 3;
    };

    batches.sort(
        (a, z) =>
            prioridad(a) - prioridad(z) ||
            z.year - a.year ||
            z.periodIndex - a.periodIndex ||
            a.courseName.localeCompare(z.courseName)
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={auth.activeRole} />
            <SignatureOverview batches={batches} />
        </div>
    );
}
