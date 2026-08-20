import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { INSTITUTE_ADMINS, requireRole } from "@/lib/authz";
import { templateRequiresSignature } from "@/lib/reports/signatures";
import { SignatureOverview, type Batch, type ReportRow } from "./SignatureOverview";

/**
 * Seguimiento de firmas de conformidad (FEAT-09).
 *
 * Lo que el instituto realmente necesita no es la firma, es la lista de quién
 * falta. Esta pantalla es el entregable de la ficha; la firma es el mecanismo.
 */
export default async function SignaturesPage() {
    const auth = await requireRole(INSTITUTE_ADMINS);
    if (!auth) redirect("/dashboard");

    const reports = await prisma.studentReport.findMany({
        where: {
            course: { instituteId: auth.instituteId },
            publishedAt: { not: null },
            // Sin hash es un informe publicado por una versión que no sabía de
            // firmas —todo el primer trimestre, por ejemplo—. No es que nadie lo
            // haya firmado: es que nunca se le pidió a nadie.
            contentHash: { not: null }
        },
        select: {
            id: true,
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
            signatures: { select: { signedAt: true, contentHash: true } }
        },
        orderBy: [{ year: "desc" }, { periodIndex: "desc" }]
    });

    const groups = new Map<string, Batch>();

    for (const report of reports) {
        // Una plantilla puede no pedir firma, y entonces sus informes no entran
        // acá: no están pendientes, simplemente no se firman.
        if (!templateRequiresSignature(report.template.specialFields)) continue;

        const key = `${report.course.id}|${report.template.id}|${report.year}|${report.periodIndex}`;

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                courseId: report.course.id,
                courseName: report.course.name,
                courseLevel: report.course.level,
                periodLabel:
                    report.template.periodLabels[report.periodIndex] ??
                    `Período ${report.periodIndex + 1}`,
                templateName: report.template.name,
                year: report.year,
                publishedAt: report.publishedAt?.toISOString() ?? null,
                rows: []
            });
        }

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
            // El informe se editó después de que alguien lo firmó: el contenido
            // actual ya no es el que esa persona vio.
            editedAfterSignature: report.signatures.some(
                s => s.contentHash !== report.contentHash
            ),
            missingBirthDate: !report.student.birthDate,
            deliveredOther: Boolean(report.deliveredOtherAt),
            lastEditedAt: report.lastEditedAt?.toISOString() ?? null
        };

        groups.get(key)!.rows.push(row);
    }

    const batches = [...groups.values()].map(b => ({
        ...b,
        rows: b.rows.sort((a, z) => a.studentName.localeCompare(z.studentName))
    }));

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={auth.activeRole} />
            <SignatureOverview batches={batches} />
        </div>
    );
}
