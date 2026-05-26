import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; templateId: string }> }
) {
    try {
        const { id: courseId, templateId } = await params;
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

        const isAuthorized = 
            user.role === "ADMIN" || 
            user.role === "SECRETARY" || 
            user.role === "SUPERADMIN" || 
            user.id === course.teacherId;

        if (!isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const year = searchParams.get("year") 
            ? parseInt(searchParams.get("year")!) 
            : new Date().getFullYear();
        
        const periodIndex = searchParams.get("periodIndex")
            ? parseInt(searchParams.get("periodIndex")!)
            : 0;

        // Fetch active enrolled students
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId, status: "ACTIVE" },
            include: {
                student: { select: { id: true, name: true } }
            },
            orderBy: { student: { name: "asc" } }
        });

        const students = enrollments.map(e => e.student);

        // Fetch existing student reports for this template, course, year, periodIndex
        const studentReports = await prisma.studentReport.findMany({
            where: {
                courseId,
                templateId,
                year,
                periodIndex
            },
            include: {
                entries: true
            }
        });

        // Map students to their reports (or null if not yet graded)
        const rows = students.map(student => {
            const report = studentReports.find(r => r.studentId === student.id) || null;
            return {
                id: student.id,
                name: student.name,
                report
            };
        });

        return NextResponse.json({ students: rows });

    } catch (error: any) {
        console.error("GET Course Report Entries Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; templateId: string }> }
) {
    try {
        const { id: courseId, templateId } = await params;
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

        const isAuthorized = 
            user.role === "ADMIN" || 
            user.role === "SECRETARY" || 
            user.role === "SUPERADMIN" || 
            user.id === course.teacherId;

        if (!isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { year, periodIndex, reports } = body;

        if (year === undefined || periodIndex === undefined || !reports) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Perform upserts in a single transaction
        const result = await prisma.$transaction(async (tx) => {
            const savedReports = [];

            for (const rep of reports) {
                const { studentId, teacherComments, entries } = rep;

                // 1. Upsert StudentReport
                const studentReport = await tx.studentReport.upsert({
                    where: {
                        studentId_courseId_year_periodIndex_templateId: {
                            studentId,
                            courseId,
                            year,
                            periodIndex,
                            templateId
                        }
                    },
                    update: {
                        teacherComments: teacherComments !== undefined ? teacherComments : undefined,
                    },
                    create: {
                        studentId,
                        courseId,
                        year,
                        periodIndex,
                        templateId,
                        teacherComments: teacherComments || null,
                    }
                });

                // 2. Process Entries
                if (entries && entries.length > 0) {
                    for (const ent of entries) {
                        const { categoryId, value } = ent;

                        if (value === null || value === undefined || value.toString().trim() === "") {
                            // If empty, delete existing entry
                            await tx.reportEntry.deleteMany({
                                where: {
                                    reportId: studentReport.id,
                                    categoryId
                                }
                            });
                        } else {
                            // Else, upsert the entry value
                            await tx.reportEntry.upsert({
                                where: {
                                    reportId_categoryId: {
                                        reportId: studentReport.id,
                                        categoryId
                                    }
                                },
                                update: {
                                    value: value.toString()
                                },
                                create: {
                                    reportId: studentReport.id,
                                    categoryId,
                                    value: value.toString()
                                }
                            });
                        }
                    }
                }

                // Fetch final report with entries
                const finalReport = await tx.studentReport.findUnique({
                    where: { id: studentReport.id },
                    include: { entries: true }
                });

                savedReports.push(finalReport);
            }

            return savedReports;
        });

        return NextResponse.json({ success: true, count: result.length, reports: result });

    } catch (error: any) {
        console.error("POST Course Report Entries Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
