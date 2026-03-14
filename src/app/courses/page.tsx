import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus, BookOpen, Clock, Users, GraduationCap, FileText, Layers, Home, MapPin } from "lucide-react";

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
            classroom: { select: { name: true } },
            schedules: { orderBy: { dayOfWeek: 'asc' } },
            enrollments: {
                where: { status: "ACTIVE", student: { status: "ACTIVE" } },
                include: { student: { select: { name: true } } },
                orderBy: { student: { name: 'asc' } }
            },
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
                    <div className="flex flex-col gap-5 w-full">
                        {courses.map(course => (
                            <Card key={course.id} className="group overflow-hidden flex flex-col hover:border-primary/40 transition-colors shadow-sm bg-card/60 backdrop-blur-sm relative">
                                {/* Decoración de tarjeta */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 premium-gradient opacity-80" />

                                <div className="p-0 flex flex-col sm:flex-row w-full h-full relative z-10">
                                    
                                    {/* Columna 1: Curso, Nivel y Horarios */}
                                    <div className="flex-1 p-5 sm:p-6 sm:border-r border-border/40 flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                                                    {course.name}
                                                </h3>
                                                <span className="inline-block px-2 py-1 mt-2 mb-4 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                                    Nivel: {course.level || "General"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mt-auto text-sm">
                                            <div className="flex gap-2">
                                                <div className="mt-0.5"><Clock size={16} className="text-emerald-500/80 shrink-0" /></div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-muted-foreground mb-1">Días y Horarios:</span>
                                                    {course.schedules.length === 0 ? (
                                                        <span className="italic text-muted-foreground">A definir</span>
                                                    ) : (
                                                        <ul className="space-y-1">
                                                            {course.schedules.map(sch => (
                                                                <li key={sch.id} className="text-foreground">
                                                                    <span className="font-medium">{DAYS_OF_WEEK[sch.dayOfWeek]}</span> • {sch.startTime} - {sch.endTime}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna 2: Lista de alumnos */}
                                    <div className="flex-1 p-5 sm:p-6 sm:border-r border-border/40 bg-muted/10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Users size={16} className="text-blue-500/80" />
                                            <h4 className="font-semibold text-sm">Alumnos Inscriptos ({course._count.enrollments})</h4>
                                        </div>
                                        <div className="text-sm">
                                            {course.enrollments.length === 0 ? (
                                                <span className="italic text-muted-foreground">Sin alumnos cargados.</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto scrollbar-hide">
                                                    {course.enrollments.map(enr => (
                                                        <span key={enr.id} className="inline-block px-2.5 py-1 text-xs bg-background border border-border/50 text-foreground rounded-full shadow-sm">
                                                            {enr.student.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Columna 3: Profesor, Aula y Acción Administrar */}
                                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                                        <div className="space-y-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <GraduationCap size={16} className="text-amber-500/80" />
                                                    <span className="font-semibold">Profesor a Cargo:</span>
                                                </div>
                                                <span className="text-foreground font-medium pl-6">{course.teacher?.name || "No asignado"}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <MapPin size={16} className="text-red-500/80" />
                                                    <span className="font-semibold">Aula Asignada:</span>
                                                </div>
                                                <span className="text-foreground font-medium pl-6">{course.classroom?.name || "Sin aula asignada"}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 pt-4 border-t border-border/30">
                                            <Link href={`/courses/${course.id}`} className="w-full inline-block">
                                                <div className="w-full px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-sm rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap">
                                                    Administrar Curso
                                                </div>
                                            </Link>
                                        </div>
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
