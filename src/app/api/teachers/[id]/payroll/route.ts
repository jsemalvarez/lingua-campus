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
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
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
