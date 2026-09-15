import prisma from "@/lib/prisma";
import { createNotificationForUsers } from "@/app/actions/notifications";
import { asSignedHashes, fallenStudentIds } from "./batchSignatures";

/**
 * Los avisos que dispara editar notas de una tanda ya firmada (FEAT-21).
 *
 * Existen porque la firma **no traba la publicación**: la dirección va a firmar
 * tandas todavía sin publicar, y ahí el docente las puede seguir editando sin
 * ninguna restricción —el candado de "publicado sólo lo toca un ADMIN" cubre la
 * otra mitad—. Si el sistema no lo detecta solo, nadie se entera.
 */

export type ReportSnapshot = { studentId: string; contentHash: string | null };

const LINK = (p: { courseId: string; templateId: string; year: number; periodIndex: number }) =>
    `/courses/${p.courseId}/reports/${p.templateId}?year=${p.year}&period=${p.periodIndex}`;

export async function notifyAfterGradeEdit(params: {
    instituteId: string;
    courseId: string;
    courseName: string;
    templateId: string;
    year: number;
    periodIndex: number;
    editorUserId: string;
    editorIsAdmin: boolean;
    before: ReportSnapshot[];
    after: ReportSnapshot[];
}) {
    const signatures = await prisma.reportBatchSignature.findMany({
        where: {
            courseId: params.courseId,
            templateId: params.templateId,
            year: params.year,
            periodIndex: params.periodIndex
        },
        select: { signerRole: true, userId: true, contentHashes: true }
    });

    if (signatures.length === 0) return;

    const template = await prisma.reportTemplate.findUnique({
        where: { id: params.templateId },
        select: { periodLabels: true }
    });

    const periodLabel = template?.periodLabels[params.periodIndex] ?? `Período ${params.periodIndex + 1}`;
    const donde = `${periodLabel} — ${params.courseName}`;
    const link = LINK(params);

    for (const sig of signatures) {
        // Sin `userId` la cuenta que firmó ya no existe: no hay a quién avisarle.
        if (!sig.userId) continue;
        // El que edita ya sabe lo que hizo. A ella, además, corregir una nota le
        // invalida su propia firma y lo ve en el acto.
        if (sig.userId === params.editorUserId) continue;

        const hashes = asSignedHashes(sig.contentHashes);

        if (sig.signerRole === "ADMIN") {
            // Sólo en la transición de firmada a caída. Si ya estaba caída, el
            // aviso ya salió: cinco correcciones seguidas mandan uno, no cinco.
            const antes = fallenStudentIds(hashes, params.before).length;
            const ahora = fallenStudentIds(hashes, params.after).length;
            if (antes > 0 || ahora === 0) continue;

            await createNotificationForUsers({
                instituteId: params.instituteId,
                userIds: [sig.userId],
                type: "REPORT_SIGNATURE_DROPPED",
                title: "Se modificaron notas de un informe que firmaste",
                body: `${donde}: tu firma dejó de valer para ${ahora === 1 ? "1 alumno" : `${ahora} alumnos`}. Revisá y volvé a firmar.`,
                link
            });
            continue;
        }

        // La firma del docente es autoría y no se cae. Pero si la nota la cambió
        // la dirección, él no fue: en general va a ser la confirmación de que su
        // pedido se hizo, y el caso que justifica el aviso es el otro —que le
        // suban una nota sin consultarlo—.
        if (sig.signerRole === "TEACHER" && params.editorIsAdmin) {
            const yaAvisado = await prisma.notification.findFirst({
                where: {
                    userId: sig.userId,
                    type: "REPORT_EDITED_BY_ADMIN",
                    link,
                    read: false
                },
                select: { id: true }
            });

            if (yaAvisado) continue;

            await createNotificationForUsers({
                instituteId: params.instituteId,
                userIds: [sig.userId],
                type: "REPORT_EDITED_BY_ADMIN",
                title: "La dirección modificó notas de un informe que firmaste",
                body: `${donde}. Tu firma sigue puesta; si el cambio no lo pediste vos, habría que hablarlo.`,
                link
            });
        }
    }
}
