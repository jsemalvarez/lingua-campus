"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Info, PenLine, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { SignaturePad, StrokeData, isEmptyStroke } from "./SignaturePad";
import { signReportAction } from "@/app/actions/signatures";

interface ReportSignatureBoxProps {
    reportId: string;
    /** Si a quien está mirando le toca firmar este informe. */
    mustSign: boolean;
    /** Cuándo firmó, si ya firmó. */
    mySignedAt: string | Date | null;
    /** Si el informe ya tiene la firma de alguien: alcanza con una. */
    alreadySignedByOther: boolean;
    /** La firma de referencia de quien mira, para mostrarla al lado. */
    reference: StrokeData | null;
}

export function ReportSignatureBox({
    reportId,
    mustSign,
    mySignedAt,
    alreadySignedByOther,
    reference
}: ReportSignatureBoxProps) {
    const [stroke, setStroke] = useState<StrokeData | null>(null);
    const [isPending, startTransition] = useTransition();

    if (mySignedAt) {
        return (
            <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                    <p className="font-bold text-sm">Firmaste este informe</p>
                    <p className="text-sm text-muted-foreground">
                        El {formatDate(mySignedAt, "moment", "long")}. Gracias.
                    </p>
                </div>
            </div>
        );
    }

    if (!mustSign) {
        if (!alreadySignedByOther) return null;
        return (
            <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 flex items-start gap-3">
                <CheckCircle2 className="text-muted-foreground shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-muted-foreground font-medium">
                    Este informe ya está firmado. Con una firma alcanza.
                </p>
            </div>
        );
    }

    const isFirstEver = !reference;

    const handleSubmit = () => {
        if (isEmptyStroke(stroke)) {
            toast.error("Falta dibujar la firma en el recuadro");
            return;
        }

        startTransition(async () => {
            const result = await signReportAction(reportId, stroke);
            if (result.success) {
                toast.success("Listo, el informe quedó firmado. Gracias");
            } else {
                toast.error(result.error ?? "No se pudo registrar la firma");
            }
        });
    };

    return (
        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <PenLine size={14} /> Firma del informe
            </div>

            {/* Sin apurar ni nombrar al instituto como el que controla: el
                texto cuenta qué es y dónde se firma. Antes decía «Firmá para
                que el instituto sepa que viste estas notas». */}
            <p className="text-sm text-muted-foreground leading-relaxed">
                Cuando termines de leerlo, podés firmarlo acá. Es una firma simple, sin
                validez legal.
            </p>

            {isFirstEver && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                    <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-muted-foreground">
                        Es tu primera firma: <strong className="text-foreground">queda
                        guardada</strong> y la vas a ver al lado cuando firmes los próximos
                        informes. Si después querés cambiarla, lo podés hacer desde tu perfil.
                    </p>
                </div>
            )}

            <div className={reference ? "grid gap-4 sm:grid-cols-2" : ""}>
                {reference && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Tu firma anterior
                        </p>
                        <SignaturePad
                            value={reference}
                            onChange={() => {}}
                            readOnly
                            ariaLabel="Tu firma registrada anteriormente"
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {reference ? "Firmá acá" : "Tu firma"}
                    </p>
                    <SignaturePad value={stroke} onChange={setStroke} />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSubmit} disabled={isPending}>
                    {isPending ? "Guardando..." : "Firmar"}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setStroke(null)}
                    disabled={isPending || isEmptyStroke(stroke)}
                >
                    <RotateCcw size={14} className="mr-2" /> Borrar y volver a firmar
                </Button>
            </div>
        </div>
    );
}
