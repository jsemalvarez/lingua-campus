"use client";

import { useState, useTransition } from "react";
import { editFeeAmountAction, deleteFeeAction } from "../billingActions";
import { toast } from "sonner";
import { Trash2, Edit2, Check, X } from "lucide-react";

/** El mismo tope que valida `deleteFeeAction`. */
const REASON_MAX = 200;

export function PendingFeeActions({ feeId, isPaid, originalAmount }: { feeId: string, isPaid: boolean, originalAmount: number }) {
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [editAmount, setEditAmount] = useState<number>(originalAmount);
    const [isDeleting, setIsDeleting] = useState(false);
    const [reason, setReason] = useState("");

    if (isPaid) return null; // We only allow editing/deleting completely unpaid fees.

    const handleDelete = () => {
        const cleanReason = reason.trim();
        if (!cleanReason) {
            toast.error("Escribí el motivo: sin él queda una fecha, no un rastro.");
            return;
        }

        startTransition(async () => {
            const res = await deleteFeeAction(feeId, cleanReason);
            if (res.success) {
                toast.success("Deuda eliminada");
                setIsDeleting(false);
                setReason("");
            } else {
                toast.error(res.error || "No se pudo eliminar");
            }
        });
    };

    const handleSaveEdit = () => {
        if (editAmount <= 0 || isNaN(editAmount)) {
            toast.error("Monto inválido");
            return;
        }

        startTransition(async () => {
            const res = await editFeeAmountAction(feeId, editAmount);
            if (res.success) {
                toast.success("Monto actualizado");
                setIsEditing(false);
            } else {
                toast.error(res.error || "No se pudo actualizar");
            }
        });
    };

    // El motivo se pide acá adentro, en la tarjeta de la cuota, y no en un
    // `confirm()` del navegador. El cartel decía "esta cuota" sin nombrar a nadie:
    // no confirmaba nada, porque no dejaba ver cuál se estaba por borrar. Acá el
    // alumno, el período y el importe están a la vista, arriba del campo.
    if (isDeleting) {
        return (
            <div className="mt-2 mb-1 w-full relative z-10 bg-background/50 p-1.5 rounded-md">
                <p className="text-[9px] font-black uppercase tracking-tighter text-rose-600 mb-1">
                    Motivo de la eliminación
                </p>
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        maxLength={REASON_MAX}
                        disabled={isPending}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleDelete(); }}
                        placeholder="Obligatorio. Ej: duplicada, beca…"
                        className="w-full h-7 px-2 text-xs border rounded outline-none focus:ring-1 focus:ring-rose-500"
                        autoFocus
                    />
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        title="Eliminar la deuda con este motivo"
                        className="p-1.5 text-rose-600 bg-rose-100 hover:bg-rose-200 rounded disabled:opacity-50 transition-colors"
                    >
                        <Trash2 size={12} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => { setIsDeleting(false); setReason(""); }}
                        disabled={isPending}
                        title="Cancelar"
                        className="p-1.5 text-muted-foreground bg-muted hover:bg-muted/70 rounded disabled:opacity-50 transition-colors"
                    >
                        <X size={12} strokeWidth={3} />
                    </button>
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 mt-2 mb-1 w-full relative z-10 bg-background/50 p-1 rounded-md">
                <input 
                    type="number" 
                    min="1"
                    disabled={isPending}
                    value={editAmount}
                    onChange={(e) => setEditAmount(parseFloat(e.target.value))}
                    className="w-full h-7 px-2 text-xs border rounded outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                />
                <button 
                    onClick={handleSaveEdit}
                    disabled={isPending}
                    className="p-1.5 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded disabled:opacity-50 transition-colors"
                >
                    <Check size={12} strokeWidth={3} />
                </button>
                <button 
                    onClick={() => setIsEditing(false)}
                    disabled={isPending}
                    className="p-1.5 text-rose-600 bg-rose-100 hover:bg-rose-200 rounded disabled:opacity-50 transition-colors"
                >
                    <X size={12} strokeWidth={3} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end mt-1">
            <button 
                onClick={() => setIsEditing(true)}
                title="Editar Monto Base"
                className="p-1 text-muted-foreground hover:bg-muted hover:text-amber-600 rounded transition-colors"
            >
                <Edit2 size={12} />
            </button>
            <button
                onClick={() => setIsDeleting(true)}
                title="Eliminar Deuda (Anular registro incorrecto)"
                className="p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 rounded transition-colors"
                disabled={isPending}
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}
