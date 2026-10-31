import prisma from "@/lib/prisma";
import { getEmailProvider } from "@/lib/email";
import { errorAlertEmail } from "@/lib/email/templates/errorAlert";
import { INSTITUTE_TIME_ZONE, formatDate } from "@/lib/dates";
import { ERROR_AREAS, type ErrorArea } from "./areas";
import type { ErrorContext } from "./report";

/**
 * El aviso por mail de un problema nuevo en un instituto (ARQ-09).
 *
 * **Sale una vez por problema y por instituto, y sólo si el usuario vio el
 * error.** Un problema conocido que aparece en otro instituto avisa de nuevo,
 * porque ese instituto no sabe que ya está visto. Lo que falló por detrás sin
 * cartel va sólo al panel.
 *
 * **Lo que marca «ya avisado» es `ErrorIssueScope.notifiedAt`, no «primera vez
 * en este instituto».** Si la primera falla fue silenciosa y la segunda terminó
 * en un cartel, la que importa es la segunda: con «primera vez» no avisaría nunca.
 *
 * A dónde va: `ERROR_ALERT_EMAIL`. Sin esa variable no sale nada, que es lo que
 * conviene en local y en cualquier entorno que no la configuró a propósito.
 */

const ACTION_LABELS: Record<string, string> = {
    "inscripcion.crear": "Inscribirse",
    "inscripcion.manejar-choque": "Inscribirse (ya estaba registrado)",
    "asistencia.guardar": "Guardar asistencia",
    "asistencia.escanear-qr": "Marcar asistencia con QR",
    "practica.chat": "Chat con IA",
    "practica.evaluar": "Evaluar pronunciación",
    "practica.audio": "Escuchar el audio de la práctica",
    "practica.generar-frases": "Generar frases de speaking",
    "practica.generar-listening": "Generar el listening",
    "practica.generar-preguntas": "Generar las preguntas del listening",
    "practica.generar-borrador": "Generar la práctica de la clase",
    "practica.guardar-sesion": "Guardar la sesión de práctica",
};

const ROLE_LABELS: Record<string, string> = {
    STUDENT: "Un alumno",
    GUARDIAN: "Una familia",
    TEACHER: "Un docente",
    SECRETARY: "Secretaría",
    ADMIN: "Administración",
    SUPERADMIN: "Superadmin",
};

export type AlertInput = {
    issueId: string;
    scope: string;
    role: string | null;
    context?: ErrorContext;
    at: Date;
};

export async function alertIfFirstSeenInScope({ issueId, scope, role, context, at }: AlertInput): Promise<void> {
    const to = process.env.ERROR_ALERT_EMAIL;
    if (!to) return;

    // Reclamar el aviso antes de mandarlo: si dos fallas llegan juntas, sólo una
    // encuentra `notifiedAt` vacío.
    const claimed = await prisma.errorIssueScope.updateMany({
        where: { issueId, scope, notifiedAt: null },
        data: { notifiedAt: at },
    });
    if (claimed.count === 0) return;

    try {
        const [issue, institutos, institute, detalle] = await Promise.all([
            prisma.errorIssue.findUniqueOrThrow({
                where: { id: issueId },
                select: { action: true, area: true, message: true, count: true },
            }),
            prisma.errorIssueScope.count({ where: { issueId } }),
            scope === "PLATAFORMA"
                ? null
                : prisma.institute.findUnique({ where: { id: scope }, select: { name: true } }),
            describeContext(context),
        ]);

        const email = await errorAlertEmail({
            instituteName: institute?.name ?? "Plataforma",
            area: ERROR_AREAS[issue.area as ErrorArea] ?? issue.area,
            accion: actionLabel(issue.action),
            detalle,
            quien: role ? (ROLE_LABELS[role] ?? role) : "Alguien sin sesión (formulario público)",
            cuando: `${formatDate(at, "moment", "numericFull")} a las ${timeOf(at)}`,
            message: issue.message,
            vecesEnTotal: issue.count,
            institutos,
        });

        await getEmailProvider().send({
            to,
            ...email,
            from: process.env.EMAIL_FROM ?? "no-responder@lingua-campus.com.ar",
            fromName: "Lingua Campus",
        });
    } catch (failure) {
        // Devolver el reclamo: si el mail no salió, que lo intente la próxima falla.
        // No pasa por `reportError` a propósito: un aviso que falla y se registra
        // dispararía otro aviso.
        await prisma.errorIssueScope
            .updateMany({ where: { issueId, scope, notifiedAt: at }, data: { notifiedAt: null } })
            .catch(() => {});
        console.error("[alertIfFirstSeenInScope] No salió el aviso del error:", failure);
    }
}

function actionLabel(action: string): string {
    if (ACTION_LABELS[action]) return ACTION_LABELS[action];
    // Lo que llega por instrumentation.ts: "render /payments", "route /api/…".
    const route = action.match(/^(\w+) (\/\S*)$/);
    if (route) return route[1] === "render" ? `Abrir ${route[2]}` : `Pedido a ${route[2]}`;
    return action;
}

/** Hora y minutos en hora del instituto. De `Intl` sólo números, como en `dates.ts`. */
function timeOf(at: Date): string {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: INSTITUTE_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(at);
}

/**
 * Los ids del contexto, pasados a nombres: «curso Children 4, clase «Unit 21»».
 * Sólo cosas del instituto —cursos y clases—, nunca de un alumno.
 */
async function describeContext(context?: ErrorContext): Promise<string | null> {
    if (!context) return null;
    const str = (key: string) => (typeof context[key] === "string" ? (context[key] as string) : null);

    const lessonFromPractice = str("lessonPracticeId")
        ? (await prisma.lessonPractice.findUnique({ where: { id: str("lessonPracticeId")! }, select: { lessonId: true } }))?.lessonId
        : null;
    const lessonId = str("lessonId") ?? lessonFromPractice ?? null;

    if (lessonId) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { topic: true, course: { select: { name: true } } },
        });
        if (lesson) return `curso ${lesson.course.name}, clase «${lesson.topic}»`;
    }

    const courseId = str("courseId");
    if (courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { name: true } });
        if (course) return `curso ${course.name}`;
    }

    return null;
}
