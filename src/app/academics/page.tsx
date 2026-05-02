import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { StudentAcademicsView } from "../dashboard/components/StudentAcademicsView";

export default async function StudentAcademicsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);

    if (activeRole !== "STUDENT") redirect("/dashboard");

    const student = await prisma.student.findUnique({
        where: { id: (session.user as any).id },
        include: {
            institute: { select: { name: true } },
            enrollments: {
                include: {
                    course: {
                        include: {
                            teacher: { select: { name: true, avatarUrl: true } },
                            schedules: { orderBy: { dayOfWeek: "asc" } }
                        }
                    }
                }
            },
            attendances: {
                orderBy: { lesson: { date: "desc" } },
                take: 50,
                include: {
                    lesson: {
                        include: { course: { select: { name: true, color: true } } }
                    }
                }
            },
            grades: {
                orderBy: { createdAt: "desc" },
                take: 20,
                include: {
                    lesson: { select: { topic: true, course: { select: { name: true, color: true } } } }
                }
            }
        }
    });

    if (!student) redirect("/login");

    const courseIds = student.enrollments.map(e => e.course.id);

    // Próximas clases
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingLessons = await prisma.lesson.findMany({
        where: { courseId: { in: courseIds }, date: { gte: today } },
        orderBy: { date: "asc" },
        take: 5,
        include: {
            course: { include: { teacher: { select: { name: true, avatarUrl: true } } } },
            schedule: true
        }
    });

    // Tareas pendientes
    const pendingFeesCount = await prisma.fee.count({
        where: { studentId: student.id, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } }
    });

    const pendingTasks = [
        ...(pendingFeesCount > 0 ? [{ id: "fees", title: `Pagar cuotas pendientes (${pendingFeesCount})`, type: "FINANCE", dueDate: "Urgente" }] : []),
        ...upcomingLessons.filter(l => l.type === "EXAM").map(l => ({
            id: l.id, title: `Examen: ${l.topic}`, type: "ACADEMIC",
            dueDate: l.date.toLocaleDateString()
        }))
    ];

    // Estadísticas académicas
    let academicStats = { totalLessons: 0, passedLessons: 0, presentsCount: 0, absentsCount: 0 };

    if (student.enrollments.length > 0) {
        const mainCourseId = student.enrollments[0].courseId;
        academicStats.totalLessons = await prisma.lesson.count({ where: { courseId: mainCourseId } });
        academicStats.passedLessons = await prisma.lesson.count({ where: { courseId: mainCourseId, date: { lt: new Date() } } });
        academicStats.presentsCount = await prisma.attendance.count({ where: { studentId: student.id, status: { in: ["PRESENT", "LATE"] } } });
        academicStats.absentsCount = await prisma.attendance.count({ where: { studentId: student.id, status: "ABSENT" } });
    }

    // ── Métricas de práctica ──────────────────────────────────────────────────
    const rawSessions = await prisma.practiceSession.findMany({
        where: { studentId: student.id },
        include: {
            lesson: { select: { topic: true, course: { select: { name: true, color: true } } } }
        },
        orderBy: { completedAt: "desc" },
        take: 20
    });

    const practiceSessions = rawSessions.map(s => ({
        id: s.id,
        type: s.type as string,
        accuracyPct: s.accuracyPct,
        phrasesAttempted: s.phrasesAttempted,
        phrasesCorrect: s.phrasesCorrect,
        durationSeconds: s.durationSeconds,
        weakArea: s.weakArea,
        completedAt: s.completedAt.toISOString(),
        lessonTopic: s.lesson.topic,
        courseName: s.lesson.course.name,
        courseColor: s.lesson.course.color,
    }));

    const practiceMetrics = {
        totalSessions: practiceSessions.length,
        avgAccuracy: practiceSessions.length > 0
            ? Math.round(practiceSessions.reduce((s, x) => s + x.accuracyPct, 0) / practiceSessions.length)
            : null,
        totalMinutesPracticed: Math.round(
            practiceSessions.reduce((s, x) => s + x.durationSeconds, 0) / 60
        ),
        recentSessions: practiceSessions.slice(0, 8),
    };

    // Edad
    let isMinor = false;
    if (student.birthDate) {
        const birth = new Date(student.birthDate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
        isMinor = age < 18;
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={activeRole} />
            <div className="container mx-auto px-6 pt-12">
                <h1 className="text-3xl font-black italic uppercase tracking-tight">Hub de Progreso</h1>
                <p className="text-muted-foreground font-medium">Análisis detallado de tu trayectoria académica.</p>
            </div>
            <StudentAcademicsView
                student={student}
                upcomingLessons={upcomingLessons}
                pendingTasks={pendingTasks}
                isMinor={isMinor}
                recentGrades={student.grades}
                academicStats={academicStats}
                practiceMetrics={practiceMetrics}
            />
        </div>
    );
}
