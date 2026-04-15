"use client";

import { useState, useTransition } from "react";
import { editFeeAmountAction, deleteFeeAction } from "../billingActions";
import { toast } from "sonner";
import { Trash2, Edit2, Check, X } from "lucide-react";

export function PendingFeeActions({ feeId, isPaid, originalAmount }: { feeId: string, isPaid: boolean, originalAmount: number }) {
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [editAmount, setEditAmount] = useState<number>(originalAmount);

    if (isPaid) return null; // We only allow editing/deleting completely unpaid fees.

    const handleDelete = () => {
        if (!confirm("¿Eliminar esta cuota/matrícula no pagada permanentemente?")) return;
        
        startTransition(async () => {
            const res = await deleteFeeAction(feeId);
            if (res.success) {
                toast.success("Deuda eliminada");
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
                onClick={handleDelete}
                title="Eliminar Deuda (Anular registro incorrecto)"
                className="p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 rounded transition-colors"
                disabled={isPending}
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}
