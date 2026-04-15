"use client";

import { useTransition, useState } from "react";
import { registerAdvanceAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { EntitySearch } from "./EntitySearch";

interface StudentInfo {
    id: string;
    name: string;
}

interface RegisterAdvanceFormProps {
    students: StudentInfo[];
}

export function RegisterAdvanceForm({ students }: RegisterAdvanceFormProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        if (!selectedStudent) {
            setStatus("error");
            setErrorMsg("Debes seleccionar un estudiante");
            return;
        }

        formData.set("studentId", selectedStudent.id);

        startTransition(async () => {
            const result = await registerAdvanceAction(formData);
            if (result.success) {
                setStatus("success");
                setSelectedStudent(null);
                const formEl = document.getElementById("advance-form") as HTMLFormElement;
                if (formEl) formEl.reset();
                setTimeout(() => {
                    setStatus("idle");
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo registrar el adelanto");
            }
        });
    };

    return (
        <form id="advance-form" action={handleSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
                <Info className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Usa este formulario para registrar dinero que entra a la caja pero que aún no se aplicará a una cuota específica. 
                    El monto se acreditará como <strong>Saldo a Favor</strong> del alumno.
                </p>
            </div>

            <div className="space-y-1.5">
                <EntitySearch 
                    entities={students}
                    selectedEntity={selectedStudent}
                    onSelect={(s) => setSelectedStudent(s)}
                    placeholder="Seleccionar alumno..."
                    label="Alumno Beneficiario"
                    name="studentId"
                    colorTheme="emerald"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Monto del Adelanto ($)</label>
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
                    <label className="text-sm font-semibold">Método de Pago</label>
                    <select
                        name="method"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="EFECTIVE">Efectivo 💵</option>
                        <option value="TRANSFERENCIA">Transferencia 🏦</option>
                        <option value="TARJETA">Tarjeta 💳</option>
                        <option value="MERCADOPAGO">MercadoPago 📱</option>
                        <option value="OTRO">Otro 💠</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Notas / Comentarios</label>
                <input
                    type="text"
                    name="notes"
                    placeholder="Ej: Pago adelantado de 2 meses, seña..."
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Adelanto registrado y saldo acreditado
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
                {isPending ? "Registrando..." : "Registrar Adelanto (+)"}
            </Button>
        </form>
    );
}
