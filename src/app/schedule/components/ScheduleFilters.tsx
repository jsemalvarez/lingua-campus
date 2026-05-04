"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, BookOpen, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

import { FilterOption, ScheduleFiltersProps } from "../types";

export function ScheduleFilters({
    allCourses,
    allTeachers,
    allClassrooms,
    userRole,
    currentFilters
}: ScheduleFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Si es estudiante o tutor, no mostramos nada según lo solicitado
    if (userRole === "STUDENT" || userRole === "GUARDIAN") {
        return null;
    }

    const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN" || userRole === "SECRETARY";
    const isTeacher = userRole === "TEACHER";

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/schedule?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("courseId");
        params.delete("teacherId");
        params.delete("classroomId");
        router.push(`/schedule?${params.toString()}`);
    };

    const hasActiveFilters = currentFilters.courseId || currentFilters.teacherId || currentFilters.classroomId;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-muted/10 backdrop-blur-md border border-border/30 rounded-[2rem] p-2 sm:p-3 shadow-inner flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-2xl border border-border/20 shadow-sm ml-1">
                    <Filter size={16} className="text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-foreground/70">Filtros</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 flex-1">
                    {/* Filtro de Curso */}
                    <div className="relative group min-w-[160px]">
                        <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                        <select
                            value={currentFilters.courseId || ""}
                            onChange={(e) => updateFilter("courseId", e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-border/40 bg-background/60 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all cursor-pointer appearance-none"
                        >
                            <option value="">Todos los Cursos</option>
                            {allCourses.map((course) => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Profesor (Solo Admins) */}
                    {isAdmin && (
                        <div className="relative group min-w-[160px]">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                            <select
                                value={currentFilters.teacherId || ""}
                                onChange={(e) => updateFilter("teacherId", e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-border/40 bg-background/60 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all cursor-pointer appearance-none"
                            >
                                <option value="">Todos los Profesores</option>
                                {allTeachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Filtro de Aula (Admins y Profesores) */}
                    {(isAdmin || isTeacher) && (
                        <div className="relative group min-w-[160px]">
                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                            <select
                                value={currentFilters.classroomId || ""}
                                onChange={(e) => updateFilter("classroomId", e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-border/40 bg-background/60 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all cursor-pointer appearance-none"
                            >
                                <option value="">Todas las Aulas</option>
                                {allClassrooms.map((classroom) => (
                                    <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Limpiar Filtros */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-10 px-4 rounded-2xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all group"
                        >
                            <X size={14} className="mr-2 group-hover:scale-110 transition-transform" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
