import { randomUUID } from "crypto";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { supabaseClient } from "@/lib/supabase-client";

/**
 * Crear avisos para la campana. Sólo del lado del servidor: vivía en
 * `app/actions/notifications.ts`, que es `"use server"`, y ahí cada función exportada
 * es un endpoint que el navegador puede invocar (SEC-14).
 */

type NotificationContent = {
    instituteId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
};

async function deliver(
    { instituteId, type, title, body, link }: NotificationContent,
    to: "userId" | "studentId",
    recipients: string[]
) {
    if (!recipients.length) return;

    const createdAt = new Date();
    // El `id` se pone acá porque viaja también en el aviso en vivo: sin él, la campana
    // recibía un aviso que no se podía marcar como leído hasta recargar la página.
    const rows = recipients.map((recipient) => ({ id: randomUUID(), recipient }));

    await prisma.notification.createMany({
        data: rows.map(({ id, recipient }) => ({
            id,
            instituteId,
            ...(to === "userId" ? { userId: recipient } : { studentId: recipient }),
            type,
            title,
            body,
            link,
            createdAt,
        })),
    });

    for (const { id, recipient } of rows) {
        if (supabaseClient) {
            await supabaseClient.channel(`user:${recipient}`).send({
                type: "broadcast",
                event: "new_notification",
                payload: { id, type, title, body, link, read: false, createdAt },
            });
        }
    }
}

/** A los usuarios del instituto que tengan alguno de los roles. */
export async function createNotificationForRoles({
    roles,
    ...content
}: NotificationContent & { roles: UserRole[] }) {
    const targetUsers = await prisma.user.findMany({
        where: {
            instituteId: content.instituteId,
            roles: { hasSome: roles },
        },
        select: { id: true },
    });

    await deliver(content, "userId", targetUsers.map((u) => u.id));
}

export async function createNotificationForUsers({
    userIds,
    ...content
}: NotificationContent & { userIds: string[] }) {
    await deliver(content, "userId", userIds);
}

export async function createNotificationForStudents({
    studentIds,
    ...content
}: NotificationContent & { studentIds: string[] }) {
    await deliver(content, "studentId", studentIds);
}
