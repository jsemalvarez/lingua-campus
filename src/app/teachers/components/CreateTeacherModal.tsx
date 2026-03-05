"use client";

import { useState, useTransition } from "react";
import { createTeacherAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Plus, X, CheckCircle, AlertCircle, User, Mail, Lock, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateTeacherModal() {
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
            const result = await createTeacherAction(formData);
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
            <Button className="premium-gradient shadow-md shadow-primary/20" onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Registrar Profesor
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-[500px] rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <User className="text-primary" /> Registrar Nuevo Profesor
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Nombre Completo</label>
                        <input type="text" name="name" required placeholder="Ej: Laura Martinez" className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text focus:border-primary" />
                    </div>

                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Mail size={14} /> Correo Electrónico</label>
                        <input type="email" name="email" required placeholder="laura@instituto.com" className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text focus:border-primary" />
                    </div>

                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Lock size={14} /> Contraseña de Acceso</label>
                        <input type="password" name="password" required placeholder="Min 6 caracteres" minLength={6} className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text focus:border-primary" />
                    </div>

                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Phone size={14} /> Celular (Opcional)</label>
                        <input type="tel" name="phone" placeholder="+54 9 11 1234..." className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-text focus:border-primary" />
                    </div>

                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> Profesor registrado con éxito.
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
                            {isPending ? "Procesando..." : "Confirmar Alta"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
