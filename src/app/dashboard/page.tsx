import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
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
    Plus
} from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/login");
    }

    // Si es estudiante, armamos una vista personalizada
    if ((session.user as any).role === "STUDENT") {
        const student = await prisma.student.findUnique({
            where: {
                email_instituteId: {
                    email: session.user.email!,
                    instituteId: session.user.instituteId!
                }
            },
            select: { id: true, name: true, instituteId: true }
        });

        if (!student) redirect("/login");

        // Cursos del estudiante
        const enrollments = await prisma.enrollment.findMany({
            where: { studentId: student.id, status: "ACTIVE" },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        level: true,
                        teacher: { select: { name: true } },
                        schedules: { select: { dayOfWeek: true, startTime: true, endTime: true }, orderBy: { dayOfWeek: 'asc' } }
                    }
                }
            }
        });

        const courseIds = enrollments.map(e => e.course.id);

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
                course: { select: { name: true } }
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

        // Cuotas pendientes
        const pendingFees = await prisma.fee.count({
            where: { studentId: student.id, status: { in: ["PENDING", "OVERDUE"] } }
        });

        const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        const studentStats = [
            { label: "Mis Cursos", value: enrollments.length.toString(), icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Asistencia", value: totalAttendances > 0 ? `${attendanceRate}%` : "—", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Cuotas Pendientes", value: pendingFees.toString(), icon: DollarSign, color: pendingFees > 0 ? "text-amber-600" : "text-green-600", bg: pendingFees > 0 ? "bg-amber-50" : "bg-green-50" },
        ];

        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">¡Hola, {student.name.split(" ")[0]}!</h1>
                        <p className="text-muted-foreground mt-1">
                            Aquí tenés un resumen de tu actividad académica.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {studentStats.map((stat, i) => (
                            <Card key={i} className="p-6 hover:shadow-md transition-shadow">
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

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Mis Cursos */}
                        <Card className="p-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                <BookOpen className="text-purple-500" size={20} /> Mis Cursos
                            </h3>
                            <div className="space-y-3">
                                {enrollments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic text-center py-4">No estás inscripto en ningún curso actualmente.</p>
                                ) : enrollments.map((enrol) => (
                                    <div key={enrol.course.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm">{enrol.course.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {enrol.course.level || "Sin nivel"} • Prof. {enrol.course.teacher?.name || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        {enrol.course.schedules.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {enrol.course.schedules.map((s, i) => (
                                                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                        {dayNames[s.dayOfWeek]} {s.startTime}–{s.endTime}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Próximas Clases */}
                        <Card className="p-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                <Clock className="text-blue-500" size={20} /> Próximas Clases
                            </h3>
                            <div className="space-y-3">
                                {upcomingLessons.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic text-center py-4">No hay próximas clases programadas.</p>
                                ) : upcomingLessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{lesson.course.name}</span>
                                            <span className="text-xs text-muted-foreground">{lesson.topic}</span>
                                        </div>
                                        <div className="text-sm font-semibold tabular-nums">
                                            {new Date(lesson.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
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

    // Flujo normal para Admin/Teacher
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/admin/institutes");
    }

    const isTeacher = user.role === "TEACHER";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ─── TEACHER-specific dashboard ───
    if (isTeacher) {
        // Cursos asignados al profesor
        const teacherCourses = await prisma.course.findMany({
            where: { teacherId: user.id, instituteId: user.instituteId },
            select: { id: true, name: true }
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

        // Próximas clases solo de sus cursos
        const myUpcomingLessons = await prisma.lesson.findMany({
            where: {
                courseId: { in: teacherCourseIds },
                date: { gte: today }
            },
            orderBy: { date: 'asc' },
            take: 5,
            include: {
                course: { select: { name: true } }
            }
        });

        const teacherStats = [
            { label: "Mis Cursos", value: teacherCourses.length.toString(), icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Mis Estudiantes", value: myStudentsCount.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        ];

        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
                            <p className="text-muted-foreground mt-1">
                                Bienvenido de nuevo, {user.name || "profesor"}. Aquí tenés un resumen de tus cursos.
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {teacherStats.map((stat, i) => (
                            <Card key={i} className="p-6 hover:shadow-md transition-shadow">
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

                    {/* Próximas Clases del profesor */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Clock className="text-blue-500" size={20} /> Mis Próximas Clases
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {myUpcomingLessons.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic text-center py-4">No tenés próximas clases programadas.</p>
                            ) : myUpcomingLessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{lesson.course.name}</span>
                                        <span className="text-xs text-muted-foreground">{lesson.topic}</span>
                                    </div>
                                    <div className="text-sm font-semibold tabular-nums">
                                        {new Date(lesson.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
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
            role: "TEACHER"
        }
    });

    // 4. Current month income
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const monthlyFees = await prisma.fee.findMany({
        where: {
            instituteId: user.instituteId,
            status: "PAID",
            year: currentYear,
            month: currentMonth
        },
        select: { amount: true }
    });
    const monthlyIncome = monthlyFees.reduce((acc, curr) => acc + curr.amount, 0);

    const stats = [
        { label: "Estudiantes Activos", value: totalStudents.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Cursos Activos", value: totalCourses.toString(), icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Profesores", value: totalTeachers.toString(), icon: GraduationCap, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Ingresos del Mes", value: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monthlyIncome), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
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
            status: "PAID"
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

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
                        <p className="text-muted-foreground mt-1">
                            Bienvenido de nuevo, administrador. Esto está pasando en Lingua Campus hoy.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <Card key={i} className="p-6 hover:shadow-md transition-shadow">
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

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
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

                    <Card className="p-6">
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
                                        +{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(payment.amount)}
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
