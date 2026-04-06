"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { createPaymentAction, getStudentPendingFeesAction } from "../actions";
import { generateMonthlyFeesAction } from "../billingActions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { EntitySearch } from "./EntitySearch";

interface StudentListOption {
    id: string;
    name: string;
}

export function RegisterFeeForm({ students }: { students: StudentListOption[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [selectedStudent, setSelectedStudent] = useState<StudentListOption | null>(null);
    const [pendingFees, setPendingFees] = useState<any[]>([]);
    const [selectedFeeId, setSelectedFeeId] = useState("");
    const [isLoadingFees, setIsLoadingFees] = useState(false);

    // Form states for dynamic calculation
    const [baseAmount, setBaseAmount] = useState<number>(0);
    const [surcharge, setSurcharge] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    
    // Auto-select fee and populate base amount
    useEffect(() => {
        if (selectedFeeId && pendingFees.length > 0) {
            const fee = pendingFees.find(f => f.id === selectedFeeId);
            if (fee) {
                setBaseAmount(fee.originalAmount - fee.paidAmount);
            }
        }
    }, [selectedFeeId, pendingFees]);

    useEffect(() => {
        if (selectedStudent) {
            loadFees(selectedStudent.id);
        } else {
            setPendingFees([]);
            setSelectedFeeId("");
        }
    }, [selectedStudent]);

    async function loadFees(studentId: string) {
        setIsLoadingFees(true);
        const res = await getStudentPendingFeesAction(studentId);
        if (res.success) {
            setPendingFees(res.fees || []);
            if (res.fees?.[0]) {
                setSelectedFeeId(res.fees[0].id);
            }
        }
        setIsLoadingFees(false);
    }


    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        if (!selectedStudent || !selectedFeeId) {
            setStatus("error");
            setErrorMsg("Debes seleccionar un estudiante y una cuota pendiente");
            return;
        }

        if (totalToCollect < 0) {
            setStatus("error");
            setErrorMsg("El monto total a cobrar no puede ser negativo");
            return;
        }

        formData.append("feeId", selectedFeeId);
        // We overwrite 'amount' to be the exact cash collected (Total a Cobrar)
        formData.set("amount", totalToCollect.toString());
        formData.set("surcharge", surcharge.toString());
        formData.set("discount", discount.toString());

        startTransition(async () => {
            const result = await createPaymentAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    setStatus("idle");
                    setSelectedStudent(null);
                    setBaseAmount(0);
                    setSurcharge(0);
                    setDiscount(0);
                    const formEl = document.getElementById("fee-form") as HTMLFormElement;
                    if (formEl) formEl.reset();
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo registrar el pago");
            }
        });
    };

    const totalToCollect = Math.max(0, baseAmount + surcharge - discount);

    return (
        <form id="fee-form" action={handleSubmit} className="space-y-4">

            {/* Buscador de Estudiantes Autocompletable */}
            <EntitySearch
                entities={students}
                selectedEntity={selectedStudent}
                onSelect={(s) => setSelectedStudent(s)}
                name="studentId"
                colorTheme="emerald"
                placeholder="🔍 Buscar un estudiante..."
                label="Estudiante"
            />

            {selectedStudent && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold">Cuota Pendiente</label>
                        {isLoadingFees ? (
                            <div className="h-10 w-full animate-pulse bg-muted rounded-lg" />
                        ) : pendingFees.length === 0 ? (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg text-xs font-medium border border-amber-200/50">
                                Este alumno no tiene cuotas pendientes registradas.
                            </div>
                        ) : (
                            <select
                                value={selectedFeeId}
                                onChange={(e) => setSelectedFeeId(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20"
                            >
                                {pendingFees.map(f => {
                                    let label = "";
                                    if (f.type === "ENROLLMENT") {
                                        label = `Matrícula ${f.year}`;
                                    } else if (f.type === "EXAM") {
                                        label = `Derecho de Examen ${f.year}`;
                                    } else {
                                        label = `Cuota ${f.month}/${f.year} - ${f.enrollment?.course?.name || "Sin curso"}`;
                                    }
                                    
                                    return (
                                        <option key={f.id} value={f.id}>
                                            {label} (${(f.originalAmount - f.paidAmount).toLocaleString()} pendientes)
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Monto a cancelar de la deuda ($)</label>
                    <input 
                        type="number" 
                        min="1" 
                        step="0.01" 
                        required 
                        value={baseAmount || ""}
                        onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20" 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-red-600 dark:text-red-400">Recargo (+)</label>
                        <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={surcharge || ""}
                            onChange={(e) => setSurcharge(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/20 text-sm outline-none shadow-sm focus:ring-2 focus:ring-red-500/20" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Descuento (-)</label>
                        <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={discount || ""}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20" 
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl flex items-center justify-between">
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">Dinero total a cobrar al alumno:</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${totalToCollect.toLocaleString()}
                </span>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Método de Pago</label>
                <select name="method" className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20">
                    <option value="EFECTIVO">Efectivo 💵</option>
                    <option value="TRANSFERENCIA">Transferencia 🏦</option>
                    <option value="TARJETA">Tarjeta 💳</option>
                    <option value="MERCADOPAGO">MercadoPago 📱</option>
                    <option value="OTROS">Otros 💠</option>
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold">Notas / Concepto</label>
                <input name="notes" placeholder="Ej: Pago parcial, adelantado, etc." className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Pago registrado exitosamente
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <Button type="submit" className="w-full font-bold mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending}>
                {isPending ? "Grabando..." : "Confirmar Ingreso (+)"}
            </Button>
        </form>
    );
}
