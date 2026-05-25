"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { 
    ClipboardList, Plus, Trash2, ArrowRight, Loader2, 
    X, AlertCircle, Sparkles, CheckCircle2, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
}

interface Template {
    id: string;
    name: string;
    periodType: string;
    periodCount: number;
    periodLabels: string[];
    categories: Category[];
}

interface PeriodStat {
    periodIndex: number;
    periodLabel: string;
    gradedCount: number;
    publishedCount: number;
    totalStudents: number;
}

interface LinkedTemplate {
    id: string;
    templateId: string;
    isActive: boolean;
    template: Template;
    stats: PeriodStat[];
}

interface CourseReportsPanelProps {
    courseId: string;
    userRole: string;
}

export function CourseReportsPanel({ courseId, userRole }: CourseReportsPanelProps) {
    const [linked, setLinked] = useState<LinkedTemplate[]>([]);
    const [available, setAvailable] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLinkingOpen, setIsLinkingOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [isUnlinkingTemplate, setIsUnlinkingTemplate] = useState<LinkedTemplate | null>(null);
    const [isPending, startTransition] = useTransition();

    const isStaff = userRole === "ADMIN" || userRole === "SECRETARY" || userRole === "SUPERADMIN";

    const fetchReportsData = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/reports`);
            if (!res.ok) throw new Error("Error al cargar los informes del curso");
            const data = await res.json();
            setLinked(data.linked || []);
            setAvailable(data.available || []);
        } catch (err: any) {
            toast.error(err.message || "No se pudieron obtener las plantillas");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReportsData();
    }, [courseId]);

    const handleLinkTemplate = () => {
        if (!selectedTemplateId) {
            toast.error("Por favor selecciona una plantilla.");
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}/reports`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ templateId: selectedTemplateId })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "No se pudo vincular la plantilla.");
                }

                toast.success("¡Plantilla vinculada con éxito!");
                setIsLinkingOpen(false);
                setSelectedTemplateId("");
                fetchReportsData();
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    const handleUnlinkTemplate = () => {
        if (!isUnlinkingTemplate) return;

        startTransition(async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}/reports/${isUnlinkingTemplate.templateId}`, {
                    method: "DELETE"
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "No se pudo desvincular la plantilla.");
                }

                toast.success("¡Plantilla desvinculada con éxito!");
                setIsUnlinkingTemplate(null);
                fetchReportsData();
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 border rounded-3xl bg-card/60 backdrop-blur-sm border-border/40">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="font-semibold text-muted-foreground">Cargando sección de informes...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header y Panel General */}
            <div className="p-6 rounded-3xl shadow-md border border-border/40 bg-card/60 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-2xl shrink-0 dark:bg-blue-500/20">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Informes y Boletines Académicos
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] uppercase font-bold rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                                    Fase 1
                                </span>
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Carga de boletines institucionales calificados y seguimiento por período.
                            </p>
                        </div>
                    </div>

                    {isStaff && (
                        <Button
                            onClick={() => setIsLinkingOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <Plus size={18} />
                            Vincular Plantilla
                        </Button>
                    )}
                </div>

                {linked.length === 0 ? (
                    <div className="text-center p-10 border border-dashed rounded-2xl border-border/50 bg-muted/20 text-muted-foreground flex flex-col items-center justify-center">
                        <ClipboardList size={40} className="mb-3 opacity-30 text-blue-500" />
                        <h4 className="font-bold text-foreground mb-1 text-sm">Sin plantillas vinculadas</h4>
                        <p className="text-xs max-w-md leading-relaxed">
                            {isStaff 
                                ? "Para comenzar a evaluar a los alumnos, vincula una plantilla de boletín para este curso usando el botón de arriba."
                                : "No hay plantillas de boletines vinculadas a este curso para evaluar todavía."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {linked.map((crt) => {
                            // Sum of all progress
                            const activeStudents = crt.stats[0]?.totalStudents || 0;
                            
                            return (
                                <div 
                                    key={crt.id} 
                                    className="p-5 rounded-2xl border border-border/60 bg-background/50 hover:bg-background/80 hover:border-primary/20 transition-all flex flex-col justify-between group shadow-sm hover:shadow"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div>
                                                <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                    {crt.template.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                    <Calendar size={12} className="opacity-70" />
                                                    Estructura: {crt.template.periodLabels.length} Períodos ({crt.template.periodType === 'QUARTERLY' ? 'Trimestral' : crt.template.periodType === 'BIMONTHLY' ? 'Bimestral' : crt.template.periodType === 'MONTHLY' ? 'Mensual' : 'Personalizado'})
                                                </p>
                                            </div>
                                            
                                            {isStaff && (
                                                <button
                                                    onClick={() => setIsUnlinkingTemplate(crt)}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors opacity-60 hover:opacity-100"
                                                    title="Desvincular plantilla"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Períodos e Indicadores de Carga */}
                                        <div className="space-y-3 mb-5 border-t border-border/40 pt-4">
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                Progreso por Período
                                            </div>
                                            {crt.stats.map((stat) => {
                                                const gradedPct = activeStudents > 0 
                                                    ? Math.round((stat.gradedCount / activeStudents) * 100) 
                                                    : 0;

                                                const isCompleted = stat.gradedCount === activeStudents && activeStudents > 0;
                                                const isPublished = stat.publishedCount === activeStudents && activeStudents > 0;

                                                return (
                                                    <div key={stat.periodIndex} className="text-xs">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-medium text-foreground">
                                                                {stat.periodLabel}
                                                            </span>
                                                            <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
                                                                {stat.gradedCount}/{activeStudents} alumnos
                                                                {isPublished && (
                                                                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold rounded text-[9px] uppercase">
                                                                        Publicado
                                                                    </span>
                                                                )}
                                                                {!isPublished && stat.publishedCount > 0 && (
                                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold rounded text-[9px] uppercase">
                                                                        Parcial ({stat.publishedCount})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                            <div 
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-500",
                                                                    isPublished ? "bg-emerald-500" : isCompleted ? "bg-blue-500" : "bg-primary/60"
                                                                )}
                                                                style={{ width: `${gradedPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border/40">
                                        <Link href={`/courses/${courseId}/reports/${crt.template.id}`}>
                                            <Button 
                                                className="w-full bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:border-transparent font-semibold flex items-center justify-center gap-2 py-2 rounded-xl transition-all group-hover:translate-x-0"
                                            >
                                                Cargar Notas / Evaluar
                                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal para Vincular Plantilla */}
            {isLinkingOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="absolute inset-0 cursor-pointer" 
                        onClick={() => setIsLinkingOpen(false)} 
                    />
                    <div className="z-[101] w-full max-w-md bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Sparkles className="text-blue-500 h-5 w-5" />
                                Vincular Plantilla de Informe
                            </h3>
                            <button 
                                onClick={() => setIsLinkingOpen(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                            Selecciona una de las plantillas disponibles del instituto para incorporarla a la evaluación académica de este curso.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase">
                                    Plantillas disponibles
                                </label>
                                {available.length === 0 ? (
                                    <div className="p-4 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                                        No hay plantillas de boletines activas disponibles. Crea una primero en el Hub Académico.
                                    </div>
                                ) : (
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        className="w-full bg-background border border-border/80 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                                    >
                                        <option value="">-- Selecciona una plantilla --</option>
                                        {available.map((tpl) => (
                                            <option key={tpl.id} value={tpl.id}>
                                                {tpl.name} ({tpl.periodLabels.length} Períodos)
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setIsLinkingOpen(false)}
                                className="rounded-xl border-border hover:bg-muted font-semibold text-xs"
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleLinkTemplate}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                                disabled={isPending || !selectedTemplateId}
                            >
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Vincular Plantilla
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Confirmar Desvinculación */}
            {isUnlinkingTemplate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="absolute inset-0 cursor-pointer" 
                        onClick={() => setIsUnlinkingTemplate(null)} 
                    />
                    <div className="z-[101] w-full max-w-md bg-card text-card-foreground p-6 rounded-2xl border border-red-500/20 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 text-red-600 mb-3">
                            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-xl">
                                <AlertCircle size={20} />
                            </div>
                            <h3 className="text-lg font-bold">Desvincular Plantilla</h3>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <p className="text-sm text-foreground font-medium">
                                ¿Estás seguro de que quieres desvincular <strong>"{isUnlinkingTemplate.template.name}"</strong> de este curso?
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                                <strong>Atención:</strong> Esta acción quitará el acceso del profesor para cargar notas con esta plantilla en este curso. Los boletines con notas ya calificados para los alumnos se mantendrán pero no se podrán ver ni editar dentro del curso.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsUnlinkingTemplate(null)}
                                className="rounded-xl border-border hover:bg-muted font-semibold text-xs"
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleUnlinkTemplate}
                                className="bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                                disabled={isPending}
                            >
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Confirmar Desvinculación
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
