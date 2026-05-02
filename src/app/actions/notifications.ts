"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supabaseClient } from "@/lib/supabase-client";

export async function getUnreadNotifications(userId: string, isStudent: boolean = false) {
    return prisma.notification.findMany({
        where: isStudent ? { studentId: userId, read: false } : { userId: userId, read: false },
        orderBy: { createdAt: "desc" },
        take: 20,
    });
}

export async function getRecentNotifications(userId: string, isStudent: boolean = false) {
    return prisma.notification.findMany({
        where: isStudent ? { studentId: userId } : { userId: userId },
        orderBy: { createdAt: "desc" },
        take: 15,
    });
}

export async function markAsRead(notificationId: string) {
    await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
    revalidatePath("/dashboard");
}

export async function markAllAsRead(userId: string, isStudent: boolean = false) {
    await prisma.notification.updateMany({
        where: isStudent ? { studentId: userId, read: false } : { userId: userId, read: false },
        data: { read: true },
    });
    revalidatePath("/dashboard");
}

type BaseNotificationParams = {
    instituteId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
};

export async function createNotificationForRoles({
    instituteId,
    roles,
    type,
    title,
    body,
    link,
}: BaseNotificationParams & { roles: any[] }) {
    // Buscar usuarios del instituto que tengan alguno de los roles
    const targetUsers = await prisma.user.findMany({
        where: {
            instituteId,
            roles: { hasSome: roles },
        },
        select: { id: true },
    });

    if (targetUsers.length === 0) return;

    // Insertar notificaciones masivas
    await prisma.notification.createMany({
        data: targetUsers.map(u => ({
            instituteId,
            userId: u.id,
            type,
            title,
            body,
            link
        }))
    });

    // Enviar broadcast a cada canal
    for (const u of targetUsers) {
        if (supabaseClient) {
            await supabaseClient.channel(`user:${u.id}`).send({
                type: "broadcast",
                event: "new_notification",
                payload: { type, title, body, link, read: false, createdAt: new Date() },
            });
        }
    }
}

export async function createNotificationForUsers({
    instituteId,
    userIds,
    type,
    title,
    body,
    link,
}: BaseNotificationParams & { userIds: string[] }) {
    if (!userIds.length) return;

    await prisma.notification.createMany({
        data: userIds.map(id => ({
            instituteId,
            userId: id,
            type,
            title,
            body,
            link
        }))
    });

    for (const id of userIds) {
        if (supabaseClient) {
            await supabaseClient.channel(`user:${id}`).send({
                type: "broadcast",
                event: "new_notification",
                payload: { type, title, body, link, read: false, createdAt: new Date() },
            });
        }
    }
}

export async function createNotificationForStudents({
    instituteId,
    studentIds,
    type,
    title,
    body,
    link,
}: BaseNotificationParams & { studentIds: string[] }) {
    if (!studentIds.length) return;

    await prisma.notification.createMany({
        data: studentIds.map(id => ({
            instituteId,
            studentId: id,
            type,
            title,
            body,
            link
        }))
    });

    for (const id of studentIds) {
        if (supabaseClient) {
            await supabaseClient.channel(`user:${id}`).send({
                type: "broadcast",
                event: "new_notification",
                payload: { type, title, body, link, read: false, createdAt: new Date() },
            });
        }
    }
}
