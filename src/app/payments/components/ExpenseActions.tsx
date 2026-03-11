"use client";

import { useState, useTransition } from "react";
import { Edit2, Trash2, AlertTriangle } from "lucide-react";
import { deleteExpenseAction } from "../actions";
import { EditExpenseModal } from "./EditExpenseModal";

interface ExpenseActionsProps {
    expense: {
        id: string;
        description: string;
        amount: number;
        category: string;
        recipientName?: string | null;
        ticketNumber?: string | null;
        date: Date | string;
    };
}

export function ExpenseActions({ expense }: ExpenseActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteExpenseAction(expense.id);
            if (result.success) {
                setShowDeleteConfirm(false);
            } else {
                alert(result.error || "No se pudo eliminar el gasto");
            }
        });
    };

    return (
        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
                onClick={() => setShowEditModal(true)}
                title="Editar"
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-blue-600"
            >
                <Edit2 size={16} />
            </button>
            <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Eliminar"
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-rose-600"
            >
                <Trash2 size={16} />
            </button>

            {/* Modal de Edición */}
            <EditExpenseModal 
                expense={expense}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
            />

            {/* Modal de Confirmación de Eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">¿Confirmar eliminación?</h3>
                            <p className="text-muted-foreground text-sm">
                                Estás a punto de eliminar el gasto: <br/>
                                <span className="font-semibold text-foreground">"{expense.description}"</span> por <span className="font-semibold text-foreground">${expense.amount.toLocaleString()}</span>.
                                <br/><br/>
                                Esta acción no se puede deshacer.
                            </p>
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
                                onClick={handleDelete}
                                className="flex-1 py-4 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                disabled={isPending}
                            >
                                {isPending ? "Eliminando..." : "Sí, Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
