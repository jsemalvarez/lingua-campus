import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { INSTITUTE_ADMINS, requireRole } from "@/lib/authz";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; templateId: string }> }
) {
    try {
        const { id: courseId, templateId } = await params;
        // Only ADMIN or SECRETARY can unlink templates from course
        const user = await requireRole(INSTITUTE_ADMINS);
        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verify course belongs to same institute
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, instituteId: true }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Verify if any student reports have already been loaded for this course and template
        const reportsCount = await prisma.studentReport.count({
            where: {
                courseId,
                templateId
            }
        });

        if (reportsCount > 0) {
            return NextResponse.json(
                { error: "No se puede desvincular una plantilla que ya contiene calificaciones cargadas para este curso." },
                { status: 400 }
            );
        }

        // Find the link
        const courseReportTemplate = await prisma.courseReportTemplate.findUnique({
            where: {
                courseId_templateId: {
                    courseId,
                    templateId
                }
            }
        });

        if (!courseReportTemplate) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 });
        }

        // Delete the link
        await prisma.courseReportTemplate.delete({
            where: {
                id: courseReportTemplate.id
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("DELETE Course Report Link Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
