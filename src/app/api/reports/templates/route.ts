import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { instituteId: true, role: true, roles: true }
        });

        const hasAccess = user?.roles?.some(r => ["ADMIN", "SUPERADMIN", "SECRETARY"].includes(r)) || ["ADMIN", "SUPERADMIN", "SECRETARY"].includes(user?.role || "");

        if (!user || !hasAccess || !user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const templates = await prisma.reportTemplate.findMany({
            where: { instituteId: user.instituteId },
            include: {
                categories: {
                    orderBy: { order: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(templates);
    } catch (error: any) {
        console.error("GET Report Templates Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { instituteId: true, role: true, roles: true }
        });

        const hasAccess = user?.roles?.some(r => ["ADMIN", "SUPERADMIN", "SECRETARY"].includes(r)) || ["ADMIN", "SUPERADMIN", "SECRETARY"].includes(user?.role || "");

        if (!user || !hasAccess || !user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { name, periodType, periodCount, periodLabels, specialFields, categories } = body;

        if (!name || !periodType || !periodLabels || !categories) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create template and categories in a transaction
        const template = await prisma.$transaction(async (tx) => {
            const newTpl = await tx.reportTemplate.create({
                data: {
                    instituteId: user.instituteId!,
                    name,
                    periodType,
                    periodCount: periodCount ?? periodLabels.length,
                    periodLabels,
                    specialFields: specialFields ?? {},
                }
            });

            if (categories && categories.length > 0) {
                await Promise.all(
                    categories.map((cat: any, idx: number) => 
                        tx.reportCategory.create({
                            data: {
                                templateId: newTpl.id,
                                name: cat.name,
                                order: cat.order ?? idx,
                                scaleType: cat.scaleType,
                                scaleMin: cat.scaleMin,
                                scaleMax: cat.scaleMax,
                                scaleOptions: cat.scaleOptions ?? [],
                            }
                        })
                    )
                );
            }

            // Return full template with categories
            return tx.reportTemplate.findUnique({
                where: { id: newTpl.id },
                include: {
                    categories: {
                        orderBy: { order: "asc" }
                    }
                }
            });
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error: any) {
        console.error("POST Report Template Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
