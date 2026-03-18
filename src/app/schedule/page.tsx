import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

const daysMapping = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function SchedulePage({
    searchParams
}: {
    searchParams: Promise<{ 
        view?: string; 
        date?: string;
        courseId?: string;
        teacherId?: string;
        classroomId?: string;
    }>
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const params = await searchParams;
    const view = params.view || "week";

    // Parse the date from URL or use today
    let baseDate = new Date();
    if (params.date) {
        const parsed = parseISO(params.date);
        if (isValid(parsed)) {
            baseDate = parsed;
        }
    }

    // CRITICAL: Normalize to UTC Noon to avoid timezone shifts (e.g., UTC-3)
    // and ensure perfect matching with @db.Date records
    const displayDateNoon = new Date(baseDate);
    displayDateNoon.setUTCHours(12, 0, 0, 0);

    const dateStr = format(displayDateNoon, "yyyy-MM-dd");
    const isToday = isSameDay(displayDateNoon, new Date());

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // Obtenemos los cursos, profesores y aulas para los filtros
    const [allCourses, allTeachers, allClassrooms] = await Promise.all([
        prisma.course.findMany({
            where: { instituteId: user.instituteId, status: "ACTIVE" },
            orderBy: { name: "asc" }
        }),
        prisma.user.findMany({
            where: { instituteId: user.instituteId, role: "TEACHER", status: "ACTIVE" },
            orderBy: { name: "asc" }
        }),
        prisma.classroom.findMany({
            where: { instituteId: user.instituteId },
            orderBy: { name: "asc" }
        })
    ]);

    const activeCourseId = params.courseId;
    const activeTeacherId = params.teacherId;
    const activeClassroomId = params.classroomId;

    const displayDayIndex = displayDateNoon.getUTCDay();

    // If weekly view, fetch lessons for the whole week
    const weekStart = startOfWeek(displayDateNoon, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const weekStartNoon = new Date(weekStart);
    weekStartNoon.setUTCHours(12, 0, 0, 0);
    const weekEndNoon = new Date(weekEnd);
    weekEndNoon.setUTCHours(12, 0, 0, 0);

    const lessonsWhere = view === "day" 
        ? { date: displayDateNoon }
        : { date: { gte: weekStartNoon, lte: weekEndNoon } };

    // Get all scheduled class templates
    const allSchedules = await prisma.schedule.findMany({
        where: {
            course: {
                instituteId: user.instituteId,
                status: "ACTIVE",
                // Apply optional filters
                ...(activeCourseId ? { id: activeCourseId } : {}),
                ...(activeTeacherId ? { teacherId: activeTeacherId } : {}),
                ...(activeClassroomId ? { classroomId: activeClassroomId } : {}),
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

    // Filter by day if in "day" view
    const schedules = view === "day"
        ? allSchedules.filter(s => {
            const isCorrectDay = s.dayOfWeek === displayDayIndex;
            if (!isCorrectDay) return false;

            // @ts-ignore - Prisma types might be lagging in IDE
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

    // Navigation calculation
    const prevDate = view === "day" ? subDays(displayDateNoon, 1) : subWeeks(displayDateNoon, 1);
    const nextDate = view === "day" ? addDays(displayDateNoon, 1) : addWeeks(displayDateNoon, 1);

    const filterParams = `${activeCourseId ? `&courseId=${activeCourseId}` : ""}${activeTeacherId ? `&teacherId=${activeTeacherId}` : ""}${activeClassroomId ? `&classroomId=${activeClassroomId}` : ""}`;

    const prevUrl = `/schedule?view=${view}&date=${format(prevDate, "yyyy-MM-dd")}${filterParams}`;
    const nextUrl = `/schedule?view=${view}&date=${format(nextDate, "yyyy-MM-dd")}${filterParams}`;


    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

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

                {/* Date Navigation Control */}
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

                <div className="grid gap-8 lg:grid-cols-4">
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <Card className="p-5 bg-card border-border/60 shadow-sm rounded-2xl">
                            <h3 className="text-sm font-bold mb-5 flex items-center gap-2 text-foreground/80">
                                <Users className="text-primary" size={16} /> Filtros de Búsqueda
                            </h3>
                            
                            <form method="GET" action="/schedule" className="space-y-5">
                                <input type="hidden" name="view" value={view} />
                                <input type="hidden" name="date" value={dateStr} />

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Curso</label>
                                    <select 
                                        name="courseId" 
                                        defaultValue={activeCourseId || ""}
                                        className="w-full bg-muted/30 border-border/40 rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                    >
                                        <option value="">Todos los Cursos</option>
                                        {allCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Profesor</label>
                                    <select 
                                        name="teacherId" 
                                        defaultValue={activeTeacherId || ""}
                                        className="w-full bg-muted/30 border-border/40 rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                    >
                                        <option value="">Todos los Profesores</option>
                                        {allTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Aula</label>
                                    <select 
                                        name="classroomId" 
                                        defaultValue={activeClassroomId || ""}
                                        className="w-full bg-muted/30 border-border/40 rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                    >
                                        <option value="">Todas las Aulas</option>
                                        {allClassrooms.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                                    </select>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <Button type="submit" className="flex-1 rounded-xl h-10 font-bold text-xs bg-primary hover:bg-primary/90">
                                        Aplicar Filtros
                                    </Button>
                                    {(activeCourseId || activeTeacherId || activeClassroomId) && (
                                        <Link href={`/schedule?view=${view}&date=${dateStr}`} className="flex-1">
                                            <Button type="button" variant="outline" className="w-full rounded-xl h-10 font-bold text-xs">
                                                Limpiar
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </form>
                        </Card>

                        <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 blur-2xl rounded-full -mr-10 -mt-10" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Estadística Rápida</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-foreground">{schedules.length}</span>
                                <span className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Clases Encontradas</span>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Grid or Daily List */}
                    <div className="lg:col-span-3 space-y-4">
                        {schedules.length === 0 ? (
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
                                        // @ts-ignore
                                        const hasLesson = schedule.lessons && schedule.lessons.length > 0;
                                        const cardColor = hasLesson ? schedule.course.color : "#94a3b8"; // SLATE-400 for empty slots

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
                                                                    {/* @ts-ignore */}
                                                                    {schedule.lessons[0].content && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-1 italic">
                                                                            {/* @ts-ignore */}
                                                                            {schedule.lessons[0].content}
                                                                        </p>
                                                                    )}
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
                                                        {hasLesson ? (
                                                            <Link
                                                                // @ts-ignore
                                                                href={`/courses/${schedule.course.id}/lessons/${schedule.lessons[0].id}/attendance`}
                                                                className="flex-1 sm:flex-none"
                                                            >
                                                                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/20 transition-all flex items-center justify-center gap-1.5">
                                                                    <ClipboardCheck size={14} /> Asistencia
                                                                </Button>
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                href={`/courses/${schedule.course.id}`}
                                                                className="flex-1 sm:flex-none"
                                                            >
                                                                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-1.5">
                                                                    <BookOpen size={14} /> Ir al Curso
                                                                </Button>
                                                            </Link>
                                                        )}
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
