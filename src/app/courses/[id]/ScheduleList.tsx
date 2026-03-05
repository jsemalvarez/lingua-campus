"use client";

import { useState, useTransition } from "react";
import { addCourseScheduleAction, removeCourseScheduleAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface ScheduleListProps {
    courseId: string;
    schedules: Schedule[];
    isTeacherOrAdmin: boolean;
}

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function ScheduleList({ courseId, schedules, isTeacherOrAdmin }: ScheduleListProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddSchedule = async (formData: FormData) => {
        setStatus("idle");
        formData.append("courseId", courseId); // Se añade seguro

        startTransition(async () => {
            const result = await addCourseScheduleAction(formData);
            if (result.success) {
                setStatus("success");
                setIsAdding(false);
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo agregar");
            }
        });
    };

    const handleRemoveSchedule = async (scheduleId: string) => {
        startTransition(async () => {
            const result = await removeCourseScheduleAction(scheduleId, courseId);
            if (!result.success) {
                alert(result.error ?? "Error al eliminar horario");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Clock size={20} className="text-emerald-500" />
                        Días y Horarios
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Configura la agenda regular del curso.</p>
                </div>
                {isTeacherOrAdmin && !isAdding && (
                    <div
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-sm rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
                    >
                        Nuevo Horario
                    </div>
                )}
            </div>

            {/* Listado de horarios */}
            <div className="space-y-3">
                {schedules.length === 0 ? (
                    <div className="text-center p-6 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm">
                        Aún no se han asignado horarios para este curso.
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-4">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="w-full sm:w-[280px] shrink-0 flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 flex-shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg flex items-center justify-center">
                                        {DAYS_OF_WEEK[schedule.dayOfWeek].substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{DAYS_OF_WEEK[schedule.dayOfWeek]}</p>
                                        <p className="text-xs text-muted-foreground font-medium">{schedule.startTime} - {schedule.endTime}</p>
                                    </div>
                                </div>
                                {isTeacherOrAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all rounded-full h-8 w-8"
                                        onClick={() => handleRemoveSchedule(schedule.id)}
                                        disabled={isPending}
                                        title="Eliminar Horario"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Formulario Añadir Horario */}
            {isTeacherOrAdmin && isAdding && (
                <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-xl animate-in fade-in zoom-in-95 mt-4">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Plus size={16} className="text-emerald-500" /> Nuevo Horario
                    </h3>

                    <form action={handleAddSchedule} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Día</label>
                                <select
                                    name="dayOfWeek"
                                    className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background/50 focus:bg-background outline-none appearance-none"
                                    required
                                    defaultValue=""
                                >
                                    <option value="" disabled>Seleccione...</option>
                                    {DAYS_OF_WEEK.map((day, idx) => (
                                        <option key={idx} value={idx}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Hora Inicio</label>
                                <input
                                    name="startTime"
                                    type="time"
                                    className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background/50 focus:bg-background outline-none"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Hora Fin</label>
                                <input
                                    name="endTime"
                                    type="time"
                                    className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-background/50 focus:bg-background outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {status === "error" && (
                            <div className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={14} /> {errorMsg}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending}>
                                {isPending ? "Guardando..." : "Guardar Horario"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {status === "success" && !isAdding && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Horario añadido correctamente.
                </div>
            )}
        </div>
    );
}
