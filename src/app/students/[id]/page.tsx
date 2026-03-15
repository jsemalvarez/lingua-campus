import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import dayjs from "dayjs";
import { StudentProfileView } from "./StudentProfileView";
import { ActivateStudentBanner } from "./components/ActivateStudentBanner";
import { StudentDangerZone } from "./StudentDangerZone";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

    const student = await prisma.student.findUnique({
        where: { id: id },
        include: {
            enrollments: {
                include: { course: true }
            },
            fees: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    });

    if (!student || student.instituteId !== user.instituteId) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8">
                    <Link
                        href="/students"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a la lista de estudiantes
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Ficha del Estudiante</h1>
                </header>

                {student.status === "PRE_INSCRIBED" && (
                    <ActivateStudentBanner studentId={student.id} studentName={student.name} />
                )}

                <div className="grid gap-8 lg:grid-cols-4 items-start">
                    <div className="lg:col-span-3">
                        {/* Seccion 1: Perfil Interactivo (Vista / Edicion) */}
                        <StudentProfileView student={student as any} userRole={user.role} />

                        {/* Seccion 2: Cursos inscriptos */}
                        <div className="mt-8 max-w-5xl mx-auto space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <BookOpen className="text-primary" size={24} /> Desempeño y Cursos
                            </h3>

                            {student.enrollments.length === 0 ? (
                                <Card className="p-8 text-center border-dashed border-border/50 bg-muted/10">
                                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-3">
                                        <BookOpen size={24} />
                                    </div>
                                    <h4 className="font-semibold text-lg">No inscripto</h4>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                                        Este estudiante no está asignado a ningún curso todavía.
                                    </p>
                                    <Link href={`/enrollments/new?student=${student.id}`} className="text-primary hover:underline text-sm font-semibold">
                                        Inscribir en un Curso &rarr;
                                    </Link>
                                </Card>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {student.enrollments.map(e => (
                                        <Link href={`/courses/${e.course.id}`} key={e.id}>
                                            <Card className="p-5 border-border/40 hover:border-primary/50 transition-colors group relative overflow-hidden bg-card/50">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                                                            {e.course.name}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground mt-0.5">Nivel: {e.course.level}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${e.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                                        {e.status}
                                                    </span>
                                                </div>
                                                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                    <Clock size={14} /> Fecha de alta: {dayjs(e.enrolledAt).format("DD/MM/YYYY")}
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {student.status !== "PRE_INSCRIBED" && (
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="p-5 border-border/40 bg-card/60">
                                <h3 className="font-bold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                                    Últimos Pagos Registrados
                                </h3>

                                {student.fees.length === 0 ? (
                                    <p className="text-sm italic text-muted-foreground border-l-2 pl-3 border-border">Sin movimiento financiero.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {student.fees.map(f => (
                                            <div key={f.id} className="flex justify-between items-center text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-emerald-600">${f.amount}</span>
                                                    <span className="text-xs text-muted-foreground">{f.month}/{f.year}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-medium text-foreground/80">{f.status}</span>
                                                    <span className="text-xs text-muted-foreground">{dayjs(f.datePaid || f.createdAt).format("DD/MMM")}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Link href="/payments" className="block w-full mt-4 text-center rounded-lg bg-primary/10 text-primary py-2 text-sm font-bold hover:bg-primary/20 transition-colors">
                                    Ir a Cobranzas
                                </Link>

                            </Card>
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
                    <div className="lg:col-span-4 mt-8">
                        <StudentDangerZone studentId={student.id} studentStatus={student.status} />
                    </div>
                )}
            </main>
        </div>
    );
}
