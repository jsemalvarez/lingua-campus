"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { 
  Users, 
  Clock, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Video,
  BookOpen,
  Mic2,
  Brain,
  ClipboardList,
  Info,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { StudentPerformanceChart } from "./StudentPerformanceChart";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface PracticeSessionRecord {
  id: string;
  type: string;
  accuracyPct: number;
  phrasesAttempted: number;
  phrasesCorrect: number;
  durationSeconds: number;
  weakArea: string | null;
  completedAt: string;
  lessonTopic: string;
  courseName: string;
  courseColor: string;
}

interface PracticeMetrics {
  totalSessions: number;
  avgAccuracy: number | null;
  totalMinutesPracticed: number;
  recentSessions: PracticeSessionRecord[];
}

interface StudentAcademicsViewProps {
  student: any;
  upcomingLessons: any[];
  pendingTasks: any[];
  isMinor: boolean;
  recentGrades: any[];
  academicStats: {
    totalLessons: number;
    passedLessons: number;
    presentsCount: number;
    absentsCount: number;
  };
  practiceMetrics: PracticeMetrics;
}

export function StudentAcademicsView({
  student,
  upcomingLessons,
  pendingTasks,
  isMinor,
  recentGrades,
  academicStats,
  practiceMetrics
}: StudentAcademicsViewProps) {
  
  // Lógica robusta para encontrar el curso principal
  // 1. Intentar obtener la primera matrícula
  const mainEnrollment = student.enrollments?.[0];
  let mainCourse = mainEnrollment?.course;

  // 2. Si no hay matrícula, intentar obtener el curso de la última asistencia
  if (!mainCourse && student.attendances && student.attendances.length > 0) {
    mainCourse = student.attendances[0].lesson.course;
  }

  // Obtener las últimas 6 asistencias
  const recentAttendances = student.attendances?.slice(0, 6) || [];

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in mt-12 mb-24">
      
      {/* 2. MAIN CONTENT GRID (SYMMETRIC) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Left: Performance Chart (Master Container) */}
        <div className="lg:col-span-2">
          <Card className="h-full p-8 rounded-[2.5rem] border-none shadow-xl bg-card relative overflow-hidden flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 shrink-0">
               <div>
                 <h3 className="text-2xl font-black tracking-tight">Rendimiento Académico</h3>
                 <p className="text-sm text-muted-foreground font-medium mt-1">Visualización del crecimiento en tus últimas sesiones.</p>
               </div>
               <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-[10px] font-bold">
                    <div className="w-2 h-2 rounded-full bg-primary" /> Speaking
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-[10px] font-bold">
                    <div className="w-2 h-2 rounded-full bg-accent" /> Grammar
                  </div>
               </div>
             </div>
             
             <div className="flex-1 min-h-[300px]">
                <StudentPerformanceChart data={recentGrades} />
             </div>

             {/* Recent Learning Milestones */}
             <div className="mt-12 pt-8 border-t border-border/50 shrink-0">
               <h4 className="text-lg font-black tracking-tight mb-6">Hitos Recientes</h4>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 {recentGrades.length > 0 ? (
                   recentGrades.slice(0, 3).map((g, i) => (
                     <div key={i} className="flex items-center gap-4 group cursor-default">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                           {i === 0 ? <Mic2 size={20} /> : i === 1 ? <BookOpen size={20} /> : <Brain size={20} />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-[13px] leading-tight group-hover:text-primary transition-colors truncate">{g.lesson.topic}</h5>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{dayjs(g.createdAt).fromNow()}</p>
                        </div>
                     </div>
                   ))
                 ) : (
                    <div className="col-span-3 py-4 text-center italic text-muted-foreground text-sm">Pronto aparecerán tus logros aquí</div>
                 )}
               </div>
             </div>
          </Card>
        </div>

        {/* Right: Sidebar (Symmetric Flex Column) */}
        <div className="flex flex-col gap-8">
          
          {/* Información del Profesor / Cursada (Centrado y horizontal) */}
          <Card className="flex-1 p-8 rounded-[2.5rem] border-none shadow-xl bg-card flex flex-col items-center justify-center gap-8 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
            
            {/* Bloque Principal: Avatar + Textos */}
            <div className="flex items-center gap-6">
              {/* Avatar e Ícono de Estado - Izquierda */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden border-4 border-muted shadow-xl group-hover:scale-105 transition-transform duration-500">
                  {mainCourse?.teacher?.avatarUrl ? (
                    <img 
                      src={mainCourse.teacher.avatarUrl} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl font-black text-primary italic leading-none">
                      {mainCourse?.teacher?.name?.charAt(0) || mainCourse?.name?.charAt(0) || <Users size={28} />}
                    </div>
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-card flex items-center justify-center text-white shadow-lg",
                  mainCourse ? "bg-emerald-500" : "bg-muted text-muted-foreground"
                )}>
                  {mainCourse ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                </div>
              </div>

              {/* Títulos - Derecha */}
              <div className="text-left space-y-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground block">Tu Instructor</span>
                <h3 className="text-lg font-black tracking-tight leading-tight">
                  {mainCourse?.teacher?.name || "Docente no asignado"}
                </h3>
                <p className="text-[13px] font-medium text-primary/60">
                  {mainCourse?.name || "Sin curso activo"}
                </p>
              </div>
            </div>

            {/* Parte Inferior - Mensajes / Botón */}
            <div className="pt-6 border-t border-border/50 w-full text-center">
              {mainCourse?.teacher ? (
                <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
                  <Video size={14} /> Contactar docente
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary/80 italic font-bold">
                    {mainCourse ? "Información no disponible" : "ESPERANDO ASIGNACIÓN"}
                  </span>
                  {!mainCourse && (
                     <p className="text-[10px] text-muted-foreground/60 font-bold max-w-[200px] mx-auto leading-tight">
                       Pronto verás aquí los datos de tu instructor.
                     </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Pending Tasks (Llamativa) */}
          <Card className="flex-1 p-8 rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white relative overflow-hidden group flex flex-col justify-between">
             <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:scale-110 transition-transform duration-700">
                <AlertCircle size={120} />
             </div>
             
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black tracking-tight italic">Tareas Pendientes</h3>
                   {pendingTasks.length > 0 && (
                     <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-black shadow-lg shadow-rose-500/30 animate-bounce">
                        {pendingTasks.length}
                     </div>
                   )}
                </div>

                <div className="space-y-4">
                  {pendingTasks.length > 0 ? (
                    pendingTasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                         <h4 className="font-bold text-sm truncate">{task.title}</h4>
                         <p className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-widest">{task.dueDate}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-6 opacity-30 gap-2">
                       <CheckCircle2 size={32} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Al día</span>
                    </div>
                  )}
                </div>
             </div>

             <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:gap-3 transition-all">
                   Ver todo el centro <ArrowRight size={14} />
                </button>
             </div>
          </Card>

        </div>
      </div>

      {/* 3. NEW STATS & HISTORY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: 2x2 Impact Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Classes - Blue */}
          <Card className="p-5 rounded-[1.5rem] bg-indigo-600 text-white border-none shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Total Clases</p>
              <div className="text-3xl font-black italic leading-none">{academicStats.totalLessons}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 ml-4">
              <Calendar size={20} />
            </div>
          </Card>

          {/* Passed Classes - Gold */}
          <Card className="p-5 rounded-[1.5rem] bg-amber-500 text-white border-none shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Clases Dictadas</p>
              <div className="text-3xl font-black italic leading-none">{academicStats.passedLessons}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 ml-4">
              <Clock size={20} />
            </div>
          </Card>

          {/* Attendances - Green */}
          <Card className="p-5 rounded-[1.5rem] bg-emerald-500 text-white border-none shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Asistencias</p>
              <div className="text-3xl font-black italic leading-none">{academicStats.presentsCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 ml-4">
              <CheckCircle2 size={20} />
            </div>
          </Card>

          {/* Absences - Red */}
          <Card className="p-5 rounded-[1.5rem] bg-rose-500 text-white border-none shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Faltas</p>
              <div className="text-3xl font-black italic leading-none">{academicStats.absentsCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 ml-4">
              <AlertCircle size={20} />
            </div>
          </Card>
        </div>

        {/* Right: Recent Sessions List */}
        <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-card">
          <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
            <Clock size={20} className="text-primary" /> Historial de Cursada
          </h3>
          <div className="space-y-3">
            {recentAttendances.length > 0 ? (
              recentAttendances.map((att: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-3 h-3 rounded-full shrink-0",
                      att.status === 'PRESENT' || att.status === 'LATE' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    )} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-black truncate">{att.lesson.course.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{dayjs(att.lesson.date).format('DD MMMM, YYYY')}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider",
                    att.status === 'PRESENT' || att.status === 'LATE' 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : "bg-rose-500/10 text-rose-600"
                  )}>
                    {att.status === 'PRESENT' ? 'Asistió' : att.status === 'LATE' ? 'Tarde' : 'Ausente'}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center opacity-20 italic text-sm">Sin registros de asistencia</div>
            )}
          </div>
        </Card>

      </div>

      {/* 4. MÉTRICAS DE PRÁCTICA CON IA */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Sparkles size={16} className="text-violet-500" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Práctica con IA</h3>
        </div>

        {practiceMetrics.totalSessions === 0 ? (
          <Card className="p-8 rounded-[2rem] border-dashed border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 text-center">
            <Sparkles size={32} className="text-violet-400 mx-auto mb-3" />
            <p className="font-bold">Aún no realizaste sesiones de práctica</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando tu profesor publique material de práctica, podrás practicar y ver tus métricas aquí.
            </p>
          </Card>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-5 rounded-[1.5rem] bg-violet-600 text-white border-none shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Sesiones</p>
                  <div className="text-3xl font-black italic leading-none">{practiceMetrics.totalSessions}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Target size={20} />
                </div>
              </Card>

              <Card className="p-5 rounded-[1.5rem] bg-emerald-500 text-white border-none shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Precisión</p>
                  <div className="text-3xl font-black italic leading-none">
                    {practiceMetrics.avgAccuracy !== null ? `${practiceMetrics.avgAccuracy}%` : "—"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} />
                </div>
              </Card>

              <Card className="p-5 rounded-[1.5rem] bg-sky-500 text-white border-none shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Tiempo</p>
                  <div className="text-3xl font-black italic leading-none">{practiceMetrics.totalMinutesPracticed}m</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Timer size={20} />
                </div>
              </Card>
            </div>

            {/* Session history */}
            <Card className="p-6 rounded-[2rem] border-none shadow-xl bg-card">
              <h4 className="font-black text-base mb-4 flex items-center gap-2">
                <Mic2 size={16} className="text-violet-500" /> Historial de Sesiones
              </h4>
              <div className="space-y-2.5">
                {practiceMetrics.recentSessions.map((s) => {
                  const scoreColor = s.accuracyPct >= 80 ? "text-emerald-600 dark:text-emerald-400"
                    : s.accuracyPct >= 60 ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400";
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                      <div
                        className="w-2 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.courseColor || "#8b5cf6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate">{s.lessonTopic}</p>
                        <p className="text-[10px] text-muted-foreground">{s.courseName} · {dayjs(s.completedAt).fromNow()}</p>
                        {s.weakArea && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">📍 {s.weakArea}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-lg font-black", scoreColor)}>{s.accuracyPct}%</p>
                        <p className="text-[10px] text-muted-foreground">{s.phrasesCorrect}/{s.phrasesAttempted} frases</p>
                      </div>
                      {s.accuracyPct >= 70
                        ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        : <XCircle size={16} className="text-red-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* 5. BOLETÍN INSTITUCIONAL */}
      <Card className="p-10 border-none shadow-2xl bg-card rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <ClipboardList size={200} />
          </div>
          
          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="text-primary" size={32} />
              </div>
              <h2 className="text-3xl font-black tracking-tight">Boletín del Instituto</h2>
              <p className="text-muted-foreground font-medium leading-relaxed">
                  Este espacio está reservado para el reporte oficial académico emitido por el instituto. 
                  Aquí podrás ver el desglose trimestral, promedios finales y la firma digital de las autoridades. 
              </p>
              <div className="pt-6 border-t border-border/50">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-muted/50 rounded-full text-sm font-bold text-muted-foreground border border-dashed border-muted-foreground/30 animate-pulse">
                      <Info size={16} /> Próximamente disponible
                  </div>
              </div>
          </div>

          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </Card>

    </main>
  );
}
