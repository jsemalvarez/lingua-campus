"use client";

import { Card } from "@/components/ui/Card";
import { Clock, MapPin, User, BookOpen, ClipboardCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SCHEDULED_LESSON_TOPIC } from "@/lib/practice/draft";

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
    course: {
        id: string;
        name: string;
        level: string | null;
        color: string;
        startDate: string | null;
        endDate: string | null;
        teacher: {
            name: string;
        } | null;
        lessons?: {
            id: string;
            date: string | Date;
            topic: string;
        }[];
    };
    lessons: {
        id: string;
        date: string | Date;
        topic: string;
        content?: string | null;
    }[];
    /** Clase de otro docente del mismo nivel: se ve, no se toca (FEAT-07). */
    isPeer?: boolean;
}

interface WeeklyGridViewProps {
    schedules: any[];
    daysMapping: string[];
    /**
     * Las siete fechas de la semana, lunes a domingo, como `yyyy-MM-dd` en UTC.
     *
     * Las manda el servidor y son **las mismas** con las que consultó las clases.
     * La grilla ya no calcula su propio lunes: cuando lo hacía, las dos puntas
     * usaban reglas distintas y podían discrepar sin que nada fallara (BUG-17).
     */
    weekDates: string[];
}

/**
 * Día calendario de una fecha, en UTC y como `yyyy-MM-dd`.
 *
 * `Lesson.date` es un `date` de Postgres —un día, sin hora—, así que llega al
 * navegador como medianoche UTC. Leerlo en la hora local del dispositivo lo corre
 * al día anterior en cualquier zona al oeste de Greenwich; de ahí salía el
 * `.add(12, 'hour')` que compensaba eso acá, y que aguantaba de UTC−11 a UTC+11.
 * Recortar el ISO no depende de ninguna zona horaria, así que no hay qué
 * compensar ni dónde equivocarse.
 */
function dayKey(value: string | Date): string {
    return new Date(value).toISOString().slice(0, 10);
}

