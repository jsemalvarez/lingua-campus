import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { StudentPracticeView } from "../dashboard/components/StudentPracticeView";
import prisma from "@/lib/prisma";

export default async function StudentPracticePage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);

    if (activeRole !== "STUDENT") redirect("/dashboard");

    // Get enrolled active courses
    const enrollments = await prisma.enrollment.findMany({
        where: { studentId: sessionUser.id, status: "ACTIVE" },
        select: { courseId: true }
    });

    const courseIds = enrollments.map((e) => e.courseId);

    // Get all published practice items from student's courses (most recent first)
    const practiceItems = courseIds.length > 0
        ? await prisma.lessonPractice.findMany({
            where: {
                isPublished: true,
                lesson: { courseId: { in: courseIds } }
            },
            include: {
                lesson: {
                    include: {
                        course: { select: { id: true, name: true, color: true } }
                    }
                },
                sessions: {
                    where: { studentId: sessionUser.id },
                    select: { type: true, accuracyPct: true, completedAt: true },
                    orderBy: { completedAt: "desc" }
                }
            },
            orderBy: { lesson: { date: "desc" } }
        })
        : [];

    // Serialize Dates for client component
    const practiceData = practiceItems.map((item) => ({
        lessonPracticeId: item.id,
        lessonId: item.lessonId,
        topic: item.lesson.topic,
        date: item.lesson.date.toISOString(),
        courseId: item.lesson.course.id,
        courseName: item.lesson.course.name,
        courseColor: item.lesson.course.color,
        speakingPhrases: item.speakingPhrases,
        listeningText: item.listeningText,
        chatScenario: item.chatScenario,
        sessions: item.sessions.map((s) => ({
            type: s.type as "SPEAKING" | "LISTENING" | "CHAT",
            accuracyPct: s.accuracyPct,
            completedAt: s.completedAt.toISOString()
        }))
    }));

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={activeRole} />
            <StudentPracticeView practiceData={practiceData} />
        </div>
    );
}
