import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { ReportGradeSheet } from "./ReportGradeSheet";
import Link from "next/link";
import { ArrowLeft, BookOpen, ClipboardList } from "lucide-react";

export default async function ReportGradeSheetPage({
    params
}: {
    params: Promise<{ id: string; templateId: string }>
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [user?.role || "TEACHER"];
    const activeRole = await getActiveRole(userRoles);

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    const { id: courseId, templateId } = await params;

    // Validate course exists and belongs to institute
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, name: true, level: true, color: true, instituteId: true, teacherId: true }
    });

    if (!course || course.instituteId !== user.instituteId) {
        redirect("/courses");
    }

    // Verify authorized user (admin, secretary, or the teacher assigned to the course)
    const isAuthorized = 
        user.role === "ADMIN" || 
        user.role === "SECRETARY" || 
        user.id === course.teacherId;

    if (!isAuthorized) {
        redirect(`/courses/${courseId}`);
    }

    // Verify report template is active and linked to this course
    const link = await prisma.courseReportTemplate.findUnique({
        where: {
            courseId_templateId: {
                courseId,
                templateId
            }
        },
        include: {
            template: {
                include: {
                    categories: { orderBy: { order: "asc" } }
                }
            }
        }
    });

    if (!link || !link.isActive || !link.template) {
        redirect(`/courses/${courseId}`);
    }

    const template = link.template;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar currentActiveRole={activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="space-y-4">
                    <Link
                        href={`/courses/${courseId}`}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Curso
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-md text-white" style={{ backgroundColor: course.color || "#3b82f6" }}>
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Planilla de Notas: {template.name}
                            </h1>
                            <p className="text-sm font-semibold mt-0.5 text-muted-foreground">
                                Curso: <span className="text-primary">{course.name}</span>
                                <span className="text-border mx-2">•</span>
                                Nivel: <span className="text-primary">{course.level || "General"}</span>
                            </p>
                        </div>
                    </div>
                </header>

                <div className="bg-card/60 backdrop-blur-sm shadow-md border border-border/40 rounded-3xl p-6">
                    <ReportGradeSheet 
                        courseId={course.id}
                        template={template}
                        userRole={user.role}
                    />
                </div>
            </main>
        </div>
    );
}
