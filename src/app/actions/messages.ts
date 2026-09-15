"use server";

import prisma from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/authz";
import { supabaseClient } from "@/lib/supabase-client";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTO DE SESIÓN
// ─────────────────────────────────────────────────────────────────────────────

type MessagingContext = {
    userId: string;
    isStudent: boolean;
    activeRole: string;
    instituteId: string;
    /** ADMIN / SECRETARY / SUPERADMIN: ven todos los hilos del instituto */
    isAdmin: boolean;
};

/**
 * Identidad y rol activo de quien llama, más el atajo `isAdmin` que usa este módulo.
 *
 * IMPORTANTE: estas funciones son server actions, es decir endpoints POST que el
 * navegador puede invocar con los argumentos que quiera. La identidad NUNCA debe
 * llegar por parámetro: si lo hiciera, cualquier usuario autenticado podría leer
 * hilos ajenos o enviar mensajes en nombre de otra persona.
 */
async function getMessagingContext(): Promise<MessagingContext> {
    const ctx = await getAuthContext();
    if (!ctx) throw new Error("No autorizado.");

    return {
        userId: ctx.userId,
        isStudent: ctx.isStudent,
        activeRole: ctx.activeRole,
        instituteId: ctx.instituteId ?? "",
        isAdmin:
            ctx.activeRole === "ADMIN" ||
            ctx.activeRole === "SECRETARY" ||
            ctx.activeRole === "SUPERADMIN",
    };
}

/**
 * Quién puede abrir un hilo desde el lado de la familia (FEAT-06).
 *
 * Es el alumno o el tutor, siempre por **rol activo**: alguien que es tutor y
 * docente a la vez —hay una persona así en producción— abre el hilo como lo que
 * está siendo en ese momento, no como lo que figura en su ficha.
 */
function isFamily(ctx: MessagingContext): boolean {
    return ctx.isStudent || ctx.activeRole === "GUARDIAN";
}

/**
 * Avisa a los participantes de un hilo que entró un mensaje.
 *
 * **No escribe una `Notification`, y es a propósito** (decisión del 2026-09-13,
 * ver FEAT-06). La bandeja ya lleva el estado de leído por persona y por hilo en
 * `ThreadParticipant.lastReadAt`; una fila de `Notification` sería un segundo
 * contador del mismo hecho, y leer el hilo no la apagaría — la campana quedaría
 * marcando pendiente algo ya contestado.
 *
 * Lo que se manda es sólo un empujón para que el sobre se actualice sin esperar
 * al siguiente refresco. El contenido del mensaje no viaja en el payload: el
 * sobre vuelve a preguntar por su cuenta.
 *
 * **Canal propio, y no el `user:${id}` de las notificaciones.** Un cliente de
 * Supabase no puede tener dos suscripciones al mismo tema: la segunda recibe
 * `CHANNEL_ERROR` y queda muda. Como la campana ya ocupa `user:${id}`, el sobre
 * necesita el suyo — verificado por pantalla el 2026-09-13, compartiéndolo no
 * conectaba.
 */
