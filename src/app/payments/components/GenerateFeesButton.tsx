"use client";

import { useTransition, useState } from "react";
import { generateMonthlyFeesAction, generateYearlyEnrollmentFeesAction } from "../billingActions";
import { Button } from "@/components/ui/Button";
import { Calculator, ChevronDown, Calendar, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export function GenerateFeesButton() {
    const [isPending, startTransition] = useTransition();
    const [showOptions, setShowOptions] = useState(false);
    const [mode, setMode] = useState<"MONTHLY" | "ENROLLMENT">("MONTHLY");
    
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [enrollmentAmount, setEnrollmentAmount] = useState<number>(0);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const handleGenerate = () => {
        if (mode === "MONTHLY") {
            const monthName = months[month - 1];
            if (!confirm(`¿Generar todas las cuotas de ${monthName} ${year} para los alumnos inscriptos?`)) return;

            startTransition(async () => {
                const res = await generateMonthlyFeesAction(month, year);
                if (res.success) {
                    toast.success(`Se generaron ${res.count} cuotas mensuales para ${monthName} ${year}.`);
                    setShowOptions(false);
                } else {
                    toast.error(res.error || "Error al generar cuotas");
                }
            });
        } else {
            if (enrollmentAmount <= 0) {
                toast.error("Debes ingresar un monto base válido para las matrículas.");
                return;
            }
            if (!confirm(`¿Generar masivamente las Matrículas Anuales ${year} para TODOS los alumnos activos por un valor de $${enrollmentAmount}?`)) return;

            startTransition(async () => {
                const res = await generateYearlyEnrollmentFeesAction(year, enrollmentAmount);
                if (res.success) {
                    toast.success(`Se generaron ${res.count} matrículas anuales para ${year}.`);
                    setShowOptions(false);
                } else {
                    toast.error(res.error || "Error al generar matrículas");
                }
            });
        }
    };

    return (
        <div className="relative inline-flex flex-col items-end">
            <div className="flex items-center gap-1">
                <Button 
                    onClick={() => setShowOptions(!showOptions)}
                    variant="outline"
                    className="flex items-center gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 h-10 px-3 rounded-r-none border-r-0"
                    title="Configurar mes/año"
                >
                    <Calendar size={16} />
                    <span className="text-xs font-bold">{months[month-1]} {year}</span>
                    <ChevronDown size={14} className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} />
                </Button>
                
                <Button 
                    onClick={handleGenerate} 
                    disabled={isPending}
                    className={`flex items-center gap-2 text-white h-10 px-4 rounded-l-none shadow-sm ${mode === "MONTHLY" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                    {isPending ? (
                        "Generando..."
                    ) : (
                        <>
                            <Calculator size={16} />
                            Generar {mode === "MONTHLY" ? "Cuotas" : "Matrículas"}
                        </>
                    )}
                </Button>
            </div>

            {showOptions && (
                <div className="absolute top-full mt-2 right-0 z-50 bg-card border border-border/60 shadow-xl rounded-2xl p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex gap-2 mb-4 bg-muted/50 p-1 rounded-lg">
                        <button 
                            className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${mode === "MONTHLY" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setMode("MONTHLY")}
                        >
                            Mensual
                        </button>
                        <button 
                            className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${mode === "ENROLLMENT" ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setMode("ENROLLMENT")}
                        >
                            Matrícula
                        </button>
                    </div>

                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        {mode === "MONTHLY" ? "Seleccionar Período" : "Configurar Matrícula Anual"}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        {mode === "MONTHLY" && (
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground uppercase">Mes</label>
                                <select 
                                    value={month} 
                                    onChange={(e) => setMonth(parseInt(e.target.value))}
                                    className="w-full bg-muted/40 border border-border/40 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500/30"
                                >
                                    {months.map((m, i) => (
                                        <option key={i+1} value={i+1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className={`space-y-1 ${mode === "ENROLLMENT" ? "col-span-2" : ""}`}>
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">Año</label>
                            <select 
                                value={year} 
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className={`w-full bg-muted/40 border border-border/40 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 ${mode === "MONTHLY" ? "focus:ring-emerald-500/30" : "focus:ring-blue-500/30"}`}
                            >
                                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {mode === "ENROLLMENT" && (
                        <div className="space-y-1 animate-in fade-in">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">Valor Base de la Matrícula ($)</label>
                            <input 
                                type="number" 
                                min="1"
                                placeholder="Ej: 15000"
                                value={enrollmentAmount || ""}
                                onChange={(e) => setEnrollmentAmount(parseFloat(e.target.value))}
                                className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
                                Se generará automáticamente una deuda por este monto para <b>todos</b> los estudiantes activos que aún no tengan matrícula en el año seleccionado.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
