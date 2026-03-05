"use client";

import { useState, useTransition } from "react";
import { createScheduleAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Plus, X, Calendar, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface CourseOption {
    id: string;
    name: string;
    level: string | null;
}

export function CreateScheduleModal({ courses }: { courses: CourseOption[] }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await createScheduleAction(formData);
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

    if (!isOpen) {
        return (
            <Button className="premium-gradient shadow-md" onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Clase
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="text-primary" /> Programar Nueva Clase
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">Curso a dictar</label>
                        <select name="courseId" required className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                            <option value="">Seleccione el curso...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.level ? `(${c.level})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 focus-within:text-primary transition-colors">
                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Día de la semana</label>
                            <select name="dayOfWeek" required className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                                <option value="1">Lunes</option>
                                <option value="2">Martes</option>
                                <option value="3">Miércoles</option>
                                <option value="4">Jueves</option>
                                <option value="5">Viernes</option>
                                <option value="6">Sábado</option>
                                <option value="0">Domingo</option>
                            </select>
                        </div>

                        <div className="space-y-1.5 focus-within:text-primary transition-colors">
                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><MapPin size={14} /> Aula / Salón</label>
                            <input type="text" name="room" placeholder="Ej: Aula 1" className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 focus-within:text-primary transition-colors">
                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock size={14} /> Inicio</label>
                            <input type="time" name="startTime" required className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text" />
                        </div>
                        <div className="space-y-1.5 focus-within:text-primary transition-colors">
                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock size={14} /> Fin</label>
                            <input type="time" name="endTime" required className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text" />
                        </div>
                    </div>

                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> Schedule creado exitosamente.
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-border/40 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending || courses.length === 0} className="premium-gradient font-bold px-6">
                            {isPending ? "Guardando..." : "Programar"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
