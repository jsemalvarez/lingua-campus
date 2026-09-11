"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";
import {
    reportContentHash,
    resolveSigners,
    templateRequiresSignature
} from "@/lib/reports/signatures";
import { isValidStroke } from "@/lib/reports/signatureCompare";
import type { BatchSignerRole, SignedHashes } from "@/lib/reports/batchSignatures";

/**
 * Firmar una tanda de informes (FEAT-21).
 *
 * Se firma **una vez por tanda** —curso + plantilla + año + período— y la firma
 * sale en el boletín de todos sus alumnos. Lo que queda congelado es la foto de
 * lo firmado alumno por alumno: si después se corrige una nota, la firma de la
 * dirección deja de cubrir a ese alumno y sigue cubriendo a los demás.
 *
 * No traba la publicación. Fue decisión del cliente para esta etapa: se está
 * estrenando el mecanismo y una traba sin salida paraliza al instituto entero.
 */

export type SignBatchInput = {
    courseId: string;
    templateId: string;
    year: number;
    periodIndex: number;
    signerRole: BatchSignerRole;
};

export async function signReportBatchAction(input: SignBatchInput, strokeData?: unknown) {
    const auth = await requireRole(INSTITUTE_STAFF);
    if (!auth) return { success: false, error: "No autorizado" };

    const { courseId, templateId, year, periodIndex, signerRole } = input;

    if (signerRole !== "ADMIN" && signerRole !== "TEACHER") {
        return { success: false, error: "Rol de firma inválido" };
    }

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, name: true, instituteId: true, teacherId: true }
    });

    if (!course || course.instituteId !== auth.instituteId) {
        return { success: false, error: "Curso no encontrado" };
    }

    // La dirección firma por cargo: alcanza con estar operando como ADMIN. El
    // docente firma su propio curso. **La secretaría no firma**: mira y
    // persigue, la misma línea que SEC-03 trazó para la caja.
    const puedeFirmar =
        signerRole === "ADMIN" ? auth.activeRole === "ADMIN" : auth.userId === course.teacherId;

    if (!puedeFirmar) {
        return { success: false, error: "No te corresponde firmar este informe" };
    }

    const template = await prisma.reportTemplate.findFirst({
        where: { id: templateId, instituteId: auth.instituteId },
        select: { id: true, specialFields: true }
    });

    if (!template) return { success: false, error: "Plantilla no encontrada" };

    const reports = await prisma.studentReport.findMany({
        where: { courseId, templateId, year, periodIndex },
        select: {
            id: true,
            studentId: true,
            contentHash: true,
            teacherComments: true,
            publishedAt: true,
            entries: { select: { categoryId: true, value: true } },
            signers: { select: { id: true } },
            student: {
                select: {
                    birthDate: true,
                    guardianLinks: { select: { guardianId: true } }
                }
            }
        }
    });

    if (reports.length === 0) {
        return {
            success: false,
            error: "Todavía no hay notas cargadas en este informe"
        };
    }

    // La foto de lo que se está firmando. Se calcula del contenido vivo y no se
    // lee de `contentHash`, porque una tanda sin publicar puede no tenerlo
    // todavía — y firmar antes de publicar es justamente el orden natural.
    const hashes: SignedHashes = {};
    const faltanHash: { id: string; hash: string }[] = [];

    for (const report of reports) {
        const hash = reportContentHash({
            teacherComments: report.teacherComments,
            entries: report.entries
        });
        hashes[report.studentId] = hash;
        if (report.contentHash !== hash) {
            faltanHash.push({ id: report.id, hash });
        }
    }

    // Un informe publicado sin firmantes resueltos es uno de antes de que la
    // firma existiera. Escribirle el hash —que es lo que hay que hacer -3
    // líneas más arriba— lo mete en la pantalla de firmas de las familias, y
    // sin firmantes entraría mostrando a **todos** los alumnos como "sin
    // firmante". Así que se resuelven acá, igual que hace
    // `scripts/backfill-report-signers.js`.
    //
    // Con la **fecha original de publicación**, no la de hoy: un alumno que
    // cumplió 20 desde marzo resolvería que firma él, cuando en marzo le tocaba
    // al tutor.
    //
    // El script sigue haciendo falta para habilitar todo de una; esto saca la
    // dependencia del orden, que era la trampa: firmar antes de correrlo
    // ensuciaba la pantalla.
    const pideFirmaFamilia = templateRequiresSignature(template.specialFields);
    const nuevosFirmantes = pideFirmaFamilia
        ? reports
              .filter(r => r.publishedAt && r.signers.length === 0)
              .flatMap(r =>
                  resolveSigners({
                      studentId: r.studentId,
                      birthDate: r.student.birthDate,
                      guardianIds: r.student.guardianLinks.map(l => l.guardianId),
                      publishedAt: r.publishedAt!
                  }).map(signer => ({ reportId: r.id, ...signer }))
              )
        : [];

    // El trazo sale de la firma de referencia de la persona: se registra una vez
    // desde el perfil y firmar pasa a ser un click. Con treinta cursos, esa
    // diferencia es lo que hace la tarea posible.
    const reference = await prisma.signatureReference.findFirst({
        where: { userId: auth.userId },
        select: { id: true, strokeData: true }
    });

    let trazo = reference?.strokeData ?? null;

    if (!trazo) {
        if (!isValidStroke(strokeData)) {
            // `needsStroke` le dice a la pantalla que abra el recuadro para
            // dibujar, en vez de que tenga que adivinarlo del texto del error.
            return {
                success: false,
                needsStroke: true,
                error: "Todavía no registraste tu firma. Dibujala para firmar por primera vez."
            };
        }
        trazo = strokeData as object;
    }

    const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { name: true }
    });

    const where = {
        courseId_templateId_year_periodIndex_signerRole: {
            courseId,
            templateId,
            year,
            periodIndex,
            signerRole
        }
    };

    await prisma.$transaction(async tx => {
        // El hash del informe tiene que seguir al contenido para que la caída de
        // la firma se pueda detectar después. En una tanda ya publicada por una
        // versión vieja puede faltar; acá se completa con lo que hay.
        for (const row of faltanHash) {
            await tx.studentReport.update({
                where: { id: row.id },
                data: { contentHash: row.hash }
            });
        }

        if (nuevosFirmantes.length > 0) {
            await tx.reportSigner.createMany({
                data: nuevosFirmantes,
                skipDuplicates: true
            });
        }

        const data = {
            instituteId: auth.instituteId,
            courseId,
            templateId,
            year,
            periodIndex,
            signerRole,
            userId: auth.userId,
            signerName: user?.name ?? "—",
            signedAt: new Date(),
            contentHashes: hashes as object,
            strokeData: trazo as object
        };

        await tx.reportBatchSignature.upsert({ where, create: data, update: data });

        // La primera firma es la que queda de referencia, igual que para las
        // familias. Si ya existe no se toca: se cambia desde el perfil.
        if (!reference) {
            await tx.signatureReference.create({
                data: {
                    userId: auth.userId,
                    instituteId: auth.instituteId,
                    strokeData: trazo as object
                }
            });
        }
    });

    revalidatePath("/reports/signatures");
    revalidatePath(`/courses/${courseId}/reports/${templateId}`);

    return { success: true };
}

/** Sacar la propia firma de una tanda, por si se firmó la que no era. */
export async function unsignReportBatchAction(input: SignBatchInput) {
    const auth = await requireRole(INSTITUTE_STAFF);
    if (!auth) return { success: false, error: "No autorizado" };

    const { courseId, templateId, year, periodIndex, signerRole } = input;

    const existing = await prisma.reportBatchSignature.findUnique({
        where: {
            courseId_templateId_year_periodIndex_signerRole: {
                courseId,
                templateId,
                year,
                periodIndex,
                signerRole
            }
        },
        select: { id: true, userId: true, instituteId: true }
    });

    if (!existing || existing.instituteId !== auth.instituteId) {
        return { success: false, error: "Esa firma no existe" };
    }

    // Cada uno saca la suya. Que un admin pueda borrar la firma de un docente
    // convertiría la firma en algo que otro puede poner y sacar.
    if (existing.userId !== auth.userId) {
        return { success: false, error: "Sólo podés sacar tu propia firma" };
    }

    await prisma.reportBatchSignature.delete({ where: { id: existing.id } });

    revalidatePath("/reports/signatures");
    revalidatePath(`/courses/${courseId}/reports/${templateId}`);

    return { success: true };
}
