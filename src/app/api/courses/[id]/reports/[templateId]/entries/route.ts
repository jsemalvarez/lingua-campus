import { NextRequest, NextResponse } from "next/server";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";
import prisma from "@/lib/prisma";
import { reportContentHash } from "@/lib/reports/signatures";
import { asSignedHashes, fallenStudentIds } from "@/lib/reports/batchSignatures";
import { notifyAfterGradeEdit } from "@/lib/reports/batchSignatureNotices";

export async function GET(
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

        const isAdminOrSecretary = user.activeRole === "ADMIN" || user.activeRole === "SECRETARY";
        const isAuthorized = isAdminOrSecretary || user.userId === course.teacherId;

        if (!isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const year = searchParams.get("year") 
            ? parseInt(searchParams.get("year")!) 
            : new Date().getFullYear();
        
        const periodIndex = searchParams.get("periodIndex")
            ? parseInt(searchParams.get("periodIndex")!)
            : 0;

        // Fetch active enrolled students
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId, status: "ACTIVE" },
            include: {
                student: { select: { id: true, name: true } }
            },
            orderBy: { student: { name: "asc" } }
        });

        const students = enrollments.map(e => e.student);

        // Fetch existing student reports for this template, course, year, periodIndex
        const studentReports = await prisma.studentReport.findMany({
            where: {
                courseId,
                templateId,
                year,
                periodIndex
            },
            include: {
                entries: true
            }
        });

        // Map students to their reports (or null if not yet graded)
        const rows = students.map(student => {
            const report = studentReports.find(r => r.studentId === student.id) || null;
            return {
                id: student.id,
                name: student.name,
                report
            };
        });

        // Las firmas del instituto sobre esta tanda (FEAT-21). El parecido con
        // el contenido se calcula **en vivo** y no contra `contentHash`: una
        // tanda sin publicar puede no tenerlo todavía, y firmar antes de
        // publicar es justamente el orden natural.
        const batchSignatures = await prisma.reportBatchSignature.findMany({
            where: { courseId, templateId, year, periodIndex },
            select: {
                signerRole: true,
                signerName: true,
                signedAt: true,
                userId: true,
                strokeData: true,
                contentHashes: true
            }
        });

        const currentHashes = studentReports.map(r => ({
            studentId: r.studentId,
            contentHash: reportContentHash({
                teacherComments: r.teacherComments,
                entries: r.entries
            })
        }));

        const signatures = batchSignatures.map(sig => ({
            signerRole: sig.signerRole,
            signerName: sig.signerName,
            signedAt: sig.signedAt,
            strokeData: sig.strokeData,
            isMine: sig.userId === user.userId,
            fallenCount: fallenStudentIds(asSignedHashes(sig.contentHashes), currentHashes).length
        }));

        return NextResponse.json({
            students: rows,
            signatures,
            // Quién puede firmar esta tanda, para no mostrar un botón que el
            // servidor va a rechazar. La secretaría no firma.
            canSign: {
                ADMIN: user.activeRole === "ADMIN",
                TEACHER: user.userId === course.teacherId
            }
        });

    } catch (error: any) {
        console.error("GET Course Report Entries Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
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
            select: { id: true, name: true, instituteId: true, teacherId: true }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const isAdminOrSecretary = user.activeRole === "ADMIN" || user.activeRole === "SECRETARY";
        const isAuthorized = isAdminOrSecretary || user.userId === course.teacherId;

        if (!isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { year, periodIndex, reports } = body;

        if (year === undefined || periodIndex === undefined || !reports) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Un informe publicado sólo lo toca un ADMIN (FEAT-09).
        //
        // Es lo que sostiene la firma: si cualquier docente pudiera cambiar las
        // notas después de publicadas, el "confirmo que lo leí" del tutor no
        // diría nada. Que la corrección tenga que pasar por una sola persona la
        // mantiene siendo un hecho raro y deliberado.
        const existing = await prisma.studentReport.findMany({
            where: { courseId, templateId, year, periodIndex },
            select: { studentId: true, publishedAt: true, contentHash: true }
        });
        const publishedStudentIds = new Set(
            existing.filter(r => r.publishedAt).map(r => r.studentId)
        );

        const touchesPublished = reports.some((rep: any) =>
            publishedStudentIds.has(rep.studentId)
        );

        if (touchesPublished && user.activeRole !== "ADMIN") {
            return NextResponse.json(
                {
                    error:
                        "El informe ya está publicado. Sólo un administrador puede modificarlo."
                },
                { status: 403 }
            );
        }

        // Procesar en lotes (batches) para evitar saturar el pool de conexiones (que tiene un límite de 5).
        // En desarrollo local (Latinoamérica -> EE.UU.), la latencia de red hace que las conexiones
        // se mantengan ocupadas mucho tiempo. Procesar de a 5 alumnos a la vez asegura que la cola
        // de Prisma no alcance el timeout de 10 segundos buscando conexiones libres.
        const BATCH_SIZE = 5;
        const result = [];

        for (let i = 0; i < reports.length; i += BATCH_SIZE) {
            const batch = reports.slice(i, i + BATCH_SIZE);

            const batchPromises = batch.map(async (rep: any) => {
                const { studentId, teacherComments, entries } = rep;

                // 1. Upsert StudentReport
                const studentReport = await prisma.studentReport.upsert({
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
                        teacherComments: teacherComments !== undefined ? teacherComments : undefined,
                    },
                    create: {
                        studentId,
                        courseId,
                        year,
                        periodIndex,
                        templateId,
                        teacherComments: teacherComments || null,
                    }
                });

                // 2. Process Entries
                if (entries && entries.length > 0) {
                    const entryPromises = entries.map((ent: any) => {
                        const { categoryId, value } = ent;

                        if (value === null || value === undefined || value.toString().trim() === "") {
                            // If empty, delete existing entry
                            return prisma.reportEntry.deleteMany({
                                where: {
                                    reportId: studentReport.id,
                                    categoryId
                                }
                            });
                        } else {
                            // Else, upsert the entry value
                            return prisma.reportEntry.upsert({
                                where: {
                                    reportId_categoryId: {
                                        reportId: studentReport.id,
                                        categoryId
                                    }
                                },
                                update: {
                                    value: value.toString()
                                },
                                create: {
                                    reportId: studentReport.id,
                                    categoryId,
                                    value: value.toString()
                                }
                            });
                        }
                    });

                    await Promise.all(entryPromises);
                }

                // Fetch final report with entries
                const finalReport = await prisma.studentReport.findUnique({
                    where: { id: studentReport.id },
                    include: { entries: true }
                });

                // El hash sigue al contenido **siempre**, publicado o no. Cuando
                // deja de coincidir con el que guardó una firma, esa firma ya no
                // cubre a ese alumno. Antes se escribía sólo para lo publicado, y
                // eso dejaba ciega la mitad que más importa: la dirección firma
                // tandas todavía sin publicar (FEAT-21).
                //
                // `lastEditedAt` / `lastEditedById` sí son de lo publicado: auditan
                // la corrección posterior a que la familia lo vio.
                //
                // Se compara antes de escribir para no dejar rastro de una edición
                // que no cambió nada — abrir y guardar sin tocar no cuenta.
                if (finalReport) {
                    const newHash = reportContentHash({
                        teacherComments: finalReport.teacherComments,
                        entries: finalReport.entries
                    });

                    if (newHash !== finalReport.contentHash) {
                        return prisma.studentReport.update({
                            where: { id: finalReport.id },
                            data: {
                                contentHash: newHash,
                                ...(publishedStudentIds.has(studentId)
                                    ? { lastEditedAt: new Date(), lastEditedById: user.userId }
                                    : {})
                            },
                            include: { entries: true }
                        });
                    }
                }

                return finalReport;
            });

            const batchResults = await Promise.all(batchPromises);
            result.push(...batchResults);
        }

        // Si la edición tiró la firma de la dirección, o si la hizo la dirección
        // sobre una tanda que el docente firmó, hay a quién avisarle (FEAT-21).
        // Nunca puede tumbar un guardado que ya se hizo.
        try {
            const before = existing.map(r => ({
                studentId: r.studentId,
                contentHash: r.contentHash
            }));
            const after = result
                .filter((r): r is NonNullable<typeof r> => Boolean(r))
                .map(r => ({ studentId: r.studentId, contentHash: r.contentHash }));

            const previo = new Map(before.map(r => [r.studentId, r.contentHash]));
            const huboCambios = after.some(r => previo.get(r.studentId) !== r.contentHash);

            if (huboCambios) {
                await notifyAfterGradeEdit({
                    instituteId: user.instituteId,
                    courseId,
                    courseName: course.name,
                    templateId,
                    year,
                    periodIndex,
                    editorUserId: user.userId,
                    editorIsAdmin: user.activeRole === "ADMIN",
                    before,
                    after
                });
            }
        } catch (notifErr) {
            console.error("Error notifying batch signers:", notifErr);
        }

        return NextResponse.json({ success: true, count: result.length, reports: result });

    } catch (error: any) {
        console.error("POST Course Report Entries Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
