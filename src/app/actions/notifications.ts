"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUnreadNotifications(instituteId: string) {
    return prisma.notification.findMany({
        where: { instituteId, read: false },
        orderBy: { createdAt: "desc" },
        take: 20,
    });
}

export async function getRecentNotifications(instituteId: string) {
    return prisma.notification.findMany({
        where: { instituteId },
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

export async function markAllAsRead(instituteId: string) {
    await prisma.notification.updateMany({
        where: { instituteId, read: false },
        data: { read: true },
    });
    revalidatePath("/dashboard");
}

export async function createNotification({
    instituteId,
    type,
    title,
    body,
    link,
}: {
    instituteId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
}) {
    return prisma.notification.create({
        data: { instituteId, type, title, body, link },
    });
}
