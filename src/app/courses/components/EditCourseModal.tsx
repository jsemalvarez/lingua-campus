"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateCourseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { X, BookOpen, CheckCircle, AlertCircle, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditCourseModalProps {
    courseId: string;
    currentName: string;
    currentLevel: string | null;
}

export function EditCourseModal({ courseId, currentName, currentLevel }: EditCourseModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [mounted, setMounted] = useState(false);
    const [name, setName] = useState(currentName);
    const [level, setLevel] = useState(currentLevel || "");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        startTransition(async () => {
            const result = await updateCourseAction(courseId, { name, level });
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
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => setIsOpen(true)}
                title="Editar curso"
            >
                <Edit2 size={16} />
            </Button>
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="text-blue-500" /> Editar Curso
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); setStatus("idle"); }}>
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Nombre del Curso
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all focus:border-blue-500"
                            placeholder="Ej: Inglés Avanzado"
                        />
                    </div>

                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Nivel
                        </label>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all focus:border-blue-500 appearance-none cursor-pointer"
                        >
                            <option value="">Sin nivel definido</option>
                            <option value="A1 (Principiante)">A1 (Principiante)</option>
                            <option value="A2 (Básico)">A2 (Básico)</option>
                            <option value="B1 (Intermedio)">B1 (Intermedio)</option>
                            <option value="B2 (Intermedio Alto)">B2 (Intermedio Alto)</option>
                            <option value="C1 (Avanzado)">C1 (Avanzado)</option>
                            <option value="C2 (Maestría)">C2 (Maestría)</option>
                            <option value="Kids / Especial">Kids / Especial</option>
                        </select>
                    </div>

                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> Curso actualizado exitosamente.
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-border/40 mt-6">
                        <Button type="button" variant="ghost" onClick={() => { setIsOpen(false); setStatus("idle"); }} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                            {isPending ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
