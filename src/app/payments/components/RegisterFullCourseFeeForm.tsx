"use client";

import { useTransition, useState, useEffect } from "react";
import { registerFullCoursePaymentAction, getStudentActiveEnrollmentsAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Info, Sparkles } from "lucide-react";
import { EntitySearch } from "./EntitySearch";

interface StudentListOption {
    id: string;
    name: string;
}

export function RegisterFullCourseFeeForm({ students }: { students: StudentListOption[] }) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [selectedStudent, setSelectedStudent] = useState<StudentListOption | null>(null);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
    const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

    const [amount, setAmount] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);

    useEffect(() => {
        if (selectedStudent) {
            loadEnrollments(selectedStudent.id);
        } else {
            setEnrollments([]);
            setSelectedEnrollmentId("");
            setAmount(0);
        }
    }, [selectedStudent]);

    useEffect(() => {
        if (selectedEnrollmentId && enrollments.length > 0) {
            const enr = enrollments.find(e => e.id === selectedEnrollmentId);
            if (enr) {
                // Sugerir 4 meses por defecto si no tiene custom price
                const defaultTotal = enr.customFullCoursePrice ?? (enr.course.monthlyPrice * 4);
                setAmount(defaultTotal);
            }
        }
    }, [selectedEnrollmentId, enrollments]);

    async function loadEnrollments(studentId: string) {
        setIsLoadingEnrollments(true);
        const res = await getStudentActiveEnrollmentsAction(studentId);
        if (res.success) {
            setEnrollments(res.enrollments || []);
            if (res.enrollments?.[0]) {
                setSelectedEnrollmentId(res.enrollments[0].id);
            }
        }
        setIsLoadingEnrollments(false);
    }

    const netToCollect = Math.max(0, amount - discount);

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        if (!selectedStudent || !selectedEnrollmentId) {
            setStatus("error");
            setErrorMsg("Debes seleccionar un estudiante y una inscripción activa.");
            return;
        }

        formData.set("studentId", selectedStudent.id);
        formData.set("enrollmentId", selectedEnrollmentId);
        formData.set("amount", amount.toString());
        formData.set("discount", discount.toString());

        startTransition(async () => {
            const result = await registerFullCoursePaymentAction(formData);
            if (result.success) {
                setStatus("success");
                setSelectedStudent(null);
                setEnrollments([]);
                setSelectedEnrollmentId("");
                setAmount(0);
                setDiscount(0);
                const formEl = document.getElementById("full-course-fee-form") as HTMLFormElement;
                if (formEl) formEl.reset();
                setTimeout(() => setStatus("idle"), 2500);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo registrar el pago único.");
            }
        });
    };

    return (
        <form id="full-course-fee-form" action={handleSubmit} className="space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-3">
                <Sparkles className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    Registra el <strong>Pago Único (Curso Completo)</strong> de un alumno. Congelará la tarifa del curso, saldará la deuda total e impedirá que el sistema genere cuotas en los meses siguientes.
                    <br /><br />
                    Sólo se puede usar si el alumno <strong>todavía no pagó ninguna cuota</strong> de esa inscripción.
                </p>
            </div>

            <EntitySearch
                entities={students}
                selectedEntity={selectedStudent}
                onSelect={(s) => setSelectedStudent(s)}
                placeholder="Seleccionar alumno..."
                label="Alumno Beneficiario"
                name="studentId"
                colorTheme="emerald"
            />

            {selectedStudent && (
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Curso Activo</label>
                    {isLoadingEnrollments ? (
                        <div className="text-xs text-muted-foreground italic py-2">Cargando cursos del alumno...</div>
                    ) : enrollments.length === 0 ? (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs">
                            Este alumno no posee inscripciones activas actualmente.
                        </div>
                    ) : (
                        <select
                            value={selectedEnrollmentId}
                            onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            {enrollments.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.course.name} ({e.billingMode === "FULL_COURSE" ? "Ya es Pago Único" : "Cuotas Mensuales"})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Valor Total del Curso ($)</label>
                    <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={amount || ""}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Descuento Pago Contado ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount || ""}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-sm">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Total Neto a Ingresar a Caja:</span>
                <span className="font-extrabold text-lg text-emerald-600">${netToCollect.toLocaleString()}</span>
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
                        <option value="MERCADOPAGO">MercadoPago 📱</option>
                        <option value="OTRO">Otro 💠</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Notas / Concepto</label>
                    <input
                        type="text"
                        name="notes"
                        placeholder="Ej: Pago total del curso contado"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>
            </div>

            {status === "success" && (
                <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle size={16} /> ¡Pago Único registrado exitosamente!
                </div>
            )}

            {status === "error" && (
                <div className="p-3 rounded-lg bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-md shadow-emerald-600/20"
                disabled={isPending || !selectedStudent || enrollments.length === 0}
            >
                {isPending ? "Registrando..." : "Confirmar Ingreso de Pago Único (+)"}
            </Button>
        </form>
    );
}
