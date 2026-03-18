"use client";

import { Card } from "@/components/ui/Card";
import { Clock, MapPin, User, BookOpen, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import dayjs from "dayjs";

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
        lessons: {
            id: string;
            topic: string;
        }[];
    };
}

interface WeeklyGridViewProps {
    schedules: any[];
    daysMapping: string[];
    currentDate: Date;
}

export function WeeklyGridView({ schedules, daysMapping, currentDate }: WeeklyGridViewProps) {
    const weekDays = [1, 2, 3, 4, 5, 6, 0];

    // Find the Monday of the current week
    const startOfViewWeek = dayjs(currentDate).startOf('week').add(1, 'day');

    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[1000px] grid grid-cols-7 gap-4 items-start">
                {weekDays.map((dayIndex) => {
                    const dayName = daysMapping[dayIndex];
                    
                    // Specific date for this column
                    const columnDate = startOfViewWeek.add((dayIndex + 6) % 7, 'day').startOf('day');

                    const daySchedules = schedules
                        .filter((s) => {
                            const isCorrectDay = s.dayOfWeek === dayIndex;
                            if (!isCorrectDay) return false;

                            const courseStart = s.course.startDate ? dayjs(s.course.startDate).startOf('day') : null;
                            const courseEnd = s.course.endDate ? dayjs(s.course.endDate).startOf('day') : null;

                            if (courseStart && columnDate.isBefore(courseStart)) return false;
                            if (courseEnd && columnDate.isAfter(courseEnd)) return false;

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
                                    {columnDate.format('D/M')}
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
                                        // Find the specific lesson for this day/slot
                                        const linkedLesson = schedule.lessons?.find((l: any) => 
                                            // Add 12 hours to avoid timezone shifts (00:00 UTC showing as previous day)
                                            dayjs(l.date).add(12, 'hour').isSame(columnDate, 'day')
                                        );

                                        const cardColor = linkedLesson ? schedule.course.color : "#94a3b8";

                                        return (
                                            <Card 
                                                key={schedule.id} 
                                                className={`p-3 border-l-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-md cursor-pointer group ${!linkedLesson ? 'border-dashed opacity-80' : ''}`}
                                                style={{ 
                                                    borderLeftColor: cardColor,
                                                    backgroundColor: linkedLesson ? `${cardColor}10` : 'transparent'
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

                                                    {/* Teacher & Lesson info */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                            <User size={10} className="shrink-0" />
                                                            <span className="truncate">
                                                                {schedule.course.teacher ? schedule.course.teacher.name : "Sin prof."}
                                                            </span>
                                                        </div>
                                                        
                                                        {linkedLesson ? (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-primary/70 font-bold shrink-0">
                                                                <BookOpen size={10} className="shrink-0" />
                                                                <span className="truncate italic">
                                                                    {linkedLesson.topic}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-bold shrink-0">
                                                                <span className="truncate italic">
                                                                    Pendiente
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Quick Action */}
                                                    <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link 
                                                            href={linkedLesson
                                                                ? `/courses/${schedule.course.id}/lessons/${linkedLesson.id}/attendance`
                                                                : `/courses/${schedule.course.id}`}
                                                        >
                                                            <Button variant="ghost" className="w-full h-7 text-[9px] font-black uppercase tracking-wider bg-white/50 dark:bg-black/20 hover:bg-primary hover:text-white">
                                                                {linkedLesson ? (
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
