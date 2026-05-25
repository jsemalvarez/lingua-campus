import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Users, GraduationCap, MapPin, ClipboardCheck, CalendarRange, AlertTriangle } from "lucide-react";
import { ScheduleList } from "./ScheduleList";
import { LessonList } from "./lessons/components/LessonList";
import { CoursePracticeMetrics } from "./lessons/components/CoursePracticeMetrics";
import { EditCourseModal } from "../components/EditCourseModal";
import { RemoveStudentButton } from "../components/RemoveStudentButton";
import { DeleteCourseButton } from "../components/DeleteCourseButton";
import { FinishCourseButton } from "../components/FinishCourseButton";
import { BadgeCheck, Info } from "lucide-react";
import { getActiveRole } from "@/lib/roles";
import { CourseReportsPanel } from "@/features/courses/CourseReportsPanel";


// TODO: Create StudentList component to handle enrollments. For now we will create an empty block
export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            teacher: { select: { id: true, name: true, email: true } },
            classroom: { select: { id: true, name: true } },
            schedules: { orderBy: { dayOfWeek: 'asc' } },
            lessons: {
                orderBy: { date: 'asc' },
                include: {
                    practice: {
                        select: {
                            speakingPhrases: true,
                            listeningText: true,
                            chatScenario: true,
                            isPublished: true,
                        }
                    }
                }
            },
            enrollments: {
                select: { id: true, status: true, student: { select: { id: true, name: true, phone: true } } },
                orderBy: { student: { name: 'asc' } }
            }
        }
    });


    // Validar que el curso existe y pertenece al instituto del usuario actual
    if (!course || course.instituteId !== user.instituteId) {
        redirect("/courses");
    }

    // Fetch available teachers for this institute (for admin teacher-edit dropdown)
    const instituteTeachers = (user.role === "ADMIN" || user.role === "SECRETARY") ? await prisma.user.findMany({
        where: { 
            instituteId: user.instituteId, 
            OR: [
                { role: "TEACHER" },
                { roles: { has: "TEACHER" } }
            ]
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    }) : [];

    const levels = await prisma.level.findMany({
        where: { instituteId: user.instituteId },
        orderBy: { name: 'asc' }
    });

    const classrooms = await prisma.classroom.findMany({
        where: { instituteId: user.instituteId },
        orderBy: { name: 'asc' }
    });

    const isTeacherOrAdmin = user.role === "ADMIN" || user.role === "SECRETARY" || user.id === course.teacher?.id;
    const isFinished = course.status === "FINISHED";

    // ── Practice metrics (only for teacher/admin view) ───────────────────────
    const publishedLessons = course.lessons.filter(l => l.practice?.isPublished);
    const publishedLessonIds = publishedLessons.map(l => l.id);

    const practiceSessions = isTeacherOrAdmin && publishedLessonIds.length > 0
        ? await prisma.practiceSession.findMany({
            where: { lessonId: { in: publishedLessonIds } },
            select: { lessonId: true, studentId: true, accuracyPct: true }
        })
        : [];

    // Group by lesson
    const practiceByLesson = publishedLessons.map(lesson => {
        const sessions = practiceSessions.filter(s => s.lessonId === lesson.id);
        const uniqueStudents = new Set(sessions.map(s => s.studentId)).size;
        const avgAcc = sessions.length > 0
            ? Math.round(sessions.reduce((s, x) => s + x.accuracyPct, 0) / sessions.length)
            : null;
        return {
            lessonId: lesson.id,
            lessonTopic: lesson.topic,
            lessonDate: lesson.date.toISOString(),
            sessionCount: sessions.length,
            studentCount: uniqueStudents,
            avgAccuracy: avgAcc,
        };
    });

    const totalEnrolled = course.enrollments.filter(e => e.status === "ACTIVE").length;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar currentActiveRole={activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* ── Encabezado Principal ── */}
                <header className="space-y-4 mb-4">
                    <Link
                        href="/courses"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Cursos
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-md text-white" style={{ backgroundColor: course.color || "#3b82f6" }}>
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                        {course.name}
                                    </h1>
                                    {(user.role === "ADMIN" || user.role === "SECRETARY") && !isFinished && (
                                        <EditCourseModal
                                            courseId={course.id}
                                            currentName={course.name}
                                            currentLevel={course.level}
                                            levels={levels}
                                            currentClassroomId={course.classroomId}
                                            classrooms={classrooms}
                                            currentTeacherId={course.teacher?.id || null}
                                            teachers={instituteTeachers}
                                            currentColor={course.color}
                                            currentStartDate={course.startDate}
                                            currentEndDate={course.endDate}
                                            currentMonthlyPrice={course.monthlyPrice}
                                            currentEnrollmentPrice={course.enrollmentPrice}
                                            currentExamPrice={course.examPrice}
                                        />
                                    )}
                                </div>
                                <p className="text-sm font-semibold mt-0.5 text-muted-foreground flex items-center gap-2 flex-wrap">
                                    Nivel: <span className="text-primary">{course.level || "General"}</span>
                                    <span className="text-border">•</span>
                                    {course.startDate && (
                                        <>
                                            <span className="text-muted-foreground">Vigencia: </span>
                                            <span className="text-primary font-bold">{new Date(course.startDate).toLocaleDateString('es-ES')}</span>
                                            {course.endDate ? (
                                                <> - <span className="text-primary font-bold">{new Date(course.endDate).toLocaleDateString('es-ES')}</span></>
                                            ) : (
                                                " en adelante"
                                            )}
                                            <span className="text-border">•</span>
                                        </>
                                    )}
                                    Aula: <span className="text-emerald-600 dark:text-emerald-400">{course.classroom?.name || "No asignada"}</span>
                                    <span className="text-border">•</span>
                                    <GraduationCap size={14} className="ml-1" /> Prof. {course.teacher?.name || "Sin Asignar"}
                                    {isFinished && (
                                        <>
                                            <span className="text-border">•</span>
                                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] uppercase font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                                <BadgeCheck size={10} /> Finalizado
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                </header>

                <div className="space-y-6 lg:space-y-8">

                    {/* FILA SUPERIOR: Horarios */}
                    <Card className="p-6 shadow-md border-border/40 overflow-hidden bg-card/60 backdrop-blur-sm">
                        <ScheduleList
                            courseId={course.id}
                            schedules={course.schedules}
                            isTeacherOrAdmin={isTeacherOrAdmin && !isFinished}
                        />
                    </Card>

                    {/* FILA INFERIOR: Clases vs Alumnos (50/50 estricto) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

                        {/* COLUMNA IZQUIERDA: Libro de Clases (Lessons) */}
                        <Card className="p-6 shadow-md border-border/40 overflow-hidden flex flex-col h-full bg-card/60 backdrop-blur-sm">
                            <div className="mb-4 shrink-0">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <CalendarRange size={20} className="text-blue-500" />
                                    Libro de Temas (Clases)
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Registro de sesiones dictadas y asistencia.
                                </p>
                            </div>
                            <div className="flex-1 min-h-0">
                                <LessonList
                                    courseId={course.id}
                                    lessons={course.lessons}
                                    schedules={course.schedules}
                                    isTeacherOrAdmin={isTeacherOrAdmin && !isFinished}
                                    courseStatus={course.status}
                                    startDate={course.startDate || undefined}
                                    endDate={course.endDate || undefined}
                                />
                            </div>
                        </Card>

                        {/* COLUMNA DERECHA: Alumnos Inscritos */}
                        <div className="flex flex-col gap-6 lg:gap-8 min-h-0">
                            <Card className="p-6 shadow-md border-border/40 overflow-hidden flex flex-col h-full bg-card/60 backdrop-blur-sm">
                                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between shrink-0">
                                        <div>
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <Users size={20} className="text-blue-500" />
                                                Alumnos Inscritos ({course.enrollments.length})
                                            </h2>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Listado oficial de estudiantes activos en este grupo.
                                            </p>
                                        </div>
                                        {!isFinished && (
                                            <Link href={`/enrollments/new?course=${course.id}`}>
                                                <div className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-sm rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap">
                                                    Inscribir Alumno
                                                </div>
                                            </Link>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[300px]">
                                        {course.enrollments.length === 0 ? (
                                            <div className="text-center p-10 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm flex flex-col items-center justify-center h-full">
                                                <Users size={32} className="mb-3 opacity-30" />
                                                Todavía no hay ningún estudiante registrado en este curso.
                                            </div>
                                        ) : (
                                            <div className="space-y-3 mt-4">
                                                {course.enrollments.map((enrol: any) => (
                                                    <div key={enrol.student.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-sm">
                                                                {enrol.student.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                {/*
                                                                 * NAVEGACIÓN CONTEXTUAL (?from= pattern)
                                                                 * ─────────────────────────────────────────
                                                                 * Pasamos la URL actual como query param `from` al navegar
                                                                 * al perfil del alumno. Esto permite que la página destino
                                                                 * muestre un botón "Volver" dinámico que lleve de regreso
                                                                 * al curso correcto, en lugar de ir siempre a /students.
                                                                 *
                                                                 * Para implementar este patrón en otro flujo:
                                                                 *   1. Aquí (origen): agregar `?from=<ruta-actual>` al href.
                                                                 *   2. En la página destino: leer `searchParams.from`,
                                                                 *      validarlo con isValidBackUrl() y usarlo como href
                                                                 *      del botón "Volver". Ver students/[id]/page.tsx.
                                                                 */}
                                                                <Link 
                                                                    href={`/students/${enrol.student.id}?from=/courses/${id}`}
                                                                    className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
                                                                >
                                                                    {enrol.student.name}
                                                                </Link>
                                                                <p className="text-xs text-muted-foreground">{enrol.student.phone || "Sin teléfono"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {enrol.status === "FINISHED" && (
                                                                <div className="px-2 py-1 rounded border border-emerald-500/30 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 uppercase tracking-tighter">
                                                                    Finalizado
                                                                </div>
                                                            )}
                                                            {enrol.status === "INCOMPLETE" && (
                                                                <div className="px-2 py-1 rounded border border-amber-500/30 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 uppercase tracking-tighter">
                                                                    Incompleto
                                                                </div>
                                                            )}
                                                            {enrol.status === "ACTIVE" && (
                                                                <div className="px-2 py-1 rounded border border-blue-500/20 text-[10px] font-bold text-blue-500 bg-blue-50/50 dark:bg-blue-950/10 uppercase tracking-tighter">
                                                                    Activo
                                                                </div>
                                                            )}
                                                            {(user.role === "ADMIN" || user.role === "SECRETARY") && enrol.status === "ACTIVE" && !isFinished && (
                                                                <RemoveStudentButton
                                                                    enrollmentId={enrol.id}
                                                                    courseId={course.id}
                                                                    studentName={enrol.student.name}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* ── PRACTICE METRICS (teacher/admin) ── */}
                    {isTeacherOrAdmin && (
                        <Card className="p-6 shadow-md border-border/40 bg-card/60 backdrop-blur-sm">
                            <CoursePracticeMetrics
                                totalEnrolled={totalEnrolled}
                                byLesson={practiceByLesson}
                            />
                        </Card>
                    )}

                    {/* ── SECCIÓN DE INFORMES ACADÉMICOS (Fase 1) ── */}
                    <CourseReportsPanel courseId={course.id} userRole={user.role} />

                    {/* ── SECCIÓN DE GESTIÓN Y PELIGRO (ANCHO COMPLETO) ── */}
                    <div className="space-y-6 lg:space-y-8 mt-12 pt-8 border-t border-border/40">
                        {/* GESTIÓN DE CICLO (WARNING) */}
                        {(user.role === "ADMIN" || user.role === "SECRETARY") && !isFinished && (
                            <Card className="border-amber-500/30 bg-amber-500/5 overflow-hidden">
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-6">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Gestión de Ciclo Académico</h3>
                                            <p className="text-sm text-amber-700/70 dark:text-amber-400/70">Esta acción afecta a todos los alumnos del curso</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="max-w-3xl">
                                            <h4 className="font-bold text-foreground text-lg">Finalizar Ciclo del Curso</h4>
                                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                Al finalizar el curso, el estado del grupo pasará a <strong>"Finalizado"</strong> y se archivará. 
                                                Todos los alumnos con estado "Activo" serán marcados automáticamente como <strong>"Finalizados"</strong>. 
                                                Esta acción es ideal para cerrar el año o un nivel específico, permitiendo mantener un historial limpio sin borrar los datos del profesor o las notas obtenidas.
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            <FinishCourseButton courseId={course.id} courseName={course.name} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* DANGER ZONE (ANCHO COMPLETO) */}
                        {(user.role === "ADMIN" || user.role === "SECRETARY") && (
                            <Card className="border-red-500/30 bg-red-500/5 overflow-hidden">
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center gap-3 text-red-600 mb-6">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Zona de Peligro</h3>
                                            <p className="text-sm text-red-600/70">Acciones irreversibles y críticas</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="max-w-3xl">
                                            <h4 className="font-bold text-foreground text-lg">Eliminar Curso por Completo</h4>
                                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                Esta acción <strong>borrará de forma irreversible</strong> todos los registros asociados: horarios, clases dictadas (asistencias/temas) e inscripciones. 
                                                Los estudiantes NO serán borrados del sistema, pero su historial vinculado a este curso desaparecerá para siempre. Solo usa esto si el curso fue creado por error.
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            <DeleteCourseButton id={course.id} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
