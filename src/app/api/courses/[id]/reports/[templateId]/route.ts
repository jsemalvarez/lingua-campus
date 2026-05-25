import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; templateId: string }> }
) {
    try {
        const { id: courseId, templateId } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, instituteId: true, role: true }
        });

        if (!user || !user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Only ADMIN, SECRETARY or SUPERADMIN can unlink templates from course
        const isAuthorizedDelete = 
            user.role === "ADMIN" || 
            user.role === "SECRETARY" || 
            user.role === "SUPERADMIN";

        if (!isAuthorizedDelete) {
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
