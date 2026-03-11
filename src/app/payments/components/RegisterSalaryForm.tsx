"use client";

import { useTransition, useState } from "react";
import { createExpenseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, UserCircle } from "lucide-react";

interface UserInfo {
    id: string;
    name: string;
    role: string;
}

interface RegisterSalaryFormProps {
    employees: UserInfo[];
}

export function RegisterSalaryForm({ employees }: RegisterSalaryFormProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        // El campo category es fijo para sueldos
        formData.append("category", "NOMINA");

        startTransition(async () => {
            const result = await createExpenseAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    setStatus("idle");
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo registrar el pago de sueldo");
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border/50 pb-2 mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <UserCircle size={20} /> Registrar Pago de Sueldo
            </h3>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Empleado / Profesor</label>
                <select name="recipientId" required className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none">
                    <option value="">Seleccionar empleado...</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role === "TEACHER" ? "Profesor" : "Admin"})
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Concepto / Descripción</label>
                <input
                    type="text"
                    name="description"
                    required
                    placeholder="Ej: Sueldo Marzo 2024"
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Monto ($)</label>
                    <input
                        type="number"
                        name="amount"
                        min="1"
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Fecha de Pago</label>
                    <input
                        type="date"
                        name="date"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none"
                    />
                </div>
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Pago de sueldo registrado correctamente
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <Button type="submit" className="w-full font-bold mt-2 bg-amber-600 hover:bg-amber-700 text-white" disabled={isPending}>
                {isPending ? "Procesando..." : "Registrar Pago (-)"}
            </Button>
        </form>
    );
}
