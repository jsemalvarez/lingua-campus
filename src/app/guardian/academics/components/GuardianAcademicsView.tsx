"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
    GraduationCap,
    TrendingUp,
    CalendarDays,
    BookOpen,
    AlertCircle,
    CheckCircle2,
    Calendar,
    PenTool,
    UserCircle,
    XCircle,
    Info,
    Clock,
    FileText,
    ClipboardList
} from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { StudentReportViewer } from "@/components/reports/StudentReportViewer";

interface GuardianAcademicsViewProps {
    students: any[];
}

export function GuardianAcademicsView({ students }: GuardianAcademicsViewProps) {
    const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");

    const currentStudent = students.find(s => s.id === selectedStudentId);

    if (!currentStudent) return null;

    // Computed Properties para el estudiante actual
    const enrollments = currentStudent.enrollments || [];
    const activeCourse = enrollments[0]?.course;
    const hasEnrollment = enrollments.length > 0;

    const attendances = currentStudent.attendances || [];
    const grades = currentStudent.grades || [];
    
    // Proyecciones de estado (Para el recuadro de Proficiency)
    const presentRate = attendances.length > 0 
        ? Math.round((attendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length / attendances.length) * 100) 
        : null; 

    const showTabs = students.length > 1;

    return (
        <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
                <div>
                    <span className="text-sm font-bold text-primary/80 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <TrendingUp size={16} /> Hub Académico
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight">Expediente de {currentStudent.name.split(" ")[0]}</h1>
                    <p className="text-muted-foreground font-medium mt-1">Supervisión integral de rendimiento, asistencia y progreso general.</p>
                </div>
            </div>

            {/* Selector de Estudiantes (Tabs) */}
            {showTabs && (
                <div className="flex flex-wrap gap-2 bg-muted/30 p-2 rounded-2xl border border-border/50 w-fit">
                    {students.map((st) => (
                        <button
                            key={st.id}
                            onClick={() => setSelectedStudentId(st.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                                selectedStudentId === st.id 
                                    ? "bg-background shadow-md text-foreground scale-[1.02]" 
                                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                        >
                            <UserCircle size={18} className={selectedStudentId === st.id ? "text-primary" : ""} />
                            {st.name}
                        </button>
                    ))}
                </div>
            )}

            {/* ROW 1: Proficiency & Course Summary Layer */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 border-y-0 border-r-0 border-l-4 border-l-primary shadow-lg dark:shadow-xl dark:shadow-sky-400/60 bg-gradient-to-r from-card to-card/50 relative overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <GraduationCap size={150} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {hasEnrollment ? (
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">
                                    Curso Activo
                                </span>
                                <h2 className="text-3xl font-black mb-1">{activeCourse?.name}</h2>
                                <p className="text-muted-foreground font-medium flex items-center gap-2">
                                    <BookOpen size={16} /> Nivel: {activeCourse?.level || "General"}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full mb-3 inline-block w-fit">
                                    Matriculación Pendiente
                                </span>
                                <h2 className="text-3xl font-black mb-2 opacity-50 italic">Sin cursos activos</h2>
                                <p className="text-muted-foreground font-medium max-w-sm">
                                    Aún no hemos registrado inscripciones este periodo. Contacta a secretaría para asignar un curso.
                                </p>
                            </div>
                        )}
                        
                        {activeCourse && (
                            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border/50 min-w-[200px]">
                                <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Profesor Asignado</p>
                                <p className="font-bold">{activeCourse.teacher?.name || "Pendiente"}</p>
                                <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-muted-foreground">Ciclo Lectivo</span>
                                    <span className="text-xs font-black">{dayjs(activeCourse.startDate).format("YYYY")}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-6 border-y-0 border-r-0 border-l-4 border-l-emerald-500 shadow-lg dark:shadow-xl dark:shadow-sky-400/60 bg-card rounded-[2rem] flex flex-col justify-center items-center text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Progreso de Asistencia</span>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
                            {presentRate !== null && (
                                <circle 
                                    cx="50" cy="50" r="45" fill="none" 
                                    stroke={presentRate >= 80 ? "#10b981" : presentRate >= 60 ? "#f59e0b" : "#ef4444"} 
                                    strokeWidth="8" 
                                    strokeDasharray="283" 
                                    strokeDashoffset={283 - (283 * presentRate) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            )}
                        </svg>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black">{presentRate !== null ? `${presentRate}%` : "—"}</span>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-4">
                        {presentRate !== null ? "Asistencia general requerida." : "Sin actividad registrada aún."}
                    </p>
                </Card>
            </div>

            {/* ROW 2 & 3: GRID TETRIS LAYOUT */}
            <div className={cn("grid lg:grid-cols-2 gap-8 items-stretch", !hasEnrollment && "opacity-60")}>
                
                {/* COLUMN LEFT: Próximas Clases (Tall) */}
                <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-primary shadow-lg dark:shadow-xl dark:shadow-sky-400/60 bg-card rounded-[2rem] flex flex-col h-full min-h-[680px]">
                    <div className="flex items-center gap-3 mb-6">
                        <CalendarDays className="text-primary" size={24} />
                        <h3 className="text-2xl font-extrabold tracking-tight">Próximas Clases</h3>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {!hasEnrollment ? (
                            <p className="text-sm text-muted-foreground italic">Pendiente de asignación de horarios.</p>
                        ) : activeCourse?.lessons?.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No hay clases registradas en el calendario cercano.</p>
                        ) : (
                            activeCourse?.lessons?.map((lesson: any) => (
                                <div key={lesson.id} className="flex bg-muted/20 border border-border/50 rounded-2xl overflow-hidden hover:bg-muted/40 transition-colors">
                                    <div className="bg-primary/5 border-r border-border/50 p-4 flex flex-col justify-center items-center shrink-0 w-24">
                                        <span className="text-xs font-black text-primary/70 uppercase mb-0.5">{dayjs(lesson.date).format("MMM")}</span>
                                        <span className="text-2xl font-black text-primary leading-none">{dayjs(lesson.date).format("DD")}</span>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-center">
                                        <h4 className="font-bold text-base">{lesson.topic || "Clase Regular"}</h4>
                                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 font-semibold">
                                            <Clock size={14} /> {lesson.schedule?.startTime || "00:00"} hs
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* COLUMN RIGHT: Stacked Faltas & Notas */}
                <div className="flex flex-col gap-8 h-full">
                    
                    {/* Registro de Faltas (Superior - Menor altura) */}
                    <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-rose-500 shadow-lg dark:shadow-xl dark:shadow-sky-400/60 bg-card rounded-[2rem] flex-1 max-h-[280px] flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                            <AlertCircle className="text-rose-500" size={22} />
                            <h3 className="text-xl font-extrabold tracking-tight text-foreground/90">Registro de Faltas</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {!hasEnrollment ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <Calendar size={32} />
                                    <p className="text-xs font-bold mt-2 uppercase tracking-tighter">Pendiente</p>
                                </div>
                            ) : attendances.filter((a: any) => a.status !== "PRESENT").length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-4">
                                    <CheckCircle2 className="text-emerald-500 mb-2 opacity-50" size={32} />
                                    <p className="text-muted-foreground font-medium text-xs text-center px-4">Asistencia perfecta. No se registran inasistencias.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {attendances.filter((a:any) => a.status !== "PRESENT").map((att: any) => (
                                        <div key={att.id} className="p-3.5 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                                    att.status === "ABSENT" ? "bg-rose-500/10 text-rose-500" :
                                                    att.status === "LATE" ? "bg-amber-500/10 text-amber-500" :
                                                    "bg-blue-500/10 text-blue-500"
                                                )}>
                                                    {att.status === "ABSENT" ? <XCircle size={16} /> : att.status === "LATE" ? <Clock size={16} /> : <Info size={16} />}
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-bold text-xs truncate">{dayjs(att.lesson.date).format("DD MMM")} • {att.lesson.topic}</p>
                                                    {att.notes && <p className="text-[10px] italic text-muted-foreground truncate opacity-80">{att.notes}</p>}
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                att.status === "ABSENT" ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"
                                            )}>
                                                {att.status === "LATE" ? "Tarde" : "Falta"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Notas (Inferior - Mayor altura) */}
                    <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-amber-500 shadow-lg dark:shadow-xl dark:shadow-sky-400/60 bg-card rounded-[2rem] flex-1 max-h-[360px] flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                            <PenTool className="text-amber-500" size={22} />
                            <h3 className="text-xl font-extrabold tracking-tight text-foreground/90">Notas</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {!hasEnrollment || grades.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <FileText size={32} />
                                    <p className="text-xs font-bold mt-2 uppercase tracking-tighter">Sin calificaciones</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {grades.map((grade: any) => (
                                        <div key={grade.id} className="p-4 bg-background border border-border/40 rounded-2xl flex items-center justify-between group decoration-primary active:scale-[0.98] transition-all">
                                            <div className="min-w-0 pr-4">
                                                <p className="font-black text-sm truncate">{grade.lesson.topic}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mt-1">
                                                    {dayjs(grade.createdAt).format("DD/MM")} • {grade.lesson.course.name}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span className="text-xl font-black" style={{ color: grade.lesson.course.color }}>
                                                    {grade.score}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                </div>
            </div>

            {/* ROW 4: Boletín Institucional */}
            <StudentReportViewer studentName={currentStudent.name} reports={currentStudent.studentReports || []} />

        </main>
    );
}
