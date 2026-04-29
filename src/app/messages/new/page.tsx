import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { getCoursesWithRecipientsForUser } from "@/app/actions/messages";
import { ComposeClient } from "./components/ComposeClient";
import { PenSquare } from "lucide-react";

export const metadata = {
    title: "Nuevo Mensaje | Lingua Campus",
};

export default async function NewMessagePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles: string[] = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);

    // Solo Staff puede redactar
    const canCompose =
        activeRole === "ADMIN" ||
        activeRole === "SECRETARY" ||
        activeRole === "SUPERADMIN" ||
        activeRole === "TEACHER";

    if (!canCompose) redirect("/messages");

    const { courses, allTeachers } = await getCoursesWithRecipientsForUser({
        userId: sessionUser.id,
        roles: userRoles,
        instituteId: sessionUser.instituteId,
    });

    const isAdmin =
        activeRole === "ADMIN" ||
        activeRole === "SECRETARY" ||
        activeRole === "SUPERADMIN";

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={activeRole} />
            <main className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <PenSquare className="text-primary" size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Nuevo Mensaje</h1>
                        <p className="text-sm text-muted-foreground">
                            Redactá un nuevo mensaje para alumnos, tutores o personal.
                        </p>
                    </div>
                </div>

                <ComposeClient
                    senderUserId={sessionUser.id}
                    instituteId={sessionUser.instituteId}
                    courses={courses}
                    allTeachers={allTeachers}
                    isAdmin={isAdmin}
                />
            </main>
        </div>
    );
}
