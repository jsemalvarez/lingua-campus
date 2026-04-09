import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateBulkTeacherPayroll } from "@/lib/payroll";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, instituteId: true, role: true }
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN") || !user.instituteId) {
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
