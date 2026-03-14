"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/Card";
import { Clock, Users, GraduationCap, MapPin, GripVertical } from "lucide-react";
import Link from "next/link";

interface SortableCourseCardProps {
    course: any;
    userRole: string;
    DAYS_OF_WEEK: string[];
}

export function SortableCourseCard({ course, userRole, DAYS_OF_WEEK }: SortableCourseCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: course.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative">
            <Card className={`group overflow-hidden flex flex-col hover:border-primary/40 transition-colors shadow-sm bg-card/60 backdrop-blur-sm relative ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                {/* Decoración de tarjeta */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 premium-gradient opacity-80" />

                <div className="p-0 flex flex-col sm:flex-row w-full h-full relative z-10">
                    
                    {/* Handle para arrastrar */}
                    <div 
                        {...attributes} 
                        {...listeners}
                        className="absolute right-2 top-2 p-2 text-muted-foreground/30 hover:text-primary cursor-grab active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                        <GripVertical size={20} />
                    </div>

                    {/* Columna 1: Curso, Nivel y Horarios */}
                    <div className="flex-1 p-5 sm:p-6 sm:border-r border-border/40 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="pr-8">
                                <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                                    {course.name}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                                    <span className="inline-block px-2 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                        Nivel: {course.level || "General"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mt-auto text-sm">
                            <div className="flex gap-2">
                                <div className="mt-0.5"><Clock size={16} className="text-emerald-500/80 shrink-0" /></div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-muted-foreground mb-1">Días y Horarios:</span>
                                    {course.schedules.length === 0 ? (
                                        <span className="italic text-muted-foreground">A definir</span>
                                    ) : (
                                        <ul className="space-y-1">
                                            {course.schedules.map((sch: any) => (
                                                <li key={sch.id} className="text-foreground">
                                                    <span className="font-medium">{DAYS_OF_WEEK[sch.dayOfWeek]}</span> • {sch.startTime} - {sch.endTime}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna 2: Lista de alumnos */}
                    <div className="flex-1 p-5 sm:p-6 sm:border-r border-border/40 bg-muted/10">
                        <div className="flex items-center gap-2 mb-3">
                            <Users size={16} className="text-blue-500/80" />
                            <h4 className="font-semibold text-sm">Alumnos Inscriptos ({course._count.enrollments})</h4>
                        </div>
                        <div className="text-sm">
                            {course.enrollments.length === 0 ? (
                                <span className="italic text-muted-foreground">Sin alumnos cargados.</span>
                            ) : (
                                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto scrollbar-hide">
                                    {course.enrollments.map((enr: any) => (
                                        <span key={enr.id} className="inline-block px-2.5 py-1 text-xs bg-background border border-border/50 text-foreground rounded-full shadow-sm">
                                            {enr.student.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna 3: Profesor, Aula y Acción Administrar */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                        <div className="space-y-4 text-sm">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <GraduationCap size={16} className="text-amber-500/80" />
                                    <span className="font-semibold">Profesor a Cargo:</span>
                                </div>
                                <span className="text-foreground font-medium pl-6">{course.teacher?.name || "No asignado"}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <MapPin size={16} className="text-red-500/80" />
                                    <span className="font-semibold">Aula Asignada:</span>
                                </div>
                                <span className="text-foreground font-medium pl-6">{course.classroom?.name || "Sin aula asignada"}</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-border/30">
                            <Link href={`/courses/${course.id}`} className="w-full inline-block">
                                <div className="w-full px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-sm rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap">
                                    Administrar Curso
                                </div>
                            </Link>
                        </div>
                    </div>

                </div>
            </Card>
        </div>
    );
}
