"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { createLessonAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Plus, X, Calendar, BookOpen, FileText, CheckCircle, AlertCircle, FileEdit, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateLessonModal({ courseId, lessonType = "CLASS" }: { courseId: string; lessonType?: "CLASS" | "TP" | "EXAM" }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const todayStr = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const formData = new FormData(e.currentTarget);
        formData.append("courseId", courseId);

        startTransition(async () => {
            const result = await createLessonAction(formData);
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

    const config = {
        CLASS: { label: "Clase", title: "Registrar Nueva Clase", success: "Clase registrada exitosamente.", btn: "Crear Clase", Icon: Calendar, color: "text-blue-500", btnColor: "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-none" },
        TP: { label: "TP", title: "Registrar Trabajo Práctico", success: "TP registrado exitosamente.", btn: "Crear TP", Icon: FileEdit, color: "text-amber-500", btnColor: "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-none" },
        EXAM: { label: "Examen", title: "Registrar Nuevo Examen", success: "Examen registrado exitosamente.", btn: "Crear Examen", Icon: GraduationCap, color: "text-red-500", btnColor: "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 shadow-none" }
    };

    const current = config[lessonType];

    if (!isOpen || !mounted) {
        return (
            <Button className={`w-full text-sm font-semibold transition-all ${current.btnColor}`} onClick={() => setIsOpen(true)}>
                <Plus size={16} className="mr-1.5" /> {current.label}
            </Button>
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <current.Icon className={current.color} /> {current.title}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <input type="hidden" name="type" value={lessonType} />

                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Fecha</label>
                        <input type="date" name="date" defaultValue={todayStr} required className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text focus:border-primary" />
                    </div>

                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><BookOpen size={14} /> Tema / Título Principal</label>
                        <input type="text" name="topic" placeholder="Ej: Past Simple vs Continuous" required className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:border-primary" />
                    </div>

                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><FileText size={14} /> Contenidos / Tareas (Opcional)</label>
                        <textarea name="content" rows={3} placeholder="Mencionar páginas del libro, tareas asignadas, notas breves de la sesión..." className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none focus:border-primary"></textarea>
                    </div>

                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> {current.success}
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
                        <Button type="submit" disabled={isPending} className="premium-gradient font-bold px-6">
                            {isPending ? "Guardando..." : current.btn}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
