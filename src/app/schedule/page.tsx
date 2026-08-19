import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, User, ClipboardCheck, BookOpen, AlertTriangle, Eye } from "lucide-react";
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, isSameDay, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { WeeklyGridView } from "./components/WeeklyGridView";
import { ScheduleFilters } from "./components/ScheduleFilters";
import { getActiveRole } from "@/lib/roles";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";
import { getPeerLevels, isPeerCourse, visibleCoursesFilter } from "@/lib/peers";
import { SCHEDULED_LESSON_TOPIC } from "@/lib/practice/draft";

const daysMapping = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SchedulePage(props: PageProps) {
    const session = await getServerSession(authOptions);
    // El `id` se usa para filtrar los cursos del profesor y los vínculos del
    // tutor. En Prisma un filtro en `undefined` se ignora en vez de fallar, así
    // que sin identidad la agenda mostraría de más.
    if (!session?.user?.id) redirect("/login");

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

    const sessionUser = session.user;
    const userRoles = sessionUser.roles ?? [];
    const role = await getActiveRole(userRoles);

    let instituteId = "";
    let studentEnrollments: string[] = [];

    if (role === "STUDENT") {
        const student = await prisma.student.findUnique({
            where: { id: session.user.id },
            include: { enrollments: { select: { courseId: true } } }
        });
        if (!student) redirect("/login");
        instituteId = student.instituteId;
        studentEnrollments = student.enrollments.map(e => e.courseId);
    } else if (role === "GUARDIAN") {
        const guardianId = session.user.id;
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
        const user = await requireRole(INSTITUTE_STAFF);
        if (!user) {
            redirect("/dashboard");
        }
        instituteId = user.instituteId;
    }

    const currentUserId = session.user.id;
    const isTeacher = role === "TEACHER";
    const isStudentOrGuardian = role === "STUDENT" || role === "GUARDIAN";
    const effectiveTeacherId = isTeacher ? currentUserId : (params.teacherId as string);

    // ── Los pares del mismo nivel (FEAT-07) ──────────────────────────────────
    // El docente ve además, en gris, las clases de los otros docentes que dan su
    // mismo nivel: es para saber por dónde van sus pares. Se puede apagar, porque
    // en un instituto con varios cursos por nivel la semana se llena de tarjetas
    // ajenas y a veces uno sólo quiere ver lo suyo.
    const peerLevels = isTeacher ? await getPeerLevels(currentUserId, instituteId) : [];
    const canSeePeers = peerLevels.length > 0;
    const showPeers = params.pares !== "0";

    // Alcance de cursos del docente: los suyos, más los de sus pares si la vista
    // está encendida. Para el resto de los roles sigue mandando el filtro de
    // profesor de la barra, que sólo ven los administrativos.
    const teacherCourseScope = visibleCoursesFilter(currentUserId, peerLevels, showPeers);
    const courseScope = isTeacher
        ? teacherCourseScope
        : (effectiveTeacherId ? { teacherId: effectiveTeacherId } : {});

    // Obtenemos los cursos, profesores y aulas para los filtros
    const [allCourses, allTeachers, allClassrooms] = await Promise.all([
        prisma.course.findMany({
            where: {
                instituteId: instituteId,
                status: "ACTIVE",
                // El desplegable lista lo que la agenda muestra: si el docente ve
                // a sus pares, también puede filtrar por el curso de un par.
                ...(isTeacher ? teacherCourseScope : {}),
                ...(isStudentOrGuardian ? { id: { in: studentEnrollments } } : {})
            },
            orderBy: { name: "asc" }
        }),
        prisma.user.findMany({
            where: { 
                instituteId: instituteId,
                roles: { has: "TEACHER" },
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
    const weekStartUTC = new Date(weekStart);
    weekStartUTC.setUTCHours(0, 0, 0, 0);
    
    const weekEndUTC = addDays(weekStartUTC, 6);
    weekEndUTC.setUTCHours(23, 59, 59, 999);

    const dayStartUTC = new Date(displayDateNoon);
    dayStartUTC.setUTCHours(0, 0, 0, 0);
    const dayEndUTC = new Date(displayDateNoon);
    dayEndUTC.setUTCHours(23, 59, 59, 999);

    const lessonsWhere = view === "day"
        ? { status: "ACTIVE", date: { gte: dayStartUTC, lte: dayEndUTC } }
        : { status: "ACTIVE", date: { gte: weekStartUTC, lte: weekEndUTC } };

    const scheduleRows = await prisma.schedule.findMany({
        where: {
            course: {
                instituteId: instituteId,
                status: "ACTIVE",
                ...(activeCourseId ? { id: activeCourseId } : {}),
                ...courseScope,
                ...(activeClassroomId ? { classroomId: activeClassroomId } : {}),
                ...(isStudentOrGuardian ? { id: { in: studentEnrollments } } : {})
            }
        },
        include: {
            course: {
                include: {
                    teacher: true,
                    lessons: {
                        where: lessonsWhere
                    }
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

    // La tarjeta ajena se pinta distinto y no ofrece ninguna acción de la clase,
    // pero **muestra lo mismo que cualquier otra**: el calendario es una agenda,
    // no el lugar donde se lee lo que dio un colega. Eso se lee entrando al libro
    // de temas del curso, que está a un clic.
    //
    // El corte real no está acá sino en el servidor de cada pantalla: esto es
    // sólo para que se note de quién es la clase.
    const allSchedules = scheduleRows.map(schedule => ({
        ...schedule,
        isPeer: isTeacher && isPeerCourse(schedule.course, currentUserId, peerLevels)
    }));

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

    // `pares=0` viaja con el resto de los filtros: si el docente apagó a sus
    // pares, cambiar de semana no se los tiene que devolver.
    const filterParams = `${activeCourseId ? `&courseId=${activeCourseId}` : ""}${activeTeacherId ? `&teacherId=${activeTeacherId}` : ""}${activeClassroomId ? `&classroomId=${activeClassroomId}` : ""}${canSeePeers && !showPeers ? "&pares=0" : ""}`;

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
                    canSeePeers={canSeePeers}
                    showPeers={showPeers}
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
                                        // La clase del día puede estar colgada del horario o sólo del
                                        // curso —una clase suelta, sin `scheduleId`—. Antes se miraban
                                        // las dos para decidir si había clase pero después se leía
                                        // `schedule.lessons[0]` a secas, que en ese caso es `undefined`
                                        // y voltea la pantalla entera.
                                        const lesson = schedule.lessons?.[0] ?? schedule.course.lessons?.[0];
                                        const hasLesson = !!lesson;
                                        // «Clase Programada» es el rótulo con el que nacen las clases
                                        // generadas en tanda: quiere decir que **todavía nadie escribió
                                        // qué se dio**. Mostrarlo como si fuera el tema es lo que hace
                                        // que el par no se entere de nada.
                                        const registeredTopic = lesson && lesson.topic !== SCHEDULED_LESSON_TOPIC ? lesson.topic : null;
                                        // La clase de un par va siempre en gris, tenga tema cargado o
                                        // no: el color del curso es de quien lo dicta.
                                        const cardColor = (hasLesson && !schedule.isPeer) ? schedule.course.color : "#94a3b8";

                                        return (
                                            <Card
                                                key={schedule.id}
                                                className={`p-0 overflow-hidden border-l-4 transition-all hover:scale-[1.01] hover:shadow-lg group shadow-sm sm:shadow-md cursor-pointer ${!hasLesson ? 'border-dashed opacity-80' : ''} ${schedule.isPeer ? 'opacity-75' : ''}`}
                                                style={{
                                                    borderLeftColor: cardColor,
                                                    backgroundColor: (hasLesson && !schedule.isPeer) ? `${cardColor}08` : 'transparent'
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
                                                            <h3 className="text-lg font-bold tracking-tight text-foreground/90">
                                                                {schedule.course.name}
                                                                <span className="text-muted-foreground font-medium text-sm ml-1">({schedule.course.level || "General"})</span>
                                                                {schedule.isPeer && (
                                                                    <span className="ml-2 align-middle inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                                                                        <Eye size={10} /> Otro docente
                                                                    </span>
                                                                )}
                                                            </h3>


                                                            {registeredTopic ? (
                                                                <div className="flex flex-col gap-1 mt-1">
                                                                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                                                        <BookOpen size={14} className="text-primary" />
                                                                        {registeredTopic}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm font-medium text-muted-foreground/60 flex items-center gap-1.5 -mt-0.5">
                                                                    <AlertTriangle size={14} className="text-amber-500/50" />
                                                                    {hasLesson ? "Tema de la clase: sin registrar" : "Programación: Pendiente de registro"}
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
                                                                {schedule.isPeer
                                                                    ? <><Eye size={14} /> Ver Temas</>
                                                                    : <><BookOpen size={14} /> Ver Curso</>}
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
