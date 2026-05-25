import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: courseId } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, instituteId: true, role: true }
        });

        if (!user || !user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, instituteId: true, teacherId: true }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const isAuthorizedGet = 
            user.role === "ADMIN" || 
            user.role === "SECRETARY" || 
            user.role === "SUPERADMIN" || 
            user.id === course.teacherId;

        if (!isAuthorizedGet) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const year = searchParams.get("year") 
            ? parseInt(searchParams.get("year")!) 
            : new Date().getFullYear();

        // Count active enrolled students
        const totalStudents = await prisma.enrollment.count({
            where: { courseId, status: "ACTIVE" }
        });

        // Find linked report templates
        const linkedTemplates = await prisma.courseReportTemplate.findMany({
            where: { courseId, isActive: true },
            include: {
                template: {
                    include: {
                        categories: { orderBy: { order: "asc" } }
                    }
                }
            }
        });

        const linkedTemplatesWithStats = await Promise.all(
            linkedTemplates.map(async (crt) => {
                const template = crt.template;
                
                // Fetch student reports for this template, course and academic year
                const studentReports = await prisma.studentReport.findMany({
                    where: {
                        courseId,
                        templateId: crt.templateId,
                        year
                    },
                    select: {
                        periodIndex: true,
                        publishedAt: true
                    }
                });

                // Calculate stats for each period
                const stats = template.periodLabels.map((label, index) => {
                    const reportsForPeriod = studentReports.filter(r => r.periodIndex === index);
                    const gradedCount = reportsForPeriod.length;
                    const publishedCount = reportsForPeriod.filter(r => r.publishedAt !== null).length;

                    return {
                        periodIndex: index,
                        periodLabel: label,
                        gradedCount,
                        publishedCount,
                        totalStudents
                    };
                });

                return {
                    id: crt.id,
                    templateId: crt.templateId,
                    isActive: crt.isActive,
                    template: {
                        id: template.id,
                        name: template.name,
                        periodType: template.periodType,
                        periodCount: template.periodCount,
                        periodLabels: template.periodLabels,
                        specialFields: template.specialFields,
                        categories: template.categories
                    },
                    stats
                };
            })
        );

        // Fetch all templates in the institute that are active and not currently linked to this course
        const linkedIds = linkedTemplates.map(l => l.templateId);
        const availableTemplates = await prisma.reportTemplate.findMany({
            where: {
                instituteId: user.instituteId,
                isActive: true,
                id: { notIn: linkedIds }
            },
            include: {
                categories: { orderBy: { order: "asc" } }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({
            linked: linkedTemplatesWithStats,
            available: availableTemplates
        });

    } catch (error: any) {
        console.error("GET Course Reports Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: courseId } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, instituteId: true, role: true }
        });

        if (!user || !user.instituteId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Only ADMIN, SECRETARY or SUPERADMIN can link templates to course
        const isAuthorizedPost = 
            user.role === "ADMIN" || 
            user.role === "SECRETARY" || 
            user.role === "SUPERADMIN";

        if (!isAuthorizedPost) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, instituteId: true }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const body = await req.json();
        const { templateId } = body;

        if (!templateId) {
            return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
        }

        // Verify template exists in same institute and is active
        const template = await prisma.reportTemplate.findFirst({
            where: {
                id: templateId,
                instituteId: user.instituteId,
                isActive: true
            }
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found or inactive" }, { status: 404 });
        }

        // Link template to course using upsert to avoid duplicate/inactive issues
        const linked = await prisma.courseReportTemplate.upsert({
            where: {
                courseId_templateId: {
                    courseId,
                    templateId
                }
            },
            update: {
                isActive: true
            },
            create: {
                courseId,
                templateId,
                isActive: true
            },
            include: {
                template: true
            }
        });

        return NextResponse.json(linked, { status: 201 });

    } catch (error: any) {
        console.error("POST Course Reports Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
