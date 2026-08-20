import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";
import {
    reportContentHash,
    resolveSigners,
    templateRequiresSignature
} from "@/lib/reports/signatures";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; templateId: string }> }
) {
    try {
        const { id: courseId, templateId } = await params;
        const user = await requireRole(INSTITUTE_STAFF);
        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, instituteId: true, teacherId: true }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Both ADMIN/SECRETARY AND the teacher of the course can publish reports (user request)
        const isAdminOrSecretary = user.activeRole === "ADMIN" || user.activeRole === "SECRETARY";
        const isAuthorized = isAdminOrSecretary || user.userId === course.teacherId;

        if (!isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { year, periodIndex, publishedAt } = body;

        if (year === undefined || periodIndex === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const template = await prisma.reportTemplate.findFirst({
            where: { id: templateId, instituteId: user.instituteId },
            select: { specialFields: true }
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Get all active student enrollments for this course
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId, status: "ACTIVE" },
            select: { studentId: true }
        });

        const studentIds = enrollments.map(e => e.studentId);
        const pubDate = publishedAt ? new Date(publishedAt) : null;

        // Despublicar un informe que ya tiene firmas lo saca de la vista de las
        // familias que lo confirmaron, así que queda para el ADMIN (FEAT-09).
        // Las firmas no se borran: si vuelve a publicarse sin cambios, el hash
        // sigue coincidiendo y valen igual.
        if (!pubDate && user.activeRole !== "ADMIN") {
            const firmados = await prisma.signature.count({
                where: {
                    report: { courseId, templateId, year, periodIndex }
                }
            });

            if (firmados > 0) {
                return NextResponse.json(
                    {
                        error:
                            "Este informe ya tiene firmas. Sólo un administrador puede despublicarlo."
                    },
                    { status: 403 }
                );
            }
        }

        // Needed to resolve who has to sign each report (FEAT-09)
        const students = await prisma.student.findMany({
            where: { id: { in: studentIds } },
            select: {
                id: true,
                birthDate: true,
                guardianLinks: { select: { guardianId: true } }
            }
        });
        const studentsById = new Map(students.map(s => [s.id, s]));
        const needsSignature = templateRequiresSignature(template.specialFields);

        // Perform upserts to guarantee report existence and update publishedAt
        const updated = await prisma.$transaction(async (tx) => {
            const reports = [];
            for (const studentId of studentIds) {
                const rep = await tx.studentReport.upsert({
                    where: {
                        studentId_courseId_year_periodIndex_templateId: {
                            studentId,
                            courseId,
                            year,
                            periodIndex,
                            templateId
                        }
                    },
                    update: {
                        publishedAt: pubDate
                    },
                    create: {
                        studentId,
                        courseId,
                        year,
                        periodIndex,
                        templateId,
                        publishedAt: pubDate
                    }
                });
                reports.push(rep);
            }

            // Freeze who has to sign, and snapshot what they are signing.
            // Only on publish, and only for reports that were not frozen before:
            // re-publishing must not re-resolve signers, or a student turning 20
            // in August would change the signer of the report signed in March.
            //
            // A report with zero signer rows is BOTH "sin firmante" and "not
            // frozen yet", and that is deliberate: with no signers there are no
            // signatures to protect, so re-resolving is safe. It also self-heals
            // the common case — the student had no guardian loaded at publish
            // time, someone loads one, and re-publishing makes the report
            // signable. Do not "fix" this with an explicit frozen flag without
            // replacing that recovery path.
            // The hash is written on every publish, even when the template does
            // not ask for a signature: it describes content, not policy. That
            // makes `contentHash != null` mean "published by a version that knows
            // about signatures", which is how the institute screen tells apart a
            // report with nobody to sign it from one published before all this
            // existed — the whole first term, for instance.
            if (pubDate) {
                const reportIds = reports.map(r => r.id);

                const alreadyFrozen = new Set(
                    (await tx.reportSigner.findMany({
                        where: { reportId: { in: reportIds } },
                        select: { reportId: true },
                        distinct: ["reportId"]
                    })).map(s => s.reportId)
                );

                const entries = await tx.reportEntry.findMany({
                    where: { reportId: { in: reportIds } },
                    select: { reportId: true, categoryId: true, value: true }
                });
                const entriesByReport = new Map<string, typeof entries>();
                for (const entry of entries) {
                    const list = entriesByReport.get(entry.reportId) ?? [];
                    list.push(entry);
                    entriesByReport.set(entry.reportId, list);
                }

                const signerRows = [];
                for (const rep of reports) {
                    // The hash always tracks the current content, so an edit after
                    // publishing shows up as a mismatch against the signed hash.
                    await tx.studentReport.update({
                        where: { id: rep.id },
                        data: {
                            contentHash: reportContentHash({
                                teacherComments: rep.teacherComments,
                                entries: entriesByReport.get(rep.id) ?? []
                            })
                        }
                    });

                    if (!needsSignature || alreadyFrozen.has(rep.id)) continue;

                    const student = studentsById.get(rep.studentId);
                    if (!student) continue;

                    // An empty list is a valid outcome: the student has no guardian
                    // loaded, so nobody can sign. That is the "sin firmante" state.
                    signerRows.push(
                        ...resolveSigners({
                            studentId: rep.studentId,
                            birthDate: student.birthDate,
                            guardianIds: student.guardianLinks.map(l => l.guardianId),
                            publishedAt: pubDate
                        }).map(signer => ({ reportId: rep.id, ...signer }))
                    );
                }

                if (signerRows.length > 0) {
                    await tx.reportSigner.createMany({ data: signerRows });
                }
            }

            return reports;
        });

        return NextResponse.json({ success: true, count: updated.length, publishedAt: pubDate });

    } catch (error: any) {
        console.error("PATCH Course Report Publish Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
