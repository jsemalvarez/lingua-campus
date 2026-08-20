"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Info, PenLine, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
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
                    <p className="font-bold text-sm">Confirmaste que lo leíste</p>
                    <p className="text-sm text-muted-foreground">
                        El {dayjs(mySignedAt).format("D [de] MMMM [de] YYYY")}. El instituto ya
                        figura avisado de que viste estas notas.
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
                    Este informe ya fue confirmado. Alcanza con que lo confirme una persona.
                </p>
            </div>
        );
    }

    const isFirstEver = !reference;

    const handleSubmit = () => {
        if (isEmptyStroke(stroke)) {
            toast.error("Dibujá tu firma antes de confirmar");
            return;
        }

        startTransition(async () => {
            const result = await signReportAction(reportId, stroke);
            if (result.success) {
                toast.success("Listo, quedó confirmado que leíste el informe");
            } else {
                toast.error(result.error ?? "No se pudo registrar la firma");
            }
        });
    };

    return (
        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <PenLine size={14} /> Confirmo que lo leí
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                Firmá para que el instituto sepa que viste estas notas. No es una firma con
                validez legal: es un acuse de lectura.
            </p>

            {isFirstEver && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                    <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-muted-foreground">
                        Es tu primera firma, así que <strong className="text-foreground">esta va a
                        quedar guardada como tu firma</strong> y las próximas se van a parecer a
                        ésta. Tomate un segundo. Después la podés volver a registrar desde tu
                        perfil.
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
                    {isPending ? "Registrando..." : "Confirmar que lo leí"}
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
