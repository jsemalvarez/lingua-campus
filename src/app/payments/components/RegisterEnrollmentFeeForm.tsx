"use client";

import { useTransition, useState } from "react";
import { generateStandaloneEnrollmentFeeAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { EntitySearch } from "./EntitySearch";

interface StudentInfo {
    id: string;
    name: string;
}

interface RegisterEnrollmentFeeFormProps {
    students: StudentInfo[];
}

export function RegisterEnrollmentFeeForm({ students }: RegisterEnrollmentFeeFormProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        if (!selectedStudent) {
            setStatus("error");
            setErrorMsg("Debes seleccionar un alumno");
            return;
        }

        startTransition(async () => {
            const result = await generateStandaloneEnrollmentFeeAction(formData);
            if (result.success) {
                setStatus("success");
                setSelectedStudent(null);
                const formEl = document.getElementById("enrollment-fee-form") as HTMLFormElement;
                if (formEl) formEl.reset();
                setTimeout(() => {
                    setStatus("idle");
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo generar la matrícula");
            }
        });
    };

    return (
        <form id="enrollment-fee-form" action={handleSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50 mb-2">
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed italic">
                    Utiliza este formulario para cobrar matrículas de forma anticipada (ej: inscripciones para el próximo año) sin necesidad de que el curso esté creado.
                </p>
            </div>

            <div className="space-y-1.5">
                <EntitySearch 
                    entities={students}
                    selectedEntity={selectedStudent}
                    onSelect={(s) => setSelectedStudent(s as StudentInfo | null)}
                    placeholder="Buscar alumno..."
                    label="Alumno"
                    name="studentId"
                    colorTheme="emerald"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Año Académico</label>
                    <select
                        name="year"
                        required
                        defaultValue={currentYear}
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value={currentYear}>{currentYear} (Actual)</option>
                        <option value={nextYear}>{nextYear} (Próximo)</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Monto Total ($)</label>
                    <input
                        type="number"
                        name="amount"
                        min="1"
                        step="0.01"
                        required
                        placeholder="Ej: 45000"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Matrícula generada. Ya puede ser cobrada en la pestaña de "Cuotas".
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
                {isPending ? "Generando..." : "Generar Deuda de Matrícula (+)"}
            </Button>
        </form>
    );
}
