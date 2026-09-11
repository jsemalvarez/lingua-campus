"use client";

import { useState, useTransition } from "react";
import { PenLine, RotateCcw, Info } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Button } from "@/components/ui/Button";
import { SignaturePad, StrokeData, isEmptyStroke } from "./SignaturePad";
import { saveMySignatureReference } from "@/app/actions/signatures";

interface SignatureManagerProps {
    /** La firma registrada hoy, si hay alguna. */
    current: StrokeData | null;
    updatedAt: string | null;
    /**
     * Qué hace la firma para quien está mirando. No es lo mismo para el tutor
     * —que acusa recibo de las notas— que para el docente o la dirección, cuya
     * firma sale impresa en el boletín de la familia.
     */
    audience: "FAMILY" | "STAFF";
}

/**
 * Registrar la firma propia (FEAT-09, completado por FEAT-21).
 *
 * FEAT-09 decidió que la persona pueda volver a registrar su firma **ella
 * misma**, no la secretaría, y la pantalla de firma del informe se lo promete
 * al tutor con todas las letras. Faltaba esta pantalla.
 *
 * Para el docente y la dirección es además la única puerta de entrada: ellos no
 * firman informes propios, y sin una firma registrada no tendrían con qué
 * firmar la tanda.
 */
export function SignatureManager({ current, updatedAt, audience }: SignatureManagerProps) {
    const [stroke, setStroke] = useState<StrokeData | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        if (isEmptyStroke(stroke)) {
            toast.error("Dibujá tu firma antes de guardar");
            return;
        }

        startTransition(async () => {
            const result = await saveMySignatureReference(stroke);
            if (result.success) {
                setStroke(null);
                toast.success(current ? "Tu firma quedó actualizada" : "Tu firma quedó registrada");
            } else {
                toast.error(result.error ?? "No se pudo guardar la firma");
            }
        });
    };

    return (
        <div className="pt-8 mt-8 border-t border-border/40 space-y-4">
            <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <PenLine size={18} className="text-primary" /> Mi firma
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {audience === "STAFF" ? (
                        <>
                            Es la firma que sale impresa en los boletines que firmes. La registrás
                            una vez acá y después firmar cada informe es un solo click.
                        </>
                    ) : (
                        <>
                            Es la firma con la que confirmás los informes. Si la que quedó guardada
                            no te representa, dibujá una nueva: las que ya hiciste no cambian.
                        </>
                    )}
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {current && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Tu firma registrada
                        </p>
                        <SignaturePad
                            value={current}
                            onChange={() => {}}
                            readOnly
                            ariaLabel="Tu firma registrada actualmente"
                        />
                        {updatedAt && (
                            <p className="text-xs text-muted-foreground">
                                Registrada el {dayjs(updatedAt).format("D [de] MMMM [de] YYYY")}
                            </p>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {current ? "Dibujá una nueva" : "Dibujá tu firma"}
                    </p>
                    <SignaturePad value={stroke} onChange={setStroke} />
                </div>
            </div>

            {!current && audience === "STAFF" && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                    <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-muted-foreground">
                        Todavía no tenés firma registrada, así que no vas a poder firmar boletines.
                        Tomate un segundo: <strong className="text-foreground">ésta es la que van a
                        ver las familias</strong> impresa en el informe.
                    </p>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? "Guardando..." : current ? "Reemplazar mi firma" : "Guardar mi firma"}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setStroke(null)}
                    disabled={isPending || isEmptyStroke(stroke)}
                >
                    <RotateCcw size={14} className="mr-2" /> Borrar y volver a dibujar
                </Button>
            </div>
        </div>
    );
}
