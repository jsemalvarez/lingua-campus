"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, PenLine, Undo2 } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SignaturePad, StrokeData, isEmptyStroke } from "@/components/reports/SignaturePad";
import { strokeToPath } from "@/lib/reports/signatureCompare";
import { signReportBatchAction, unsignReportBatchAction } from "@/app/actions/batchSignatures";
import type { BatchSignerRole } from "@/lib/reports/batchSignatures";

export interface BatchSignatureRow {
    signerRole: BatchSignerRole;
    signerName: string;
    signedAt: string;
    strokeData?: StrokeData | null;
    isMine: boolean;
    /** Alumnos cuya nota se tocó después de esta firma. */
    fallenCount: number;
}

interface BatchSignaturePanelProps {
    courseId: string;
    templateId: string;
    year: number;
    periodIndex: number;
    periodLabel: string;
    signatures: BatchSignatureRow[];
    canSign: { ADMIN: boolean; TEACHER: boolean };
    hasUnsavedChanges: boolean;
    onChanged: () => void;
}

const ETIQUETA: Record<BatchSignerRole, string> = {
    ADMIN: "Dirección",
    TEACHER: "Docente"
};

/**
 * Firmar la tanda de informes (FEAT-21).
 *
 * Va arriba de la planilla y no en la barra de acciones del final a propósito:
 * con treinta cursos que firmar, que el botón esté sin scrollear es lo que
 * separa una tarde de tres.
 */
export function BatchSignaturePanel({
    courseId,
    templateId,
    year,
    periodIndex,
    periodLabel,
    signatures,
    canSign,
    hasUnsavedChanges,
    onChanged
}: BatchSignaturePanelProps) {
    const [isPending, startTransition] = useTransition();
    const [stroke, setStroke] = useState<StrokeData | null>(null);
    const [needsStroke, setNeedsStroke] = useState<BatchSignerRole | null>(null);

    const firmaDe = (role: BatchSignerRole) => signatures.find(s => s.signerRole === role);
    const direccion = firmaDe("ADMIN");

    const roles: BatchSignerRole[] = (["TEACHER", "ADMIN"] as const).filter(
        r => canSign[r] || firmaDe(r)
    );

    if (roles.length === 0) return null;

    const key = { courseId, templateId, year, periodIndex };

    const handleSign = (signerRole: BatchSignerRole) => {
        if (needsStroke === signerRole && isEmptyStroke(stroke)) {
            toast.error("Dibujá tu firma antes de firmar");
            return;
        }

        startTransition(async () => {
            const result = await signReportBatchAction(
                { ...key, signerRole },
                stroke ?? undefined
            );

            if (result.success) {
                setStroke(null);
                setNeedsStroke(null);
                toast.success(`Firmaste el ${periodLabel} como ${ETIQUETA[signerRole].toLowerCase()}`);
                onChanged();
                return;
            }

            if ("needsStroke" in result && result.needsStroke) {
                setNeedsStroke(signerRole);
            }
            toast.error(result.error ?? "No se pudo firmar");
        });
    };

    const handleUnsign = (signerRole: BatchSignerRole) => {
        startTransition(async () => {
            const result = await unsignReportBatchAction({ ...key, signerRole });
            if (result.success) {
                toast.success("Sacaste tu firma de este informe");
                onChanged();
            } else {
                toast.error(result.error ?? "No se pudo sacar la firma");
            }
        });
    };

    return (
        <div className="space-y-3">
            {/* El aviso que evita el problema en vez de reportarlo: guardar con
                la dirección ya firmada le tira la firma a los que se modifiquen. */}
            {direccion && (
                <div className="flex items-start gap-3 p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                    <AlertTriangle className="text-violet-600 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm">
                        <p className="font-bold">
                            {direccion.isMine
                                ? "Ya firmaste este informe"
                                : "La dirección ya firmó este informe"}
                        </p>
                        <p className="text-muted-foreground">
                            Si guardás cambios,{" "}
                            {direccion.isMine ? "tu firma" : `la firma de ${direccion.signerName}`} se
                            cae para los alumnos que modifiques y hay que volver a firmar. Los demás
                            no se tocan.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-background/40 border border-border/20 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                    <PenLine size={14} /> Firmas del boletín
                </div>

                <div className="flex flex-wrap items-center gap-3 flex-1">
                    {roles.map(role => {
                        const firma = firmaDe(role);

                        if (!firma) {
                            return (
                                <Button
                                    key={role}
                                    onClick={() => handleSign(role)}
                                    disabled={isPending || hasUnsavedChanges}
                                    title={
                                        hasUnsavedChanges
                                            ? "Guardá los cambios antes de firmar: se firma lo que está guardado"
                                            : undefined
                                    }
                                    className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                    <PenLine size={14} /> Firmar como {ETIQUETA[role].toLowerCase()}
                                </Button>
                            );
                        }

                        return (
                            <div
                                key={role}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs",
                                    firma.fallenCount > 0
                                        ? "bg-amber-500/5 border-amber-500/30"
                                        : "bg-emerald-500/5 border-emerald-500/20"
                                )}
                            >
                                {firma.strokeData ? (
                                    <svg
                                        width={64}
                                        height={22}
                                        viewBox="0 0 64 22"
                                        className="shrink-0 text-foreground"
                                        role="img"
                                        aria-label={`Firma de ${firma.signerName}`}
                                    >
                                        <path
                                            d={strokeToPath(firma.strokeData, 64, 22)}
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                ) : (
                                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                )}

                                <div className="leading-tight">
                                    <p className="font-bold">
                                        {ETIQUETA[role]} · {firma.signerName}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {dayjs(firma.signedAt).format("D/M/YYYY")}
                                        {firma.fallenCount > 0 && (
                                            <span className="text-amber-600 font-semibold">
                                                {" "}· caída en {firma.fallenCount}{" "}
                                                {firma.fallenCount === 1 ? "alumno" : "alumnos"}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {firma.isMine && (
                                    <div className="flex items-center gap-1 pl-1">
                                        {firma.fallenCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSign(role)}
                                                disabled={isPending || hasUnsavedChanges}
                                                className="h-7 px-2 text-xs font-bold text-amber-700"
                                            >
                                                Volver a firmar
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleUnsign(role)}
                                            disabled={isPending}
                                            className="h-7 px-2 text-muted-foreground"
                                            title="Sacar mi firma"
                                        >
                                            <Undo2 size={13} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {hasUnsavedChanges && (
                        <span className="text-xs text-amber-600 font-semibold">
                            Guardá los cambios antes de firmar.
                        </span>
                    )}
                </div>
            </div>

            {/* La primera vez no hay trazo registrado. Se dibuja acá y queda como
                su firma; las próximas tandas se firman con un solo click. */}
            {needsStroke && (
                <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl space-y-3">
                    <p className="text-sm font-bold">Es tu primera firma</p>
                    <p className="text-sm text-muted-foreground">
                        Va a quedar registrada como tu firma y es la que van a ver las familias
                        impresa en el boletín. Después la podés cambiar desde tu perfil.
                    </p>
                    <div className="max-w-sm">
                        <SignaturePad value={stroke} onChange={setStroke} />
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => handleSign(needsStroke)} disabled={isPending}>
                            {isPending ? "Firmando..." : "Firmar"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setStroke(null);
                                setNeedsStroke(null);
                            }}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
