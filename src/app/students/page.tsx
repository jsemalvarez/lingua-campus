import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Search, UserPlus, Filter, Eye, Mail, Phone, Calendar as CalendarIcon } from "lucide-react";
import dayjs from "dayjs";

export default async function StudentsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // Buscamos a todos los estudiantes de este instituto
    const students = await prisma.student.findMany({
        where: { instituteId: user.instituteId },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Estudiantes</h1>
                        <p className="text-muted-foreground mt-1">
                            Administra la base de datos de tus alumnos. Hay {students.length} registrados.
                        </p>
                    </div>
                    <Link href="/students/new">
                        <Button className="premium-gradient shadow-md shadow-primary/20">
                            <UserPlus className="mr-2 h-4 w-4" /> Nuevo Estudiante
                        </Button>
                    </Link>
                </header>

                {/* Filters & Search */}
                <Card className="p-4 mb-6 shadow-sm border-border/40">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o teléfono..."
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

                {/* Students Table/List */}
                {students.length === 0 ? (
                    <div className="text-center p-12 border border-dashed rounded-xl border-border/50 bg-muted/20">
                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Sin estudiantes</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                            Aún no has registrado ningún estudiante en tu instituto.
                        </p>
                        <Link href="/students/new">
                            <Button className="premium-gradient">Registrar el primero</Button>
                        </Link>
                    </div>
                ) : (
                    <Card className="overflow-hidden border-border/40 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/50">
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre del Alumno</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Contacto</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ingreso</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-muted/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm shadow-primary/5">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-sm">{student.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {student.email && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                            <Mail size={13} className="text-blue-500/80" /> {student.email}
                                                        </div>
                                                    )}
                                                    {student.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                            <Phone size={13} className="text-emerald-500/80" /> {student.phone}
                                                        </div>
                                                    )}
                                                    {!student.email && !student.phone && (
                                                        <span className="text-xs text-muted-foreground italic">Sin vías de contacto personal</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon size={14} />
                                                    {dayjs(student.joinDate).format("DD/MM/YYYY")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/students/${student.id}`}>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all rounded-full h-8 w-8">
                                                        <Eye size={16} />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
}
