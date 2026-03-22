import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreateTeacherModal } from "./components/CreateTeacherModal";
import { Search, GraduationCap, Filter, Mail, Phone, Calendar as CalendarIcon, Edit3, Eye } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";

export default async function TeachersPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // Buscamos a todos los profesores del instituto 
    const teachers = await prisma.user.findMany({
        where: {
            instituteId: user.instituteId,
            role: "TEACHER",
            // @ts-ignore
            status: "ACTIVE"
        },
        include: {
            courses: true // Obtenemos las clases activas donde figuran como titulares
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Plantel Docente</h1>
                        <p className="text-muted-foreground mt-1">
                            Administra a los profesores de la institución. Tienes {teachers.length} registrados.
                        </p>
                    </div>
                    <CreateTeacherModal />
                </header>

                {/* Filters & Search */}
                <Card className="p-4 mb-6 shadow-sm border-border/40">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Buscar profesor por nombre o email..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="hidden sm:flex border-border/60">
                                <Filter className="mr-2 h-4 w-4" /> Filtros
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Teachers Grid */}
                {teachers.length === 0 ? (
                    <div className="text-center p-12 border border-dashed rounded-xl border-border/50 bg-muted/20">
                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Sin profesores</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                            Aún no has registrado a ningún docente. Registra al primero para poder asignarlo a un curso.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachers.map(teacher => (
                            <Card key={teacher.id} className="p-5 border-border/40 hover:border-primary/50 transition-colors bg-card/50 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-14 w-14 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-sm border border-primary/20">
                                            {teacher.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground/90">{teacher.name}</h3>
                                            <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded-full mt-1">Docente</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                            <Mail size={14} className="text-blue-500/80" /> {teacher.email}
                                        </div>
                                        {teacher.phone && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                                <Phone size={14} className="text-emerald-500/80" />
                                                <a href={`https://wa.me/${teacher.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-600 dark:text-emerald-400">
                                                    {teacher.phone}
                                                </a>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium pt-2 border-t border-border/40 mt-2">
                                            <CalendarIcon size={14} /> Incorporación: {dayjs(teacher.createdAt).format("DD/MMM/YYYY")}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                                        {teacher.courses.length} Cursos Asignados
                                    </div>
                                    <div className="flex gap-1">
                                        <Link href={`/teachers/${teacher.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full transition-colors">
                                                <Eye size={16} />
                                            </Button>
                                        </Link>
                                        <Link href={`/teachers/${teacher.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full transition-colors">
                                                <Edit3 size={16} />
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
