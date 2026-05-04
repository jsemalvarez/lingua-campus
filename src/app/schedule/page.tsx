import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, User, ClipboardCheck, BookOpen, AlertTriangle } from "lucide-react";
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, isSameDay, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { WeeklyGridView } from "./components/WeeklyGridView";
import { ScheduleFilters } from "./components/ScheduleFilters";
import { getActiveRole } from "@/lib/roles";

const daysMapping = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SchedulePage(props: PageProps) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const params = await props.searchParams;
    const view = (params.view as string) || "week";

    // Parse the date from URL or use today
    let baseDate = new Date();
    if (params.date) {
        const parsed = parseISO(params.date as string);
        if (isValid(parsed)) {
            baseDate = parsed;
        }
    }

    const displayDateNoon = new Date(baseDate);
    displayDateNoon.setUTCHours(12, 0, 0, 0);

    const dateStr = format(displayDateNoon, "yyyy-MM-dd");
    const isToday = isSameDay(displayDateNoon, new Date());

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const role = await getActiveRole(userRoles);

    let instituteId = "";
    let studentEnrollments: string[] = [];

    if (role === "STUDENT") {
        const student = await prisma.student.findUnique({
            where: { id: (session.user as any).id },
            include: { enrollments: { select: { courseId: true } } }
        });
        if (!student) redirect("/login");
        instituteId = student.instituteId;
        studentEnrollments = student.enrollments.map(e => e.courseId);
    } else if (role === "GUARDIAN") {
        const guardianId = (session.user as any).id;
        const guardianLinks = await prisma.guardianStudentLink.findMany({
            where: { guardianId },
            include: {
                student: {
                    include: { enrollments: { select: { courseId: true } } }
                }
            }
        });
        
        if (guardianLinks.length === 0) redirect("/dashboard");
        
        instituteId = guardianLinks[0].student.instituteId;
        
        guardianLinks.forEach(link => {
            link.student.enrollments.forEach(e => {
                if (!studentEnrollments.includes(e.courseId)) {
                    studentEnrollments.push(e.courseId);
                }
            });
        });
    } else {
        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            select: { id: true, role: true, instituteId: true }
        });
        if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
            redirect("/dashboard");
        }
        instituteId = user.instituteId;
    }

    const isTeacher = role === "TEACHER";
    const isStudentOrGuardian = role === "STUDENT" || role === "GUARDIAN";
    const effectiveTeacherId = isTeacher ? (session.user as any).id : (params.teacherId as string);

    // Obtenemos los cursos, profesores y aulas para los filtros
    const [allCourses, allTeachers, allClassrooms] = await Promise.all([
        prisma.course.findMany({
            where: { 
                instituteId: instituteId, 
                status: "ACTIVE",
                ...(isTeacher ? { teacherId: (session.user as any).id } : {}),
                ...(isStudentOrGuardian ? { id: { in: studentEnrollments } } : {})
            },
            orderBy: { name: "asc" }
        }),
        prisma.user.findMany({
            where: { 
                instituteId: instituteId, 
                role: "TEACHER", 
                status: "ACTIVE"
            },
            orderBy: { name: "asc" }
        }),
        prisma.classroom.findMany({
            where: { instituteId: instituteId },
            orderBy: { name: "asc" }
        })
    ]);

    const activeCourseId = params.courseId as string;
    const activeTeacherId = effectiveTeacherId as string;
    const activeClassroomId = params.classroomId as string;

    const displayDayIndex = displayDateNoon.getUTCDay();

    const weekStart = startOfWeek(displayDateNoon, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const weekStartNoon = new Date(weekStart);
    weekStartNoon.setUTCHours(12, 0, 0, 0);
    const weekEndNoon = new Date(weekEnd);
    weekEndNoon.setUTCHours(12, 0, 0, 0);

    const lessonsWhere = view === "day" 
        ? { date: displayDateNoon }
        : { date: { gte: weekStartNoon, lte: weekEndNoon } };

    const allSchedules = await prisma.schedule.findMany({
        where: {
            course: {
                instituteId: instituteId,
                status: "ACTIVE",
                ...(activeCourseId ? { id: activeCourseId } : {}),
                ...(activeTeacherId ? { teacherId: activeTeacherId } : {}),
                ...(activeClassroomId ? { classroomId: activeClassroomId } : {}),
                ...(isStudentOrGuardian ? { id: { in: studentEnrollments } } : {})
            }
        },
        include: {
            course: {
                include: {
                    teacher: true
                }
            },
            lessons: {
                where: lessonsWhere
            }
        },
        orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
        ]
    });

    const schedules = view === "day"
        ? allSchedules.filter(s => {
            const isCorrectDay = s.dayOfWeek === displayDayIndex;
            if (!isCorrectDay) return false;

            const courseStart = s.course.startDate ? new Date(s.course.startDate) : null;
            const courseEnd = s.course.endDate ? new Date(s.course.endDate) : null;

            if (courseStart) {
                courseStart.setUTCHours(0, 0, 0, 0);
                if (displayDateNoon < courseStart) return false;
            }
            if (courseEnd) {
                courseEnd.setUTCHours(23, 59, 59, 999);
                if (displayDateNoon > courseEnd) return false;
            }

            return true;
        })
        : allSchedules;

    const filterParams = `${activeCourseId ? `&courseId=${activeCourseId}` : ""}${activeTeacherId ? `&teacherId=${activeTeacherId}` : ""}${activeClassroomId ? `&classroomId=${activeClassroomId}` : ""}`;

    const prevDate = view === "day" ? subDays(displayDateNoon, 1) : subWeeks(displayDateNoon, 1);
    const nextDate = view === "day" ? addDays(displayDateNoon, 1) : addWeeks(displayDateNoon, 1);

    const prevUrl = `/schedule?view=${view}&date=${format(prevDate, "yyyy-MM-dd")}${filterParams}`;
    const nextUrl = `/schedule?view=${view}&date=${format(nextDate, "yyyy-MM-dd")}${filterParams}`;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={role} />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">
                            {view === "day" ? "Clases del Día" : "Calendario Institucional"}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">
                            {view === "day"
                                ? `Mostrando ${schedules.length} clases para el ${format(displayDateNoon, "EEEE d 'de' MMMM", { locale: es })}.`
                                : `Visualiza la agenda semanal. Encontradas ${schedules.length} plantillas de clases.`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-border/50 shadow-sm">
                            <Link href={`/schedule?view=day&date=${dateStr}${filterParams}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-9 px-5 rounded-xl transition-all duration-300 font-semibold text-xs ${view === "day" ? "bg-background shadow-md text-foreground scale-[1.02]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
                                >
                                    Día
                                </Button>
                            </Link>
                            <Link href={`/schedule?view=week&date=${dateStr}${filterParams}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-9 px-5 rounded-xl transition-all duration-300 font-semibold text-xs ${view === "week" ? "bg-background shadow-md text-foreground scale-[1.02]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
                                >
                                    Semana
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <ScheduleFilters 
                    allCourses={allCourses}
                    allTeachers={allTeachers}
                    allClassrooms={allClassrooms}
                    userRole={role}
                    currentFilters={{
                        courseId: activeCourseId,
                        teacherId: activeTeacherId,
                        classroomId: activeClassroomId
                    }}
                />

                <div className="flex items-center justify-between mb-8 bg-muted/15 p-5 rounded-[2rem] border border-border/30 backdrop-blur-sm shadow-inner">
                    <div className="flex items-center gap-5">
                        <Link href={prevUrl}>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/50 bg-background/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm active:scale-95">
                                <ChevronLeft size={18} />
                            </Button>
                        </Link>
                        <div className="flex flex-col items-center min-w-[180px]">
                            <h2 className="text-base font-bold tracking-tight text-foreground/90 capitalize">
                                {view === "day"
                                    ? format(displayDateNoon, "EEEE d 'de' MMMM", { locale: es })
                                    : isToday ? "Semana Actual" : `Semana del ${format(startOfWeek(displayDateNoon, { weekStartsOn: 1 }), "d 'de' MMM", { locale: es })}`}
                            </h2>
                            <span className="text-[10px] font-bold text-primary/60 tracking-widest uppercase mt-0.5">
                                {view === "day" ? "Vista Diaria" : "Vista Semanal"}
                            </span>
                        </div>
                        <Link href={nextUrl}>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/50 bg-background/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm active:scale-95">
                                <ChevronRight size={18} />
                            </Button>
                        </Link>
                    </div>
                    <Link href={`/schedule?view=${view}&date=${format(new Date(), "yyyy-MM-dd")}${filterParams}`}>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`text-[10px] font-black uppercase tracking-wider h-8 px-5 rounded-full border-border/50 transition-all duration-300 shadow-sm hover:shadow-md ${isToday ? "bg-primary text-primary-foreground border-primary" : "bg-background/50 hover:bg-muted hover:text-foreground"}`}
                        >
                            Hoy
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-8 grid-cols-1">
                    <div className="space-y-4">
                        {allSchedules.length === 0 ? (
                            <div className="text-center p-12 border border-dashed rounded-xl border-border/50 bg-muted/20">
                                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">Sin clases programadas</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                                    Aún no has configurado ninguna plantilla semanal en el calendario de la institución.
                                </p>
                            </div>
                        ) : (
                            view === "week" ? (
                                <WeeklyGridView schedules={allSchedules} daysMapping={daysMapping} currentDate={displayDateNoon} />
                            ) : (
                                <div className="space-y-4">
                                    {schedules.map((schedule) => {
                                        const hasLesson = schedule.lessons && schedule.lessons.length > 0;
                                        const cardColor = hasLesson ? schedule.course.color : "#94a3b8";

                                        return (
                                            <Card 
                                                key={schedule.id} 
                                                className={`p-0 overflow-hidden border-l-4 transition-all hover:scale-[1.01] hover:shadow-lg group shadow-sm sm:shadow-md cursor-pointer ${!hasLesson ? 'border-dashed opacity-80' : ''}`}
                                                style={{ 
                                                    borderLeftColor: cardColor,
                                                    backgroundColor: hasLesson ? `${cardColor}08` : 'transparent'
                                                }}
                                            >
                                                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-5">
                                                        <div className={"h-12 w-16 rounded-2xl flex flex-col items-center justify-center border border-border/40 shadow-sm shrink-0 bg-background/50"}>
                                                            <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-0.5">{daysMapping[schedule.dayOfWeek].substring(0, 3)}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1"><Clock size={13} /> {schedule.startTime} - {schedule.endTime}</span>
                                                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                                    <MapPin size={10} /> {schedule.room || "Sin Aula"}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-lg font-bold tracking-tight text-foreground/90">{schedule.course.name} <span className="text-muted-foreground font-medium text-sm ml-1">({schedule.course.level || "General"})</span></h3>
                                                            
                                                            {hasLesson ? (
                                                                <div className="flex flex-col gap-1 mt-1">
                                                                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                                                        <BookOpen size={14} className="text-primary" />
                                                                        {/* @ts-ignore */}
                                                                        {schedule.lessons[0].topic}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm font-medium text-muted-foreground/60 flex items-center gap-1.5 -mt-0.5">
                                                                    <AlertTriangle size={14} className="text-amber-500/50" />
                                                                    Programación: Pendiente de registro
                                                                </p>
                                                            )}
                                                            
                                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-1">
                                                                <span className="text-[10px]"><User size={13} /></span> {schedule.course.teacher ? schedule.course.teacher.name : "Sin profesor asignado"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="sm:text-right w-full sm:w-auto flex sm:flex-col gap-2">
                                                        <Link href={`/courses/${schedule.course.id}`} className="flex-1 sm:flex-none">
                                                            <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-1.5">
                                                                <BookOpen size={14} /> Ver Curso
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
