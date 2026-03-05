"use client";

import { useState, useTransition } from "react";
import { editStudentAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudentData {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    guardian1Name: string | null;
    guardian1Relation: string | null;
    guardian1Phone: string | null;
    guardian2Name: string | null;
    guardian2Relation: string | null;
    guardian2Phone: string | null;
}

export function EditStudentForm({ student, onCancel }: { student: StudentData, onCancel: () => void }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const formData = new FormData(e.currentTarget);
        formData.append("studentId", student.id);

        startTransition(async () => {
            const result = await editStudentAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    onCancel(); // Cerrar form después de guardar
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
                <h3 className="text-xl font-bold">Editar Estudiante</h3>
                <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
                    <X size={20} className="text-muted-foreground" />
                </Button>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    Datos del Alumno
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Completo</label>
                        <input type="text" name="name" defaultValue={student.name} required className="w-full px-4 py-2 rounded-lg border border-input transition-all bg-background text-foreground text-sm flex items-center font-medium focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Juan Perez" />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo (Opcional)</label>
                        <input type="email" name="email" defaultValue={student.email || ""} className="w-full px-4 py-2 rounded-lg border border-input transition-all bg-background text-foreground text-sm flex items-center font-medium focus:ring-2 focus:ring-primary/20 outline-none" placeholder="alumno@mail.com" />
                    </div>
                    <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Celular (Opcional)</label>
                        <input type="tel" name="phone" defaultValue={student.phone || ""} className="w-full px-4 py-2 rounded-lg border border-input transition-all bg-background text-foreground text-sm flex items-center font-medium focus:ring-2 focus:ring-primary/20 outline-none" placeholder="+54 9 11..." />
                    </div>
                </div>
            </div>

            <div className="space-y-4 border-t border-border/40 pt-4">
                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    Tutor Legal Principal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre / Apellido</label>
                        <input type="text" name="guardian1Name" defaultValue={student.guardian1Name || ""} className="w-full px-4 py-2.5 rounded-xl border border-input/60 outline-none bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parentesco</label>
                        <input type="text" name="guardian1Relation" defaultValue={student.guardian1Relation || ""} placeholder="Eg: Madre" className="w-full px-4 py-2.5 rounded-xl border border-input/60 outline-none bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Celular Confirmado</label>
                        <input type="tel" name="guardian1Phone" defaultValue={student.guardian1Phone || ""} className="w-full px-4 py-2.5 rounded-xl border border-input/60 outline-none bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 border-t border-border/40 pt-4">
                <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    Segundo Tutor (Opcional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre / Apellido</label>
                        <input type="text" name="guardian2Name" defaultValue={student.guardian2Name || ""} className="w-full px-4 py-2.5 rounded-xl border border-input/60 outline-none bg-background text-sm focus:ring-2 focus:ring-primary/20 transition-all opacity-80 focus:opacity-100" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parentesco</label>
                        <input type="text" name="guardian2Relation" defaultValue={student.guardian2Relation || ""} placeholder="Eg: Padre" className="w-full px-4 py-2.5 rounded-xl border border-input/60 outline-none bg-background text-sm focus:ring-2 focus:ring-primary/20 transition-all opacity-80 focus:opacity-100" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Celular</label>
                        <input type="tel" name="guardian2Phone" defaultValue={student.guardian2Phone || ""} className="w-full px-4 py-2.5 rounded-xl border border-input/60 outline-none bg-background text-sm focus:ring-2 focus:ring-primary/20 transition-all opacity-80 focus:opacity-100" />
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
                    Cancelar Operación
                </Button>
                <Button type="submit" disabled={isPending} className="premium-gradient font-bold px-6">
                    {isPending ? "Guardando..." : <><Save size={16} className="mr-2" /> Guardar Cambios</>}
                </Button>
            </div>
        </form>
    );
}
