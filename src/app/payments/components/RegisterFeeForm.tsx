"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { createPaymentAction, getStudentPendingFeesAction, applyCreditToFeeAction } from "../actions";
import { generateMonthlyFeesAction } from "../billingActions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { EntitySearch } from "./EntitySearch";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { feeAfterPayment } from "@/lib/feePayment";

interface StudentListOption {
    id: string;
    name: string;
}

interface PendingFeeOption {
    type: string;
    year: number;
    month: number;
    enrollment?: { course?: { name?: string | null } | null } | null;
}

/**
 * Cómo se nombra una cuota en esta pantalla. La matrícula lleva el curso al lado
 * porque es por curso: un alumno con dos cursos tiene dos matrículas del mismo
 * año y sin eso son indistinguibles al cobrar.
 */
function feeLabel(f: PendingFeeOption): string {
    if (f.type === "ENROLLMENT") {
        return `Matrícula ${f.year}${f.enrollment?.course?.name ? ` - ${f.enrollment.course.name}` : ""}`;
    }
    if (f.type === "EXAM") return `Derecho de Examen ${f.year}`;
    return `Cuota ${getMonthName(f.month)} ${f.year} - ${f.enrollment?.course?.name || "Sin curso"}`;
}

const NOTHING_TO_COLLECT = "Con ese descuento no queda nada que cobrar.";

/**
 * En qué estado queda la cuota. Antes la pantalla decía "Se cancela parte de la
 * deuda" tanto si la saldaba como si la dejaba debiendo, y así pasó el cobro del
 * 03/08 que dejó julio a medio pagar sin que nadie lo notara. Ver FIN-32.
 */
function feeStateText(remaining: number, surplus: number): string {
    if (surplus > 0) return `La cuota queda saldada, y $${formatCurrency(surplus)} van al saldo a favor del alumno.`;
    if (remaining > 0) return `Quedan $${formatCurrency(remaining)} pendientes de la cuota.`;
    return "La cuota queda saldada.";
}

