"use client";

import { useTransition, useState, useEffect } from "react";
import { updateExpenseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, X, DollarSign, Tag, Calendar, FileText, ChevronRight, Hash } from "lucide-react";
import dayjs from "dayjs";

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    recipientName?: string | null;
    ticketNumber?: string | null;
    date: Date | string;
}

interface EditExpenseModalProps {
    expense: Expense;
    isOpen: boolean;
    onClose: () => void;
}

export function EditExpenseModal({ expense, isOpen, onClose }: EditExpenseModalProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // Determinar esquema de color según categoría
    const isSalary = expense.category === "NOMINA";
    const themeColor = isSalary ? "amber" : "rose";
    
    // Clases dinámicas
    const bgHeaderIcon = isSalary ? "bg-amber-100 dark:bg-amber-900/30" : "bg-rose-100 dark:bg-rose-900/30";
    const textHeaderIcon = isSalary ? "text-amber-600" : "text-rose-600";
    const bgBlurDecoration = isSalary ? "bg-amber-500/10" : "bg-rose-500/10";
    const focusRing = isSalary ? "focus:ring-amber-500/20 focus:border-amber-500/50" : "focus:ring-rose-500/20 focus:border-rose-500/50";
    const submitBtn = isSalary ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20";

    // Reset status when opening
    useEffect(() => {
        if (isOpen) {
            setStatus("idle");
            setErrorMsg("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        startTransition(async () => {
            const result = await updateExpenseAction(expense.id, formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo actualizar el gasto");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div 
                className="bg-background border border-border/50 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Gradient Background */}
                <div className="relative p-8 overflow-hidden">
                    <div className={`absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 ${bgBlurDecoration} rounded-full blur-3xl`} />
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`p-1.5 ${bgHeaderIcon} ${textHeaderIcon} rounded-lg`}>
                                    <DollarSign size={18} />
                                </span>
                                <h3 className="text-2xl font-bold tracking-tight">Editar Movimiento</h3>
                            </div>
                            <p className="text-muted-foreground text-sm">Actualiza los detalles del {isSalary ? "pago de sueldo" : "gasto operativo"}</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-muted rounded-full transition-all hover:rotate-90 duration-200 text-muted-foreground hover:text-foreground"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form action={handleSubmit} className="p-8 pt-0 space-y-6">
                    {/* Description Field */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <FileText size={14} /> 
                            Concepto del {isSalary ? `Sueldo${expense.recipientName ? `: ${expense.recipientName}` : ""}` : "Gasto"}
                        </label>
                        <div className="relative group">
                            <input 
                                type="text" 
                                name="description" 
                                required 
                                defaultValue={expense.description}
                                placeholder="Ej: Materiales, Limpieza, Alquiler..." 
                                className={`w-full pl-4 pr-4 py-3 rounded-2xl border border-border bg-muted/30 text-sm outline-none transition-all group-hover:bg-muted/50 ${focusRing}`} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Amount Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <DollarSign size={14} /> Monto ($)
                            </label>
                            <div className="relative group">
                                <input 
                                    type="number" 
                                    name="amount" 
                                    min="1" 
                                    step="0.01" 
                                    required 
                                    defaultValue={expense.amount}
                                    placeholder="0" 
                                    className={`w-full pl-4 pr-4 py-3 rounded-2xl border border-border bg-muted/30 text-sm outline-none transition-all group-hover:bg-muted/50 font-mono font-bold ${focusRing}`} 
                                />
                            </div>
                        </div>

                        {/* Category Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Tag size={14} /> Categoría
                            </label>
                            <div className="relative group">
                                {isSalary && <input type="hidden" name="category" value={expense.category} />}
                                <select 
                                    name={isSalary ? "" : "category"} 
                                    required 
                                    defaultValue={expense.category}
                                    disabled={isSalary}
                                    className={`w-full pl-4 pr-10 py-3 rounded-2xl border border-border bg-muted/30 text-sm outline-none appearance-none transition-all group-hover:bg-muted/50 ${focusRing} ${isSalary ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    <option value="ALQUILER">Alquiler / Expensas</option>
                                    <option value="SERVICIOS">Servicios (Luz, Internet)</option>
                                    <option value="MANTENIMIENTO">Mantenimiento / Limpieza</option>
                                    <option value="MATERIALES">Material Didáctico</option>
                                    <option value="PUBLICIDAD">Publicidad / Marketing</option>
                                    <option value="OTROS">Otros</option>
                                    <option value="NOMINA">Pago de Sueldo</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <ChevronRight size={16} className="rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Date Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Calendar size={14} /> Fecha
                            </label>
                            <div className="relative group">
                                <input 
                                    type="date" 
                                    name="date" 
                                    defaultValue={new Date(expense.date).toISOString().split("T")[0]}
                                    className={`w-full pl-4 pr-4 py-3 rounded-2xl border border-border bg-muted/30 text-sm outline-none transition-all group-hover:bg-muted/50 ${focusRing}`} 
                                />
                            </div>
                        </div>

                        {/* Ticket Number Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Hash size={14} /> Nº de Ticket
                            </label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    name="ticketNumber" 
                                    defaultValue={expense.ticketNumber || ""}
                                    placeholder="Sin ticket"
                                    className={`w-full pl-4 pr-4 py-3 rounded-2xl border border-border bg-muted/30 text-sm outline-none transition-all group-hover:bg-muted/50 ${focusRing}`} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    {status === "success" && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-in slide-in-from-top-2">
                            <div className="p-1 bg-emerald-500/20 rounded-full">
                                <CheckCircle size={18} />
                            </div>
                            Registro actualizado correctamente
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold animate-in slide-in-from-top-2">
                            <div className="p-1 bg-rose-500/20 rounded-full">
                                <AlertCircle size={18} />
                            </div>
                            {errorMsg}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1 py-6 rounded-2xl border-border hover:bg-muted transition-all text-base font-medium"
                            onClick={onClose}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            className={`flex-[1.5] py-6 rounded-2xl font-bold text-white shadow-lg text-base transition-all active:scale-95 ${submitBtn}`} 
                            disabled={isPending}
                        >
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
