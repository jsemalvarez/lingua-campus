import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Search, UserPlus, Mail, Phone, Calendar as CalendarIcon, ChevronLeft, ChevronRight, UserMinus, Users } from "lucide-react";
import dayjs from "dayjs";
import { StudentListActions } from "./components/StudentListActions";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StudentsPage(props: PageProps) {
    const searchParams = await props.searchParams;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // Pagination setup
    const PAGE_SIZE = 50;
    const pageParam = typeof searchParams.page === 'string' ? searchParams.page : '1';
    const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);
    const skip = (currentPage - 1) * PAGE_SIZE;

    const tabParam = typeof searchParams.tab === 'string' ? searchParams.tab : 'active';
    const isActiveTab = tabParam === 'active';
    const isInactiveTab = tabParam === 'inactive';
    const isPreEnrolledTab = tabParam === 'pre-enrolled';

    // Build the query where clause
    const whereClause: import("@prisma/client").Prisma.StudentWhereInput = { 
        instituteId: user.instituteId, 
        status: isPreEnrolledTab ? "PRE_INSCRIBED" : (isInactiveTab ? "DELETED" : "ACTIVE")
    };

    // Add simple text search if query is present
    const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
    if (query) {
        whereClause.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } }
        ];
    }

    // Buscamos a los estudiantes y el total para la paginación
    const [students, totalStudents] = await Promise.all([
        prisma.student.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            skip,
            take: PAGE_SIZE,
        }),
        prisma.student.count({
            where: whereClause
        })
    ]);

    const totalPages = Math.ceil(totalStudents / PAGE_SIZE) || 1;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-2 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Estudiantes</h1>
                        <p className="text-muted-foreground mt-1">
                            Administra la base de datos de tus alumnos. Hay {totalStudents} registrados en total.
                        </p>
                    </div>
                    <Link href="/students/new">
                        <Button className="premium-gradient shadow-md shadow-primary/20">
                            <UserPlus className="mr-2 h-4 w-4" /> Nuevo Estudiante
                        </Button>
                    </Link>
                </header>

                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-muted/30 p-1 rounded-lg w-fit mb-6 border border-border/40">
                    <Link href="/students?tab=active">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`px-4 sm:px-6 py-2 rounded-md transition-all ${isActiveTab ? "bg-background shadow-sm border border-border/60 text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Users size={16} className="mr-2" /> Activos
                        </Button>
                    </Link>
                    <Link href="/students?tab=pre-enrolled">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`px-4 sm:px-6 py-2 rounded-md transition-all ${isPreEnrolledTab ? "bg-background shadow-sm border border-border/60 text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <UserPlus size={16} className="mr-2" /> Pre-inscriptos
                        </Button>
                    </Link>
                    <Link href="/students?tab=inactive">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`px-4 sm:px-6 py-2 rounded-md transition-all ${isInactiveTab ? "bg-background shadow-sm border border-border/60 text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <UserMinus size={16} className="mr-2" /> Papelera
                        </Button>
                    </Link>
                </div>

                {/* Filters & Search */}
                <Card className="p-4 mb-6 shadow-sm border-border/40">
                    <form className="flex flex-col md:flex-row gap-4" action="/students" method="GET">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <input
                                type="text"
                                name="q"
                                defaultValue={query || ""}
                                placeholder="Buscar por nombre, email o teléfono..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" variant="secondary" className="border-border/60">
                                Buscar
                            </Button>
                            {query && (
                                <Link href="/students">
                                    <Button variant="outline" className="border-border/60 text-muted-foreground">
                                        Limpiar
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </form>
                </Card>

                {/* Students Table/List */}
                {students.length === 0 ? (
                    <div className="text-center p-12 border border-dashed rounded-xl border-border/50 bg-muted/20">
                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                            {query ? "Sin resultados" : "Sin estudiantes"}
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                            {query
                                ? "No se encontraron estudiantes que coincidan con la búsqueda."
                                : "Aún no has registrado ningún estudiante en tu instituto."}
                        </p>
                        {!query && (
                            <Link href="/students/new">
                                <Button className="premium-gradient">Registrar el primero</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <Card className="overflow-hidden border-border/40 shadow-sm mb-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-border/50">
                                            <th className="px-3 sm:px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre del Alumno</th>
                                            <th className="px-3 sm:px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Contacto</th>
                                            <th className="hidden lg:table-cell px-3 sm:px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{isActiveTab ? "Ingreso" : "Baja"}</th>
                                            <th className="hidden lg:table-cell px-3 sm:px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {students.map((student) => (
                                            <tr key={student.id} className="hover:bg-muted/40 transition-colors group">
                                                <td className="px-3 sm:px-2 py-4 sm:py-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="hidden md:flex h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 items-center justify-center text-primary font-bold shadow-sm shadow-primary/5">
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <Link href={`/students/${student.id}`} className="font-semibold text-sm underline md:no-underline md:hover:underline hover:text-primary transition-colors text-foreground">
                                                                {student.name}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-2 py-4 sm:py-2">
                                                    <div className="flex flex-col gap-1.5">
                                                        {student.email && (
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                                <Mail size={13} className="text-blue-500/80" /> {student.email}
                                                            </div>
                                                        )}
                                                        {student.phone && (
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                                <Phone size={13} className="text-emerald-500/80" />
                                                                <a href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-600 dark:text-emerald-400">
                                                                    {student.phone}
                                                                </a>
                                                            </div>
                                                        )}
                                                        {!student.email && !student.phone && student.guardian1Name && (
                                                            <>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                                    <UserPlus size={13} className="text-purple-500/80" /> {student.guardian1Name} {student.guardian1Relation ? `(${student.guardian1Relation})` : ""}
                                                                </div>
                                                                {student.guardian1Phone && (
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                                        <Phone size={13} className="text-emerald-500/80" />
                                                                        <a href={`https://wa.me/${student.guardian1Phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-600 dark:text-emerald-400">
                                                                            {student.guardian1Phone}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                        {!student.email && !student.phone && !student.guardian1Name && (
                                                            <span className="text-xs text-muted-foreground italic">Sin vías de contacto personal</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-xs font-medium text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon size={14} />
                                                        {dayjs(student.joinDate).format("DD/MM/YYYY")}
                                                    </div>
                                                </td>
                                                <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-right">
                                                    <StudentListActions 
                                                        studentId={student.id} 
                                                        studentName={student.name} 
                                                        isActive={isActiveTab} 
                                                        status={student.status}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between gap-4 mt-6">
                                <span className="text-sm text-muted-foreground hidden sm:block">
                                    Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, totalStudents)} de {totalStudents}
                                </span>

                                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                    <Link
                                        href={`/students?page=${currentPage - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                                    >
                                        <Button variant="outline" size="sm" disabled={currentPage <= 1} className="border-border/60">
                                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                                        </Button>
                                    </Link>

                                    <div className="mx-2 text-sm font-medium">
                                        Página {currentPage} / {totalPages}
                                    </div>

                                    <Link
                                        href={`/students?page=${currentPage + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                                    >
                                        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} className="border-border/60">
                                            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
