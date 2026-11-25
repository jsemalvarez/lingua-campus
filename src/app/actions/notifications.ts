"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/authz";

/**
 * Los avisos de quien llama, y de nadie más (SEC-14).
 *
 * Son server actions: endpoints que el navegador puede invocar con los argumentos
 * que quiera. Antes recibían de quién eran los avisos por parámetro y no miraban la
 * sesión, así que con el id de otra persona se leían o se marcaban los suyos. Es la
 * misma regla que sigue `messages.ts`: la identidad nunca llega por parámetro.
 *
 * Crear avisos no va acá sino en `@/lib/notifications`: en un archivo `"use server"`
 * cada función exportada es un endpoint, y ésas no son para el navegador.
 */
async function ownNotifications() {
    const ctx = await getAuthContext();
    if (!ctx) return null;
    return ctx.isStudent ? { studentId: ctx.userId } : { userId: ctx.userId };
}

/** Lo que muestra la campana. Sin sesión, vacía: no es una falla, es que se fue. */
export async function getMyNotifications() {
    const own = await ownNotifications();
    if (!own) return { unreadCount: 0, recent: [] };

    const [unreadCount, recent] = await Promise.all([
        prisma.notification.count({ where: { ...own, read: false } }),
        prisma.notification.findMany({ where: own, orderBy: { createdAt: "desc" }, take: 15 }),
    ]);
    return { unreadCount, recent };
}

export async function markAsRead(notificationId: string) {
    const own = await ownNotifications();
    // Un `id` vacío en el `where` de Prisma no filtra: marcaría todos.
    if (!own || typeof notificationId !== "string" || !notificationId) return;

    await prisma.notification.updateMany({
        where: { ...own, id: notificationId },
        data: { read: true },
    });
    revalidatePath("/dashboard");
}

export async function markAllAsRead() {
    const own = await ownNotifications();
    if (!own) return;

    await prisma.notification.updateMany({
        where: { ...own, read: false },
        data: { read: true },
    });
    revalidatePath("/dashboard");
}
