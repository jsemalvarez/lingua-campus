"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadPaymentReceipt } from "@/lib/pdf/paymentReceipt";
import { cn } from "@/lib/utils";

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
            const error = await downloadPaymentReceipt(paymentId);
            if (error) alert(error);
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
