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
import { formatDate } from "@/lib/dates";

interface StudentAttendanceData {
    studentId: string;
    studentName: string;
    /** Las últimas 10 marcas, de la más reciente a la más vieja. */
    attendances: { id: string; status: string; date: Date | string; topic: string | null }[];
}

const SEGMENT_COLOR: Record<string, string> = {
    PRESENT: "bg-emerald-500",
    LATE: "bg-amber-400",
    JUSTIFIED: "bg-blue-400",
    ABSENT: "bg-rose-500",
};

const STATUS_LABEL: Record<string, string> = {
    PRESENT: "Presente",
    LATE: "Tarde",
    JUSTIFIED: "Ausente, justificado",
    ABSENT: "Ausente",
};

/**
 * La asistencia de un hijo: el porcentaje, una raya por clase —de la más vieja,
 * a la izquierda, a la más reciente— y las clases a las que faltó. Reemplaza al
 * anillo, que ocupaba 200 px para un número y mostraba 3 de las 10 clases que
 * anunciaba. Diseño elegido en el lienzo «Asistencia del tutor», variante B.
 * Ver BUG-21.
 *
 * «Tarde» cuenta como presente, como contaba el anillo.
 */
function StudentAttendance({ data, showName, divided }: { data: StudentAttendanceData; showName: boolean; divided: boolean }) {
    const total = data.attendances.length;
    const present = data.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const missed = data.attendances.filter((a) => a.status === "ABSENT" || a.status === "JUSTIFIED");
    const oldestFirst = [...data.attendances].reverse();

    return (
        <div className={cn(divided && "border-t border-slate-800 pt-6")}>
            {showName && <p className="font-bold text-sm text-slate-100">{data.studentName}</p>}
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-1">
                {total === 0 ? "Todavía sin asistencia tomada" : total === 1 ? "Última clase" : `Últimas ${total} clases`}
            </p>

            {total > 0 && (
                <>
                    <div className="flex items-baseline gap-2.5 mt-3">
                        <span className="text-2xl font-black tracking-tight">{Math.round((present / total) * 100)}%</span>
                        <span className="text-xs font-medium text-slate-400">
                            {present} de {total} {present === 1 ? "presente" : "presentes"}
                        </span>
                    </div>

                    <div
                        role="img"
                        aria-label={`Asistencia: ${present} de ${total} clases, de la más vieja a la más reciente`}
                        className="flex gap-1 mt-3"
                    >
                        {oldestFirst.map((att) => (
                            <span
                                key={att.id}
                                title={`${formatDate(att.date, "day", "dayMonth")} · ${att.topic || "Clase"} · ${STATUS_LABEL[att.status] ?? "Ausente"}`}
                                className={cn("flex-1 h-3.5 rounded", SEGMENT_COLOR[att.status] ?? "bg-rose-500")}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1.5">
                        <span>{formatDate(oldestFirst[0].date, "day", "dayMonth")}</span>
                        <span>{formatDate(data.attendances[0].date, "day", "dayMonth")}</span>
                    </div>

                    {missed.length === 0 ? (
                        <p className="mt-4 text-xs font-semibold text-emerald-400">No faltó a ninguna de estas clases.</p>
                    ) : (
                        <div className="mt-4 space-y-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Faltó a</p>
                            {missed.map((att) => (
                                <div key={att.id} className="flex items-center gap-2 text-xs font-semibold min-w-0">
                                    <span className={cn("w-2 h-2 rounded-full shrink-0", att.status === "JUSTIFIED" ? "bg-blue-400" : "bg-rose-500")} />
                                    {/* La fecha delante del tema: «Culture» sólo se leía como una
                                        categoría, no como el tema de una clase. */}
                                    <span className="text-slate-400 shrink-0 w-11">{formatDate(att.date, "day", "dayMonth")}</span>
                                    <span className="text-slate-300 truncate">{att.topic || "Clase"}</span>
                                    {att.status === "JUSTIFIED" && <span className="text-blue-300 shrink-0">justificada</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

interface GuardianDashboardViewProps {
    guardianName: string;
    instituteName: string;
    students: any[];
    upcomingLessons: any[];
    attendanceByStudent: StudentAttendanceData[];
    recentGrades: any[];
    totalDebt: number;
}

export function GuardianDashboardView({
    guardianName,
    instituteName,
    students,
    upcomingLessons,
    attendanceByStudent,
    recentGrades,
    totalDebt
}: GuardianDashboardViewProps) {
    const firstName = guardianName.split(" ")[0];

    // Lógica del Saludo Narrativo
    let narrativeGreeting = "Con gusto te presentamos el desempeño académico de los estudiantes.";
    if (students.length === 1) {
        const s = students[0];
        const courseName = s.enrollments?.[0]?.course?.level || s.enrollments?.[0]?.course?.name || "sus estudios";
        narrativeGreeting = `Con gusto te presentamos el desempeño académico de ${s.name.split(" ")[0]} en el curso ${courseName}.`;
    } else if (students.length === 2) {
        narrativeGreeting = `Con gusto te presentamos el desempeño académico de ${students[0].name.split(" ")[0]} y ${students[1].name.split(" ")[0]}.`;
    } else if (students.length > 2) {
        const names = students.slice(0, -1).map(s => s.name.split(" ")[0]).join(", ");
        const lastName = students[students.length - 1].name.split(" ")[0];
        narrativeGreeting = `Con gusto te presentamos el desempeño académico de ${names} y ${lastName}.`;
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Section (Narrativo) */}
                <div className="flex flex-col gap-2 max-w-4xl border-b border-border/50 pb-6">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Hola {firstName}, qué bueno volver a verte.
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
                    <div className="min-w-0 lg:col-span-2 space-y-6">
                        <Card className="p-6 md:p-8 border-none shadow-xl bg-card rounded-3xl relative overflow-hidden">
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
                                                        {grade.studentName} • Evaluado el {formatDate(grade.createdAt, "moment", "short")}
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

                    {/* RIGHT COLUMN (Span 1): Sidebar components.
                        `min-w-0`: sin él, el tema más largo de una clase —que va en
                        una línea y se corta con «…»— ensanchaba la columna y la
                        página se corría de costado en el celular. */}
                    <div className="min-w-0 space-y-6">
                        
                        {/* Attendance Card (Dark Mode Style).
                            Un bloque por hijo, titulado por lo que mide: las últimas
                            clases con asistencia tomada. Antes decía «Período
                            Académico Actual» y eran las últimas 10 marcas, de los
                            hijos mezclados. Ver BUG-21. */}
                        <Card className="p-6 border-none shadow-xl bg-slate-900 text-slate-50 dark:bg-slate-950 rounded-3xl relative overflow-hidden">
                            <h3 className="font-extrabold text-xl tracking-tight mb-4">Asistencia</h3>

                            <div className="space-y-6">
                                {attendanceByStudent.map((s, i) => (
                                    <StudentAttendance
                                        key={s.studentId}
                                        data={s}
                                        showName={attendanceByStudent.length > 1}
                                        divided={i > 0}
                                    />
                                ))}
                            </div>
                        </Card>

                        {/* Upcoming Lessons Card */}
                        <Card className="p-6 border-none shadow-lg bg-card rounded-3xl">
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
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                {formatDate(lesson.date, "day", "short")}
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                {lesson.studentName}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        {/* Financial Status Mini-Widget */}
                        <Card className="p-6 border-none shadow-lg bg-card rounded-3xl text-center relative overflow-hidden">
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
