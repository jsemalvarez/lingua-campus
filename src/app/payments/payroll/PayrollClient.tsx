"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, DollarSign, Wallet, CheckCircle, AlertCircle, Loader2, Calculator } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TeacherPayrollSection } from "../../teachers/[id]/TeacherPayrollSection";
import dayjs from "dayjs";
import { processBulkPayrollAction } from "@/app/teachers/actions";

interface Teacher {
    id: string;
    name: string;
    email: string;
    hourlyRate: number | null;
}

interface SettlementData {
    teacherId: string;
    amount: number;
    bonus: number;
    deduction: number;
    notes: string;
    isSelected: boolean;
    lessonIds?: string[];
}

interface TeacherPayrollProps {
    teacherId: string;
    globalMonth?: number;
    globalYear?: number;
    onDataChange?: (data: any) => void;
    refreshKey?: number;
}

export function PayrollClient({ teachers }: { teachers: Teacher[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Default al mes pasado
    const [globalMonth, setGlobalMonth] = useState(dayjs().subtract(1, 'month').month() + 1);
    const [globalYear, setGlobalYear] = useState(dayjs().subtract(1, 'month').year());
    
    const [settlements, setSettlements] = useState<Record<string, SettlementData>>({});
    const [isPending, startTransition] = useTransition();
    const [calculating, setCalculating] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSettlementChange = useCallback((teacherId: string, data: SettlementData) => {
        setSettlements(prev => {
            const existing = prev[teacherId];
            if (existing && 
                existing.amount === data.amount && 
                existing.bonus === data.bonus && 
                existing.deduction === data.deduction && 
                existing.notes === data.notes && 
                existing.isSelected === data.isSelected &&
                JSON.stringify(existing.lessonIds) === JSON.stringify(data.lessonIds)) {
                return prev;
            }
            return {
                ...prev,
                [teacherId]: {
                    ...data,
                    // Aseguramos que pasamos los IDs para el registro final
                    lessonIds: data.lessonIds
                }
            };
        });
    }, []);

    const fetchBulkData = async () => {
        setCalculating(true);
        setStatus("idle");
        try {
            const startDate = dayjs(`${globalYear}-${globalMonth}-01`).startOf('month').toISOString();
            const endDate = dayjs(`${globalYear}-${globalMonth}-01`).endOf('month').toISOString();
            
            const res = await fetch(`/api/institutes/payroll?start=${startDate}&end=${endDate}`);
            const data = await res.json();
            
            const newSettlements: Record<string, SettlementData> = {};
            // El API retorna teacherId -> { totalAmount, lessonCount, ... }
            Object.values(data).forEach((item: any) => {
                newSettlements[item.teacherId] = {
                    teacherId: item.teacherId,
                    amount: item.totalAmount,
                    bonus: 0,
                    deduction: 0,
                    notes: "",
                    isSelected: item.lessonCount > 0
                };
            });
            setSettlements(newSettlements);
        } catch (error) {
            console.error("Error fetching bulk payroll:", error);
            setStatus("error");
        } finally {
            setCalculating(false);
        }
    };

    // Resetear datos si cambia el periodo (para forzar nuevo cálculo)
    const handlePeriodChange = (m: number, y: number) => {
        setGlobalMonth(m);
        setGlobalYear(y);
        setSettlements({});
    };

    const selectedTeachers = Object.values(settlements).filter(s => s.isSelected);
    const totalToPay = selectedTeachers.reduce((acc, s) => acc + s.amount + s.bonus - s.deduction, 0);

    const handleBulkPayment = async () => {
        if (selectedTeachers.length === 0) return;

        const startDate = dayjs(`${globalYear}-${globalMonth}-01`).startOf('month').toISOString();
        const endDate = dayjs(`${globalYear}-${globalMonth}-01`).endOf('month').toISOString();

        const payments = selectedTeachers.map(s => ({
            teacherId: s.teacherId,
            amount: s.amount,
            description: `Pago de Haberes - ${dayjs().month(globalMonth - 1).format("MMMM")} ${globalYear}`,
            date: dayjs().format("YYYY-MM-DD"),
            bonus: s.bonus,
            deduction: s.deduction,
            notes: s.notes,
            startDate,
            endDate,
            lessonIds: s.lessonIds
        }));

        startTransition(async () => {
            const res = await processBulkPayrollAction(payments);
            if (res.success) {
                setStatus("success");
                setRefreshKey(prev => prev + 1);
                setTimeout(() => setStatus("idle"), 5000);
            } else {
                setStatus("error");
            }
        });
    };

    return (
        <div className="space-y-6 pb-32">
            {/* Global Filters */}
            <Card className="p-6 border-border/40 shadow-sm bg-card/50 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Buscar docente..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Período:</p>
                    <select 
                        value={globalMonth} 
                        onChange={(e) => handlePeriodChange(parseInt(e.target.value), globalYear)}
                        className="bg-background border border-border/60 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {dayjs().month(i).format("MMMM")}
                            </option>
                        ))}
                    </select>
                    <select 
                        value={globalYear} 
                        onChange={(e) => handlePeriodChange(globalMonth, parseInt(e.target.value))}
                        className="bg-background border border-border/60 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                        {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <Button 
                        onClick={fetchBulkData}
                        disabled={calculating}
                        variant="outline"
                        className="border-primary/30 text-primary hover:bg-primary/5 font-bold"
                    >
                        {calculating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Calculator className="mr-2" size={16} />}
                        Calcular Sueldos
                    </Button>
                </div>
            </Card>

            {/* Total Summary Sticky Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-50">
                <Card className="p-4 border-primary/20 shadow-2xl bg-background/95 backdrop-blur-md border-t-4 border-t-primary animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total a Liquidar ({selectedTeachers.length} seleccionados)</p>
                                <h3 className="text-2xl font-black text-foreground">
                                    ${totalToPay.toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {status === "success" && (
                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-2 rounded-lg animate-in fade-in zoom-in">
                                    <CheckCircle size={18} /> ¡Pagos registrados!
                                </div>
                            )}
                            {status === "error" && (
                                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm bg-rose-50 px-3 py-2 rounded-lg">
                                    <AlertCircle size={18} /> Error al procesar
                                </div>
                            )}
                            
                            <Button 
                                onClick={handleBulkPayment}
                                disabled={isPending || selectedTeachers.length === 0 || status === "success" || calculating}
                                className="premium-gradient font-bold h-12 px-8 shadow-xl shadow-primary/20 w-full sm:w-auto"
                            >
                                {isPending ? <Loader2 className="animate-spin mr-2" /> : <DollarSign className="mr-2" />}
                                Registrar {selectedTeachers.length} Pagos Masivos
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid gap-4">
                {filteredTeachers.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl border-border/50 bg-muted/10">
                        <p className="text-muted-foreground">No se encontraron docentes.</p>
                    </div>
                ) : (
                    filteredTeachers.map((teacher) => {
                        const s = settlements[teacher.id];
                        const displayAmount = s ? (s.amount + s.bonus - s.deduction) : 0;
                        const isExpanded = expandedTeacherId === teacher.id;

                        return (
                            <div key={teacher.id} className="space-y-2">
                                <Card 
                                    className={`p-4 border-border/40 hover:border-primary/30 transition-all cursor-pointer overflow-hidden relative ${
                                        isExpanded ? 'border-primary/40 bg-primary/5 shadow-md ring-1 ring-primary/10' : 'bg-card/50'
                                    }`}
                                    onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm border border-primary/10">
                                                {teacher.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <Link 
                                                    href={`/teachers/${teacher.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="font-bold text-foreground/90 hover:text-primary transition-colors underline-offset-4 hover:underline cursor-pointer relative z-20"
                                                >
                                                    {teacher.name}
                                                </Link>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{teacher.email}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            {/* Toggle Premium de Selección */}
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSettlementChange(teacher.id, {
                                                        ...(s || { 
                                                            teacherId: teacher.id, 
                                                            amount: 0, 
                                                            bonus: 0, 
                                                            deduction: 0, 
                                                            notes: "", 
                                                            isSelected: true 
                                                        }),
                                                        isSelected: !s?.isSelected
                                                    });
                                                }}
                                                className={`group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border ${
                                                    s?.isSelected !== false
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]"
                                                        : "bg-muted/50 border-border/80 text-muted-foreground opacity-60 grayscale"
                                                }`}
                                            >
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                                    s?.isSelected !== false
                                                        ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-100"
                                                        : "bg-transparent border-muted-foreground/30 scale-90"
                                                }`}>
                                                    {(s?.isSelected !== false) && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                                                    {s?.isSelected !== false ? "Incluido" : "Excluido"}
                                                </span>
                                            </div>

                                            {s && s.isSelected && (
                                                <div className="text-right min-w-[80px]">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Sueldo</p>
                                                    <p className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                                                        ${displayAmount.toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div className="h-8 w-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
                                                {isExpanded ? (
                                                    <ChevronUp size={20} className="text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown size={20} className="text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!s?.isSelected && s?.amount !== undefined && (
                                        <div className="absolute inset-0 bg-muted/20 backdrop-blur-[1px] pointer-events-none" />
                                    )}
                                </Card>

                                {isExpanded && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pb-4">
                                        <TeacherPayrollSection 
                                            teacherId={teacher.id} 
                                            globalMonth={globalMonth}
                                            globalYear={globalYear}
                                            onDataChange={(data) => handleSettlementChange(teacher.id, data)}
                                            refreshKey={refreshKey}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

