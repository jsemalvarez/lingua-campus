import prisma from "@/lib/prisma";
import { INSTITUTE_STAFF, requireRole, type StaffContext } from "@/lib/authz";

/**
 * Autoriza a **escribir** sobre una clase, con la misma política que aplican las
 * pantallas: personal del instituto, la clase tiene que ser de un curso del
 * instituto propio, y un docente sólo entra al curso que dicta. Los roles
 * administrativos pasan a cualquier curso: el corte es entre docentes, no contra
 * la conducción.
 *
 * Salió de `saveLessonAttendanceAction` (BUG-07), donde era una función local.
 * Vive acá porque el mismo chequeo lo necesitan las notas y todo lo que se cuelgue
 * de una clase: hasta FEAT-07, `saveLessonGradesAction` no miraba **nada** más
 * que la existencia de una sesión, así que un tutor podía escribir las notas de
 * cualquier clase de cualquier instituto mandando los ids. Un server action es un
 * POST como cualquier otro: esconder el botón no protege nada.
 */
export async function requireLessonWriteAccess(
    lessonId: string,
    courseId: string,
    /** Qué se estaba por escribir, para el mensaje del curso finalizado. */
    subject: string
): Promise<{ error: string } | { auth: StaffContext }> {
    const auth = await requireRole(INSTITUTE_STAFF);
    if (!auth) return { error: "No autorizado" };

    // `courseId` va en el `where` y no en un `if` posterior: una clase de otro
    // curso simplemente no existe para esta acción.
    const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, courseId: courseId, status: "ACTIVE" },
        select: {
            id: true,
            course: { select: { instituteId: true, teacherId: true, status: true } }
        }
    });

    if (!lesson || lesson.course.instituteId !== auth.instituteId) {
        return { error: "No autorizado" };
    }

    if (auth.activeRole === "TEACHER" && lesson.course.teacherId !== auth.userId) {
        return { error: "No autorizado (no dictás este curso)" };
    }

    // Las pantallas muestran los cursos terminados en modo lectura; el servidor
    // tiene que sostener lo mismo.
    if (lesson.course.status === "FINISHED") {
        return { error: `El curso está finalizado: ${subject} es sólo de lectura.` };
    }

    return { auth };
}

/**
 * Autoriza a escribir sobre el **libro de temas** de un curso: crear, editar,
 * borrar y generar clases. Mismo corte que la escritura sobre una clase, pero
 * entrando por el curso, que es lo que traen esas acciones.
 *
 * Antes de FEAT-07 estas acciones chequeaban personal e instituto pero no de
 * quién era el curso, así que un docente podía borrarle las clases a otro
 * mandando los ids. La pantalla nunca se lo ofreció; la acción sí.
 */
export async function requireCourseWriteAccess(
    courseId: string
): Promise<{ error: string } | { auth: StaffContext }> {
    const auth = await requireRole(INSTITUTE_STAFF);
    if (!auth) return { error: "No autorizado" };

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instituteId: true, teacherId: true }
    });

    if (!course || course.instituteId !== auth.instituteId) {
        return { error: "No autorizado (el curso no pertenece a tu instituto)" };
    }

    if (auth.activeRole === "TEACHER" && course.teacherId !== auth.userId) {
        return { error: "No autorizado (no dictás este curso)" };
    }

    return { auth };
}

/**
 * Autoriza a **abrir** una pantalla colgada de una clase. Misma política que la
 * escritura salvo dos diferencias: el curso finalizado se puede mirar, y un
 * docente ajeno del mismo nivel entra en modo lectura (FEAT-07).
 *
 * Devuelve `canWrite` para que la pantalla decida qué dibuja, en vez de repetir
 * el razonamiento en cada una.
 */
export async function requireLessonReadAccess(
    lessonId: string,
    courseId: string,
    peerLevels: string[]
): Promise<{ error: string } | { auth: StaffContext; canWrite: boolean }> {
    const auth = await requireRole(INSTITUTE_STAFF);
    if (!auth) return { error: "No autorizado" };

    const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, courseId: courseId, status: "ACTIVE" },
        select: {
            id: true,
            course: { select: { instituteId: true, teacherId: true, status: true, level: true } }
        }
    });

    if (!lesson || lesson.course.instituteId !== auth.instituteId) {
        return { error: "No autorizado" };
    }

    const course = lesson.course;
    const isOwnCourse = course.teacherId === auth.userId;

    if (auth.activeRole === "TEACHER" && !isOwnCourse) {
        const level = course.level?.trim();
        if (!level || !peerLevels.includes(level)) {
            return { error: "No autorizado (no dictás este curso)" };
        }
        // Es un par: mira, no toca.
        return { auth, canWrite: false };
    }

    return { auth, canWrite: course.status !== "FINISHED" };
}
