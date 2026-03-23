import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, BookOpen, Clock, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import dayjs from "dayjs";
import { TeacherProfileView } from "./TeacherProfileView";
import { TeacherDangerZone } from "./TeacherDangerZone";

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    const { id } = await params;

    const teacher = await prisma.user.findUnique({
        where: { id: id },
        include: {
            courses: {
                where: { instituteId: user.instituteId }
            },
            expensesReceived: {
                where: { instituteId: user.instituteId },
                orderBy: { date: 'desc' }
            }
        }
    });

    if (!teacher || teacher.role !== "TEACHER" || teacher.instituteId !== user.instituteId) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8">
                    <Link
                        href="/teachers"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a la lista de profesores
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Ficha del Profesor</h1>
                </header>

                <div className="grid gap-8 lg:grid-cols-4 items-start">
                    <div className="lg:col-span-3">
                        <TeacherProfileView teacher={teacher as any} />

                        <div className="mt-8 max-w-5xl mx-auto space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <BookOpen className="text-primary" size={24} /> Cursos Asignados
                            </h3>

                            {teacher.courses.length === 0 ? (
                                <Card className="p-8 text-center border-dashed border-border/50 bg-muted/10">
                                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-3">
                                        <BookOpen size={24} />
                                    </div>
                                    <h4 className="font-semibold text-lg">Sin cursos</h4>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                                        Este profesor no tiene cursos asignados actualmente.
                                    </p>
                                </Card>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {teacher.courses.map(course => (
                                        <Link href={`/courses/${course.id}`} key={course.id}>
                                            <Card className="p-5 border-border/40 hover:border-primary/50 transition-colors group relative overflow-hidden bg-card/50">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                                                            {course.name}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground mt-0.5">Nivel: {course.level}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                    <Clock size={14} /> Creado: {dayjs(course.createdAt).format("DD/MM/YYYY")}
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-12 max-w-5xl mx-auto space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <DollarSign className="text-emerald-500" size={24} /> Historial de Pagos / Sueldos
                            </h3>

                            {teacher.expensesReceived.length === 0 ? (
                                <Card className="p-8 text-center border-dashed border-border/50 bg-muted/10">
                                    <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-3">
                                        <DollarSign size={24} />
                                    </div>
                                    <h4 className="font-semibold text-lg">Sin pagos registrados</h4>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                                        No se han registrado pagos de sueldo para este profesor todavía.
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {teacher.expensesReceived.map(payment => (
                                        <Card key={payment.id} className="p-4 border-border/40 bg-card/50 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                                                    <CalendarIcon size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{payment.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dayjs(payment.date).format("DD [de] MMMM, YYYY")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-emerald-600 dark:text-emerald-400">
                                                    ${payment.amount.toLocaleString()}
                                                </p>
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                                    Pagado
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Danger Zone - Under assigned courses */}
                        <div className="mt-12 max-w-5xl mx-auto">
                            <TeacherDangerZone teacherId={teacher.id} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
