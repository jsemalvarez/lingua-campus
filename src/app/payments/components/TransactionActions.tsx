"use client";

import { useState, useTransition } from "react";
import { XCircle, AlertTriangle } from "lucide-react";
import { voidExpenseAction, voidPaymentAction, voidIncomeAction, getReceiptDataAction } from "../actions";
import { Download, Loader2 } from "lucide-react";
import { generatePaymentReceipt } from "@/lib/pdf/generateReceipt";
import { formatFeeLabel } from "@/lib/utils";

interface TransactionActionsProps {
    tx: {
        id: string; // The originalId, which is paymentId, expenseId, etc
        description: string;
        amount: number;
        source: "PAYMENT" | "EXPENSE" | "MISC_INCOME" | "PAYROLL" | "REFUND" | "ADJUSTMENT" | string;
    };
}

export function TransactionActions({ tx }: TransactionActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [isDownloading, setIsDownloading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [reason, setReason] = useState("");

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const result = await getReceiptDataAction(tx.id);
            if (result.success && result.payment && result.institute) {
                const { payment, institute } = result;
                
                // Prepare concepts
                const concepts = [
                    {
                        description: formatFeeLabel(payment.feeType as any, payment.feeMonth, payment.feeYear),
                        amount: payment.amount
                    }
                ];

                if (payment.surcharge > 0) {
                    concepts.push({ description: 'RECARGO / INTERÉS', amount: payment.surcharge });
                }
                if (payment.discount > 0) {
                    concepts.push({ description: 'DESCUENTO APLICADO', amount: -payment.discount });
                }

                await generatePaymentReceipt({
                    receiptNumber: payment.id.slice(0, 8).toUpperCase(),
                    date: payment.date,
                    studentName: payment.studentName,
                    studentAddress: payment.studentAddress,
                    concepts,
                    total: payment.amount, // El 'amount' ya es el neto cobrado en este modelo
                    institute: institute as any
                });
            } else {
                alert(result.error || "Error al generar el recibo");
            }
        } catch (error) {
            console.error(error);
            alert("Error al descargar el comprobante");
        } finally {
            setIsDownloading(false);
        }
    };

    // Filter out actions for adjustments or refunds themselves
    if (tx.source === "REFUND" || tx.source === "ADJUSTMENT") {
        return null;
    }

    const handleVoid = () => {
        startTransition(async () => {
            let result;
            if (tx.source === "PAYMENT") {
                    result = await voidPaymentAction(tx.id, reason.trim() || undefined);
            } else if (tx.source === "EXPENSE" || tx.source === "PAYROLL") {
                result = await voidExpenseAction(tx.id, reason.trim() || undefined);
            } else if (tx.source === "MISC_INCOME") {
                result = await voidIncomeAction(tx.id, reason.trim() || undefined);
            } else {
                return;
            }

            if (result.success) {
                setShowDeleteConfirm(false);
                setReason("");
            } else {
                alert(result.error || "No se pudo anular el registro");
            }
        });
    };

    return (
        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {tx.source === "PAYMENT" && (
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    title="Descargar Comprobante"
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
                >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </button>
            )}
            <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Anular"
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-rose-600"
            >
                <XCircle size={16} />
            </button>

            {/* Modal de Confirmación de Anulación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 whitespace-normal">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-left">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">¿Confirmar anulación?</h3>
                            <p className="text-muted-foreground text-sm">
                                Estás a punto de anular: <br/>
                                <span className="font-semibold text-foreground">"{tx.description}"</span> por <span className="font-semibold text-foreground">${tx.amount.toLocaleString()}</span>.
                                <br/><br/>
                                Esto generará un asiento contable de ajuste para revertir el balance. No se eliminará del historial.
                            </p>
                            <textarea
                                className="w-full mt-4 p-3 rounded-lg border border-input bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                                rows={2}
                                placeholder="Motivo de la anulación (opcional)..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                        <div className="flex border-t border-border/50">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-4 text-sm font-medium hover:bg-muted transition-colors border-r border-border/50"
                                disabled={isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleVoid}
                                className="flex-1 py-4 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                disabled={isPending}
                            >
                                {isPending ? "Procesando..." : "Sí, Anular"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
