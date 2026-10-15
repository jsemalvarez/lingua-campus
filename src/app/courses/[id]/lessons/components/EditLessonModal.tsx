"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { editLessonAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { X, BookOpen, FileText, CheckCircle, AlertCircle, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
}

interface EditLessonModalProps {
    courseId: string;
    lesson: {
        id: string;
        date: Date;
        topic: string;
        content: string | null;
        type: "CLASS" | "TP" | "EXAM";
        scheduleId: string | null;
    };
    schedules?: Schedule[];
}

const daysMapping = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/**
 * Edición de un TP o un examen. Las clases se editan en su página (PED-09), que
 * es donde está también la práctica de los alumnos.
 */
export function EditLessonModal({ courseId, lesson, schedules = [] }: EditLessonModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const initialDateStr = new Date(lesson.date).toISOString().split("T")[0];
    const labelName = lesson.type === "CLASS" ? "Clase" : lesson.type === "TP" ? "TP" : "Examen";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const formData = new FormData(e.currentTarget);
        formData.append("courseId", courseId);
        formData.append("lessonId", lesson.id);

        startTransition(async () => {
            const result = await editLessonAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    setIsOpen(false);
                    setStatus("idle");
                    router.refresh();
                }, 1500);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Ocurrió un error");
            }
        });
    };

    if (!isOpen || !mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                aria-label={`Editar ${labelName}`}
                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                onClick={() => {
                    setStatus("idle");
                    setIsOpen(true);
                }}
            >
                <Edit2 size={16} />
            </Button>
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 pb-8 bg-background/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95 my-auto">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Edit2 className="text-blue-500" /> Editar {labelName}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Cerrar">
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <input type="hidden" name="type" value={lesson.type} />

                    {/* Fecha */}
                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Fecha
                        </label>
                        <input
                            type="date"
                            name="date"
                            defaultValue={initialDateStr}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-text focus:border-blue-500"
                        />
                    </div>

                    {/* Horario */}
                    {schedules.length > 0 && (
                        <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Horario Correspondiente
                            </label>
                            <select
                                name="scheduleId"
                                className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all focus:border-blue-500"
                                defaultValue={lesson.scheduleId || ""}
                            >
                                <option value="">Seleccionar horario</option>
                                {schedules.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {daysMapping[s.dayOfWeek]} {s.startTime} - {s.endTime}{s.room ? ` (${s.room})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tema */}
                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <BookOpen size={14} /> Tema / Título Principal
                        </label>
                        <input
                            type="text"
                            name="topic"
                            defaultValue={lesson.topic}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all focus:border-blue-500"
                        />
                    </div>

                    {/* Contenidos */}
                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <FileText size={14} /> Contenidos / Tareas (Opcional)
                        </label>
                        <textarea
                            name="content"
                            rows={3}
                            defaultValue={lesson.content || ""}
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none focus:border-blue-500"
                        />
                    </div>

                    {/* Feedback */}
                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> {labelName} editada exitosamente.
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-border/40 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
