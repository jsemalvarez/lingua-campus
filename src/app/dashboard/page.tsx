import { Suspense } from "react";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Users,
    BookOpen,
    DollarSign,
    GraduationCap,
    Clock,
    Plus,
    ClipboardCheck
} from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { StudentsChart } from "./components/StudentsChart";
import { AnnualFinanceChartServer } from "./components/AnnualFinanceChartServer";
import { PlaygroundChartServer } from "./components/PlaygroundChartServer";
import { GuardianDashboardView } from "./components/GuardianDashboardView";
import { getActiveRole } from "@/lib/roles";
import { StudentDashboardV2View } from "./components/StudentDashboardV2View";
import { BirthdayWidgetServer, BirthdayWidgetTeacherServer } from "./components/BirthdayWidgetServer";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        redirect("/login");
    }

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);

    // ─── GUARDIAN View ───
    if (activeRole === "GUARDIAN") {
        const guardianId = sessionUser.id;

        const guardianLinks = await prisma.guardianStudentLink.findMany({
            where: { guardianId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        institute: { select: { name: true } },
                        enrollments: {
                            where: { status: "ACTIVE" },
                            include: {
                                course: {
                                    select: {
                                        id: true,
                                        name: true,
                                        color: true,
                                        lessons: {
                                            where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
                                            orderBy: { date: 'asc' },
                                            take: 5,
                                            select: { id: true, date: true, topic: true }
                                        }
                                    }
                                }
                            }
                        },
                        attendances: {
                            orderBy: { lesson: { date: 'desc' } },
                            take: 10,
                            include: {
                                lesson: { select: { date: true, topic: true, course: { select: { name: true, color: true } } } }
                            }
                        },
                        grades: {
                            orderBy: { createdAt: 'desc' },
                            take: 5,
                            include: {
                                lesson: { select: { topic: true, course: { select: { color: true, name: true } } } }
                            }
                        },
                        fees: {
                            where: { status: { not: "PAID" } },
                            select: { originalAmount: true, paidAmount: true }
                        }
                    }
                }
            }
        });

        if (guardianLinks.length === 0) {
            // No hay vinculación aún
            return (
                <div className="min-h-screen bg-background">
                    <Navbar currentActiveRole={activeRole} />
                    <main className="container mx-auto px-4 py-20 text-center">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Users className="text-muted-foreground" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold">Portal de Tutores</h2>
                            <p className="text-muted-foreground">
                                Todavía no tenés alumnos asociados a tu cuenta. Por favor, contactate con la secretaría del instituto.
                            </p>
                        </div>
                    </main>
                </div>
            );
        }

        const students = guardianLinks.map(l => l.student);
        const instituteName = students[0]?.institute?.name || "Lingua Campus";

        // Flatten lessons
        const allLessons = guardianLinks.flatMap(l =>
            l.student.enrollments.flatMap(e =>
                e.course.lessons.map(lesson => ({
                    ...lesson,
                    color: e.course.color,
                    course: { name: e.course.name },
                    studentName: l.student.name
                }))
            )
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 6);

        // Flatten attendances
        const recentAttendances = guardianLinks.flatMap(l =>
            l.student.attendances.map((att: any) => ({
                id: att.id,
                status: att.status,
                notes: att.notes,
                date: att.lesson.date,
                topic: att.lesson.topic,
                courseName: att.lesson.course.name,
                courseColor: att.lesson.course.color,
                studentName: l.student.name
            }))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        // Flatten grades
        const recentGrades = guardianLinks.flatMap(l =>
            l.student.grades.map((g: any) => ({
                id: g.id,
                score: g.score,
                feedback: g.feedback,
                createdAt: g.createdAt,
                topic: g.lesson.topic,
                courseName: g.lesson.course.name,
                courseColor: g.lesson.course.color,
                studentName: l.student.name
            }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        // Total Debt
        const totalDebt = students.flatMap(s => s.fees)
            .reduce((acc, fee) => acc + (fee.originalAmount - fee.paidAmount), 0);

        return (
            <div className="min-h-screen bg-background pb-20">
                <Navbar currentActiveRole={activeRole} />
                <GuardianDashboardView
                    guardianName={sessionUser.name || "Tutor"}
                    instituteName={instituteName}
                    students={students}
                    upcomingLessons={allLessons}
                    recentAttendances={recentAttendances}
                    recentGrades={recentGrades}
                    totalDebt={totalDebt}
                />
            </div>
        );
    }

    // ─── STUDENT View ───
    if (activeRole === "STUDENT") {
        const student = await prisma.student.findUnique({
            where: { id: (session.user as any).id },
            include: {
                institute: { select: { name: true } },
                enrollments: {
                    where: { status: "ACTIVE" },
                    include: {
                        course: {
                            include: {
                                teacher: { select: { name: true, avatarUrl: true } },
                                schedules: { orderBy: { dayOfWeek: 'asc' } }
                            }
                        }
                    }
                },
                attendances: {
                    orderBy: { lesson: { date: 'desc' } },
                    take: 20,
                    include: {
                        lesson: {
                            include: {
                                course: { select: { name: true, color: true } }
                            }
                        }
                    }
                },
                grades: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        lesson: { select: { topic: true, course: { select: { name: true, color: true } } } }
                    }
                }
            }
        });

        if (!student) redirect("/login");

        const courseIds = student.enrollments.map(e => e.course.id);

        // Próximas clases de sus cursos
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingLessons = await prisma.lesson.findMany({
            where: {
                courseId: { in: courseIds },
                date: { gte: today }
            },
            orderBy: { date: 'asc' },
            take: 5,
            include: {
                course: {
                    include: {
                        teacher: { select: { name: true, avatarUrl: true } }
                    }
                },
                schedule: true
            }
        });

        // Estadísticas de asistencia
        const totalAttendances = await prisma.attendance.count({
            where: { studentId: student.id }
        });
        const presentCount = await prisma.attendance.count({
            where: { studentId: student.id, status: { in: ["PRESENT", "LATE"] } }
        });
        const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0;

        // Horas totales (clases asistidas)
        let totalMinutes = 0;
        student.attendances.forEach(att => {
            if (att.status === "PRESENT" || att.status === "LATE") {
                const sched = att.lesson.scheduleId ? student.enrollments.flatMap(e => e.course.schedules).find(s => s.id === att.lesson.scheduleId) : null;
                if (sched) {
                    const [h1, m1] = sched.startTime.split(":").map(Number);
                    const [h2, m2] = sched.endTime.split(":").map(Number);
                    totalMinutes += (h2 * 60 + m2) - (h1 * 60 + m1);
                } else {
                    totalMinutes += 60; // Default 1 hour
                }
            }
        });
        const practiceHours = (totalMinutes / 60).toFixed(1);

        // Cuotas pendientes
        const pendingFeesCount = await prisma.fee.count({
            where: { studentId: student.id, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } }
        });

        // Tareas pendientes
        const pendingTasks = [
            ...(pendingFeesCount > 0 ? [{ id: 'fees', title: `Pagar cuotas pendientes (${pendingFeesCount})`, type: 'FINANCE', dueDate: 'Urgente' }] : []),
            ...upcomingLessons.filter(l => l.type === 'EXAM').map(l => ({
                id: l.id,
                title: `Examen: ${l.topic}`,
                type: 'ACADEMIC',
                dueDate: l.date.toLocaleDateString()
            }))
        ];

        // Calcular edad
        let isMinor = false;
        if (student.birthDate) {
            const birth = new Date(student.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            isMinor = age < 18;
        }


        // Calcular progreso del curso principal (Maestría)
        let courseProgress = 0;
        let lessonStats = { current: 0, total: 0 };
        if (student.enrollments.length > 0) {
            const mainCourseId = student.enrollments[0].courseId;
            const total = await prisma.lesson.count({ where: { courseId: mainCourseId } });
            const passed = await prisma.lesson.count({ where: { courseId: mainCourseId, date: { lt: new Date() } } });
            courseProgress = total > 0 ? Math.round((passed / total) * 100) : 0;
            lessonStats = { current: passed, total };
        }

        // Calcular promedio general (GPA)
        const allGrades = await prisma.grade.findMany({
            where: { studentId: student.id },
            select: { score: true }
        });

        const numericGrades = allGrades
            .map(g => parseFloat(g.score || ""))
            .filter(n => !isNaN(n));

        const averageGrade = numericGrades.length > 0
            ? (numericGrades.reduce((acc, curr) => acc + curr, 0) / numericGrades.length).toFixed(1)
            : null;

        return (
            <div className="min-h-screen bg-background pb-20">
                <Navbar currentActiveRole={activeRole} />
                <StudentDashboardV2View
                    student={student}
                    attendanceRate={attendanceRate}
                    practiceHours={practiceHours}
                    upcomingLessons={upcomingLessons}
                    pendingTasks={pendingTasks}
                    isMinor={isMinor}
                    courseProgress={courseProgress}
                    lessonStats={lessonStats}
                    averageGrade={averageGrade}
                />
            </div>
        );
    }

    // Flujo normal para Admin/Teacher
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, role: true, instituteId: true, institute: { select: { name: true } } }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/admin/institutes");
    }

    const isActiveTeacher = activeRole === "TEACHER";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ─── TEACHER-specific dashboard ───
    if (isActiveTeacher) {
        // Cursos asignados al profesor con sus horarios
        const teacherCourses = await prisma.course.findMany({
            where: { teacherId: user.id, instituteId: user.instituteId, status: "ACTIVE" },
            include: {
                schedules: {
                    select: { dayOfWeek: true, startTime: true, endTime: true, room: true },
                    orderBy: { dayOfWeek: 'asc' }
                }
            }
        });
        const teacherCourseIds = teacherCourses.map(c => c.id);

        // Estudiantes inscritos en sus cursos
        const myStudentsCount = await prisma.enrollment.count({
            where: {
                courseId: { in: teacherCourseIds },
                status: "ACTIVE",
                student: { status: "ACTIVE" }
            }
        });

        // Próximas clases solo de sus cursos, incluyendo horario y aula
        const myUpcomingLessons = await prisma.lesson.findMany({
            where: {
                courseId: { in: teacherCourseIds },
                date: { gte: today }
            },
            orderBy: { date: 'asc' },
            take: 10,
            include: {
                course: { select: { name: true, color: true } },
                schedule: { select: { startTime: true, endTime: true, room: true } }
            }
        });

        const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        const teacherStats = [
            { label: "Mis Cursos", value: teacherCourses.length.toString(), icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Mis Estudiantes", value: myStudentsCount.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        ];

        return (
            <div className="min-h-screen bg-background pb-24">
                <Navbar currentActiveRole={activeRole} />
                <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span
                                className="font-black uppercase tracking-widest inline-flex items-center gap-2 mb-2 select-none"
                                style={{
                                    color: "#e0f7ff",
                                    textShadow: "0 0 4px rgba(0, 240, 255, 0.6), 0 0 12px rgba(0, 240, 255, 0.45), 0 0 25px rgba(2, 132, 199, 0.35)",
                                    WebkitTextStroke: "0.5px rgba(0, 240, 255, 0.8)",
                                    letterSpacing: "0.2em"
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
                                {user.institute?.name || "Instituto"}
                            </span>
                            <h1 className="text-3xl font-bold tracking-tight mt-1">Panel de Control</h1>
                            <p className="text-muted-foreground mt-1">
                                Bienvenido/a de nuevo, {user.name.split(" ")[0]}. Esto está pasando hoy.
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {teacherStats.map((stat, i) => (
                            <Card variant="premium-glass" key={i} className="p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                    </div>
                                    <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                        <stat.icon size={24} />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Birthday Widget - Teacher */}
                    <Suspense fallback={<div className="h-32 rounded-xl bg-muted/40 animate-pulse" />}>
                        <BirthdayWidgetTeacherServer
                            instituteId={user.instituteId!}
                            courseIds={teacherCourseIds}
                        />
                    </Suspense>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Mis Cursos */}
                        <Card variant="premium-glass" className="p-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                <BookOpen className="text-purple-500" size={20} /> Mis Cursos
                            </h3>
                            <div className="space-y-3">
                                {teacherCourses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic text-center py-4">No tenés cursos asignados actualmente.</p>
                                ) : teacherCourses.map((course) => (
                                    <Link key={course.id} href={`/courses/${course.id}`} className="block">
                                        <div className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-sm">{course.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {course.level || "Sin nivel"}
                                                    </p>
                                                </div>
                                            </div>
                                            {course.schedules.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {course.schedules.map((s, i) => (
                                                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                                                            <Clock size={10} /> {dayNames[s.dayOfWeek]} {s.startTime}–{s.endTime}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </Card>

                        {/* Próximas Clases del profesor */}
                        <Card variant="premium-glass" className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Clock className="text-blue-500" size={20} /> Mis Próximas Clases
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {myUpcomingLessons.length === 0 ? (
                                    <div className="text-center py-8 space-y-3">
                                        <p className="text-sm text-muted-foreground italic">No hay clases programadas próximamente.</p>
                                        <p className="text-xs text-muted-foreground">Si ya configuraste los horarios de tus cursos, asegurate de generar la agenda.</p>
                                        <div className="pt-2">
                                            <Link href="/courses">
                                                <Button variant="outline" size="sm" className="text-xs">
                                                    Ir a mis cursos para generar agenda
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ) : myUpcomingLessons.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-all border-l-4 group relative"
                                        style={{ borderLeftColor: lesson.course.color || "#3b82f6" }}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <Link href={`/courses/${lesson.courseId}`} className="hover:underline decoration-primary/30 underline-offset-2 transition-all">
                                                <span className="font-bold text-sm text-foreground/90">{lesson.course.name}</span>
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {lesson.schedule?.startTime || '--:--'}</span>
                                                {lesson.schedule?.room && (
                                                    <span className="flex items-center gap-1">• {lesson.schedule.room}</span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground/80 line-clamp-1">{lesson.topic}</span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link href={`/courses/${lesson.courseId}/lessons/${lesson.id}/attendance`} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <Button variant="outline" size="sm" className="h-8 px-2 text-[10px] font-bold bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 flex items-center shadow-sm">
                                                    <ClipboardCheck size={14} /> Asis.
                                                </Button>
                                            </Link>
                                            <div className="text-[10px] font-bold tabular-nums bg-muted px-2 py-1.5 rounded-md sm:group-hover:hidden transition-all whitespace-nowrap">
                                                {new Date(lesson.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }

    // ─── ADMIN dashboard (sin cambios) ───

    // 1. Get total students for institute
    const totalStudents = await prisma.student.count({
        where: { instituteId: user.instituteId, status: "ACTIVE" }
    });

    // 2. Total active courses
    const totalCourses = await prisma.course.count({
        where: { instituteId: user.instituteId }
    });

    // 3. Teachers count
    const totalTeachers = await prisma.user.count({
        where: {
            instituteId: user.instituteId,
            OR: [
                { role: "TEACHER" },
                { roles: { has: "TEACHER" } }
            ]
        }
    });

    // 4. Current month income
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const monthlyFees = await prisma.fee.findMany({
        where: {
            instituteId: user.instituteId,
            status: { in: ["PAID", "PARTIAL"] },
            year: currentYear,
            month: currentMonth
        },
        select: { paidAmount: true }
    });
    const monthlyIncome = monthlyFees.reduce((acc, curr) => acc + curr.paidAmount, 0);

    const isSecretary = activeRole === "SECRETARY";

    // 7. Get all Active Enrollments for context
    const activeEnrollments = await prisma.enrollment.findMany({
        where: {
            course: { instituteId: user.instituteId },
            status: 'ACTIVE',
            student: { status: 'ACTIVE' }
        },
        include: {
            course: { select: { name: true, color: true } }
        }
    });

    const enrolledStudentIds = new Set<string>();
    activeEnrollments.forEach(enrollment => {
        enrolledStudentIds.add(enrollment.studentId);
    });
    const enrolledStudentsCount = enrolledStudentIds.size;

    const stats = [
        { label: "Estudiantes Activos", value: totalStudents.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "En Cursos", value: enrolledStudentsCount.toString(), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Cursos Activos", value: totalCourses.toString(), icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Profesores", value: totalTeachers.toString(), icon: GraduationCap, color: "text-orange-600", bg: "bg-orange-50" },
        ...(!isSecretary ? [{ label: "Ingresos del Mes", value: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monthlyIncome), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" }] : []),
    ];

    // 5. Fetch upcoming lessons
    const upcomingLessons = await prisma.lesson.findMany({
        where: {
            course: { instituteId: user.instituteId },
            date: { gte: today }
        },
        orderBy: { date: 'asc' },
        take: 3,
        include: {
            course: { select: { name: true, teacher: { select: { name: true } } } }
        }
    });

    // 6. Fetch recent payments
    const recentPayments = await prisma.fee.findMany({
        where: {
            instituteId: user.instituteId,
            status: { in: ["PAID", "PARTIAL"] },
            paidAmount: { gt: 0 }
        },
        orderBy: { datePaid: 'desc' },
        take: 3,
        include: {
            student: { select: { name: true } }
        }
    });

    const getMonthName = (month: number) => {
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return months[month - 1] || "";
    };

    // Grouping for chart
    const courseInfo: Record<string, { count: number; color: string }> = {};
    activeEnrollments.forEach(enrollment => {
        const courseName = enrollment.course.name;
        if (!courseInfo[courseName]) {
            courseInfo[courseName] = { count: 0, color: enrollment.course.color || "#3b82f6" };
        }
        courseInfo[courseName].count += 1;
    });

    const chartData = Object.entries(courseInfo).map(([name, info]) => ({
        name,
        studentCount: info.count,
        color: info.color
    }));

    // Find students without any ACTIVE courses
    const studentsWithoutCourses = totalStudents - enrolledStudentIds.size;
    if (studentsWithoutCourses > 0) {
        chartData.push({
            name: "Sin Curso Asignado",
            studentCount: studentsWithoutCourses,
            color: "#9ca3af" // gris neutral (gray-400)
        });
    }

    // Sort by largest to smallest student count for better UI flow
    chartData.sort((a, b) => b.studentCount - a.studentCount);

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={activeRole} />
            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span
                            className="font-black uppercase tracking-widest inline-flex items-center gap-2 mb-2 select-none"
                            style={{
                                color: "#e0f7ff",
                                textShadow: "0 0 4px rgba(0, 240, 255, 0.6), 0 0 12px rgba(0, 240, 255, 0.45), 0 0 25px rgba(2, 132, 199, 0.35)",
                                WebkitTextStroke: "0.5px rgba(0, 240, 255, 0.8)",
                                letterSpacing: "0.2em"
                            }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
                            {user.institute?.name || "Instituto"}
                        </span>
                        <h1 className="text-3xl font-bold tracking-tight mt-1">Panel de Control</h1>
                        <p className="text-muted-foreground mt-1">
                            Bienvenido/a de nuevo, {user.name.split(" ")[0]}. Esto está pasando hoy.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className={`grid gap-4 md:grid-cols-2 ${stats.length === 3 ? "lg:grid-cols-3" :
                    stats.length === 4 ? "lg:grid-cols-4" :
                        "lg:grid-cols-3 xl:grid-cols-5"
                    }`}>
                    {stats.map((stat, i) => (
                        <Card key={i} variant="premium-glass" className="p-6 !bg-gradient-to-b !from-sky-600 !to-blue-950 dark:!from-blue-950 dark:!to-sky-500 !border-none relative overflow-hidden group">
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <p className="text-sm font-medium text-sky-100/80">{stat.label}</p>
                                    <h3 className="text-3xl font-bold mt-1 text-white tracking-tight">{stat.value}</h3>
                                </div>
                                <div className="bg-white/10 text-white p-3 rounded-xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                    <stat.icon size={24} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Birthday Widget - Admin/Secretary */}
                <Suspense fallback={<div className="h-32 rounded-xl bg-muted/40 animate-pulse" />}>
                    <BirthdayWidgetServer instituteId={user.instituteId!} />
                </Suspense>

                {/* Enhanced Wow-Factor Graphics Section */}
                <div className="mb-6 space-y-6">
                    <StudentsChart data={chartData} totalActive={totalStudents} />
                    {!isSecretary && (
                        <Suspense fallback={<Card className="h-[450px] w-full animate-pulse bg-muted/50 rounded-xl" />}>
                            <AnnualFinanceChartServer instituteId={user.instituteId} />
                        </Suspense>
                    )}
                    <Suspense fallback={<Card className="h-[480px] w-full animate-pulse bg-muted/50 rounded-xl" />}>
                        <PlaygroundChartServer instituteId={user.instituteId} />
                    </Suspense>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card variant="premium-glass" className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Clock className="text-blue-500" size={20} /> Próximas Clases
                            </h3>
                            <Button variant="ghost" size="sm">Ver todo</Button>
                        </div>
                        <div className="space-y-4">
                            {upcomingLessons.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic text-center py-4">No hay próximas clases programadas.</p>
                            ) : upcomingLessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{lesson.course.name}</span>
                                        <span className="text-xs text-muted-foreground">Prof. {lesson.course.teacher?.name || 'N/A'} • {lesson.topic}</span>
                                    </div>
                                    <div className="text-sm font-semibold tabular-nums">
                                        {new Date(lesson.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card variant="premium-glass" className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <DollarSign className="text-green-500" size={20} /> Pagos Recientes
                            </h3>
                            <Link href="/payments" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Ver todo</Link>
                        </div>
                        <div className="space-y-4">
                            {recentPayments.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic text-center py-4">No hay pagos recientes.</p>
                            ) : recentPayments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{payment.student.name || 'Sin nombre'}</span>
                                        <span className="text-xs text-muted-foreground">Cuota {getMonthName(payment.month)} {payment.year}</span>
                                    </div>
                                    <div className="text-sm font-bold text-green-600">
                                        +{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(payment.paidAmount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
