"use client";

import { useTransition, useState } from "react";
import { createExpenseAction } from "../actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle } from "lucide-react";

export function RegisterExpenseForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        startTransition(async () => {
            const result = await createExpenseAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    setStatus("idle");
                    // Limpieza opcional del form
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo registrar el gasto");
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border/50 pb-2 mb-4 text-rose-600 dark:text-rose-400">Registrar Nuevo Gasto</h3>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Descripción</label>
                <input type="text" name="description" required placeholder="Ej: Sueldos Profesores Marzo, Alquiler..." className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Monto ($)</label>
                    <input type="number" name="amount" min="1" step="0.01" required placeholder="Ej: 50000" className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Categoría</label>
                    <select name="category" required className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none">
                        <option value="NOMINA">Nómina / Sueldos</option>
                        <option value="ALQUILER">Alquiler / Expensas</option>
                        <option value="SERVICIOS">Servicios (Luz, Internet)</option>
                        <option value="MANTENIMIENTO">Mantenimiento / Limpieza</option>
                        <option value="MATERIALES">Material Didáctico</option>
                        <option value="PUBLICIDAD">Publicidad / Marketing</option>
                        <option value="OTROS">Otros</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Fecha (Opcional, sino toma la actual)</label>
                <input type="date" name="date" className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none" />
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Gasto asentado exitosamente
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <Button type="submit" className="w-full font-bold mt-2 bg-rose-600 hover:bg-rose-700 text-white" disabled={isPending}>
                {isPending ? "Grabando..." : "Asentar Gasto Operativo (-)"}
            </Button>
        </form>
    );
}
