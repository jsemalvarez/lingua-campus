import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";

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

        // Get all active student enrollments for this course
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId, status: "ACTIVE" },
            select: { studentId: true }
        });

        const studentIds = enrollments.map(e => e.studentId);
        const pubDate = publishedAt ? new Date(publishedAt) : null;

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
            return reports;
        });

        return NextResponse.json({ success: true, count: updated.length, publishedAt: pubDate });

    } catch (error: any) {
        console.error("PATCH Course Report Publish Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
