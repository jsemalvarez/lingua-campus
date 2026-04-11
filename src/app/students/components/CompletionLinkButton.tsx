"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Link2, Check, Loader2 } from "lucide-react";
import { generateDataCompletionToken } from "../[id]/actions";
import { cn } from "@/lib/utils";

interface CompletionLinkButtonProps {
    studentId: string;
    variant?: "full" | "icon";
    className?: string;
}

/**
 * A button that generates a temporary link for student data completion
 * and copies it to the clipboard.
 */
export function CompletionLinkButton({
    studentId,
    variant = "full",
    className
}: CompletionLinkButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [copied, setCopied] = useState(false);

    const handleGenerateAndCopy = () => {
        startTransition(async () => {
            const result = await generateDataCompletionToken(studentId);

            if (result.success && result.token) {
                const url = `${window.location.origin}/complete-profile/${result.token}`;

                try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                } catch (err) {
                    console.error("Failed to copy:", err);
                    alert("No se pudo copiar el link automáticamente. Por favor, intentalo de nuevo.");
                }
            } else {
                alert(result.error || "Error al generar el link");
            }
        });
    };

    if (variant === "icon") {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleGenerateAndCopy}
                disabled={isPending}
                title={copied ? "¡Link copiado!" : "Generar link de completado de datos"}
                className={cn(
                    "rounded-full h-8 w-8 transition-all duration-300",
                    copied
                        ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 scale-110"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                    className
                )}
            >
                {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : copied ? (
                    <Check size={16} className="animate-in zoom-in duration-300" />
                ) : (
                    <Link2 size={16} className="group-hover:rotate-12 transition-transform" />
                )}
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            onClick={handleGenerateAndCopy}
            disabled={isPending}
            className={cn(
                "relative group overflow-hidden transition-all duration-500 h-11 px-6 rounded-xl border-dashed",
                copied
                    ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                    : "hover:border-primary/50 hover:bg-primary/5",
                className
            )}
        >
            <div className="flex items-center gap-2 font-bold tracking-tight">
                {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : copied ? (
                    <Check size={18} className="animate-in zoom-in duration-300" />
                ) : (
                    <Link2 size={18} className="group-hover:rotate-12 transition-transform" />
                )}
                <span>{isPending ? "Generando..." : copied ? "¡Copiado!" : "Generar Link de Edición"}</span>
            </div>

            {/* Visual feedback for the copy duration */}
            {copied && (
                <div className="absolute bottom-0 left-0 h-[2px] bg-emerald-500 w-full animate-out fade-out duration-[3000ms] opacity-50" />
            )}
        </Button>
    );
}
