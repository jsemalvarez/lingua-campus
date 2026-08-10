import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { INSTITUTE_STAFF, getAuthContext } from "@/lib/authz";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: studentId } = await params;
        const auth = await getAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── Authorization ─────────────────────────────────────────────────────
        // 1. The student themselves
        // 2. A guardian linked to this student
        // 3. Institute staff (ADMIN, SECRETARY, TEACHER)
        const isStudent = auth.userId === studentId;

        let isGuardian = false;
        if (!isStudent && auth.activeRole === "GUARDIAN") {
            const link = await prisma.guardianStudentLink.findFirst({
                where: { guardianId: auth.userId, studentId }
            });
            isGuardian = !!link;
        }

        // El personal accede por rol, y el rol por sí solo no aísla institutos:
        // sin comparar el instituto del alumno, un profesor del instituto A leía
        // los informes de un alumno del instituto B mandando su ID.
        let isStaff = false;
        const isStaffRole = INSTITUTE_STAFF.includes(auth.activeRole as typeof INSTITUTE_STAFF[number]);
        if (!isStudent && !isGuardian && isStaffRole && auth.instituteId) {
            const student = await prisma.student.findFirst({
                where: { id: studentId, instituteId: auth.instituteId },
                select: { id: true }
            });
            isStaff = !!student;
        }

        if (!isStudent && !isGuardian && !isStaff) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // ── Fetch published reports ───────────────────────────────────────────
        const now = new Date();
        const reports = await prisma.studentReport.findMany({
            where: {
                studentId,
                publishedAt: { lte: now }
            },
            include: {
                template: {
                    include: {
                        categories: { orderBy: { order: "asc" } }
                    }
                },
                entries: true,
                course: { select: { id: true, name: true, color: true, teacher: { select: { name: true } } } }
            },
            orderBy: [{ year: "desc" }, { periodIndex: "asc" }]
        });

        return NextResponse.json(reports);
    } catch (error: any) {
        console.error("GET Student Reports Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
