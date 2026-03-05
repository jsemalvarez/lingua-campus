"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, UserSearch } from "lucide-react";

interface Teacher {
    id: string;
    name: string;
    email: string;
}

interface CourseFormProps {
    teachers: Teacher[];
}

export function CourseForm({ teachers }: CourseFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [statusFeedback, setStatusFeedback] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setStatusFeedback("idle");

        startTransition(async () => {
            const result = await createCourseAction(formData);
            if (result.success) {
                setStatusFeedback("success");
                setTimeout(() => {
                    router.push("/courses");
                }, 1000); // 1s de grato feedback verde
            } else {
                setStatusFeedback("error");
                setErrorMsg(result.error ?? "No se pudo crear el curso.");
            }
        });
    };

    return (
        <form action={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold">Datos del Grupo / Clase</h2>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Nombre del Curso <span className="text-red-500">*</span></label>
                    <input
                        name="name"
                        placeholder="Ej: First Certificate Adultos Intensive"
                        className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring bg-background text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold">Nivel</label>
                        <select
                            name="level"
                            className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring bg-background text-sm font-medium outline-none transition-all appearance-none"
                            defaultValue=""
                        >
                            <option value="" disabled>Seleccionar nivel</option>
                            <option value="A1 (Principiante)">A1 (Principiante)</option>
                            <option value="A2 (Básico)">A2 (Básico)</option>
                            <option value="B1 (Intermedio)">B1 (Intermedio)</option>
                            <option value="B2 (Intermedio Alto)">B2 (Intermedio Alto)</option>
                            <option value="C1 (Avanzado)">C1 (Avanzado)</option>
                            <option value="C2 (Maestría)">C2 (Maestría)</option>
                            <option value="Kids / Especial">Kids / Especial</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold flex items-center justify-between">
                            Profesor Asignado
                            <UserSearch size={14} className="text-muted-foreground" />
                        </label>
                        <select
                            name="teacherId"
                            className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring bg-background text-sm font-medium outline-none transition-all appearance-none"
                            defaultValue=""
                        >
                            <option value="">Aún sin definir</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name} — {t.email}</option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1 text-right">Puedes asignarlo después</p>
                    </div>
                </div>
            </div>

            {/* Feedback Mensajes */}
            {statusFeedback === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-top-2">
                    <CheckCircle size={18} />
                    ¡Curso creado con éxito! Volviendo...
                </div>
            )}
            {statusFeedback === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    {errorMsg}
                </div>
            )}

            <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" className="premium-gradient shadow-md shadow-primary/20 px-6 h-11" disabled={isPending}>
                    {isPending ? "Registrando..." : "Crear Curso"}
                </Button>
            </div>
        </form>
    );
}
