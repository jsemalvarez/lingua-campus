import { NextRequest, NextResponse } from "next/server";
import { calculateBulkTeacherPayroll } from "@/lib/payroll";
import { requireRole } from "@/lib/authz";
import { userMessageFor } from "@/lib/errors/report";

export async function GET(req: NextRequest) {
    try {
        const user = await requireRole(["ADMIN"]);
        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!start || !end) {
            return NextResponse.json({ error: "Missing dates" }, { status: 400 });
        }

        const data = await calculateBulkTeacherPayroll(
            user.instituteId,
            new Date(start),
            new Date(end)
        );

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: await userMessageFor(error, "No se pudo cargar la liquidación de sueldos. Probá de nuevo en un momento.", { action: "sueldos.ver-liquidacion-general" }) },
            { status: 500 }
        );
    }
}
