"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DollarSign, Clock, Calendar as CalendarIcon, Loader2, CheckCircle, AlertCircle, AlertTriangle, Calculator } from "lucide-react";
import dayjs from "dayjs";
import { processTeacherPayment } from "../actions";

interface PayrollItem {
    id: string;
    date: Date;
    topic: string;
    courseName: string;
    durationMinutes: number;
    amount: number;
    isPaid: boolean;
    hasSchedule: boolean;
}

interface PayrollData {
    teacherId: string;
    rate: number;
    totalHours: number;
    totalAmount: number;
    lessonCount: number;
    unpaidCount: number;
    allItems: PayrollItem[];
}

export function TeacherPayrollSection({ 
    teacherId, 
    globalMonth, 
    globalYear,
    onDataChange,
    refreshKey
}: { 
    teacherId: string;
    globalMonth?: number;
    globalYear?: number;
    onDataChange?: (data: {
        teacherId: string;
        amount: number;
        bonus: number;
        deduction: number;
        notes: string;
        isSelected: boolean;
        lessonIds?: string[];
    }) => void;
    refreshKey?: number;
}) {
    const [month, setMonth] = useState(globalMonth || dayjs().month() + 1);
    const [year, setYear] = useState(globalYear || dayjs().year());
    
    // Estados para ajustes manuales
    const [bonus, setBonus] = useState(0);
    const [deduction, setDeduction] = useState(0);
    const [notes, setNotes] = useState("");
    const [isSelected, setIsSelected] = useState(true);

    const [data, setData] = useState<PayrollData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [hasCalculated, setHasCalculated] = useState(false);
    const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());

    // Sincronizar con props globales si existen
    useEffect(() => {
        if (globalMonth) setMonth(globalMonth);
        if (globalYear) setYear(globalYear);
    }, [globalMonth, globalYear]);

    const fetchPayrollData = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate();
            const endDate = dayjs(`${year}-${month}-01`).endOf('month').toDate();
            
            const res = await fetch(`/api/teachers/${teacherId}/payroll?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
            const result = await res.json();
            setData(result);
            // Seleccionar por defecto todas las clases pendientes
            if (result.allItems) {
                const pendingIds = result.allItems
                    .filter((item: any) => !item.isPaid)
                    .map((item: any) => item.id);
                setSelectedLessonIds(new Set(pendingIds));
            }
        } catch (error) {
            console.error("Error fetching payroll:", error);
        } finally {
            setLoading(false);
        }
    }, [teacherId, month, year]);

    useEffect(() => {
        // Fetch data immediately on mount OR when refreshKey changes
        fetchPayrollData();
    }, [fetchPayrollData, refreshKey]);

    // Notificar al padre cuando cambian los datos o ajustes
    useEffect(() => {
        if (onDataChange && data) {
            // Filtrar items seleccionados que NO están pagos para el cálculo del padre
            const currentSelectedItems = data.allItems.filter(item => 
                !item.isPaid && selectedLessonIds.has(item.id)
            );
            
            const currentTotalAmount = currentSelectedItems.reduce((acc, item) => acc + item.amount, 0);

            onDataChange({
                teacherId,
                amount: currentTotalAmount,
                bonus,
                deduction,
                notes,
                isSelected: isSelected && currentSelectedItems.length > 0,
                lessonIds: currentSelectedItems.map(i => i.id)
            });
        }
    }, [data, bonus, deduction, notes, isSelected, onDataChange, teacherId, selectedLessonIds]);

    const formatHours = (decimalHours: number) => {
        const h = Math.floor(decimalHours);
        const m = Math.round((decimalHours % 1) * 60);
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    const handleRegisterPayment = async () => {
        if (!data) return;
        
        const description = `Pago de Haberes - ${dayjs(`${year}-${month}-01`).format("MMMM YYYY")} (${formatHours(currentTotalHours)})`;
        const dateStr = dayjs().format("YYYY-MM-DD");

        startTransition(async () => {
            const res = await processTeacherPayment(
                teacherId, 
                currentTotalAmount, 
                description, 
                dateStr,
                bonus,
                deduction,
                notes,
                dayjs(`${year}-${month}-01`).startOf('month').toISOString(),
                dayjs(`${year}-${month}-01`).endOf('month').toISOString(),
                Array.from(selectedLessonIds)
            );
            if (res.success) {
                setStatus("success");
                // Refrescar datos y limpiar selección
                await fetchPayrollData();
                setBonus(0);
                setDeduction(0);
                setNotes("");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                setErrorMsg(res.error || "Error al procesar el pago");
            }
        });
    };

    const currentSelectedItems = data?.allItems.filter(item => !item.isPaid && selectedLessonIds.has(item.id)) || [];
    const currentTotalHours = currentSelectedItems.reduce((acc, item) => acc + (item.durationMinutes / 60), 0);
    const currentTotalAmount = currentSelectedItems.reduce((acc, item) => acc + item.amount, 0);
    const finalAmount = currentTotalAmount + bonus - deduction;

    const toggleLesson = (id: string) => {
        const next = new Set(selectedLessonIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedLessonIds(next);
    };

    const toggleAll = () => {
        if (!data) return;
        const pending = data.allItems.filter(i => !i.isPaid);
        if (selectedLessonIds.size === pending.length && pending.length > 0) {
            setSelectedLessonIds(new Set());
        } else {
            setSelectedLessonIds(new Set(pending.map(i => i.id)));
        }
    };

    return (
        <Card className="p-6 border-border/40 bg-card/30 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Calculator className="text-indigo-500" size={24} /> 
                            Liquidación de Haberes
                            {data && (
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20 ml-2">
                                    Valor Hora: ${data.rate.toLocaleString()}
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Cálculo basado en clases efectivamente dictadas.</p>
                    </div>
                </div>
                
                {!globalMonth && (
                    <div className="flex items-center gap-2">
                        <select 
                            value={month} 
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="bg-background border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {dayjs().month(i).format("MMMM")}
                                </option>
                            ))}
                        </select>
                        <select 
                            value={year} 
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-background border border-border/60 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                            {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p className="text-sm font-medium">Calculando horas...</p>
                </div>
            ) : data && data.lessonCount > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">Clases Seleccionadas</p>
                            <p className="text-2xl font-black">{currentSelectedItems.length}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500/70 mb-1">Horas Seleccionadas</p>
                            <p className="text-2xl font-black">{formatHours(currentTotalHours)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/70 mb-1">Total a Liquidar</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${finalAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    {data.unpaidCount === 0 && data.lessonCount > 0 && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
                            <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Período completamente liquidado</p>
                                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">
                                    Las {data.lessonCount} clases de este período ya fueron pagadas. Total liquidado: ${data.allItems.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {data.unpaidCount > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Bonificación (+)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 h-4 w-4" />
                                    <input 
                                        type="number" 
                                        value={bonus || ""} 
                                        onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Deducción (-)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 h-4 w-4" />
                                    <input 
                                        type="number" 
                                        value={deduction || ""} 
                                        onChange={(e) => setDeduction(parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Notas / Concepto</label>
                                <input 
                                    type="text" 
                                    value={notes} 
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ej: Bono asistencia, Adelanto..."
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <div className="border border-border/40 rounded-xl overflow-hidden bg-background/50">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="px-4 py-3 text-left w-10">
                                        <input 
                                            type="checkbox" 
                                            checked={data.allItems.filter(i => !i.isPaid).length > 0 && selectedLessonIds.size === data.allItems.filter(i => !i.isPaid).length}
                                            onChange={toggleAll}
                                            className="rounded border-border bg-background focus:ring-primary h-4 w-4"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left">Fecha</th>
                                    <th className="px-4 py-3 text-left">Curso / Tema</th>
                                    <th className="px-4 py-3 text-center">Duración</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-right">Monto Base</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {data.allItems.map(lesson => (
                                    <tr key={lesson.id} className={`hover:bg-muted/30 transition-colors ${lesson.isPaid ? 'opacity-50 grayscale select-none bg-muted/20' : ''}`}>
                                        <td className="px-4 py-3 text-center">
                                            {!lesson.isPaid && (
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedLessonIds.has(lesson.id)}
                                                    onChange={() => toggleLesson(lesson.id)}
                                                    className="rounded border-border bg-background focus:ring-primary h-4 w-4 cursor-pointer"
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium">{dayjs(lesson.date).format("DD/MM/YY")}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold">{lesson.courseName}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{lesson.topic}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">
                                            {!lesson.hasSchedule ? (
                                                <span className="inline-flex items-center gap-1 text-amber-600" title="Esta clase no tiene horario asignado. Asigná un horario al curso para incluirla en el cálculo.">
                                                    <AlertTriangle size={14} /> 0 min
                                                </span>
                                            ) : (
                                                <>{lesson.durationMinutes} min</>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {lesson.isPaid ? (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">Pagada</span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Pendiente</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                                            ${lesson.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/20 border-t border-border/40">
                                <tr className="font-bold">
                                    <td colSpan={3} className="px-4 py-3 text-right text-muted-foreground uppercase text-[10px] tracking-widest">Total Crudo:</td>
                                    <td className="px-4 py-3 text-right">${data.totalAmount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-top-2">
                            <CheckCircle size={18} /> Pago registrado exitosamente como Gasto de Payroll.
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    {!onDataChange && data.unpaidCount > 0 && (
                        <div className="flex justify-end pt-4 border-t border-border/40">
                            <Button 
                                onClick={handleRegisterPayment} 
                                disabled={isPending || status === "success"}
                                className="premium-gradient font-bold px-8 shadow-lg shadow-primary/20"
                            >
                                {isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : <DollarSign size={18} className="mr-2" />}
                                Registrar Pago Individual
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-muted/10">
                    <CalendarIcon className="mx-auto text-muted-foreground mb-3 opacity-40" size={40} />
                    <p className="text-sm text-muted-foreground">No se encontraron clases registradas en este período.</p>
                </div>
            )}
        </Card>
    );
}
