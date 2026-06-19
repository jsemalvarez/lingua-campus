import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: studentId } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sessionUser = session.user as any;

        // ── Authorization ─────────────────────────────────────────────────────
        // 1. The student themselves
        // 2. A guardian linked to this student
        // 3. Institute staff (ADMIN, SECRETARY, TEACHER)
        const isStudent = sessionUser.id === studentId;

        let isGuardian = false;
        if (!isStudent && sessionUser.role === "GUARDIAN") {
            const link = await prisma.guardianStudentLink.findFirst({
                where: { guardianId: sessionUser.id, studentId }
            });
            isGuardian = !!link;
        }

        let isStaff = false;
        if (!isStudent && !isGuardian) {
            const user = await prisma.user.findUnique({
                where: { email: sessionUser.email },
                select: { role: true, instituteId: true, roles: true }
            });
            isStaff = ["ADMIN", "SECRETARY", "TEACHER", "SUPERADMIN"].includes(user?.role || "") ||
                (user?.roles || []).some((r: string) => ["ADMIN", "SECRETARY", "TEACHER", "SUPERADMIN"].includes(r));
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