async function broadcastNewMessage(
    threadId: string,
    sender: { userId?: string | null; studentId?: string | null }
): Promise<void> {
    if (!supabaseClient) return;

    const participants = await prisma.threadParticipant.findMany({
        where: { threadId },
        select: { userId: true, studentId: true },
    });

    const targets = participants
        .map((p) => p.userId ?? p.studentId)
        .filter((id): id is string => !!id && id !== sender.userId && id !== sender.studentId);

    await Promise.allSettled(
        targets.map((id) =>
            supabaseClient!.channel(`user:${id}:messages`).send({
                type: "broadcast",
                event: "new_message",
                payload: { threadId },
            })
        )
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ThreadPreview = {
    id: string;
    subject: string;
    type: string;
    courseId: string | null;
    courseName: string | null;
    /** De qué alumno habla el hilo. Null en los hilos que no son sobre nadie en particular. */
    studentId: string | null;
    studentName: string | null;
    createdAt: Date;
    updatedAt: Date;
    authorName: string;
    lastMessageBody: string | null;
    lastMessageAt: Date | null;
    unreadCount: number;
    participantCount: number;
};

/** Filtros y página de la bandeja. Todos opcionales: sin nada, es la bandeja entera. */
export type InboxQuery = {
    /** Busca en el **asunto** y nada más. Por contenido es FEAT-24. */
    search?: string;
    courseId?: string;
    studentId?: string;
    onlyUnread?: boolean;
    page?: number;
};

export type InboxPage = {
    threads: ThreadPreview[];
    total: number;
    page: number;
    pageSize: number;
    /** Opciones para los desplegables, sobre el universo del que mira (no de la página). */
    courses: { id: string; name: string }[];
    students: { id: string; name: string }[];
    unreadTotal: number;
};

// Sin `export`: en un archivo "use server" sólo se pueden exportar funciones
// async. Quien lo necesite lo recibe en `InboxPage.pageSize`.
const INBOX_PAGE_SIZE = 20;

export type ThreadDetail = {
    id: string;
    subject: string;
    type: string;
    courseId: string | null;
    courseName: string | null;
    /** De qué alumno habla el hilo (FEAT-06). Null si no es sobre nadie en particular. */
    studentId: string | null;
    studentName: string | null;
    /** El que mira es personal del instituto: puede ir a la ficha del alumno. */
    viewerIsStaff: boolean;
    createdAt: Date;
    participants: {
        id: string;
        name: string;
        isAuthor: boolean;
        userId: string | null;
        studentId: string | null;
    }[];
    messages: {
        id: string;
        body: string;
        createdAt: Date;
        senderName: string;
        senderUserId: string | null;
        senderStudentId: string | null;
        isCurrentUser: boolean;
        // Attachment
        attachmentPath: string | null;
        attachmentName: string | null;
        attachmentMime: string | null;
        attachmentSize: number | null;
        // Shared link
        sharedUrl: string | null;
        sharedUrlTitle: string | null;
        sharedUrlDesc: string | null;
        sharedUrlImage: string | null;
    }[];
    /**
     * false cuando un admin del instituto abre un hilo del que no participa.
     * Si responde, se suma como participante.
     */
    viewerIsParticipant: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nombre con el que se muestra alguien del lado del instituto.
 *
 * Del instituto contesta el **área**, no la persona: quien escribe como ADMIN
 * firma "Administración" y quien escribe como SECRETARY, "Secretaría". La
 * docente y el tutor van con su nombre.
 *
 * `actingRole` es el rol activo congelado al escribir (`Message.senderRole`) o
 * al sumarse al hilo (`ThreadParticipant.actingRole`). Cuando falta —mensajes
 * anteriores a que existiera el campo: hay uno solo en producción— se cae a los
 * roles de hoy, y ahí ADMIN le gana a SECRETARY. Ver FEAT-25.
 */
function staffDisplayName(user: { name: string; roles: string[] }, actingRole: string | null): string {
    const roles: string[] = user.roles;
    const isAdminLabel =
        actingRole === "ADMIN" ||
        actingRole === "SUPERADMIN" ||
        (!actingRole && (roles.includes("SUPERADMIN") || roles.includes("ADMIN")));
    if (isAdminLabel) return "Administración";

    if (actingRole === "SECRETARY" || (!actingRole && roles.includes("SECRETARY"))) return "Secretaría";

    return user.name;
}

/** Texto de vista previa del último mensaje: el cuerpo, o lo que lo reemplace. */
function previewOf(msg: {
    body: string;
    attachmentName: string | null;
    sharedUrl: string | null;
    sharedUrlTitle: string | null;
} | null): string | null {
    if (!msg) return null;
    return (
        msg.body ||
        (msg.attachmentName ? `📎 ${msg.attachmentName}` : null) ||
        (msg.sharedUrlTitle ? `🔗 ${msg.sharedUrlTitle}` : null) ||
        (msg.sharedUrl ? `🔗 ${msg.sharedUrl}` : null) ||
        null
    );
}

/**
 * Devuelve la bandeja del usuario actual, filtrada y paginada:
 * - Admin/Secretary: todos los hilos del instituto
 * - Teacher/Guardian/Student: solo sus hilos como participante
 *
 * **El filtro de no leídos se resuelve en memoria y el resto en la base.** Es
 * deliberado: comparar el último mensaje contra el `lastReadAt` *de cada
 * participante* no entra en un `where` de Prisma, y hoy el instituto tiene 27
 * hilos y proyecta entre 200 y 400 por año lectivo (medición del 2026-09-13, en
 * FEAT-06). El día que eso no alcance, el filtro se muda a SQL — el contador del
 * sobre, que sí se consulta seguido, ya está escrito así.
 */
export async function getThreadsForUser(query: InboxQuery = {}): Promise<InboxPage> {
    const { userId, isStudent, instituteId, isAdmin } = await getMessagingContext();

    const participantWhere = isStudent ? { studentId: userId } : { userId };

    // El admin ve todos los hilos del instituto aunque no participe; el resto,
    // sólo donde participa. El chequeo de instituto es imprescindible en la
    // rama del admin: sin él leería hilos de otro instituto (ver BUG-05).
    const scopeWhere: Prisma.MessageThreadWhereInput = isAdmin
        ? { instituteId }
        : { participants: { some: participantWhere } };

    const search = query.search?.trim();

    const threads = await prisma.messageThread.findMany({
        where: {
            ...scopeWhere,
            ...(search ? { subject: { contains: search, mode: "insensitive" } } : {}),
            ...(query.courseId ? { courseId: query.courseId } : {}),
            ...(query.studentId ? { studentId: query.studentId } : {}),
        },
        orderBy: { updatedAt: "desc" },
        include: {
            course: { select: { name: true } },
            student: { select: { id: true, name: true } },
            participants: {
                include: {
                    user: { select: { id: true, name: true, roles: true } },
                    student: { select: { id: true, name: true } },
                },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    body: true,
                    createdAt: true,
                    attachmentName: true,
                    sharedUrl: true,
                    sharedUrlTitle: true,
                    senderUserId: true,
                    senderStudentId: true,
                },
            },
        },
    });

    const previews: ThreadPreview[] = threads.map((thread) => {
        const authorParticipant = thread.participants.find((p) => p.isAuthor);
        let authorName = "Sistema";
        if (authorParticipant?.user) {
            authorName = staffDisplayName(authorParticipant.user, authorParticipant.actingRole);
        } else if (authorParticipant?.student) {
            authorName = authorParticipant.student.name;
        }

        const own = thread.participants.find((p) =>
            isStudent ? p.studentId === userId : p.userId === userId
        );
        const lastMsg = thread.messages[0] ?? null;

        // Sin fila de participante no hay no leídos: es el admin mirando un hilo
        // del instituto del que no forma parte. Contarlos era lo que tenía el
        // badge encendido para siempre — BUG-06.
        const mine = lastMsg
            ? isStudent
                ? lastMsg.senderStudentId === userId
                : lastMsg.senderUserId === userId
            : false;
        const unreadCount =
            own && lastMsg && !mine && (!own.lastReadAt || lastMsg.createdAt > own.lastReadAt) ? 1 : 0;

        return {
            id: thread.id,
            subject: thread.subject,
            type: thread.type,
            courseId: thread.courseId,
            courseName: thread.course?.name ?? null,
            studentId: thread.studentId,
            studentName: thread.student?.name ?? null,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            authorName,
            lastMessageBody: previewOf(lastMsg),
            lastMessageAt: lastMsg?.createdAt ?? null,
            unreadCount,
            participantCount: thread.participants.length,
        };
    });

    const filtered = query.onlyUnread ? previews.filter((t) => t.unreadCount > 0) : previews;

    // El total de sin leer se pregunta aparte y no sale de `previews`: es una
    // afirmación sobre toda la bandeja ("tenés 3 sin leer"), no sobre lo que
    // quedó después de buscar. Saliendo de acá, escribir en el buscador le
    // cambiaría el número al encabezado.
    const unreadTotal = await getUnreadThreadCount();

    const page = Math.max(1, query.page ?? 1);
    const start = (page - 1) * INBOX_PAGE_SIZE;

    // Las opciones de los desplegables salen del universo de quien mira, no de
    // la página ni del filtro: si salieran de lo filtrado, elegir un curso
    // vaciaría la lista de cursos y no habría forma de volver.
    const [courseRows, studentRows] = await Promise.all([
        prisma.messageThread.findMany({
            where: { ...scopeWhere, courseId: { not: null } },
            select: { courseId: true, course: { select: { name: true } } },
            distinct: ["courseId"],
        }),
        prisma.messageThread.findMany({
            where: { ...scopeWhere, studentId: { not: null } },
            select: { studentId: true, student: { select: { name: true } } },
            distinct: ["studentId"],
        }),
    ]);

    return {
        threads: filtered.slice(start, start + INBOX_PAGE_SIZE),
        total: filtered.length,
        page,
        pageSize: INBOX_PAGE_SIZE,
        courses: courseRows
            .map((r) => ({ id: r.courseId!, name: r.course?.name ?? "—" }))
            .sort((a, b) => a.name.localeCompare(b.name, "es")),
        students: studentRows
            .map((r) => ({ id: r.studentId!, name: r.student?.name ?? "—" }))
            .sort((a, b) => a.name.localeCompare(b.name, "es")),
        unreadTotal,
    };
}

/**
 * Devuelve el detalle de un hilo con todos sus mensajes.
 * También marca el hilo como leído para el usuario actual.
 */
export async function getThread({
    threadId,
}: {
    threadId: string;
}): Promise<ThreadDetail | null> {
    const {
        userId: currentUserId,
        isStudent,
        activeRole,
        instituteId,
        isAdmin,
    } = await getMessagingContext();

    const thread = await prisma.messageThread.findUnique({
        where: { id: threadId },
        include: {
            course: { select: { name: true } },
            student: { select: { id: true, name: true } },
            participants: {
                include: {
                    user: { select: { id: true, name: true, roles: true } },
                    student: { select: { id: true, name: true } },
                },
            },
            messages: {
                orderBy: { createdAt: "asc" },
                include: {
                    senderUser: { select: { id: true, name: true, roles: true } },
                    senderStudent: { select: { id: true, name: true } },
                },
                // Selects all fields by default — attachment/link fields included automatically
            },
        },
    });

    if (!thread) return null;

    const isParticipant = thread.participants.some((p) =>
        isStudent ? p.studentId === currentUserId : p.userId === currentUserId
    );

    // Los admins del instituto pueden abrir cualquier hilo, aunque no participen.
    // El chequeo de instituto es imprescindible acá: para un participante la
    // pertenencia al hilo ya garantizaba el aislamiento entre institutos, pero
    // el acceso por rol no, y sin esta línea un admin leería hilos de otro instituto.
    const isInstituteAdmin = isAdmin && !!instituteId && thread.instituteId === instituteId;

    if (!isParticipant && !isInstituteAdmin) return null;

    // Marcar como leído (sólo si participa: un admin observador no tiene fila que actualizar)
    if (isParticipant) {
        await prisma.threadParticipant.updateMany({
            where: isStudent
                ? { threadId, studentId: currentUserId }
                : { threadId, userId: currentUserId },
            data: { lastReadAt: new Date() },
        });
    }

    return {
        id: thread.id,
        subject: thread.subject,
        type: thread.type,
        courseId: thread.courseId,
        courseName: thread.course?.name ?? null,
        studentId: thread.studentId,
        studentName: thread.student?.name ?? null,
        viewerIsStaff: !isStudent && activeRole !== "GUARDIAN",
        createdAt: thread.createdAt,
        participants: thread.participants.map((p) => {
            let name = "Desconocido";
            if (p.user) {
                name = staffDisplayName(p.user, p.actingRole);
            } else if (p.student) {
                name = p.student.name;
            }
            return {
                id: p.id,
                name,
                isAuthor: p.isAuthor,
                userId: p.userId,
                studentId: p.studentId,
            };
        }),
        messages: thread.messages.map((msg) => {
            let senderName = "Sistema";
            if (msg.senderUser) {
                senderName = staffDisplayName(msg.senderUser, msg.senderRole);
            } else if (msg.senderStudent) {
                senderName = msg.senderStudent.name;
            }
            return {
                id: msg.id,
                body: msg.body,
                createdAt: msg.createdAt,
                senderName,
                senderUserId: msg.senderUserId,
                senderStudentId: msg.senderStudentId,
                isCurrentUser: isStudent
                    ? msg.senderStudentId === currentUserId
                    : msg.senderUserId === currentUserId,
                // Attachment fields
                attachmentPath: msg.attachmentPath,
                attachmentName: msg.attachmentName,
                attachmentMime: msg.attachmentMime,
                attachmentSize: msg.attachmentSize,
                // Shared link fields
                sharedUrl: msg.sharedUrl,
                sharedUrlTitle: msg.sharedUrlTitle,
                sharedUrlDesc: msg.sharedUrlDesc,
                sharedUrlImage: msg.sharedUrlImage,
            };
        }),
        viewerIsParticipant: isParticipant,
    };
}

/**
 * Cuenta cuántos hilos tienen mensajes sin leer, para el badge del sobre.
 *
 * **Sólo cuenta hilos donde la persona participa** (BUG-06). Antes reusaba la
 * bandeja completa, y como el admin ve todos los hilos del instituto sin ser
 * participante de casi ninguno, ninguno tenía `lastReadAt` que actualizar: el
 * badge mostraba el total del instituto, para siempre, y abrir un hilo no lo
 * bajaba. Los hilos del instituto siguen visibles en la bandeja; lo que dejan
 * de hacer es inflar el contador.
 *
 * **Va en SQL y no reusando `getThreadsForUser`** porque esto se consulta
 * seguido —en cada carga y en cada aviso del canal en vivo— y aquello levanta
 * todos los hilos con todos sus participantes. Para el admin eso era el
 * instituto entero, una vez por minuto y por pestaña abierta.
 *
 * Los mensajes propios no cuentan: nadie tiene sin leer lo que acaba de escribir.
 */
export async function getUnreadThreadCount(): Promise<number> {
    const { userId, isStudent } = await getMessagingContext();

    const rows = isStudent
        ? await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint AS count
            FROM "ThreadParticipant" p
            WHERE p."studentId" = ${userId}
              AND EXISTS (
                  SELECT 1 FROM "Message" m
                  WHERE m."threadId" = p."threadId"
                    AND (p."lastReadAt" IS NULL OR m."createdAt" > p."lastReadAt")
                    AND m."senderStudentId" IS DISTINCT FROM ${userId}
              )`
        : await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint AS count
            FROM "ThreadParticipant" p
            WHERE p."userId" = ${userId}
              AND EXISTS (
                  SELECT 1 FROM "Message" m
                  WHERE m."threadId" = p."threadId"
                    AND (p."lastReadAt" IS NULL OR m."createdAt" > p."lastReadAt")
                    AND m."senderUserId" IS DISTINCT FROM ${userId}
              )`;

    return Number(rows[0]?.count ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// EL LADO DE LA FAMILIA (FEAT-06)
// ─────────────────────────────────────────────────────────────────────────────

export type FamilyCourseOption = {
    courseId: string;
    courseName: string;
    /** Null si el curso no tiene docente, o si el que tenía ya no está activo. */
    teacherId: string | null;
    teacherName: string | null;
};

export type FamilySubject = {
    studentId: string;
    studentName: string;
    /** true cuando el que escribe es el propio alumno. */
    isSelf: boolean;
    courses: FamilyCourseOption[];
};

/**
 * Sobre qué alumnos y qué cursos puede escribir quien llama.
 *
 * Para el alumno es su propia inscripción; para el tutor, sus hijos vinculados.
 * En los dos casos: **inscripciones activas, en cursos activos, del instituto**.
 * Eso es lo que hace que el día que el alumno se cambie de curso la docente
 * anterior simplemente deje de aparecer, sin necesidad de bloquear nada
 * (ver FEAT-23).
 *
 * Se usa para dibujar la pantalla **y** para autorizar el envío. Que sea la
 * misma función en los dos lados es el punto: si sólo dibujara, alcanzaría con
 * mandar otro `courseId` en el cuerpo del pedido para escribirle a cualquiera
 * del instituto.
 */
export async function getFamilyRecipients(): Promise<FamilySubject[]> {
    const ctx = await getMessagingContext();
    if (!isFamily(ctx) || !ctx.instituteId) return [];

    const { userId, isStudent, instituteId } = ctx;

    let studentIds: string[];
    if (isStudent) {
        studentIds = [userId];
    } else {
        const links = await prisma.guardianStudentLink.findMany({
            where: { guardianId: userId, student: { status: "ACTIVE", instituteId } },
            select: { studentId: true },
        });
        studentIds = links.map((l) => l.studentId);
    }
    if (studentIds.length === 0) return [];

    const enrollments = await prisma.enrollment.findMany({
        where: {
            studentId: { in: studentIds },
            status: "ACTIVE",
            student: { status: "ACTIVE", instituteId },
            course: { status: "ACTIVE", instituteId },
        },
        select: {
            student: { select: { id: true, name: true } },
            course: {
                select: {
                    id: true,
                    name: true,
                    teacher: { select: { id: true, name: true, status: true, roles: true } },
                },
            },
        },
    });

    const bySubject = new Map<string, FamilySubject>();

    for (const enrollment of enrollments) {
        const { student, course } = enrollment;

        // Un docente dado de baja queda con `roles` vacío pero sigue colgando del
        // curso (SEC-01). Escribirle sería mandar un mensaje a una cuenta que ya
        // no entra: para la familia, ese curso está igual que uno sin docente.
        const teacher = course.teacher;
        const teacherActive =
            !!teacher && teacher.status === "ACTIVE" && (teacher.roles as string[]).includes("TEACHER");

        const entry = bySubject.get(student.id) ?? {
            studentId: student.id,
            studentName: student.name,
            isSelf: isStudent && student.id === userId,
            courses: [],
        };

        entry.courses.push({
            courseId: course.id,
            courseName: course.name,
            teacherId: teacherActive ? teacher!.id : null,
            teacherName: teacherActive ? teacher!.name : null,
        });

        bySubject.set(student.id, entry);
    }

    const subjects = [...bySubject.values()];
    for (const subject of subjects) {
        subject.courses.sort((a, b) => a.courseName.localeCompare(b.courseName, "es"));
    }
    return subjects.sort((a, b) => a.studentName.localeCompare(b.studentName, "es"));
}

/**
 * Abre un hilo desde el lado de la familia: el alumno o el tutor, sobre un
 * alumno y un curso, hacia el docente de ese curso o hacia Administración.
 *
 * **El destinatario no llega por parámetro y no puede llegar.** Lo que llega es
 * a quién se le escribe *en abstracto* (`destination`), y el id real sale de
 * recalcular el alcance acá adentro. Un `teacherId` en el cuerpo del pedido
 * sería exactamente el agujero que esta función existe para no tener.
 *
 * **El hilo del tutor no lleva al alumno como participante, ni al revés.** Es la
 * decisión del 2026-09-13: cada uno tiene el suyo y no se cruzan. Quien
 * supervisa es la administración, que ve todos los hilos del instituto.
 */
export async function createFamilyThread({
    studentId,
    courseId,
    destination,
    subject,
    body,
}: {
    studentId: string;
    courseId: string;
    destination: "TEACHER" | "ADMIN";
    subject: string;
    body: string;
}): Promise<{ threadId: string }> {
    const ctx = await getMessagingContext();
    if (!isFamily(ctx)) throw new Error("No tenés permiso para iniciar conversaciones.");
    if (!ctx.instituteId) throw new Error("Tu usuario no está asociado a un instituto.");

    const { userId, isStudent, activeRole, instituteId } = ctx;

    const cleanSubject = subject.trim().slice(0, 120);
    const cleanBody = body.trim();
    if (!cleanSubject || !cleanBody) {
        throw new Error("El asunto y el mensaje son obligatorios.");
    }

    const allowed = await getFamilyRecipients();
    const allowedSubject = allowed.find((s) => s.studentId === studentId);
    const allowedCourse = allowedSubject?.courses.find((c) => c.courseId === courseId);

    if (!allowedSubject || !allowedCourse) {
        throw new Error("No podés escribir sobre ese curso.");
    }

    let recipientIds: string[];
    if (destination === "TEACHER") {
        if (!allowedCourse.teacherId) {
            throw new Error(
                "Ese curso todavía no tiene profesor asignado. Podés escribirle a Administración."
            );
        }
        recipientIds = [allowedCourse.teacherId];
    } else {
        const staff = await prisma.user.findMany({
            where: {
                instituteId,
                status: "ACTIVE",
                roles: { hasSome: [UserRole.ADMIN, UserRole.SECRETARY] },
            },
            select: { id: true },
        });
        if (staff.length === 0) {
            throw new Error("El instituto todavía no tiene una cuenta de administración.");
        }
        recipientIds = staff.map((s) => s.id);
    }

    // Un tutor que además es docente podría estar de los dos lados: se saca.
    const finalUserIds = [...new Set(recipientIds)].filter((id) => id !== userId);
    if (finalUserIds.length === 0) {
        throw new Error("No hay a quién dirigir este mensaje.");
    }

    const author = isStudent
        ? { studentId: userId, isAuthor: true, lastReadAt: new Date(), actingRole: "STUDENT" }
        : { userId, isAuthor: true, lastReadAt: new Date(), actingRole: activeRole };

    const thread = await prisma.messageThread.create({
        data: {
            instituteId,
            subject: cleanSubject,
            type: "DIRECT",
            // Siempre con curso y con alumno: es lo que después permite filtrar
            // la bandeja y lo que va a permitir cerrar el hilo (FEAT-23).
            courseId,
            studentId,
            updatedAt: new Date(),
            participants: {
                create: [author, ...finalUserIds.map((id) => ({ userId: id, isAuthor: false }))],
            },
            messages: {
                create: {
                    senderUserId: isStudent ? null : userId,
                    senderStudentId: isStudent ? userId : null,
                    senderRole: isStudent ? "STUDENT" : activeRole,
                    body: cleanBody,
                },
            },
        },
    });

    await broadcastNewMessage(thread.id, isStudent ? { studentId: userId } : { userId });

    revalidatePath("/messages");
    return { threadId: thread.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// EL LADO DEL INSTITUTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo hilo de mensajes con el primer mensaje incluido.
 * Accesible para: ADMIN, SECRETARY, TEACHER.
 *
 * La familia no entra por acá: tiene su propia puerta en `createFamilyThread`,
 * con el alcance verificado. Esta acción recibe ids de destinatarios sueltos, y
 * eso sólo es aceptable para quien ya puede ver a todo el instituto.
 */
export async function createThread({
    subject,
    body,
    type = "DIRECT",
    courseId,
    recipientUserIds = [],
    recipientStudentIds = [],
    includeGuardians = false,
}: {
    subject: string;
    body: string;
    type?: "DIRECT" | "COURSE_BLAST";
    courseId?: string;
    recipientUserIds?: string[];
    recipientStudentIds?: string[];
    includeGuardians?: boolean; // Si true, agrega tutores de los alumnos seleccionados
}): Promise<{ threadId: string }> {
    const {
        userId: senderUserId,
        activeRole: senderRole,
        instituteId,
        isAdmin,
        isStudent,
    } = await getMessagingContext();

    // Esta puerta es sólo del personal. La familia abre hilos por
    // `createFamilyThread`, que recalcula su alcance en vez de confiar en los
    // ids que le manden.
    if (isStudent || (!isAdmin && senderRole !== "TEACHER")) {
        throw new Error("No tenés permiso para iniciar conversaciones.");
    }

    if (!instituteId) {
        throw new Error("Tu usuario no está asociado a un instituto.");
    }

    if (!subject.trim() || !body.trim()) {
        throw new Error("El asunto y el mensaje son obligatorios.");
    }

    // Si el tipo es COURSE_BLAST, obtenemos todos los alumnos del curso
    let finalStudentIds = [...recipientStudentIds];
    let finalUserIds = [...recipientUserIds];

    if (type === "COURSE_BLAST" && courseId) {
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId, status: "ACTIVE", student: { status: "ACTIVE" } },
            select: { studentId: true },
        });
        finalStudentIds = enrollments.map((e) => e.studentId);
    }

    // Si se pide incluir tutores de los alumnos seleccionados
    if (includeGuardians && finalStudentIds.length > 0) {
        const guardianLinks = await prisma.guardianStudentLink.findMany({
            where: { studentId: { in: finalStudentIds } },
            select: { guardianId: true },
        });
        const guardianIds = [...new Set(guardianLinks.map((g) => g.guardianId))];
        finalUserIds = [...new Set([...finalUserIds, ...guardianIds])];
        // Excluir al propio sender si estuviera en la lista
        finalUserIds = finalUserIds.filter((id) => id !== senderUserId);
    }

    // Construir participantes
    const participantsData = [
        // Autor (sender)
        { userId: senderUserId, isAuthor: true, lastReadAt: new Date(), actingRole: senderRole ?? null },
        // Destinatarios User
        ...finalUserIds.map((id) => ({ userId: id, isAuthor: false })),
        // Destinatarios Student
        ...finalStudentIds.map((id) => ({ studentId: id, isAuthor: false })),
    ];

    const thread = await prisma.messageThread.create({
        data: {
            instituteId,
            subject: subject.trim(),
            type,
            courseId: courseId ?? null,
            // Cuando el instituto le escribe a un solo alumno, el hilo también
            // es sobre él: se anota, y así los filtros de la bandeja sirven
            // igual del lado del instituto. Con varios destinatarios queda en
            // null, que es la verdad — ese hilo no es sobre nadie en particular.
            studentId: finalStudentIds.length === 1 ? finalStudentIds[0] : null,
            updatedAt: new Date(),
            participants: {
                create: participantsData,
            },
            messages: {
                create: {
                    senderUserId,
                    senderRole: senderRole ?? null,
                    body: body.trim(),
                },
            },
        },
    });

    await broadcastNewMessage(thread.id, { userId: senderUserId });

    revalidatePath("/messages");
    return { threadId: thread.id };
}

/**
 * Envía un mensaje de respuesta dentro de un hilo existente.
 * Accesible para cualquier participante del hilo.
 */
export async function sendMessage({
    threadId,
    body,
    // File attachment
    attachmentPath,
    attachmentName,
    attachmentMime,
    attachmentSize,
    // Shared link
    sharedUrl,
    sharedUrlTitle,
    sharedUrlDesc,
    sharedUrlImage,
}: {
    threadId: string;
    body: string;
    attachmentPath?: string;
    attachmentName?: string;
    attachmentMime?: string;
    attachmentSize?: number;
    sharedUrl?: string;
    sharedUrlTitle?: string;
    sharedUrlDesc?: string;
    sharedUrlImage?: string;
}): Promise<void> {
    const hasAttachment = !!attachmentPath;
    const hasLink = !!sharedUrl;
    if (!body.trim() && !hasAttachment && !hasLink) {
        throw new Error("El mensaje no puede estar vacío.");
    }

    const {
        userId: currentUserId,
        isStudent,
        activeRole: senderRole,
        instituteId,
        isAdmin,
    } = await getMessagingContext();

    const senderUserId = isStudent ? undefined : currentUserId;
    const senderStudentId = isStudent ? currentUserId : undefined;

    // Verificar que el sender sea participante del hilo
    let participant = await prisma.threadParticipant.findFirst({
        where: isStudent
            ? { threadId, studentId: currentUserId }
            : { threadId, userId: currentUserId },
    });

    if (!participant) {
        // Un admin del instituto puede responder un hilo del que no participaba.
        // Al hacerlo se suma como participante, de modo que el resto vea que
        // se incorporó a la conversación en lugar de recibir un mensaje suelto.
        const thread = await prisma.messageThread.findUnique({
            where: { id: threadId },
            select: { instituteId: true },
        });

        const canJoin =
            isAdmin && !!instituteId && thread?.instituteId === instituteId;

        if (!canJoin) throw new Error("No tenés acceso a este hilo.");

        participant = await prisma.threadParticipant.create({
            data: {
                threadId,
                userId: currentUserId,
                isAuthor: false,
                actingRole: senderRole,
                lastReadAt: new Date(),
            },
        });
    }

    await prisma.$transaction([
        prisma.message.create({
            data: {
                threadId,
                body: body.trim(),
                senderUserId: senderUserId ?? null,
                senderStudentId: senderStudentId ?? null,
                senderRole: senderRole ?? null,
                // Attachment
                attachmentPath: attachmentPath ?? null,
                attachmentName: attachmentName ?? null,
                attachmentMime: attachmentMime ?? null,
                attachmentSize: attachmentSize ?? null,
                // Shared link
                sharedUrl: sharedUrl ?? null,
                sharedUrlTitle: sharedUrlTitle ?? null,
                sharedUrlDesc: sharedUrlDesc ?? null,
                sharedUrlImage: sharedUrlImage ?? null,
            },
        }),
        // Actualizar updatedAt del hilo para que suba en el inbox
        prisma.messageThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
        }),
        // Marcar como leído para el sender
        prisma.threadParticipant.updateMany({
            where: isStudent
                ? { threadId, studentId: currentUserId }
                : { threadId, userId: currentUserId },
            data: { lastReadAt: new Date() },
        }),
    ]);

    await broadcastNewMessage(
        threadId,
        isStudent ? { studentId: currentUserId } : { userId: currentUserId }
    );

    revalidatePath(`/messages/${threadId}`);
    revalidatePath("/messages");
}

/**
 * Devuelve los cursos de un profesor con sus alumnos y tutores.
 * Usado por el composer para seleccionar destinatarios.
 */
export async function getCoursesWithRecipientsForUser() {
    const { userId, instituteId, isAdmin } = await getMessagingContext();

    // Admin/Secretary ven todos los cursos activos del instituto
    const courseFilter = isAdmin
        ? { instituteId, status: "ACTIVE" }
        : { teacherId: userId, instituteId, status: "ACTIVE" };

    const courses = await prisma.course.findMany({
        where: courseFilter,
        select: {
            id: true,
            name: true,
            color: true,
            enrollments: {
                where: { status: "ACTIVE", student: { status: "ACTIVE" } },
                select: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            guardianLinks: {
                                select: {
                                    guardian: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    });

    // Para admin, también devolver todos los profesores del instituto como destinatarios posibles
    let allTeachers: { id: string; name: string }[] = [];
    if (isAdmin) {
        allTeachers = await prisma.user.findMany({
            where: {
                instituteId,
                status: "ACTIVE",
                roles: { has: "TEACHER" },
            },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        });
    }

    return {
        courses: courses.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            students: c.enrollments.map((e) => ({
                id: e.student.id,
                name: e.student.name,
                guardians: e.student.guardianLinks.map((gl) => ({
                    id: gl.guardian.id,
                    name: gl.guardian.name,
                })),
            })),
        })),
        allTeachers,
    };
}
