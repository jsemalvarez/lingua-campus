import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateTeacherPayroll } from "@/lib/payroll";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Verificar usuario autenticado, su instituto y rol
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, instituteId: true, role: true, roles: true }
        });

        if (!user || !user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        // Permitir acceso a: ADMIN, SECRETARY, o el propio profesor consultando sus datos
        const allowedRoles = ["ADMIN", "SUPERADMIN", "SECRETARY"];
        const isSelf = id === user.id;
        const hasAllowedRole = allowedRoles.includes(user.role) || 
            (user.roles as string[] || []).some((r: string) => allowedRoles.includes(r));

        if (!isSelf && !hasAllowedRole) {
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
