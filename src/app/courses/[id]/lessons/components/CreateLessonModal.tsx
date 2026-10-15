"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { createLessonAction } from "../actions";
import { Button } from "@/components/ui/Button";
import {
    Plus, X, Calendar, BookOpen, FileText, CheckCircle, AlertCircle,
    FileEdit, GraduationCap, Info, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
}

const daysMapping = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/**
 * Alta de clase, TP o examen en el libro de temas.
 *
 * La clase pide sólo fecha, horario y tema, y al crearse abre su página, que es
 * donde se cargan los contenidos y la práctica (PED-09). El TP y el examen siguen
 * enteros acá: no tienen práctica ni página propia.
 */
export function CreateLessonModal({
    courseId,
    lessonType = "CLASS",
    schedules = []
}: {
    courseId: string;
    lessonType?: "CLASS" | "TP" | "EXAM";
    schedules?: Schedule[];
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // El día de hoy en la hora de quien carga. `toISOString()` lo daba en UTC: a la
    // noche, en Argentina, proponía la fecha de mañana.
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isClass = lessonType === "CLASS";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const formData = new FormData(e.currentTarget);
        formData.append("courseId", courseId);

        startTransition(async () => {
            const result = await createLessonAction(formData);
            if (result.success) {
                if (isClass && "lessonId" in result && result.lessonId) {
                    router.push(`/courses/${courseId}/lessons/${result.lessonId}`);
                    return;
                }
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

    const config = {
        CLASS: {
            label: "Clase",
            title: "Nueva clase",
            success: "Clase creada.",
            btn: "Crear y abrir la clase",
            Icon: Calendar,
            color: "text-blue-500",
            btnColor: "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-none",
        },
        TP: {
            label: "TP",
            title: "Registrar Trabajo Práctico",
            success: "TP registrado exitosamente.",
            btn: "Crear TP",
            Icon: FileEdit,
            color: "text-amber-500",
            btnColor: "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-none",
        },
        EXAM: {
            label: "Examen",
            title: "Registrar Nuevo Examen",
            success: "Examen registrado exitosamente.",
            btn: "Crear Examen",
            Icon: GraduationCap,
            color: "text-red-500",
            btnColor: "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 shadow-none",
        },
    };

    const current = config[lessonType];

    if (!isOpen || !mounted) {
        return (
            <Button
                className={`w-full text-sm font-semibold transition-all ${current.btnColor}`}
                onClick={() => setIsOpen(true)}
            >
                <Plus size={16} className="mr-1.5" /> {current.label}
            </Button>
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 pb-8 bg-background/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95 my-auto">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <current.Icon className={current.color} />
                        {current.title}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Cerrar">
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <input type="hidden" name="type" value={lessonType} />

                    <div className={isClass && schedules.length > 0 ? "grid gap-5 sm:grid-cols-2" : "space-y-5"}>
                        {/* Fecha */}
                        <div className="space-y-1.5 focus-within:text-primary transition-colors">
                            <label htmlFor="nueva-fecha" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                Fecha
                            </label>
                            <input
                                id="nueva-fecha"
                                type="date"
                                name="date"
                                defaultValue={todayStr}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text focus:border-primary"
                            />
                        </div>

                        {/* Horario */}
                        {schedules.length > 0 && (
                            <div className="space-y-1.5 focus-within:text-primary transition-colors">
                                <label htmlFor="nueva-horario" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Horario
                                </label>
                                <select
                                    id="nueva-horario"
                                    name="scheduleId"
                                    className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:border-primary"
                                    defaultValue={schedules.length === 1 ? schedules[0].id : ""}
                                >
                                    <option value="">Seleccionar horario </option>
                                    {schedules.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {daysMapping[s.dayOfWeek]} {s.startTime} - {s.endTime}{s.room ? ` (${s.room})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Tema */}
                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label htmlFor="nueva-tema" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <BookOpen size={14} /> {isClass ? "Tema" : "Tema / Título Principal"}
                        </label>
                        <input
                            id="nueva-tema"
                            type="text"
                            name="topic"
                            placeholder="Ej: Past Simple vs Continuous"
                            required
                            maxLength={200}
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:border-primary"
                        />
                    </div>

                    {isClass ? (
                        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/40 text-[13px] leading-relaxed text-muted-foreground">
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <p>
                                Los contenidos y la práctica de los alumnos se cargan en la página de la clase,
                                que se abre al crearla.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 focus-within:text-primary transition-colors">
                            <label htmlFor="nueva-contenidos" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <FileText size={14} /> Contenidos / Tareas (Opcional)
                            </label>
                            <textarea
                                id="nueva-contenidos"
                                name="content"
                                rows={3}
                                placeholder="Páginas del libro, tareas asignadas, notas de la sesión..."
                                className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none focus:border-primary"
                            />
                        </div>
                    )}

                    {/* Feedback */}
                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> {current.success}
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
                        <Button
                            type="submit"
                            disabled={isPending}
                            className={isClass ? "bg-[#23806a] hover:bg-[#1f7360] text-white font-bold px-5 gap-1" : "premium-gradient font-bold px-6"}
                        >
                            {isPending ? (isClass ? "Creando..." : "Guardando...") : current.btn}
                            {isClass && !isPending && <ChevronRight size={16} />}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
