"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireLessonWriteAccess } from "@/lib/lessonAccess";
import { countChosen, isPlanEmpty, sanitizePlan } from "@/lib/lessonPlan/plan";

/**
 * Guardado de la página de la clase (PED-09). La página guarda sola, de a una
 * parte por vez: lo que el docente escribe en «La clase» viaja por
 * `saveLessonDetailsAction`, las palabras y el armado por `saveLessonPlanAction`
 * y lo de «La práctica de los alumnos» por `saveLessonPracticeAction`. Cada una
 * manda la parte entera, no el campo que cambió, así que un guardado que llega
 * tarde no deja la fila a medias.
 *
 * Reemplazan a lo que hacían `createLessonAction` y `editLessonAction` con la
 * práctica cuando todo vivía en el modal.
 */

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

const MAX_TOPIC_CHARS = 200;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** La clase tiene que ser una clase —no TP ni examen— del curso autorizado. */
async function findClass(lessonId: string, courseId: string) {
    return prisma.lesson.findFirst({
        where: { id: lessonId, courseId, status: "ACTIVE", type: "CLASS" },
        select: { id: true },
    });
}

export async function saveLessonDetailsAction(input: {
    lessonId: string;
    courseId: string;
    topic: string;
    content: string;
    date: string;
    scheduleId: string | null;
}): Promise<Result> {
    const { lessonId, courseId } = input;

    const access = await requireLessonWriteAccess(lessonId, courseId, "la clase");
    if ("error" in access) return { success: false, error: access.error };

    const topic = input.topic.trim();
    if (!topic) {
        return { success: false, error: "El tema no puede quedar vacío: es lo que ven los alumnos y las familias." };
    }
    if (topic.length > MAX_TOPIC_CHARS) {
        return { success: false, error: `El tema no puede pasar de ${MAX_TOPIC_CHARS} caracteres.` };
    }

    if (!DATE_RE.test(input.date)) {
        return { success: false, error: "La fecha no es válida." };
    }
    // Mediodía UTC, como el resto de la app: el día no se corre con la zona.
    const date = new Date(`${input.date}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) {
        return { success: false, error: "La fecha no es válida." };
    }

    // El horario tiene que ser del mismo curso. El modal no lo miraba porque
    // sólo ofrecía los del curso; una acción es un POST y recibe lo que le manden.
    if (input.scheduleId) {
        const schedule = await prisma.schedule.findFirst({
            where: { id: input.scheduleId, courseId },
            select: { id: true },
        });
        if (!schedule) return { success: false, error: "Ese horario no es de este curso." };
    }

    if (!(await findClass(lessonId, courseId))) {
        return { success: false, error: "La clase no está disponible." };
    }

    await prisma.lesson.update({
        where: { id: lessonId },
        data: {
            topic,
            content: input.content.trim() || null,
            date,
            scheduleId: input.scheduleId || null,
        },
    });

    revalidatePath(`/courses/${courseId}`);
    return { success: true };
}

export async function saveLessonPracticeAction(input: {
    lessonId: string;
    courseId: string;
    /** Una frase por línea, como en el formulario. */
    speakingPhrases: string;
    listeningText: string;
    chatScenario: string;
    isPublished: boolean;
}): Promise<Result<{ isPublished: boolean }>> {
    const { lessonId, courseId } = input;

    const access = await requireLessonWriteAccess(lessonId, courseId, "la práctica");
    if ("error" in access) return { success: false, error: access.error };

    if (!(await findClass(lessonId, courseId))) {
        return { success: false, error: "La clase no está disponible." };
    }

    const speakingPhrases = input.speakingPhrases.split("\n").map((p) => p.trim()).filter(Boolean);
    const listeningText = input.listeningText.trim() || null;
    const chatScenario = input.chatScenario.trim() || null;
    const hasContent = speakingPhrases.length > 0 || !!listeningText || !!chatScenario;

    // Sin frases no hay práctica que hacer: la app del alumno arranca por la
    // pronunciación. Se puede guardar como borrador lo que haya —con la página
    // guardando sola, exigir frases para guardar haría perder el texto del
    // listening a quien empieza por ahí—, pero no publicarlo.
    const isPublished = input.isPublished && speakingPhrases.length > 0;

    const existing = await prisma.lessonPractice.findUnique({
        where: { lessonId },
        select: { id: true },
    });

    if (hasContent) {
        await prisma.lessonPractice.upsert({
            where: { lessonId },
            create: { lessonId, speakingPhrases, listeningText, chatScenario, isPublished },
            update: { speakingPhrases, listeningText, chatScenario, isPublished },
        });
    } else if (existing) {
        // Vaciar no borra la fila: `PracticeSession` la referencia sin cascade y
        // las sesiones que los alumnos ya hicieron tienen que quedar (BUG-03).
        await prisma.lessonPractice.update({
            where: { lessonId },
            data: { speakingPhrases: [], listeningText: null, chatScenario: null, isPublished: false },
        });
    }

    revalidatePath(`/courses/${courseId}`);
    return { success: true, isPublished };
}

/**
 * Guarda el armado de la clase: el foco, las palabras y los momentos (PED-09).
 * Llega el documento entero y se valida entero con `sanitizePlan`: viene del
 * navegador, así que se recorta a la forma y a los topes de `plan.ts` antes de
 * tocar la base. `chosen` se calcula acá y no se acepta del cliente.
 */
export async function saveLessonPlanAction(input: {
    lessonId: string;
    courseId: string;
    plan: unknown;
}): Promise<Result> {
    const { lessonId, courseId } = input;

    const access = await requireLessonWriteAccess(lessonId, courseId, "el armado de la clase");
    if ("error" in access) return { success: false, error: access.error };

    if (!(await findClass(lessonId, courseId))) {
        return { success: false, error: "La clase no está disponible." };
    }

    const plan = sanitizePlan(input.plan);
    const existing = await prisma.lessonPlan.findUnique({ where: { lessonId }, select: { id: true } });

    // Una clase que nunca se armó no necesita fila.
    if (!existing && isPlanEmpty(plan)) return { success: true };

    const data = {
        focus: plan.focus,
        words: plan.words as Prisma.InputJsonValue,
        moments: plan.moments ? (plan.moments as Prisma.InputJsonValue) : Prisma.DbNull,
        ideasBasis: plan.ideasBasis,
        chosen: countChosen(plan.moments),
    };
    await prisma.lessonPlan.upsert({
        where: { lessonId },
        create: { lessonId, ...data },
        update: data,
    });

    revalidatePath(`/courses/${courseId}`);
    return { success: true };
}
