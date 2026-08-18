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

        // Permitir acceso a: ADMIN, o el propio profesor consultando sus datos.
        //
        // La secretaría queda afuera del sueldo ajeno (SEC-03): entra a la plata
        // que entra —cuotas, matrículas, ingresos varios— y no a la que sale. Si
        // alguna vez es también profesora, sigue viendo el suyo por `isSelf`.
        const isSelf = id === user.userId;
        const isAdmin = user.activeRole === "ADMIN";

        if (!isSelf && !isAdmin) {
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
