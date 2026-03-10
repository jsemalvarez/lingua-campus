"use client";

import { useState, useTransition } from "react";
import { updateTeacherAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface TeacherData {
    id: string;
    name: string;
    email: string;
    phone: string | null;
}

export function EditTeacherForm({ teacher, onCancel }: { teacher: TeacherData, onCancel: () => void }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const formData = new FormData(e.currentTarget);
        formData.append("teacherId", teacher.id);

        startTransition(async () => {
            const result = await updateTeacherAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    onCancel();
                    router.refresh();
                }, 1500);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo actualizar la ficha");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border/50 p-6 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <h3 className="text-xl font-bold">Editar Profesor</h3>
                <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
                    <X size={20} className="text-muted-foreground" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Completo</label>
                        <input type="text" name="name" defaultValue={teacher.name} required className="w-full px-4 py-2 rounded-lg border border-input transition-all bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo Electrónico</label>
                        <input type="email" name="email" defaultValue={teacher.email} required className="w-full px-4 py-2 rounded-lg border border-input transition-all bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Celular (Opcional)</label>
                        <input type="tel" name="phone" defaultValue={teacher.phone || ""} className="w-full px-4 py-2 rounded-lg border border-input transition-all bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" placeholder="+54 9 11..." />
                    </div>
                </div>
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                    <CheckCircle size={18} /> Datos actualizados exitosamente.
                </div>
            )}
            {status === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                    <AlertCircle size={18} /> {errorMsg}
                </div>
            )}

            <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="premium-gradient font-bold px-6 text-white">
                    {isPending ? "Guardando..." : <><Save size={16} className="mr-2" /> Guardar Cambios</>}
                </Button>
            </div>
        </form>
    );
}
