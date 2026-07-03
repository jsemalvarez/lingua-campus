"use client";

import React from 'react';
import { Card } from "@/components/ui/Card";
import { Clock, User, MapPin, Video, BookOpen, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

interface StudentAgendaProps {
  enrollments: any[];
}

export function StudentAgenda({ enrollments }: StudentAgendaProps) {
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const fullDayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  
  const todayIndex = dayjs().day(); // 0-6

  // Agrupar horarios por día
  const weekSchedule = Array.from({ length: 7 }, (_, i) => {
    const dayClasses = enrollments.flatMap(enrol => 
      enrol.course.schedules
        .filter((s: any) => s.dayOfWeek === i)
        .map((s: any) => ({
          ...s,
          courseName: enrol.course.level || enrol.course.name,
          teacherName: enrol.course.teacher?.name,
          teacherAvatar: enrol.course.teacher?.avatarUrl,
          color: enrol.course.color || "var(--c-primary)"
        }))
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      dayIndex: i,
      dayName: dayNames[i],
      fullDayName: fullDayNames[i],
      classes: dayClasses,
      isToday: i === todayIndex
    };
  });

  // Reordenar para que empiece por Lunes (1) a Sábado (6)
  const orderedSchedule = [
    ...weekSchedule.slice(1, 7),
    weekSchedule[0]
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-2xl font-black tracking-tight">Tu Semana</h3>
          <p className="text-sm text-muted-foreground font-medium">Cronograma de tus cursos activos</p>
        </div>
        <div className="flex gap-2">
           <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
             {enrollments.length} Cursos
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {orderedSchedule.filter(d => d.dayIndex !== 0).map((day) => (
          <div 
            key={day.dayIndex} 
            className={cn(
              "flex flex-col gap-3 p-4 rounded-[2rem] transition-all duration-500",
              day.isToday ? "bg-slate-900 text-white shadow-2xl scale-[1.02] ring-4 ring-primary/20" : "bg-muted/30 border border-border/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  day.isToday ? "text-primary-foreground/60" : "text-muted-foreground"
                )}>
                {day.dayName}
              </span>
              {day.isToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>

            <div className="space-y-3 flex-1">
              {day.classes.length > 0 ? (
                day.classes.map((cls, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-3 rounded-2xl border transition-all group cursor-pointer",
                      day.isToday 
                        ? "bg-white/10 border-white/10 hover:bg-white/20" 
                        : "bg-background border-border/50 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                       <Clock size={12} className={day.isToday ? "text-primary" : "text-muted-foreground"} />
                       <span className="text-[11px] font-bold tabular-nums">
                         {cls.startTime}
                       </span>
                    </div>
                    
                    <h4 className="font-black text-sm leading-tight mb-3 line-clamp-2">
                      {cls.courseName}
                    </h4>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-current/10">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-muted overflow-hidden border border-current/20">
                           {cls.teacherAvatar ? (
                             <img src={cls.teacherAvatar} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-[10px] font-black opacity-50">
                               {cls.teacherName?.charAt(0)}
                             </div>
                           )}
                         </div>
                         <span className="text-[10px] font-bold opacity-70 truncate max-w-[60px]">
                           {cls.teacherName?.split(" ")[0]}
                         </span>
                       </div>
                       <div className={cn(
                         "w-6 h-6 rounded-lg flex items-center justify-center",
                         day.isToday ? "bg-white/10" : "bg-muted"
                       )}>
                         {cls.room === 'Online' ? <Video size={12} /> : <MapPin size={12} />}
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 opacity-20 italic">
                  <Star size={20} className="mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Libre</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
