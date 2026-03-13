import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus, BookOpen, Clock, Users, GraduationCap, FileText, Layers, Home } from "lucide-react";
import { DeleteCourseButton } from "./components/DeleteCourseButton";

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function CoursesPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    // Validar Rol (Solo Admin y Profesores pueden ver esto, NO usar en panel SuperAdmin)
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard"); // Si sos superadmin andá a tu panel
    }

    // Listar todos los cursos del instituto
    const courses = await prisma.course.findMany({
        where: { instituteId: user.instituteId },
        include: {
            teacher: { select: { name: true } },
            schedules: { orderBy: { dayOfWeek: 'asc' } },
            _count: {
                select: { enrollments: { where: { status: "ACTIVE" } } }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* ── Encabezado Principal ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                            <BookOpen className="text-primary hidden sm:block" size={28} />
                            Gestión de Cursos
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                            Administra las clases, niveles, y profesores de tu instituto.
                        </p>
                    </div>
                    {/* Acciones Principales */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/courses/new">
                            <Button className="premium-gradient shadow-md shadow-primary/20 flex items-center gap-2">
                                <Plus size={18} />
                                Curso
                            </Button>
                        </Link>
                        <Link href="/courses/levels">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Layers size={18} className="text-primary" />
                                Niveles
                            </Button>
                        </Link>
                        <Link href="/courses/classrooms">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Home size={18} className="text-primary" />
                                Aulas
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Listado de Cursos ── */}
                {courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                            <GraduationCap size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No hay cursos creados</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            Este instituto aún no tiene oferta académica. Añade tu primer curso para empezar a recibir alumnos.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {courses.map(course => (
                            <Card key={course.id} className="group overflow-hidden flex flex-col hover:border-primary/40 transition-colors shadow-sm bg-card/60 backdrop-blur-sm">
                                {/* Decoración de tarjeta */}
                                <div className="h-2 w-full premium-gradient opacity-80" />

                                <div className="p-5 flex-1 flex flex-col">
                                    {/* Cabecera */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                                {course.name}
                                            </h3>
                                            <span className="inline-block px-2 py-0.5 mt-1.5 rounded-md text-xs font-semibold bg-muted text-muted-foreground">
                                                Nivel: {course.level || "General"}
                                            </span>
                                        </div>
                                        {user.role === "ADMIN" && (
                                            <DeleteCourseButton id={course.id} />
                                        )}
                                    </div>

                                    {/* Estadísticas / Info */}
                                    <div className="space-y-3 mb-6 flex-1 text-sm">
                                        <div className="flex items-center text-muted-foreground gap-2">
                                            <Users size={16} className="text-blue-500/80" />
                                            <span className="font-medium text-foreground">{course._count.enrollments} alumnos</span> inscriptos
                                        </div>
                                        <div className="flex items-center text-muted-foreground gap-2">
                                            <GraduationCap size={16} className="text-amber-500/80" />
                                            <span>Prof: <span className="font-medium text-foreground">{course.teacher?.name || "No asignado"}</span></span>
                                        </div>
                                        <div className="flex items-start text-muted-foreground gap-2">
                                            <Clock size={16} className="text-emerald-500/80 mt-0.5 shrink-0" />
                                            <div className="flex flex-col">
                                                {course.schedules.length === 0 ? (
                                                    <span className="italic">Horarios a definir</span>
                                                ) : (
                                                    course.schedules.map(sch => (
                                                        <span key={sch.id} className="text-xs">{DAYS_OF_WEEK[sch.dayOfWeek]} • {sch.startTime} - {sch.endTime}</span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones de Footer */}
                                    <div className="pt-4 border-t border-border/40 mt-auto flex gap-2">
                                        <Link href={`/courses/${course.id}`} className="w-full">
                                            <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                                                Administrar
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
