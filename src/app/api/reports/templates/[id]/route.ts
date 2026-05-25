import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { instituteId: true, role: true }
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN") || !user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const existingTemplate = await prisma.reportTemplate.findFirst({
            where: { id: templateId, instituteId: user.instituteId }
        });

        if (!existingTemplate) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        const body = await req.json();
        const { name, periodType, periodCount, periodLabels, specialFields, categories } = body;

        if (!name || !periodType || !periodLabels || !categories) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updatedTemplate = await prisma.$transaction(async (tx) => {
            // Update base template
            await tx.reportTemplate.update({
                where: { id: templateId },
                data: {
                    name,
                    periodType,
                    periodCount: periodCount ?? periodLabels.length,
                    periodLabels,
                    specialFields: specialFields ?? {},
                }
            });

            // Handle categories update
            const existingCategories = await tx.reportCategory.findMany({
                where: { templateId }
            });
            const existingCatIds = existingCategories.map(c => c.id);

            const incomingCategories = categories as any[];
            const incomingCatIds = incomingCategories.map(c => c.id).filter(id => id && existingCatIds.includes(id));

            // Categories to delete
            const idsToDelete = existingCatIds.filter(id => !incomingCatIds.includes(id));

            if (idsToDelete.length > 0) {
                // Verify if any of the deleted categories have entries
                const entriesCount = await tx.reportEntry.count({
                    where: {
                        categoryId: { in: idsToDelete }
                    }
                });
                if (entriesCount > 0) {
                    throw new Error("No se pueden eliminar categorías que ya contienen calificaciones de alumnos.");
                }

                // Safe to delete
                await tx.reportCategory.deleteMany({
                    where: {
                        id: { in: idsToDelete }
                    }
                });
            }

            // Create or update incoming categories
            await Promise.all(
                incomingCategories.map(async (cat: any, idx: number) => {
                    const data = {
                        name: cat.name,
                        order: idx,
                        scaleType: cat.scaleType,
                        scaleMin: cat.scaleMin,
                        scaleMax: cat.scaleMax,
                        scaleOptions: cat.scaleOptions ?? [],
                    };

                    if (cat.id && existingCatIds.includes(cat.id)) {
                        // Update
                        return tx.reportCategory.update({
                            where: { id: cat.id },
                            data
                        });
                    } else {
                        // Create
                        return tx.reportCategory.create({
                            data: {
                                ...data,
                                templateId,
                            }
                        });
                    }
                })
            );

            // Fetch final template with ordered categories
            return tx.reportTemplate.findUnique({
                where: { id: templateId },
                include: {
                    categories: {
                        orderBy: { order: "asc" }
                    }
                }
            });
        });

        return NextResponse.json(updatedTemplate);
    } catch (error: any) {
        console.error("PUT Report Template Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { instituteId: true, role: true }
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN") || !user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const existingTemplate = await prisma.reportTemplate.findFirst({
            where: { id: templateId, instituteId: user.instituteId }
        });

        if (!existingTemplate) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Check if there are any reports linked to this template
        const reportsCount = await prisma.studentReport.count({
            where: { templateId }
        });

        if (reportsCount > 0) {
            return NextResponse.json(
                { error: "No se puede eliminar una plantilla que ya contiene boletines cargados." },
                { status: 400 }
            );
        }

        // Delete (cascades to categories and course templates links)
        await prisma.reportTemplate.delete({
            where: { id: templateId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE Report Template Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
