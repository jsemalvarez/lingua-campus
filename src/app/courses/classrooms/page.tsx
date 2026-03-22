import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Home, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ClassroomManager } from "./ClassroomManager";

export default async function ClassroomsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    const classrooms = await prisma.classroom.findMany({
        where: { instituteId: user.instituteId },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link href="/courses" className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
                            <ChevronLeft size={14} /> Volver a Cursos
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Home className="text-primary" size={28} />
                            Gestión de Aulas
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Crea y organiza los espacios físicos o virtuales de tu instituto.
                        </p>
                    </div>
                </div>

                <ClassroomManager initialClassrooms={classrooms} />
            </main>
        </div>
    );
}
