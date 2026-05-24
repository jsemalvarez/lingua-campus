"use client";

import { Card } from "@/components/ui/Card";
import {
    Clock,
    Wallet,
    Users,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    History,
    GraduationCap,
    PenTool
} from "lucide-react";
import { cn, getMonthName } from "@/lib/utils";
import Link from "next/link";
import dayjs from "dayjs";

import { GuardianAttendanceChart } from "./GuardianAttendanceChart";

interface GuardianDashboardViewProps {
    guardianName: string;
    instituteName: string;
    students: any[];
    upcomingLessons: any[];
    recentAttendances: any[];
    recentGrades: any[];
    totalDebt: number;
}

export function GuardianDashboardView({
    guardianName,
    instituteName,
    students,
    upcomingLessons,
    recentAttendances,
    recentGrades,
    totalDebt
}: GuardianDashboardViewProps) {
    const firstName = guardianName.split(" ")[0];

    // Lógica del Saludo Narrativo
    let narrativeGreeting = "El recorrido académico de tus alumnos avanza estupendamente.";
    if (students.length === 1) {
        const s = students[0];
        const courseName = s.enrollments?.[0]?.course?.name || "sus estudios";
        narrativeGreeting = `El recorrido académico de ${s.name.split(" ")[0]} avanza estupendamente. Actualmente de cursando ${courseName}.`;
    } else if (students.length === 2) {
        narrativeGreeting = `Los recorridos académicos de ${students[0].name.split(" ")[0]} y ${students[1].name.split(" ")[0]} avanzan estupendamente bien.`;
    } else if (students.length > 2) {
        const names = students.slice(0, -1).map(s => s.name.split(" ")[0]).join(", ");
        const lastName = students[students.length - 1].name.split(" ")[0];
        narrativeGreeting = `Los recorridos académicos de ${names} y ${lastName} avanzan estupendamente bien.`;
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Section (Narrativo) */}
                <div className="flex flex-col gap-2 max-w-4xl border-b border-border/50 pb-6">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Bienvenido de nuevo, {firstName}.
                    </h1>
                    <p className="text-lg text-muted-foreground/90 font-medium">
                        {narrativeGreeting}
                    </p>
                </div>

                {/* Quick Select Alumnos (Proficiency replacement) */}
                <div className="flex flex-wrap gap-3">
                    {students.map((student) => (
                        <Link key={student.id} href={`/students/${student.id}`} className="block hover:scale-105 transition-transform">
                            <div className="flex items-center gap-3 px-5 py-3 bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                                    {student.name.charAt(0)}
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">{student.name}</span>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                        Ver Perfil <ChevronRight size={12} className="inline -mt-0.5" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* GRID 1: Left (Grades) & Right (Attendance, Schedule, Finance) */}
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    
                    {/* LEFT COLUMN (Span 2): Recent Performance */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6 md:p-8 border-none shadow-xl dark:shadow-xl dark:shadow-sky-400/60 bg-card rounded-3xl relative overflow-hidden">
                            <div className="mb-6">
                                <h3 className="font-extrabold text-2xl flex items-center gap-3 tracking-tight">
                                    Rendimiento Reciente
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium mt-1">
                                    Resumen de los últimos componentes evaluados.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {recentGrades.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-2xl">
                                        <GraduationCap className="mx-auto text-muted-foreground mb-3 opacity-20" size={48} />
                                        <p className="text-muted-foreground font-medium">Aún no hay calificaciones registradas.</p>
                                    </div>
                                ) : (
                                    recentGrades.map((grade) => (
                                        <div key={grade.id} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-background shadow-sm border border-border/40 rounded-2xl hover:border-primary/30 transition-colors gap-4">
                                            <div className="flex items-center gap-4 w-full">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${grade.courseColor}20`, color: grade.courseColor }}>
                                                    <PenTool size={22} className="opacity-80" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-base leading-tight text-foreground/90">{grade.topic}</h4>
                                                    <p className="text-[11px] text-muted-foreground font-semibold mt-1.5 uppercase tracking-wider">
                                                        {grade.studentName} • Evaluado el {dayjs(grade.createdAt).format("DD MMM, YYYY")}
                                                    </p>
                                                    {grade.feedback && <p className="text-[12px] text-muted-foreground italic mt-1.5 line-clamp-1 border-l-2 pl-2">"{grade.feedback}"</p>}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end w-full sm:w-auto justify-between border-t sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Calificación</span>
                                                <p className="font-black text-2xl tracking-tighter" style={{ color: grade.courseColor || "currentColor" }}>
                                                    {grade.score}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN (Span 1): Sidebar components */}
                    <div className="space-y-6">
                        
                        {/* Attendance Card (Dark Mode Style) */}
                        <Card className="p-6 border-none shadow-xl dark:shadow-xl dark:shadow-sky-400/60 bg-slate-900 text-slate-50 dark:bg-slate-950 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-extrabold text-xl tracking-tight">Asistencia</h3>
                                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-1">
                                        Período Académico Actual
                                    </p>
                                </div>
                            </div>
                            
                            {/* Graphic Space or Text */}
                            <div className="h-32 mb-4 -mx-2">
                                {/* Modificamos el gráfico para que pase los estilos o usamos solo texto si el gráfico es difícil de oscurecer */}
                                <GuardianAttendanceChart recentAttendances={recentAttendances || []} />
                            </div>

                            <div className="space-y-2.5">
                                {recentAttendances.slice(0,3).map((att) => (
                                    <div key={att.id} className="flex items-center justify-between text-xs font-semibold">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                att.status === "PRESENT" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" :
                                                att.status === "LATE" ? "bg-amber-400" :
                                                att.status === "JUSTIFIED" ? "bg-blue-400" :
                                                "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                            )} />
                                            <span className="text-slate-300 truncate max-w-[140px] relative top-[1px]">{att.topic || "Clase pasada"}</span>
                                        </div>
                                        <div className={cn(
                                            "text-right",
                                            att.status === "PRESENT" ? "text-emerald-400" :
                                            att.status === "LATE" ? "text-amber-400" :
                                            att.status === "JUSTIFIED" ? "text-blue-400" :
                                            "text-rose-400"
                                        )}>
                                            {att.status === "PRESENT" ? "Presente" : att.status === "LATE" ? "Tarde" : att.status === "JUSTIFIED" ? "Justifi." : "Ausente"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Upcoming Lessons Card */}
                        <Card className="p-6 border-none shadow-lg dark:shadow-xl dark:shadow-sky-400/60 bg-card rounded-3xl">
                            <h3 className="font-extrabold text-lg mb-4 tracking-tight flex items-center gap-2">
                                Próximas Clases
                            </h3>
                            <div className="space-y-4">
                                {upcomingLessons.length === 0 ? (
                                    <p className="text-sm italic text-muted-foreground text-center py-4">No hay próximas clases programadas.</p>
                                ) : (
                                    upcomingLessons.slice(0, 3).map((lesson) => (
                                        <div key={lesson.id} className="flex flex-col border border-border/40 bg-background/50 p-3 rounded-2xl relative overflow-hidden pl-5 group hover:border-primary/20 transition-all">
                                            {/* Colored Vertical Bar */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: lesson.color || "#3b82f6" }} />
                                            
                                            <p className="font-bold text-sm leading-tight text-foreground/90">{lesson.topic || "Clase Regular"}</p>
                                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-border" /> 
                                                {dayjs(lesson.date).format("MMM DD, YYYY")} 
                                                <div className="w-1 h-1 rounded-full bg-border" /> 
                                                {lesson.studentName}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        {/* Financial Status Mini-Widget */}
                        <Card className="p-6 border-none shadow-lg dark:shadow-xl dark:shadow-sky-400/60 bg-card rounded-3xl text-center relative overflow-hidden">
                            <div className="mx-auto w-12 h-12 rounded-2xl bg-background shadow-sm border border-border/50 flex items-center justify-center mb-3">
                                {totalDebt > 0 ? (
                                    <AlertCircle className="text-amber-500" size={24} />
                                ) : (
                                    <CheckCircle2 className="text-emerald-500" size={24} />
                                )}
                            </div>
                            
                            <h3 className="font-black text-sm uppercase tracking-widest mb-1 text-muted-foreground">
                                Estado Financiero
                            </h3>
                            
                            <h2 className={cn("text-2xl font-black tracking-tight", totalDebt > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                                {totalDebt > 0 ? `$${totalDebt.toLocaleString()}` : "Pagado"}
                            </h2>
                            
                            <p className="text-[11px] text-muted-foreground font-medium mt-1 mb-4">
                                {totalDebt > 0 ? "Saldo pendiente." : "No se registran deudas pendientes."}
                            </p>

                            <Link href="/guardian/payments" className="text-xs font-bold text-primary hover:underline uppercase tracking-wide">
                                Ir a Administración &rarr;
                            </Link>
                        </Card>

                    </div>
                </div>
            </main>
        </div>
    );
}
