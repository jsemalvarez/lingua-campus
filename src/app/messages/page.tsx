import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { getThreadsForUser } from "@/app/actions/messages";
import { MessagesInboxClient } from "./components/MessagesInboxClient";
import { Mail, PenSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata = {
    title: "Mensajes | Lingua Campus",
    description: "Bandeja de mensajes del instituto",
};

export default async function MessagesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles: string[] = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);
    const isStudent = activeRole === "STUDENT";
    const isAdmin =
        activeRole === "ADMIN" ||
        activeRole === "SECRETARY" ||
        activeRole === "SUPERADMIN";
    const canCompose =
        isAdmin || activeRole === "TEACHER";

    const instituteId = sessionUser.instituteId as string;
    if (!instituteId && !isStudent) redirect("/dashboard");

    // Para estudiantes, el instituteId viene de la sesión también
    const resolvedInstituteId = instituteId ?? "";

    const threads = await getThreadsForUser({
        userId: sessionUser.id,
        isStudent,
        instituteId: resolvedInstituteId,
        isAdmin,
    });

    const unreadCount = threads.filter((t) => t.unreadCount > 0).length;

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
                                {unreadCount > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {unreadCount} {unreadCount === 1 ? "hilo sin leer" : "hilos sin leer"}
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
                <MessagesInboxClient threads={threads} currentUserId={sessionUser.id} isStudent={isStudent} />
            </main>
        </div>
    );
}
