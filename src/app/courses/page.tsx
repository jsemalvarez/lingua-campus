import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus, BookOpen, Layers, MapPin } from "lucide-react";
import { CourseListClientRenderer } from "./components/CourseListClientRenderer";

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function CoursesPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    // Validar Rol (Solo Admin y Profesores pueden ver esto, NO usar en panel SuperAdmin)
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true, preferences: true }
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
                include: { student: { select: { id: true, name: true } } },
                orderBy: { student: { name: 'asc' } }
            },
            _count: {
                select: { enrollments: { where: { status: "ACTIVE" } } }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Aplicar orden persistente del usuario si existe
    const preferences = user.preferences as any;
    const courseOrder = preferences?.courseOrder as string[] | undefined;

    let sortedCourses = courses;
    if (courseOrder && Array.isArray(courseOrder)) {
        // Ordenar basándonos en el array de IDs guardado
        sortedCourses = [...courses].sort((a, b) => {
            const indexA = courseOrder.indexOf(a.id);
            const indexB = courseOrder.indexOf(b.id);

            // Si ambos están en el orden guardado, respetarlo
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;

            // Si solo uno está, ese va primero
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            // Si ninguno está (cursos nuevos), mantener el orden por createdAt desc (que ya trae la query)
            return 0;
        });
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

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

                    {user.role === "ADMIN" && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/courses/new">
                                <Button className="h-11 px-6 shadow-lg shadow-primary/20 premium-gradient border-none hover:opacity-90 font-bold transition-all hover:scale-[1.02]">
                                    <Plus className="mr-2 h-5 w-5" />Curso
                                </Button>
                            </Link>
                            <Link href="/courses/levels">
                                <Button variant="outline" className="flex items-center gap-2 h-11 px-4">
                                    <Layers size={18} className="text-primary" />
                                    <span className="hidden xs:inline">Niveles</span>
                                    <span className="xs:hidden">Niv.</span>
                                </Button>
                            </Link>
                            <Link href="/courses/classrooms">
                                <Button variant="outline" className="flex items-center gap-2 h-11 px-4">
                                    <MapPin size={18} className="text-primary" />
                                    <span className="hidden xs:inline">Aulas</span>
                                    <span className="xs:hidden">Aul.</span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Listado de Cursos ── */}
                {courses.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/60">
                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={32} />
                        </div>
                        <h2 className="text-xl font-bold">No hay cursos registrados</h2>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto text-sm">
                            Comienza creando tu primer curso para empezar a gestionar los niveles y alumnos.
                        </p>
                    </div>
                ) : (
                    <CourseListClientRenderer
                        initialCourses={sortedCourses}
                        userRole={user.role}
                        DAYS_OF_WEEK={DAYS_OF_WEEK}
                    />
                )}
            </main>
        </div>
    );
}
