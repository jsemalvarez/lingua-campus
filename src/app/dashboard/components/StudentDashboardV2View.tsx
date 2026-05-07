"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import {
   Calendar,
   Video,
   ArrowRight,
   Clock,
   MapPin,
   GraduationCap,
   Sparkles,
   Star
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface StudentDashboardV2ViewProps {
   student: any;
   attendanceRate: number;
   practiceHours: string;
   upcomingLessons: any[];
   pendingTasks: any[];
   isMinor: boolean;
   courseProgress: number;
   lessonStats: { current: number; total: number };
   averageGrade: string | null;
}

export function StudentDashboardV2View({
   student,
   attendanceRate,
   practiceHours,
   upcomingLessons,
   pendingTasks,
   isMinor,
   courseProgress,
   lessonStats,
   averageGrade,
}: StudentDashboardV2ViewProps) {
   const firstName = student.name.split(" ")[0];
   const nextSession = upcomingLessons[0];

   const [motivationQuote, setMotivationQuote] = React.useState("");

   React.useEffect(() => {
      const quotes = [
         "Un pequeño esfuerzo todos los días se traduce en resultados extraordinarios mañana.",
         "La constancia es el puente entre tus metas y tus logros.",
         "Cada palabra nueva es una puerta que se abre al mundo.",
         "Tu futuro se construye con lo que haces hoy, no mañana.",
         "Aprender un idioma no es solo saber palabras, es entender almas."
      ];
      setMotivationQuote(quotes[Math.floor(Math.random() * quotes.length)]);
   }, []);

   // Obtenemos el curso principal (la primera matrícula activa)
   const mainEnrollment = student.enrollments[0];
   const mainCourse = mainEnrollment?.course;

   return (
      <main className="container mx-auto px-4 sm:px-6 py-8 space-y-12 animate-in mt-12 mb-24">

         {/* 1. HERO BANNER */}
         <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 shadow-2xl min-h-[300px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-accent/20 rounded-full blur-[60px]" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="max-w-xl">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-6 backdrop-blur-sm border border-white/5">
                     Mi Espacio de Aprendizaje • {dayjs().format('MMMM YYYY')}
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 leading-[1.1]">
                     ¿Qué tal tu día,<br /> {firstName}?
                  </h1>
                  <p className="text-slate-300 text-lg font-medium leading-relaxed max-w-md">
                     Has completado el <span className="text-white font-bold">{attendanceRate}%</span> de tus módulos de asistencia semanal. ¡Sigue con ese impulso!
                  </p>
               </div>

               {/* Illustration Card */}
               <div className="hidden lg:block opacity-40 hover:opacity-100 transition-opacity duration-700">
                  <div className="w-40 h-64 bg-gradient-to-br from-primary to-accent rounded-3xl rotate-12 shadow-2xl relative overflow-hidden flex items-center justify-center border border-white/10">
                     <div className="p-6 text-white text-center">
                        <div className="text-[10px] font-black tracking-widest uppercase mb-4 opacity-50 text-white/70">Safe Work</div>
                        <div className="text-3xl font-black italic">LEARNING</div>
                        <div className="mt-8 text-5xl">✨</div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* MOTIVATION CAPSULE (2/3 Centered) */}
         <div className="flex justify-center">
            <Card className="w-full lg:w-2/3 p-8 rounded-[2rem] border-y-0 border-r-0 border-l-4 border-l-emerald-500 shadow-xl bg-gradient-to-br from-emerald-500/10 to-transparent flex flex-col items-center justify-center gap-4 group text-center">
               <p className="text-lg md:text-xl font-black italic tracking-tight text-foreground/80 leading-snug max-w-2xl">
                  {motivationQuote || "Preparando tu dosis de inspiración..."}
               </p>
            </Card>
         </div>



         {/* 2. ASYMMETRIC HIGHLIGHT ROW (Course 2/3 vs Next Session 1/3) */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

            {/* Tu Curso Actual (2/3) - Estética Llamativa */}
            <Card className="lg:col-span-2 p-8 rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white relative overflow-hidden group min-h-[250px] flex flex-col justify-between">
               {/* Background Decoration */}
               <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:scale-110 transition-transform duration-1000">
                  <GraduationCap size={200} />
               </div>

               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <Sparkles size={16} className="text-slate-900" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tu Curso Actual</span>
                  </div>

                  {mainCourse ? (
                     <div className="space-y-6">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase leading-none max-w-xl">
                           {mainCourse.name}
                        </h2>

                        {/* Mastery Progress Bar */}
                        <div className="max-w-md space-y-3 pt-2">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Maestría del Curso</span>
                              <span className="text-xs font-black italic text-primary">{courseProgress}%</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <div
                                 className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                                 style={{ width: `${courseProgress}%` }}
                              />
                           </div>
                           <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.1em]">
                              Has asistido a {lessonStats.current} de {lessonStats.total} clases programadas
                           </p>
                        </div>
                     </div>
                  ) : (
                     <p className="text-white/40 italic">No tienes matrículas activas.</p>
                  )}
               </div>

               <div className="relative z-10 flex flex-row items-end justify-between gap-6 mt-8">
                  {mainCourse?.teacher && (
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                           {mainCourse.teacher.avatarUrl ? (
                              <img src={mainCourse.teacher.avatarUrl} alt="" className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full bg-white/10 flex items-center justify-center text-xl font-black italic">
                                 {mainCourse.teacher.name.charAt(0)}
                              </div>
                           )}
                        </div>
                        <div className="hidden sm:block">
                           <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Instructor</span>
                           <p className="text-sm font-bold">{mainCourse.teacher.name.split(" ")[0]}</p>
                        </div>
                     </div>
                  )}
                  <div className="flex-1 flex justify-end">
                     <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-[1.5rem] font-black text-[12px] hover:scale-105 active:scale-95 transition-all shadow-xl">
                        Estudiar <ArrowRight size={16} />
                     </button>
                  </div>
               </div>
            </Card>

            {/* Próxima Sesión (1/3) - Compacta */}
            <Card className="p-8 rounded-[3rem] border-none shadow-xl bg-card flex flex-col justify-between min-h-[250px]">
               <div>
                  <h3 className="text-lg font-black tracking-tight mb-4">Próxima Sesión</h3>

                  {nextSession ? (
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                           <Calendar size={14} />
                           <span className="text-[10px] font-black uppercase tracking-widest">
                              {dayjs(nextSession.date).format('dddd DD')} • {nextSession.schedule?.startTime}
                           </span>
                        </div>
                        <p className="text-sm font-black leading-tight line-clamp-2">
                           {nextSession.topic || "Clase regular de reforzamiento."}
                        </p>
                     </div>
                  ) : (
                     <div className="text-center py-10 opacity-30 italic text-xs">Sin clases</div>
                  )}
               </div>

               <div className="flex justify-end pt-4">
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:gap-3 transition-all">
                     Unirse <ArrowRight size={14} />
                  </button>
               </div>
            </Card>

         </div>

      {/* 3. METRIC CARDS (At the bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 pb-12">
        
        {/* Attendance Card */}
        <Card className="p-8 rounded-[2.5rem] border-y-0 border-r-0 border-l-4 border-l-indigo-500 shadow-xl bg-gradient-to-br from-indigo-500/10 to-transparent hover:translate-y-[-4px] transition-all duration-300 group">
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">Al día</span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tasa de Asistencia</p>
          <div className="flex items-baseline gap-2 mb-6">
            <h2 className="text-3xl font-black tracking-tighter">{attendanceRate}%</h2>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
              style={{ width: `${attendanceRate}%` }} 
            />
          </div>
        </Card>

        {/* GPA / Average Card */}
        <Card className="p-8 rounded-[2.5rem] border-y-0 border-r-0 border-l-4 border-l-orange-500 shadow-xl bg-gradient-to-br from-orange-500/10 to-transparent hover:translate-y-[-4px] transition-all duration-300 group">
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <Star size={24} />
            </div>
            {averageGrade && <span className="text-[10px] font-black text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full">Destacado</span>}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Promedio General</p>
          <div className="flex items-baseline gap-2 mb-6">
            <h2 className={cn("text-3xl font-black tracking-tighter", !averageGrade && "text-muted-foreground/30 italic text-2xl")}>
                {averageGrade || "Sin notas"}
            </h2>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
              style={{ width: averageGrade ? `${parseFloat(averageGrade) * 10}%` : '0%' }} 
            />
          </div>
        </Card>

        {/* Working Hours Card */}
        <Card className="p-8 rounded-[2.5rem] border-y-0 border-r-0 border-l-4 border-l-sky-500 shadow-xl bg-gradient-to-br from-sky-500/10 to-transparent hover:translate-y-[-4px] transition-all duration-300 group">
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <span className="text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full">Acumulado</span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Horas de Clase</p>
          <div className="flex items-baseline gap-2 mb-6">
            <h2 className="text-3xl font-black tracking-tighter">{practiceHours}h</h2>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-600 rounded-full w-[65%]" 
            />
          </div>
        </Card>

      </div>

      </main>
   );
}
