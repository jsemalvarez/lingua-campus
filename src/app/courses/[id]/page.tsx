import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Users, GraduationCap, MapPin, ClipboardCheck, CalendarRange, AlertTriangle } from "lucide-react";
import { ScheduleList } from "./ScheduleList";
import { LessonList } from "./lessons/components/LessonList";
import { EditCourseModal } from "../components/EditCourseModal";
import { RemoveStudentButton } from "../components/RemoveStudentButton";
import { DeleteCourseButton } from "../components/DeleteCourseButton";

// TODO: Create StudentList component to handle enrollments. For now we will create an empty block
export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

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
            lessons: { orderBy: { date: 'asc' } },
            enrollments: {
                where: { status: "ACTIVE" },
                select: { id: true, student: { select: { id: true, name: true, phone: true } } },
                orderBy: { student: { name: 'asc' } }
            }
        }
    });

    // Validar que el curso existe y pertenece al instituto del usuario actual
    if (!course || course.instituteId !== user.instituteId) {
        redirect("/courses");
    }

    // Fetch available teachers for this institute (for admin teacher-edit dropdown)
    const instituteTeachers = user.role === "ADMIN" ? await prisma.user.findMany({
        where: { instituteId: user.instituteId, role: "TEACHER" },
        select: { id: true, name: true },
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

    const isTeacherOrAdmin = user.role === "ADMIN" || user.id === course.teacher?.id;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

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
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                        {course.name}
                                    </h1>
                                    {user.role === "ADMIN" && (
                                        <EditCourseModal
                                            courseId={course.id}
                                            currentName={course.name}
                                            currentLevel={course.level}
                                            levels={levels}
                                            currentClassroomId={course.classroomId}
                                            currentClassroomName={course.classroom?.name || null}
                                            classrooms={classrooms}
                                            currentTeacherId={course.teacher?.id || null}
                                            currentTeacherName={course.teacher?.name || null}
                                            teachers={instituteTeachers}
                                        />
                                    )}
                                </div>
                                <p className="text-sm font-semibold mt-0.5 text-muted-foreground flex items-center gap-2 flex-wrap">
                                    Nivel: <span className="text-primary">{course.level || "General"}</span>
                                    <span className="text-border">•</span>
                                    Aula: <span className="text-emerald-600 dark:text-emerald-400">{course.classroom?.name || "No asignada"}</span>
                                    <span className="text-border">•</span>
                                    <GraduationCap size={14} className="ml-1" /> Prof. {course.teacher?.name || "Sin Asignar"}
                                </p>
                            </div>
                        </div>

                        {/* Right Actions - Moved Attendance to Class Session (Lesson) level */}
                    </div>
                </header>

                <div className="space-y-6 lg:space-y-8">

                    {/* FILA SUPERIOR: Horarios */}
                    <Card className="p-6 shadow-md border-border/40 overflow-hidden bg-card/60 backdrop-blur-sm">
                        <ScheduleList
                            courseId={course.id}
                            schedules={course.schedules}
                            isTeacherOrAdmin={isTeacherOrAdmin}
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
                                    isTeacherOrAdmin={isTeacherOrAdmin}
                                />
                            </div>
                        </Card>

                        {/* COLUMNA DERECHA: Alumnos Inscritos y Zona Peligrosa */}
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
                                        <Link href={`/enrollments/new?course=${course.id}`}>
                                            <div className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-sm rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap">
                                                Inscribir Alumno
                                            </div>
                                        </Link>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[300px]">
                                        {course.enrollments.length === 0 ? (
                                            <div className="text-center p-10 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm flex flex-col items-center justify-center h-full">
                                                <Users size={32} className="mb-3 opacity-30" />
                                                Todavía no hay ningún estudiante registrado en este curso.
                                            </div>
                                        ) : (
                                            <div className="space-y-3 mt-4">
                                                {course.enrollments.map(enrol => (
                                                    <div key={enrol.student.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-sm">
                                                                {enrol.student.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{enrol.student.name}</p>
                                                                <p className="text-xs text-muted-foreground">{enrol.student.phone || "Sin teléfono"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-3 py-1 rounded border border-border/40 text-xs font-semibold text-muted-foreground bg-muted/20">
                                                                Activo
                                                            </div>
                                                            {user.role === "ADMIN" && (
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

                            {/* DANGER ZONE */}
                            {user.role === "ADMIN" && (
                                <Card className="border-red-500/30 bg-red-500/5 shrink-0">
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 text-red-600 mb-4">
                                            <AlertTriangle size={24} />
                                            <h3 className="text-lg font-bold">Zona de Peligro</h3>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <h4 className="font-semibold text-foreground">Eliminar Curso</h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Al eliminar el curso se borrarán de forma irreversible todos sus registros asociados, incluyendo horarios, dictados y las inscripciones de alumnos (los estudiantes seguirán existiendo en el sistema de todos modos).
                                                </p>
                                            </div>
                                            <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                                <DeleteCourseButton id={course.id} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
