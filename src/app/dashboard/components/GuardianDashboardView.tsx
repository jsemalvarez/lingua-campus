"use client";

import { Card } from "@/components/ui/Card";
import {
    Clock,
    DollarSign,
    Users,
    Calendar,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    History
} from "lucide-react";
import { cn, getMonthName } from "@/lib/utils";
import Link from "next/link";

interface GuardianDashboardViewProps {
    guardianName: string;
    instituteName: string;
    students: any[];
    upcomingLessons: any[];
    fees: any[];
}

export function GuardianDashboardView({
    guardianName,
    instituteName,
    students,
    upcomingLessons,
    fees
}: GuardianDashboardViewProps) {
    const firstName = guardianName.split(" ")[0];

    return (
        <div className="min-h-screen bg-background pb-20">
            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Section */}
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-primary/80 uppercase tracking-wider">
                        Portal de Tutores • {instituteName}
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight">¡Hola, {firstName}!</h1>
                    <p className="text-muted-foreground">
                        Aquí tenés un resumen de la actividad.
                    </p>
                </div>

                {/* My Students Quick Select (Optional but nice) */}
                <div className="flex flex-wrap gap-3">
                    {students.map((student) => (
                        <Link key={student.id} href={`/students/${student.id}`} className="block hover:scale-105 transition-transform">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border/50 rounded-2xl shadow-sm hover:bg-muted transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                    {student.name.charAt(0)}
                                </div>
                                <span className="font-medium text-sm">{student.name}</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">

                    {/* section: Upcoming Classes */}
                    <Card className="p-6 border-none shadow-xl bg-gradient-to-br from-card to-muted/30 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <Calendar size={120} />
                        </div>

                        <div className="flex items-center justify-between mb-6 relative">
                            <h3 className="font-bold text-xl flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                                    <Clock size={22} />
                                </div>
                                Próximas Clases
                            </h3>
                            <Link href="/schedule">
                                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">
                                    Ver calendario <ChevronRight size={16} />
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-4 relative">
                            {upcomingLessons.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground italic">No hay clases programadas esta semana.</p>
                                </div>
                            ) : upcomingLessons.map((lesson) => (
                                <Link key={lesson.id} href={`/students/${lesson.studentId}`} className="block group/item">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 group-hover/item:border-primary/30 group-hover/item:shadow-md transition-all group-hover/item:translate-x-1">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm text-foreground">{lesson.course.name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Users size={12} /> <span className="text-primary/90 font-medium">{lesson.studentName}</span> • {lesson.topic}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black tabular-nums">
                                                {new Date(lesson.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                {new Date(lesson.date).toLocaleDateString('es-AR', { weekday: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>

                    {/* Section: Financial Status (Fees) */}
                    <Card className="p-6 border-none shadow-xl bg-gradient-to-br from-card to-muted/30 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <DollarSign size={120} />
                        </div>

                        <div className="flex items-center justify-between mb-6 relative">
                            <h3 className="font-bold text-xl flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                                    <History size={22} />
                                </div>
                                Estado de Cuenta
                            </h3>

                        </div>

                        <div className="space-y-4 relative">
                            {fees.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground italic">No hay historial de pagos registrado.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Deudas y Pendientes primero */}
                                    {fees.some(f => f.status !== "PAID") && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-red-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                                <AlertCircle size={14} /> Pendientes de Pago
                                            </p>
                                            {fees.filter(f => f.status !== "PAID").map(fee => (
                                                <div key={fee.id} className="p-4 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-medium text-red-600 dark:text-red-400">Cuota {getMonthName(fee.month)} {fee.year}</p>
                                                        <p className="font-bold text-sm">{fee.student.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-red-700 dark:text-red-400">
                                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(fee.originalAmount - fee.paidAmount)}
                                                        </p>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                                                            PAGAR
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pagados */}
                                    <div className="space-y-3 pt-2">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Pagos Recientes
                                        </p>
                                        {fees.filter(f => f.status === "PAID").slice(0, 3).map(fee => (
                                            <div key={fee.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-background/30 hover:bg-background/60 transition-colors">
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Cuota {getMonthName(fee.month)} {fee.year}</p>
                                                    <p className="font-semibold text-sm">{fee.student.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-green-600">
                                                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(fee.paidAmount)}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">Pagado el {fee.datePaid ? new Date(fee.datePaid).toLocaleDateString() : '-'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>
            </main>
        </div>
    );
}

// Simple internal Button fallback since I can't import components from [id] easily
function Button({ children, variant = "default", size = "default", className, ...props }: any) {
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
    };
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
    };
    return (
        <button
            className={cn("inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50", variants[variant as keyof typeof variants], sizes[size as keyof typeof sizes], className)}
            {...props}
        >
            {children}
        </button>
    );
}
