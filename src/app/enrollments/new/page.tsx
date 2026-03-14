import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { EnrollmentForm } from "./EnrollmentForm";

export default async function NewEnrollmentPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    const { course: preselectedCourseId } = await searchParams;

    // Obtener los cursos del instituto
    const courses = await prisma.course.findMany({
        where: { instituteId: user.instituteId },
        select: { id: true, name: true, level: true },
        orderBy: { name: "asc" }
    });

    // Obtener alumnos del instituto, excluyendo aquellos que ya tengan inscripciones en TODOS los cursos
    // (Por ahora traemos a todos, permitiendo que el form bloquee el submit en el backend si hay colisión)
    const students = await prisma.student.findMany({
        where: { instituteId: user.instituteId, status: "ACTIVE" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" }
    });

    if (courses.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-12 text-center">
                    <h2 className="text-2xl font-bold mb-4">No tienes cursos creados</h2>
                    <p className="text-muted-foreground mb-6">Necesitas al menos un curso activo para poder inscribir a un alumno.</p>
                    <Link href="/courses/new" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium inline-block">
                        Crear mi primer curso
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="space-y-4 mb-4">
                    {/* Acción de regresar al curso seleccionado, o al panel de cursos */}
                    <Link
                        href={preselectedCourseId ? `/courses/${preselectedCourseId}` : "/courses"}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al curso
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Administrar Inscripción
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5 max-w-lg">
                                Asigna un estudiante existente a un curso específico dentro de tu instituto.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="max-w-xl">
                    <Card className="shadow-md border-border/40 overflow-visible bg-card/60 backdrop-blur-sm relative z-10">
                        <div className="h-2 w-full premium-gradient rounded-t-xl" />

                        <EnrollmentForm
                            courses={courses}
                            students={students}
                            preselectedCourseId={preselectedCourseId}
                        />
                    </Card>
                </div>
            </main>
        </div>
    );
}
