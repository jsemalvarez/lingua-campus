import { NextRequest, NextResponse } from "next/server";
import { calculateBulkTeacherPayroll } from "@/lib/payroll";
import { requireRole } from "@/lib/authz";

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
        console.error("API Bulk Payroll Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
