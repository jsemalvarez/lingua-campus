"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { generateLessonsAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Sparkles, X, Calendar, CheckCircle, AlertCircle, CalendarRange } from "lucide-react";
import { useRouter } from "next/navigation";

export function GenerateLessonsModal({ courseId, startDate, endDate }: { courseId: string; startDate?: Date; endDate?: Date }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [mounted, setMounted] = useState(false);
    const [count, setCount] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Default to next month if dates not provided
    const defaultStart = startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const defaultEnd = endDate ? new Date(endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const formData = new FormData(e.currentTarget);
        const fromDate = new Date(formData.get("fromDate") as string);
        const toDate = new Date(formData.get("toDate") as string);

        if (toDate < fromDate) {
            setStatus("error");
            setErrorMsg("La fecha de fin no puede ser anterior a la de inicio");
            return;
        }

        startTransition(async () => {
            const result = await generateLessonsAction(courseId, fromDate, toDate);
            if (result.success) {
                setStatus("success");
                setCount(result.count ?? 0);
                setTimeout(() => {
                    setIsOpen(false);
                    setStatus("idle");
                    router.refresh();
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Ocurrió un error");
            }
        });
    };

    if (!isOpen || !mounted) {
        return (
            <Button 
                variant="outline" 
                className="w-full text-sm font-bold border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 flex items-center justify-center gap-2"
                onClick={() => setIsOpen(true)}
            >
                <Sparkles size={16} /> Generador Automático
            </Button>
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-blue-500/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="text-blue-500" /> Generador de Agenda
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <p className="text-sm text-muted-foreground">
                        Esto creará automáticamente los registros de clases (vacíos) según los horarios configurados para este curso en el rango seleccionado.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Desde</label>
                            <input type="date" name="fromDate" defaultValue={defaultStart} required className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-text focus:border-blue-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Hasta</label>
                            <input type="date" name="toDate" defaultValue={defaultEnd} required className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-text focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                         <div className="flex items-start gap-3">
                            <CalendarRange className="text-blue-500 mt-0.5" size={18} />
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-foreground block">Detección de Duplicados</span>
                                <span className="text-[11px] text-muted-foreground leading-relaxed">
                                    El sistema omitirá las fechas que ya tengan clases registradas para evitar repeticiones.
                                </span>
                            </div>
                         </div>
                    </div>

                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> Se generaron {count} clases exitosamente.
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
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                            {isPending ? "Generando..." : "Generar Clases"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
