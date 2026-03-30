"use client";

import { useTransition, useState } from "react";
import { createIncomeAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { EntitySearch } from "./EntitySearch";

interface StudentInfo {
    id: string;
    name: string;
}

interface RegisterIncomeFormProps {
    students: StudentInfo[];
}

export function RegisterIncomeForm({ students }: RegisterIncomeFormProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        startTransition(async () => {
            const result = await createIncomeAction(formData);
            if (result.success) {
                setStatus("success");
                setSelectedStudent(null);
                const formEl = document.getElementById("income-form") as HTMLFormElement;
                if (formEl) formEl.reset();
                setTimeout(() => {
                    setStatus("idle");
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo registrar el ingreso");
            }
        });
    };

    return (
        <form id="income-form" action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Descripción / Concepto</label>
                <input
                    type="text"
                    name="description"
                    required
                    placeholder="Ej: Venta Libro Level 1, Inscripción Taller..."
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Categoría</label>
                    <select
                        name="category"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="VENTA_LIBROS">Venta de Libros</option>
                        <option value="EXCURSION">Excursión / Salida</option>
                        <option value="TALLER">Taller / Seminario</option>
                        <option value="DERECHO_EXAMEN">Derecho de Examen</option>
                        <option value="OTROS">Otros Ingresos</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Método de Pago</label>
                    <select
                        name="method"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="EFECTIVO">Efectivo 💵</option>
                        <option value="TRANSFERENCIA">Transferencia 🏦</option>
                        <option value="TARJETA">Tarjeta 💳</option>
                        <option value="OTRO">Otro 💠</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <EntitySearch 
                        entities={students}
                        selectedEntity={selectedStudent}
                        onSelect={(s) => setSelectedStudent(s)}
                        placeholder="Vincular a alumno (opcional)..."
                        label="Alumno (Opcional)"
                        name="studentId"
                        colorTheme="emerald"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Fecha (Opcional)</label>
                    <input
                        type="date"
                        name="date"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Nº de Ticket (Opcional)</label>
                    <input
                        type="text"
                        name="ticketNumber"
                        placeholder="Ej: REC-00123"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Ingreso registrado correctamente
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <Button
                type="submit"
                className="w-full font-bold mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isPending}
            >
                {isPending ? "Procesando..." : "Registrar Ingreso (+)"}
            </Button>
        </form>
    );
}
