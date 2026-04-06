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

    // Buscamos a todo el personal del instituto 
    const staffMembers = await prisma.user.findMany({
        where: {
            instituteId: user.instituteId,
            // @ts-ignore
            status: "ACTIVE",
            OR: [
                { role: { in: ["TEACHER", "SECRETARY"] } },
                { roles: { hasSome: ["TEACHER", "SECRETARY"] } }
            ]
        },
        include: {
            courses: true // Obtenemos las clases activas donde figuran como titulares
        },
        orderBy: { createdAt: "desc" }
    });

    const docentes = staffMembers.filter(s => s.roles.includes("TEACHER" as any) || s.role === "TEACHER");
    const administrativos = staffMembers.filter(s => s.roles.includes("SECRETARY" as any) || s.role === "SECRETARY");

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Personal de la institución</h1>
                        <p className="text-muted-foreground mt-1">
                            Administra a los profesionales y asistentes de la institución. Tienes {staffMembers.length} personas registradas.
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
                                placeholder="Buscar por nombre o email..."
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

                {/* Staff Sections */}
                {[
                    { title: "Docentes", icon: "🎓", items: docentes, badge: "Docente" },
                    { title: "Administración", icon: "🏢", items: administrativos, badge: "Secretaría" }
                ].map((group) => (
                    <div key={group.title} className="mb-10 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground/90 pb-2 border-b border-border/40">
                            <span className="text-2xl">{group.icon}</span> {group.title}
                            <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-2">{group.items.length}</span>
                        </h2>

                        {group.items.length === 0 ? (
                            <div className="text-center p-8 border border-dashed rounded-xl border-border/50 bg-muted/10">
                                <p className="text-sm text-muted-foreground">No hay personal registrado en este grupo.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {group.items.map(person => (
                                    <Card key={person.id} className="p-5 border-border/40 hover:border-primary/50 transition-colors bg-card/50 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="h-14 w-14 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-sm border border-primary/20">
                                                    {person.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-foreground/90">{person.name}</h3>
                                                    <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded-full mt-1 border border-border/50 text-muted-foreground">
                                                        {group.badge}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                                    <Mail size={14} className="text-blue-500/80" /> {person.email}
                                                </div>
                                                {person.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                                        <Phone size={14} className="text-emerald-500/80" />
                                                        <a href={`https://wa.me/${person.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-600 dark:text-emerald-400">
                                                            {person.phone}
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium pt-2 border-t border-border/40 mt-2">
                                                    <CalendarIcon size={14} /> Inc: {dayjs(person.createdAt).format("DD/MMM/YYYY")}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            {group.badge === "Docente" ? (
                                                <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                                                    {person.courses?.length || 0} Cursos
                                                </div>
                                            ) : (
                                                <div />
                                            )}
                                            <div className="flex gap-1 ml-auto">
                                                <Link href={`/teachers/${person.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full transition-colors">
                                                        <Eye size={16} />
                                                    </Button>
                                                </Link>
                                                <Link href={`/teachers/${person.id}`}>
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
                    </div>
                ))}
            </main>
        </div>
    );
}
