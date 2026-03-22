import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import { CourseForm } from "./CourseForm";

export default async function NewCoursePage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // Buscamos los profesores del instituto para el select
    const teachers = await prisma.user.findMany({
        where: {
            instituteId: user.instituteId,
            role: { in: ["TEACHER", "ADMIN"] }
        },
        select: { id: true, name: true, email: true }
    });

    const levels = await prisma.level.findMany({
        where: {
            instituteId: user.instituteId
        },
        orderBy: { name: 'asc' }
    });

    const classrooms = await prisma.classroom.findMany({
        where: {
            instituteId: user.instituteId
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="space-y-4 mb-4">
                    <Link
                        href="/courses"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Cursos
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Nuevo Curso
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5 max-w-lg">
                                Registra un nuevo grupo, clase o curso introduciendo su nombre, nivel y un profesor encargado.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="max-w-2xl">
                    <Card className="shadow-md border-border/40 overflow-hidden bg-card/60 backdrop-blur-sm">
                        <div className="h-2 w-full premium-gradient" />
                        <CourseForm teachers={teachers} levels={levels} classrooms={classrooms} />
                    </Card>
                </div>
            </main>
        </div>
    );
}
