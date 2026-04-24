"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { getReceiptDataAction } from "@/app/payments/actions";
import { generatePaymentReceipt } from "@/lib/pdf/generateReceipt";
import { formatFeeLabel, cn } from "@/lib/utils";

interface ReceiptDownloadButtonProps {
    paymentId: string;
    variant?: "icon" | "full" | "ghost";
    className?: string;
}

export function ReceiptDownloadButton({ 
    paymentId, 
    variant = "icon",
    className
}: ReceiptDownloadButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const result = await getReceiptDataAction(paymentId);
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
                    total: payment.amount,
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

    if (variant === "full") {
        return (
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={cn(
                    "flex items-center gap-2 text-xs font-bold text-primary hover:underline disabled:opacity-50",
                    className
                )}
            >
                {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Descargar Recibo
            </button>
        );
    }

    if (variant === "ghost") {
        return (
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={cn(
                    "flex items-center gap-2 disabled:opacity-50 transition-all",
                    className
                )}
            >
                {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Recibo
            </button>
        );
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            title="Descargar Comprobante"
            className={cn(
                "p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary disabled:opacity-50",
                className
            )}
        >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        </button>
    );
}
