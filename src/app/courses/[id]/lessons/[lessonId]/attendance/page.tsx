import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { AttendanceForm } from "./AttendanceForm";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function AttendancePage({
    params
}: {
    params: Promise<{ id: string, lessonId: string }>
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    const { id: courseId, lessonId } = await params;

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            teacher: { select: { id: true, name: true } },
            enrollments: {
                where: { status: "ACTIVE" },
                include: { student: { select: { id: true, name: true } } }
            }
        }
    });

    if (!course || course.instituteId !== user.instituteId) {
        redirect("/courses");
    }

    const isAuthorized = user.role === "ADMIN" || user.id === course.teacher?.id;
    if (!isAuthorized) {
        redirect(`/courses/${courseId}`);
    }

    const students = course.enrollments.map(e => e.student);

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId }
    });

    if (!lesson) {
        redirect(`/courses/${courseId}`);
    }

    const existingRecords = await prisma.attendance.findMany({
        where: {
            lessonId: lessonId
        }
    });

    const formattedRecords: Record<string, any> = {};
    for (const record of existingRecords) {
        formattedRecords[record.studentId] = {
            status: record.status,
            notes: record.notes
        };
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="space-y-4 mb-4">
                    <Link
                        href={`/courses/${courseId}`}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Curso
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                <ClipboardCheck size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    Tomar Asistencia
                                </h1>
                                <p className="text-sm font-semibold mt-0.5 text-muted-foreground flex items-center gap-2">
                                    <span className="text-foreground">{course.name}</span>
                                    <span className="text-border">•</span>
                                    Prof. {course.teacher?.name || "Sin Asignar"}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="mb-4 bg-blue-500/5 border border-blue-500/20 p-4 sm:p-5 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider text-xs">
                        <CalendarIcon size={16} />
                        {format(new Date(lesson.date), "EEEE, d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{lesson.topic}</h2>
                    {lesson.content && (
                        <p className="text-sm text-foreground/70 italic"><BookOpen size={14} className="inline mr-1" /> {lesson.content}</p>
                    )}
                </div>

                <AttendanceForm
                    lessonId={lessonId}
                    courseId={courseId}
                    students={students}
                    existingAttendances={formattedRecords}
                />
            </main>
        </div>
    );
}
