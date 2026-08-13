import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateTeacherPayroll } from "@/lib/payroll";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireRole(INSTITUTE_STAFF);
        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        // Permitir acceso a: ADMIN, SECRETARY, o el propio profesor consultando sus datos
        const isSelf = id === user.userId;
        const isAdminOrSecretary = user.activeRole === "ADMIN" || user.activeRole === "SECRETARY";

        if (!isSelf && !isAdminOrSecretary) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verificar que el profesor pertenece al mismo instituto (cross-tenant check)
        const teacher = await prisma.user.findUnique({
            where: { id },
            select: { instituteId: true }
        });

        if (!teacher || teacher.instituteId !== user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!start || !end) {
            return NextResponse.json({ error: "Missing dates" }, { status: 400 });
        }

        const data = await calculateTeacherPayroll(
            id,
            new Date(start),
            new Date(end)
        );

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("API Payroll Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