export function WeeklyGridView({ schedules, daysMapping, weekDates }: WeeklyGridViewProps) {
    const weekDays = [1, 2, 3, 4, 5, 6, 0];

    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[1000px] grid grid-cols-7 gap-4 items-start">
                {weekDays.map((dayIndex, columnIndex) => {
                    const dayName = daysMapping[dayIndex];

                    // La fecha de la columna viene del servidor, alineada con el
                    // rótulo del día: `weekDays` y `weekDates` van lunes a domingo.
                    const columnDate = weekDates[columnIndex];
                    const [, columnMonth, columnDay] = columnDate.split("-");

                    const daySchedules = schedules
                        .filter((s) => {
                            const isCorrectDay = s.dayOfWeek === dayIndex;
                            if (!isCorrectDay) return false;

                            // `yyyy-MM-dd` ordena igual como texto que como fecha.
                            const courseStart = s.course.startDate ? dayKey(s.course.startDate) : null;
                            const courseEnd = s.course.endDate ? dayKey(s.course.endDate) : null;

                            if (courseStart && columnDate < courseStart) return false;
                            if (courseEnd && columnDate > courseEnd) return false;

                            return true;
                        })
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));

                    return (
                        <div key={dayIndex} className="flex flex-col gap-4 min-h-[500px]">
                            {/* Day Header */}
                            <div className="text-center p-3 rounded-2xl bg-muted/20 border border-border/40 backdrop-blur-sm flex flex-col items-center gap-0.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                                    {dayName}
                                </span>
                                <span className="text-[11px] font-bold text-muted-foreground/60">
                                    {Number(columnDay)}/{Number(columnMonth)}
                                </span>
                            </div>

                            {/* Column Content */}
                            <div className="flex flex-col gap-3">
                                {daySchedules.length === 0 ? (
                                    <div className="h-24 rounded-2xl border border-dashed border-border/30 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                            Sin clases
                                        </span>
                                    </div>
                                ) : (
                                    daySchedules.map((schedule) => {
                                        const linkedLesson = (schedule.lessons || []).find((l: any) =>
                                            dayKey(l.date) === columnDate
                                        ) || (schedule.course.lessons || []).find((l: any) =>
                                            dayKey(l.date) === columnDate
                                        );

                                        // «Clase Programada» es el rótulo con el que nacen las clases
                                        // generadas en tanda: quiere decir que todavía nadie escribió
                                        // qué se dio. Mostrarlo como si fuera el tema es lo que hace
                                        // que el par no se entere de nada. La clase igual existe, así
                                        // que el botón sigue llevando a donde llevaba.
                                        const registeredTopic = linkedLesson && linkedLesson.topic !== SCHEDULED_LESSON_TOPIC
                                            ? linkedLesson.topic
                                            : null;

                                        // La clase de un par va siempre en gris, tenga tema cargado
                                        // o no: el color del curso es de quien lo dicta (FEAT-07).
                                        const isPeer = !!schedule.isPeer;
                                        const cardColor = (linkedLesson && !isPeer) ? schedule.course.color : "#94a3b8";

                                        return (
                                            <Card
                                                key={schedule.id}
                                                className={`p-3 border-l-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-md cursor-pointer group ${!linkedLesson ? 'border-dashed opacity-80' : ''} ${isPeer ? 'opacity-75' : ''}`}
                                                style={{
                                                    borderLeftColor: cardColor,
                                                    backgroundColor: (linkedLesson && !isPeer) ? `${cardColor}10` : 'transparent'
                                                }}
                                            >
                                                <div className="space-y-2">
                                                    {/* Time & Room */}
                                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                                        <span className="flex items-center gap-1 text-foreground/80">
                                                            <Clock size={10} className="text-primary" />
                                                            {schedule.startTime}
                                                        </span>
                                                        {schedule.room && (
                                                            <span className="flex items-center gap-1 text-muted-foreground/70">
                                                                <MapPin size={10} />
                                                                {schedule.room}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Course Name */}
                                                    <h4 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">
                                                        {schedule.course.name}
                                                    </h4>

                                                    {isPeer && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                                                            <Eye size={9} /> Otro docente
                                                        </span>
                                                    )}

                                                    {/* Teacher & Lesson info */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                            <User size={10} className="shrink-0" />
                                                            <span className="truncate">
                                                                {schedule.course.teacher ? schedule.course.teacher.name : "Sin prof."}
                                                            </span>
                                                        </div>
                                                        
                                                        {registeredTopic ? (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-primary/70 font-bold shrink-0">
                                                                <BookOpen size={10} className="shrink-0" />
                                                                <span className="truncate italic">
                                                                    {registeredTopic}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-bold shrink-0">
                                                                <span className="truncate italic">
                                                                    {linkedLesson ? "Sin registrar" : "Pendiente"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Quick Action */}
                                                    <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* Al par no se le ofrece tomar asistencia: la
                                                            pantalla lo rechazaría, y ofrecerlo sería
                                                            prometer algo que no va a pasar. */}
                                                        <Link
                                                            href={(linkedLesson && !isPeer)
                                                                ? `/courses/${schedule.course.id}/lessons/${linkedLesson.id}/attendance`
                                                                : `/courses/${schedule.course.id}`}
                                                        >
                                                            <Button variant="ghost" className="w-full h-7 text-[9px] font-black uppercase tracking-wider bg-white/50 dark:bg-black/20 hover:bg-primary hover:text-white">
                                                                {isPeer ? (
                                                                    <><Eye size={12} className="mr-1" /> Ver Temas</>
                                                                ) : linkedLesson ? (
                                                                    <><ClipboardCheck size={12} className="mr-1" /> Asistencia</>
                                                                ) : (
                                                                    <><BookOpen size={12} className="mr-1" /> Ver Curso</>
                                                                )}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--primary), 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--primary), 0.2);
                }
            `}</style>
        </div>
    );
}
