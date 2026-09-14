import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { getThreadsForUser, getFamilyRecipients } from "@/app/actions/messages";
import { MessagesInboxClient } from "./components/MessagesInboxClient";
import { Mail, PenSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata = {
    title: "Mensajes | Lingua Campus",
    description: "Bandeja de mensajes del instituto",
};

interface Props {
    searchParams: Promise<{
        q?: string;
        curso?: string;
        alumno?: string;
        sinleer?: string;
        pagina?: string;
    }>;
}

export default async function MessagesPage({ searchParams }: Props) {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    // Se exige el `id` y no sólo el usuario: la bandeja marca los hilos propios
    // comparando contra `currentUserId`, así que sin identidad no hay nada que
    // mostrar bien. Antes el campo entraba como `any` y llegaba `undefined`.
    if (!sessionUser?.id) redirect("/login");
    const userRoles: string[] = sessionUser.roles ?? [];
    const activeRole = await getActiveRole(userRoles);
    const isStudent = activeRole === "STUDENT";
    const isAdmin =
        activeRole === "ADMIN" ||
        activeRole === "SECRETARY" ||
        activeRole === "SUPERADMIN";
    const isFamily = isStudent || activeRole === "GUARDIAN";

    if (!sessionUser.instituteId && !isStudent) redirect("/dashboard");

    const params = await searchParams;

    // La identidad y el rol se derivan de la sesión dentro del server action
    const inbox = await getThreadsForUser({
        search: params.q,
        courseId: params.curso,
        studentId: params.alumno,
        onlyUnread: params.sinleer === "1",
        page: params.pagina ? Number(params.pagina) : 1,
    });

    // El personal siempre puede redactar. La familia, sólo si tiene sobre qué:
    // sin inscripción activa no hay docente ni curso a quien escribirle, y un
    // botón que lleva a una pantalla vacía es peor que no tener el botón.
    const canCompose = isAdmin || activeRole === "TEACHER"
        ? true
        : isFamily
        ? (await getFamilyRecipients()).length > 0
        : false;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={activeRole} />
            <main className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Mail className="text-primary" size={20} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Mensajes</h1>
                                {inbox.unreadTotal > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {inbox.unreadTotal}{" "}
                                        {inbox.unreadTotal === 1 ? "hilo sin leer" : "hilos sin leer"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    {canCompose && (
                        <Link href="/messages/new">
                            <Button className="gap-2 h-10 px-4 rounded-xl font-semibold shadow-sm">
                                <PenSquare size={16} />
                                Redactar
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Inbox */}
                <MessagesInboxClient
                    inbox={inbox}
                    filters={{
                        q: params.q ?? "",
                        curso: params.curso ?? "",
                        alumno: params.alumno ?? "",
                        sinleer: params.sinleer === "1",
                    }}
                />
            </main>
        </div>
    );
}