export function RegisterFeeForm({ students }: { students: StudentListOption[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error" | "credit">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [creditMsg, setCreditMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [selectedStudent, setSelectedStudent] = useState<StudentListOption | null>(null);
    const [pendingFees, setPendingFees] = useState<any[]>([]);
    const [selectedFeeId, setSelectedFeeId] = useState("");
    const [isLoadingFees, setIsLoadingFees] = useState(false);
    const [studentCredit, setStudentCredit] = useState(0);
    const [isApplyingCredit, setIsApplyingCredit] = useState(false);

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
            // El aviso de saldo aplicado es del alumno anterior: al elegir otro se va.
            if (status === "credit") {
                setStatus("idle");
                setCreditMsg("");
            }
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
            setStudentCredit(res.creditBalance || 0);
            if (res.fees?.[0]) {
                setSelectedFeeId(res.fees[0].id);
            }
        }
        setIsLoadingFees(false);
    }

    const handleApplyCredit = async () => {
        if (!selectedFeeId || studentCredit <= 0) return;

        setIsApplyingCredit(true);
        const fee = pendingFees.find(f => f.id === selectedFeeId);
        const debt = fee.originalAmount - fee.paidAmount;
        const toApply = Math.min(studentCredit, debt);

        const res = await applyCreditToFeeAction(selectedFeeId, toApply);
        if (res.success) {
            // Antes esto mostraba "Pago registrado exitosamente" —el cartel del cobro
            // normal, que acá dice algo que no pasó— y después recargaba las cuotas,
            // con lo cual el formulario quedaba auto-seleccionado en la cuota
            // siguiente y con el importe cargado, bajo un botón que dice "Confirmar
            // Ingreso (+)". Un clic de más asentaba un cobro en efectivo que nunca
            // ocurrió. Ahora dice qué se hizo y suelta al alumno: el formulario
            // queda vacío, no armado sobre otra cuota. Ver FIN-27.
            setStatus("credit");
            setCreditMsg(`Saldo aplicado: $${formatCurrency(toApply)} a ${feeLabel(fee)}.`);
            setSelectedStudent(null);
            setBaseAmount(0);
            setSurcharge(0);
            setDiscount(0);
        } else {
            setStatus("error");
            setErrorMsg(res.error || "Error al aplicar saldo");
        }
        setIsApplyingCredit(false);
    };


    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        if (!selectedStudent || !selectedFeeId) {
            setStatus("error");
            setErrorMsg("Debes seleccionar un estudiante y una cuota pendiente");
            return;
        }

        // Antes se chequeaba `totalToCollect < 0`, que no se cumplía nunca: el total
        // sale de un `Math.max(0, ...)`. Un descuento que se comía todo terminaba en
        // el "Datos del pago inválidos" del servidor. Ver FIN-32.
        if (rawTotal <= 0) {
            setStatus("error");
            setErrorMsg(NOTHING_TO_COLLECT);
            return;
        }

        const label = feeLabel(selectedFee);
        formData.append("feeId", selectedFeeId);
        // We overwrite 'amount' to be the exact cash collected (Total a Cobrar)
        formData.set("amount", totalToCollect.toString());
        formData.set("surcharge", surcharge.toString());
        formData.set("discount", discount.toString());

        startTransition(async () => {
            const result = await createPaymentAction(formData);
            if (result.success) {
                setSuccessMsg(`Pago registrado: ${label}. ${feeStateText(result.remaining ?? 0, result.surplus ?? 0)}`);
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

    const selectedFee = pendingFees.find(f => f.id === selectedFeeId);
    const rawTotal = baseAmount + surcharge - discount;
    const totalToCollect = Math.max(0, rawTotal);
    // Cómo queda la cuota si se confirma. La misma cuenta que hace el servidor al
    // grabar: lo que se anuncia acá es lo que pasa.
    const outcome = selectedFee && rawTotal > 0
        ? feeAfterPayment(selectedFee, { amount: totalToCollect, discount, surcharge })
        : null;

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
                                {pendingFees.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {feeLabel(f)} (${(f.originalAmount - f.paidAmount).toLocaleString()} pendientes)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Credit Balance Alert Section */}
                    {studentCredit > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                    <Wallet size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70">Saldo a Favor</p>
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">${studentCredit.toLocaleString()}</p>
                                </div>
                            </div>
                            <Button 
                                type="button"
                                size="sm" 
                                onClick={handleApplyCredit}
                                disabled={isApplyingCredit || !selectedFeeId}
                                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3"
                            >
                                {isApplyingCredit ? "Aplicando..." : "Usar Saldo"}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Importe de la cuota que se paga ($)</label>
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

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">Total a cobrar</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ${formatCurrency(totalToCollect)}
                    </span>
                </div>
                {selectedFee && baseAmount > 0 && (
                    <div className="pt-2 border-t border-emerald-200/30">
                        {!outcome ? (
                            <p className="text-sm text-red-600 dark:text-red-400 font-semibold flex items-start gap-1.5">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {NOTHING_TO_COLLECT}
                            </p>
                        ) : outcome.settled && outcome.surplus === 0 ? (
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold flex items-start gap-1.5">
                                <CheckCircle size={16} className="mt-0.5 shrink-0" /> {feeStateText(outcome.remaining, outcome.surplus)}
                            </p>
                        ) : (
                            <p className="text-sm text-amber-700 dark:text-amber-400 font-semibold flex items-start gap-1.5">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {feeStateText(outcome.remaining, outcome.surplus)}
                            </p>
                        )}
                    </div>
                )}
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
                    <CheckCircle size={16} className="shrink-0" /> {successMsg}
                </div>
            )}

            {status === "credit" && (
                <div className="flex items-start gap-2 p-3 mt-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-sm font-medium animate-in">
                    <Wallet size={16} className="mt-0.5 shrink-0" />
                    <div>
                        <p>{creditMsg}</p>
                        <p className="text-[11px] font-normal opacity-80 mt-1">
                            No ingresó dinero a la caja: ese saldo ya se había cobrado. Se puede anular
                            desde la ficha del alumno o desde Movimientos Recientes.
                        </p>
                    </div>
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
