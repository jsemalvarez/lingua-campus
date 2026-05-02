import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { getThread } from "@/app/actions/messages";
import { ThreadViewClient } from "./components/ThreadViewClient";

interface Props {
    params: Promise<{ threadId: string }>;
}

export default async function ThreadPage({ params }: Props) {
    const { threadId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles: string[] = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);
    const isStudent = activeRole === "STUDENT";

    const thread = await getThread({
        threadId,
        currentUserId: sessionUser.id,
        isStudent,
    });

    if (!thread) notFound();

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={activeRole} />
            <main className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
                <ThreadViewClient
                    thread={thread}
                    currentUserId={sessionUser.id}
                    isStudent={isStudent}
                />
            </main>
        </div>
    );
}
