"use client";

import { useTransition, useState } from "react";
import { createExpenseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { EntitySearch } from "./EntitySearch";

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
    const [selectedEmployee, setSelectedEmployee] = useState<UserInfo | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        // El campo category es fijo para sueldos (debe coincidir con la detección en createExpenseAction)
        formData.append("category", "Payroll");

        startTransition(async () => {
            const result = await createExpenseAction(formData);
            if (result.success) {
                setStatus("success");
                setSelectedEmployee(null);
                const formEl = document.getElementById("salary-form") as HTMLFormElement;
                if (formEl) formEl.reset();
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
        <form id="salary-form" action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <EntitySearch
                    entities={employees}
                    selectedEntity={selectedEmployee}
                    onSelect={(e) => setSelectedEmployee(e as UserInfo | null)}
                    placeholder="Seleccionar empleado..."
                    label="Empleado / Profesor"
                    name="recipientId"
                    colorTheme="rose"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Concepto / Descripción</label>
                <input
                    type="text"
                    name="description"
                    required
                    placeholder="Ej: Sueldo Marzo 2024"
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
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
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Fecha de Pago</label>
                    <input
                        type="date"
                        name="date"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
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

            <Button type="submit" className="w-full font-bold mt-2 bg-rose-600 hover:bg-rose-700 text-white" disabled={isPending}>
                {isPending ? "Procesando..." : "Registrar Pago de Sueldo (-)"}
            </Button>
        </form>
    );
}
