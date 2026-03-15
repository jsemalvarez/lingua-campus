import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Layers, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { LevelManager } from "./LevelManager";

export default async function LevelsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    const levels = await prisma.level.findMany({
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
                            <Layers className="text-primary" size={28} />
                            Niveles Académicos
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Agrupa y delimita las etapas de aprendizaje disponibles en tu instituto.
                        </p>
                    </div>
                </div>

                <LevelManager initialLevels={levels} />
            </main>
        </div>
    );
}
