import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { requireLessonReadAccess } from "@/lib/lessonAccess";
import { StudentPracticeView } from "@/app/dashboard/components/StudentPracticeView";
import prisma from "@/lib/prisma";

export default async function TeacherPracticePreviewPage(props: { params: Promise<{ id: string; lessonId: string }> }) {
    const params = await props.params;

    // Antes acá sólo se miraba el rol: cualquier miembro del personal —de
    // cualquier instituto— veía la práctica de cualquier clase con sólo tener el
    // `lessonId`, y el `courseId` de la URL no se verificaba contra la clase.
    //
    // Los pares van con la lista vacía a propósito: la vista de par llega hasta
    // el tema de la clase, y la práctica es material del docente que la armó.
    const access = await requireLessonReadAccess(params.lessonId, params.id, []);
    if ("error" in access) {
        redirect(`/courses/${params.id}`);
    }

    const activeRole = access.auth.activeRole;

    // Get the specific practice for this lesson
    const practiceItem = await prisma.lessonPractice.findFirst({
        where: { lessonId: params.lessonId, lesson: { status: "ACTIVE" } },
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
