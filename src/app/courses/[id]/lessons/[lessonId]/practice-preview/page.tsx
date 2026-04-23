import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { StudentPracticeView } from "@/app/dashboard/components/StudentPracticeView";
import prisma from "@/lib/prisma";

export default async function TeacherPracticePreviewPage(props: { params: Promise<{ id: string; lessonId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);

    // Only allow teachers, admins or secretaries to view this preview
    if (activeRole !== "TEACHER" && activeRole !== "ADMIN" && activeRole !== "SUPERADMIN" && activeRole !== "SECRETARY") {
        redirect("/dashboard");
    }

    // Get the specific practice for this lesson
    const practiceItem = await prisma.lessonPractice.findUnique({
        where: { lessonId: params.lessonId },
        include: {
            lesson: {
                include: {
                    course: { select: { id: true, name: true, color: true } }
                }
            }
        }
    });

    if (!practiceItem) {
        // If there's no practice, redirect back to the lesson list
        redirect(`/courses/${params.id}`);
    }

    // Serialize Dates for client component. 
    // We pass an empty sessions array so the teacher always starts fresh.
    const practiceData = [{
        lessonPracticeId: practiceItem.id,
        lessonId: practiceItem.lessonId,
        topic: practiceItem.lesson.topic,
        date: practiceItem.lesson.date.toISOString(),
        courseId: practiceItem.lesson.course.id,
        courseName: practiceItem.lesson.course.name,
        courseColor: practiceItem.lesson.course.color,
        speakingPhrases: practiceItem.speakingPhrases,
        listeningText: practiceItem.listeningText,
        chatScenario: practiceItem.chatScenario,
        sessions: [] // Always empty for preview
    }];

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={activeRole} />
            <StudentPracticeView practiceData={practiceData} isPreview={true} />
        </div>
    );
}
