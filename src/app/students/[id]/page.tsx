import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, BookOpen, Clock, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import dayjs from "dayjs";
import { StudentProfileView } from "./StudentProfileView";
import { ActivateStudentBanner } from "./components/ActivateStudentBanner";
import { StudentDangerZone } from "./StudentDangerZone";
import { ChangeCourseModal } from "./components/ChangeCourseModal";
import { ExamRegistrationToggle } from "./components/ExamRegistrationToggle";
import { ReceiptDownloadButton } from "@/components/financials/ReceiptDownloadButton";
import { getActiveRole } from "@/lib/roles";
import { formatFeeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, roles: true, instituteId: true }
    }) as any;

    if (!user || (user.roles && user.roles.includes("SUPERADMIN")) || !user.instituteId) {
        redirect("/dashboard");
    }

    const userRoles = user.roles || [user.role];
    const activeRole = await getActiveRole(userRoles);

    const isAdmin = ["ADMIN", "SECRETARY"].includes(activeRole);
    const isGuardian = activeRole === "GUARDIAN";

    // Si NO es admin, verificar si es el tutor de ESTE alumno específico
    if (!isAdmin) {
        if (isGuardian) {
            const link = await prisma.guardianStudentLink.findUnique({
                where: {
                    guardianId_studentId: {
                        guardianId: user.id,
                        studentId: id
                    }
                }
            });
            if (!link) redirect("/dashboard");
        } else {
            // No es admin ni tutor vinculado (o docente en modo docente)
            // Permitir el flujo si es admin real pero está en otro modo? 
            // Para seguridad, si no es Admin en activeRole, restringimos.
            const realIsAdmin = userRoles.some((r: any) => ["ADMIN", "SECRETARY"].includes(r));
            if (!realIsAdmin) {
                redirect("/dashboard");
            }
        }
    }

    const canManage = isAdmin; // Solo admins (en su rol activo) pueden editar o ver zona peligrosa

    const student = await prisma.student.findUnique({
        where: { id: id },
        include: {
            enrollments: {
                include: { course: true },
                orderBy: { enrolledAt: 'desc' }
            },
            fees: {
                include: { payments: { where: { status: "VALID" }, orderBy: { date: 'desc' }, take: 1 } },
                orderBy: { createdAt: 'desc' },
                take: 5
            },
            guardianLinks: {
                include: { guardian: true }
            }
        }
    });

    if (!student || (user.instituteId && student.instituteId !== user.instituteId)) {
        notFound();
    }

    // Parallelize metadata fetching to reduce database connection hold time
    const [availableCourses, instituteLevels] = await Promise.all([
        prisma.course.findMany({
            where: { instituteId: student.instituteId },
            select: { id: true, name: true, level: true },
            orderBy: { name: 'asc' }
        }),
        prisma.level.findMany({
            where: { instituteId: student.instituteId },
            orderBy: { name: 'asc' }
        })
    ]);

    // Resolve registeredLevel display name
    if (student.registeredLevel) {
        const levelData = instituteLevels.find(l => l.id === student.registeredLevel);
        (student as any).registeredLevelName = levelData ? levelData.name : student.registeredLevel;
    } else {
        (student as any).registeredLevelName = "-";
    }

    const canSeeFinancials = isAdmin || isGuardian;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8">
                    {!isGuardian && (
                        <Link
                            href="/students"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a la lista de estudiantes
                        </Link>
                    )}
                    <h1 className="text-3xl font-bold tracking-tight">Ficha del Estudiante</h1>
                </header>

                {student.status === "PRE_INSCRIBED" && isAdmin && (
                    <ActivateStudentBanner studentId={student.id} studentName={student.name} />
                )}

                <div className="grid gap-8 lg:grid-cols-4 items-start">
                    <div className="lg:col-span-3">
                        <StudentProfileView
                            student={student as any}
                            userRoles={[activeRole]}
                            instituteLevels={instituteLevels}
                        />

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
                                    {isAdmin && (
                                        <Link href={`/enrollments/new?student=${student.id}`} className="text-primary hover:underline text-sm font-semibold">
                                            Inscribir en un Curso &rarr;
                                        </Link>
                                    )}
                                </Card>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {student.enrollments.map(e => (
                                        <Card key={e.id} className="p-5 border-border/40 hover:border-primary/50 transition-colors group relative overflow-hidden bg-card/50" style={{ borderLeft: `4px solid ${e.course.color || "#3b82f6"}` }}>
                                            <div className="flex items-start justify-between">
                                                <Link href={isAdmin ? `/courses/${e.course.id}` : "#"} className={isAdmin ? "" : "pointer-events-none"}>
                                                    <div>
                                                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                                                            {e.course.name}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground mt-0.5">Nivel: {e.course.level}</p>
                                                    </div>
                                                </Link>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${e.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                                        {e.status}
                                                    </span>
                                                    {isAdmin && (
                                                        <ChangeCourseModal
                                                            enrollmentId={e.id}
                                                            currentCourseId={e.course.id}
                                                            currentCourseName={e.course.name}
                                                            availableCourses={availableCourses}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-medium border-t border-border/20 pt-3">
                                                <Clock size={14} /> Fecha de alta: {dayjs(e.enrolledAt).format("DD/MM/YYYY")}
                                            </div>
                                            {(isAdmin || e.takesExam) && (
                                                <ExamRegistrationToggle
                                                    enrollmentId={e.id}
                                                    takesExam={e.takesExam}
                                                    isAdmin={isAdmin}
                                                />
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {canSeeFinancials && student.status !== "PRE_INSCRIBED" && (
                        <div className="lg:col-span-1 space-y-6">
                            {student.creditBalance > 0 && (
                                <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 border-l-4 border-l-emerald-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm">
                                            <Wallet size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 leading-none mb-1">Saldo a Favor</p>
                                            <h3 className="text-xl font-bold text-emerald-600 leading-tight">
                                                ${student.creditBalance.toLocaleString()}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-emerald-600/60 mt-3 font-medium italic">
                                        * Este monto puede ser utilizado para pagar futuras cuotas o conceptos.
                                    </p>
                                </Card>
                            )}

                            <Card className="p-5 border-border/40 bg-card/60">
                                <h3 className="font-bold flex items-center gap-2 mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                                    Últimos Pagos Registrados
                                </h3>

                                {student.fees.filter(f => f.paidAmount > 0).length === 0 ? (
                                    <p className="text-sm italic text-muted-foreground border-l-2 pl-3 border-border">Sin movimiento financiero.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {student.fees.filter(f => f.paidAmount > 0).map(f => (
                                            <div key={f.id} className="flex flex-col gap-1.5 text-sm border-b border-border/30 pb-3 pt-2 first:pt-0 last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium text-foreground/90 leading-tight">
                                                        {formatFeeLabel(f.type, f.month, f.year)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground shrink-0">{dayjs(f.datePaid || f.createdAt).format("DD/MM")}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-0.5">
                                                    <span className="font-bold text-emerald-600">${f.paidAmount.toLocaleString()}</span>
                                                    {(f as any).payments?.[0] && (
                                                        <ReceiptDownloadButton paymentId={(f as any).payments[0].id} variant="icon" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isAdmin && (
                                    <Link href="/payments" className="block w-full mt-4 text-center rounded-lg bg-primary/10 text-primary py-2 text-sm font-bold hover:bg-primary/20 transition-colors">
                                        Ir a Cobranzas
                                    </Link>
                                )}

                            </Card>
                        </div>
                    )}
                </div>

                {canManage && (
                    <div className="lg:col-span-4 mt-8">
                        <StudentDangerZone studentId={student.id} studentStatus={student.status} />
                    </div>
                )}
            </main>
        </div>
    );
}
