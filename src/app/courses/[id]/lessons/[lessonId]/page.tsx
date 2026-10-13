import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import prisma from "@/lib/prisma";
import { requireLessonReadAccess } from "@/lib/lessonAccess";
import { sanitizePlan } from "@/lib/lessonPlan/plan";
import { courseAgeRange } from "@/lib/lessonPlan/ages";
import { LessonPageView } from "./LessonPageView";

export const metadata = {
    title: "Clase",
};

/**
 * La página de la clase (PED-09): reemplaza a los modales de crear y editar
 * clase. Junta lo que el docente piensa de una clase —qué se da, las palabras,
 * cómo la arma en cuatro momentos y la práctica que les queda a los alumnos— en
 * un lugar que guarda solo.
 *
 * La ven el docente del curso y la administración del instituto, decidido el
 * 2026-10-03. Los pares del mismo nivel no entran (la lista de niveles va vacía,
 * igual que en la vista previa de la práctica): ellos leen el libro de temas, y
 * esto es material de quien arma la clase. Los alumnos ven sólo la práctica,
 * cuando se publica, desde su propio campus.
 *
 * Es sólo para clases. Los TP y los exámenes no tienen práctica y siguen con su
 * modal en el libro de temas.
 */
export default async function LessonPage(props: { params: Promise<{ id: string; lessonId: string }> }) {
    const { id: courseId, lessonId } = await props.params;

    const access = await requireLessonReadAccess(lessonId, courseId, []);
    if ("error" in access) redirect(`/courses/${courseId}`);

    const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, courseId, status: "ACTIVE" },
        select: {
            id: true,
            type: true,
            date: true,
            topic: true,
            content: true,
            scheduleId: true,
            practice: {
                select: { speakingPhrases: true, listeningText: true, chatScenario: true, isPublished: true },
            },
            plan: { select: { focus: true, words: true, moments: true, ideasBasis: true } },
            course: {
                select: {
                    name: true,
                    level: true,
                    status: true,
                    teacher: { select: { name: true } },
                    classroom: { select: { name: true } },
                    schedules: {
                        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true },
                        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
                    },
                },
            },
        },
    });

    if (!lesson) redirect(`/courses/${courseId}`);
    if (lesson.type !== "CLASS") redirect(`/courses/${courseId}`);

    const [studentCount, ages] = await Promise.all([
        prisma.enrollment.count({
            where: { courseId, status: "ACTIVE", student: { status: "ACTIVE" } },
        }),
        courseAgeRange(courseId),
    ]);

    const { course, practice } = lesson;

    return (
        <div className="min-h-screen bg-background pb-24">
            <Navbar currentActiveRole={access.auth.activeRole} />
            <LessonPageView
                courseId={courseId}
                lessonId={lessonId}
                canWrite={access.canWrite}
                courseFinished={course.status === "FINISHED"}
                course={{
                    name: course.name,
                    level: course.level,
                    teacherName: course.teacher?.name ?? null,
                    classroomName: course.classroom?.name ?? null,
                    studentCount,
                    ages,
                    schedules: course.schedules,
                }}
                lesson={{
                    topic: lesson.topic,
                    content: lesson.content ?? "",
                    // `Lesson.date` es un `date` de Postgres: el día, sin hora.
                    dateKey: lesson.date.toISOString().slice(0, 10),
                    scheduleId: lesson.scheduleId,
                }}
                practice={
                    practice
                        ? {
                              speakingPhrases: practice.speakingPhrases.join("\n"),
                              listeningText: practice.listeningText ?? "",
                              chatScenario: practice.chatScenario ?? "",
                              isPublished: practice.isPublished,
                          }
                        : null
                }
                // Se valida también al leer: lo que no tenga la forma de hoy no
                // llega a la pantalla.
                plan={sanitizePlan(lesson.plan ?? {})}
            />
        </div>
    );
}
