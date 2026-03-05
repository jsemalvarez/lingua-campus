import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreateScheduleModal } from "./components/CreateScheduleModal";
import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, User } from "lucide-react";

const daysMapping = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function SchedulePage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // Obtenemos los cursos para el modal
    const courses = await prisma.course.findMany({
        where: { instituteId: user.instituteId },
        select: { id: true, name: true, level: true },
        orderBy: { name: 'asc' }
    });

    // Obtenemos los horarios programados, incluyendo qué curso y qué profesor
    const schedules = await prisma.schedule.findMany({
        where: {
            course: {
                instituteId: user.instituteId
            }
        },
        include: {
            course: {
                include: {
                    teacher: true
                }
            }
        },
        orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
        ]
    });

    const colors = [
        "bg-blue-500/10 text-blue-600 border-blue-500/20",
        "bg-purple-500/10 text-purple-600 border-purple-500/20",
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        "bg-orange-500/10 text-orange-600 border-orange-500/20",
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Calendario Institucional</h1>
                        <p className="text-muted-foreground mt-1">
                            Visualiza y gestiona las clases programadas de la institución. Encontradas {schedules.length} plantillas de clases.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
                            <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg bg-background shadow-sm hover:bg-background">Día</Button>
                            <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg text-muted-foreground hover:bg-muted/50">Semana</Button>
                        </div>
                        <CreateScheduleModal courses={courses} />
                    </div>
                </header>

                {/* Date Selector */}
                <div className="flex items-center justify-between mb-8 bg-muted/10 p-4 rounded-2xl border border-border/40">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50 hover:bg-muted hover:text-foreground">
                            <ChevronLeft size={16} />
                        </Button>
                        <h2 className="text-lg font-bold tracking-tight">Semana Actual</h2>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50 hover:bg-muted hover:text-foreground">
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-8 border-border/50 hover:bg-muted hover:text-foreground">Hoy</Button>
                </div>

                <div className="grid gap-8 lg:grid-cols-4">
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <Card className="p-4 bg-muted/20 border-border/50 shadow-sm">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/80">
                                <Users className="text-primary" size={16} /> Visión General
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-background">
                                    <span className="text-muted-foreground">Total de Clases:</span>
                                    <span className="font-bold">{schedules.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-background">
                                    <span className="text-muted-foreground">Cursos Activos:</span>
                                    <span className="font-bold">{courses.length}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 bg-zinc-900 text-white border-0 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-[40px] -mr-12 -mt-12 rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Recordatorio</h3>
                            <p className="text-sm text-white/80 leading-relaxed relative z-10">
                                La programación interactiva por calendario drag-and-drop se agregará pronto.
                            </p>
                        </Card>
                    </div>

                    {/* Timeline / Clases List */}
                    <div className="lg:col-span-3 space-y-4">
                        {schedules.length === 0 ? (
                            <div className="text-center p-12 border border-dashed rounded-xl border-border/50 bg-muted/20">
                                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">Sin clases programadas</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                                    Aún no has configurado ninguna plantilla semanal en el calendario de la institución.
                                </p>
                            </div>
                        ) : (
                            schedules.map((schedule, index) => (
                                <Card key={schedule.id} className={`p-0 overflow-hidden border-l-4 transition-all hover:scale-[1.01] hover:shadow-lg group shadow-sm sm:shadow-md cursor-pointer ${colors[index % colors.length]}`}>
                                    <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60">
                                        <div className="flex items-start gap-5">
                                            <div className={"h-12 w-16 rounded-2xl flex flex-col items-center justify-center border border-border/40 shadow-sm shrink-0 bg-background/50"}>
                                                <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-0.5">{daysMapping[schedule.dayOfWeek].substring(0, 3)}</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1"><Clock size={13} /> {schedule.startTime} - {schedule.endTime}</span>
                                                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                        <MapPin size={10} /> {schedule.room || "Sin Aula"}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold tracking-tight text-foreground/90">{schedule.course.name} <span className="text-muted-foreground font-medium text-sm ml-1">({schedule.course.level || "General"})</span></h3>
                                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <span className="text-[10px]"><User size={13} /></span> {schedule.course.teacher ? schedule.course.teacher.name : "Sin profesor asignado"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="sm:text-right w-full sm:w-auto flex sm:flex-col gap-2">
                                            <Button variant="outline" size="sm" className="h-8 text-xs font-bold hover:bg-primary/5 hover:text-primary transition-all flex-1 sm:flex-none">
                                                Ver Asistencia
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-1 sm:flex-none text-red-500 hover:text-red-600 hover:bg-red-50">
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
