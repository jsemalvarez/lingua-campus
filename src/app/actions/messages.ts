"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    }[];
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve el inbox del usuario actual:
 * - Admin/Secretary: todos los hilos del instituto
 * - Teacher/Guardian/Student: solo sus hilos como participante
 */
export async function getThreadsForUser({
    userId,
    isStudent,
    instituteId,
    isAdmin,
}: {
    userId: string;
    isStudent: boolean;
    instituteId: string;
    isAdmin: boolean;
}): Promise<ThreadPreview[]> {
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
                select: { body: true, createdAt: true },
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
            lastMessageBody: lastMsg?.body ?? null,
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
    currentUserId,
    isStudent,
}: {
    threadId: string;
    currentUserId: string;
    isStudent: boolean;
}): Promise<ThreadDetail | null> {
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
            },
        },
    });

    if (!thread) return null;

    // Verificar que el usuario sea participante
    const isParticipant = thread.participants.some((p) =>
        isStudent ? p.studentId === currentUserId : p.userId === currentUserId
    );
    if (!isParticipant) return null;

    // Marcar como leído
    await prisma.threadParticipant.updateMany({
        where: isStudent
            ? { threadId, studentId: currentUserId }
            : { threadId, userId: currentUserId },
        data: { lastReadAt: new Date() },
    });

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
            };
        }),
    };
}

/**
 * Cuenta cuántos hilos tienen mensajes no leídos para el badge de la Navbar.
 */
export async function getUnreadThreadCount({
    userId,
    isStudent,
    instituteId,
    isAdmin,
}: {
    userId: string;
    isStudent: boolean;
    instituteId: string;
    isAdmin: boolean;
}): Promise<number> {
    const threads = await getThreadsForUser({
        userId,
        isStudent,
        instituteId,
        isAdmin,
    });
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
    instituteId,
    subject,
    body,
    type = "DIRECT",
    courseId,
    senderUserId,
    senderRole,
    recipientUserIds = [],
    recipientStudentIds = [],
    includeGuardians = false,
}: {
    instituteId: string;
    subject: string;
    body: string;
    type?: "DIRECT" | "COURSE_BLAST";
    courseId?: string;
    senderUserId: string; // Solo Users pueden iniciar en Fase 1
    senderRole?: string;
    recipientUserIds?: string[];
    recipientStudentIds?: string[];
    includeGuardians?: boolean; // Si true, agrega tutores de los alumnos seleccionados
}): Promise<{ threadId: string }> {
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
    senderUserId,
    senderStudentId,
    senderRole,
}: {
    threadId: string;
    body: string;
    senderUserId?: string;
    senderStudentId?: string;
    senderRole?: string;
}): Promise<void> {
    if (!body.trim()) throw new Error("El mensaje no puede estar vacío.");

    const currentUserId = senderUserId ?? senderStudentId;
    const isStudent = !!senderStudentId;

    // Verificar que el sender sea participante del hilo
    const participant = await prisma.threadParticipant.findFirst({
        where: isStudent
            ? { threadId, studentId: currentUserId }
            : { threadId, userId: currentUserId },
    });

    if (!participant) throw new Error("No tenés acceso a este hilo.");

    await prisma.$transaction([
        prisma.message.create({
            data: {
                threadId,
                body: body.trim(),
                senderUserId: senderUserId ?? null,
                senderStudentId: senderStudentId ?? null,
                senderRole: senderRole ?? null,
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
export async function getCoursesWithRecipientsForUser({
    userId,
    roles,
    instituteId,
}: {
    userId: string;
    roles: string[];
    instituteId: string;
}) {
    const isAdmin =
        roles.includes("ADMIN") ||
        roles.includes("SECRETARY") ||
        roles.includes("SUPERADMIN");

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
