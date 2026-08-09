"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveRole } from "@/lib/roles";

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
 * Deriva la identidad y el rol activo desde la sesión del servidor.
 *
 * IMPORTANTE: estas funciones son server actions, es decir endpoints POST que el
 * navegador puede invocar con los argumentos que quiera. La identidad NUNCA debe
 * llegar por parámetro: si lo hiciera, cualquier usuario autenticado podría leer
 * hilos ajenos o enviar mensajes en nombre de otra persona.
 */
async function getMessagingContext(): Promise<MessagingContext> {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id) {
        throw new Error("No autorizado.");
    }

    const roles: string[] = user.roles?.length ? user.roles : [user.role].filter(Boolean);
    const activeRole = await getActiveRole(roles);

    return {
        userId: user.id,
        isStudent: activeRole === "STUDENT",
        activeRole,
        instituteId: user.instituteId ?? "",
        isAdmin:
            activeRole === "ADMIN" ||
            activeRole === "SECRETARY" ||
            activeRole === "SUPERADMIN",
    };
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
    createdAt: Date;
    updatedAt: Date;
    authorName: string;
    lastMessageBody: string | null;
    lastMessageAt: Date | null;
    unreadCount: number;
    participantCount: number;
};

export type ThreadDetail = {
    id: string;
    subject: string;
    type: string;
    courseId: string | null;
    courseName: string | null;
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
 * Devuelve el inbox del usuario actual:
 * - Admin/Secretary: todos los hilos del instituto
 * - Teacher/Guardian/Student: solo sus hilos como participante
 */
export async function getThreadsForUser(): Promise<ThreadPreview[]> {
    const { userId, isStudent, instituteId, isAdmin } = await getMessagingContext();

    // Admin ve todos los hilos del instituto
    const whereClause = isAdmin
        ? { instituteId }
        : isStudent
        ? { participants: { some: { studentId: userId } } }
        : { participants: { some: { userId } } };

    const threads = await prisma.messageThread.findMany({
        where: whereClause,
        orderBy: { updatedAt: "desc" },
        include: {
            course: { select: { name: true } },
            participants: {
                include: {
                    user: { select: { id: true, name: true, roles: true, role: true } },
                    student: { select: { id: true, name: true } },
                },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { body: true, createdAt: true, attachmentName: true, sharedUrl: true, sharedUrlTitle: true },
            },
        },
    });

    return threads.map((thread) => {
        const authorParticipant = thread.participants.find((p) => p.isAuthor);
        let authorName = "Sistema";
        if (authorParticipant?.user) {
            const u = authorParticipant.user as any;
            const actingRole = authorParticipant.actingRole;
            const userRoles: string[] = u.roles?.length ? u.roles : [u.role];
            
            if (actingRole === "ADMIN" || actingRole === "SUPERADMIN" || (!actingRole && (userRoles.includes("SUPERADMIN") || userRoles.includes("ADMIN")))) {
                authorName = "Administración";
            } else if (actingRole === "SECRETARY" || (!actingRole && userRoles.includes("SECRETARY"))) {
                authorName = "Secretaría";
            } else {
                authorName = u.name;
            }
        } else if (authorParticipant?.student) {
            authorName = authorParticipant.student.name;
        }

        // Calcular no leídos para este usuario
        let lastReadAt: Date | null = null;
        if (isStudent) {
            lastReadAt =
                thread.participants.find((p) => p.studentId === userId)
                    ?.lastReadAt ?? null;
        } else {
            lastReadAt =
                thread.participants.find((p) => p.userId === userId)
                    ?.lastReadAt ?? null;
        }

        const lastMsg = thread.messages[0] ?? null;
        // Mensajes no leídos = hay mensajes después del último tiempo de lectura
        const unreadCount =
            lastMsg && lastReadAt
                ? new Date(lastMsg.createdAt) > new Date(lastReadAt)
                    ? 1
                    : 0
                : lastMsg
                ? 1
                : 0;

        return {
            id: thread.id,
            subject: thread.subject,
            type: thread.type,
            courseId: thread.courseId,
            courseName: thread.course?.name ?? null,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            authorName,
            lastMessageBody: lastMsg
                ? lastMsg.body
                    || (lastMsg.attachmentName ? `📎 ${lastMsg.attachmentName}` : null)
                    || (lastMsg.sharedUrlTitle ? `🔗 ${lastMsg.sharedUrlTitle}` : null)
                    || (lastMsg.sharedUrl ? `🔗 ${lastMsg.sharedUrl}` : null)
                    || null
                : null,
            lastMessageAt: lastMsg?.createdAt ?? null,
            unreadCount,
            participantCount: thread.participants.length,
        };
    });
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
        instituteId,
        isAdmin,
    } = await getMessagingContext();

    const thread = await prisma.messageThread.findUnique({
        where: { id: threadId },
        include: {
            course: { select: { name: true } },
            participants: {
                include: {
                    user: { select: { id: true, name: true, roles: true, role: true } },
                    student: { select: { id: true, name: true } },
                },
            },
            messages: {
                orderBy: { createdAt: "asc" },
                include: {
                    senderUser: { select: { id: true, name: true, roles: true, role: true } },
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
        createdAt: thread.createdAt,
        participants: thread.participants.map((p) => {
            let name = "Desconocido";
            if (p.user) {
                const u = p.user as any;
                const actingRole = p.actingRole;
                const userRoles: string[] = u.roles?.length ? u.roles : [u.role];
                if (actingRole === "ADMIN" || actingRole === "SUPERADMIN" || (!actingRole && (userRoles.includes("SUPERADMIN") || userRoles.includes("ADMIN")))) {
                    name = "Administración";
                } else if (actingRole === "SECRETARY" || (!actingRole && userRoles.includes("SECRETARY"))) {
                    name = "Secretaría";
                } else {
                    name = u.name;
                }
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
                const u = msg.senderUser as any;
                const senderRole = msg.senderRole;
                const userRoles: string[] = u.roles?.length ? u.roles : [u.role];
                if (senderRole === "ADMIN" || senderRole === "SUPERADMIN" || (!senderRole && (userRoles.includes("SUPERADMIN") || userRoles.includes("ADMIN")))) {
                    senderName = "Administración";
                } else if (senderRole === "SECRETARY" || (!senderRole && userRoles.includes("SECRETARY"))) {
                    senderName = "Secretaría";
                } else {
                    senderName = u.name;
                }
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
                attachmentPath: (msg as any).attachmentPath ?? null,
                attachmentName: (msg as any).attachmentName ?? null,
                attachmentMime: (msg as any).attachmentMime ?? null,
                attachmentSize: (msg as any).attachmentSize ?? null,
                // Shared link fields
                sharedUrl: (msg as any).sharedUrl ?? null,
                sharedUrlTitle: (msg as any).sharedUrlTitle ?? null,
                sharedUrlDesc: (msg as any).sharedUrlDesc ?? null,
                sharedUrlImage: (msg as any).sharedUrlImage ?? null,
            };
        }),
        viewerIsParticipant: isParticipant,
    };
}

/**
 * Cuenta cuántos hilos tienen mensajes no leídos para el badge de la Navbar.
 */
export async function getUnreadThreadCount(): Promise<number> {
    const threads = await getThreadsForUser();
    return threads.filter((t) => t.unreadCount > 0).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo hilo de mensajes con el primer mensaje incluido.
 * Accesible para: ADMIN, SECRETARY, TEACHER.
 * En Fase 1, STUDENT y GUARDIAN no pueden iniciar (solo responder).
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

    // Fase 1: sólo ADMIN, SECRETARY y TEACHER pueden iniciar hilos
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
                OR: [{ role: "TEACHER" }, { roles: { has: "TEACHER" } }],
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
