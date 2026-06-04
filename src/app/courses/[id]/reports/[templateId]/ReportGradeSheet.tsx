"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { 
    Save, Send, Calendar, Clock, AlertTriangle, 
    Check, Loader2, Sparkles, X, Undo2, Ban, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    scaleType: string;
    scaleMin?: number | null;
    scaleMax?: number | null;
    scaleOptions: any; // Json array
}

interface Template {
    id: string;
    name: string;
    periodType: string;
    periodCount: number;
    periodLabels: string[];
    categories: Category[];
}

interface StudentRow {
    id: string;
    name: string;
    publishedAt: string | null;
}

interface GradeState {
    [studentId: string]: {
        teacherComments: string;
        entries: {
            [categoryId: string]: string;
        };
    };
}

interface ReportGradeSheetProps {
    courseId: string;
    template: Template;
    userRole: string;
}

export function ReportGradeSheet({ courseId, template, userRole }: ReportGradeSheetProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(0);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [grades, setGrades] = useState<GradeState>({});
    const [savedGrades, setSavedGrades] = useState<GradeState>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Publish modal state
    const [isPublishOpen, setIsPublishOpen] = useState(false);
    const [publishType, setPublishType] = useState<"now" | "future">("now");
    const [publishDate, setPublishDate] = useState("");

    const fetchGrades = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `/api/courses/${courseId}/reports/${template.id}/entries?year=${selectedYear}&periodIndex=${selectedPeriod}`
            );
            if (!res.ok) throw new Error("Error al cargar la planilla de notas.");
            const data = await res.json();

            const initialGrades: GradeState = {};
            const studentRows: StudentRow[] = [];

            data.students.forEach((row: any) => {
                studentRows.push({
                    id: row.id,
                    name: row.name,
                    publishedAt: row.report?.publishedAt || null
                });

                initialGrades[row.id] = {
                    teacherComments: row.report?.teacherComments || "",
                    entries: {}
                };

                // Initialize categories
                template.categories.forEach(cat => {
                    initialGrades[row.id].entries[cat.id] = "";
                });

                // Fill with existing values
                row.report?.entries?.forEach((entry: any) => {
                    initialGrades[row.id].entries[entry.categoryId] = entry.value || "";
                });
            });

            setStudents(studentRows);
            setGrades(initialGrades);
            setSavedGrades(JSON.parse(JSON.stringify(initialGrades)));
        } catch (err: any) {
            toast.error(err.message || "No se pudieron obtener las calificaciones");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, [courseId, selectedPeriod, selectedYear]);

    const handleGradeChange = (studentId: string, categoryId: string, value: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                entries: {
                    ...prev[studentId].entries,
                    [categoryId]: value
                }
            }
        }));
    };

    const handleCommentChange = (studentId: string, value: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                teacherComments: value
            }
        }));
    };

    // Check if cell has been modified compared to saved state
    const isModified = (studentId: string, categoryId?: string) => {
        const current = grades[studentId];
        const saved = savedGrades[studentId];
        if (!current || !saved) return false;

        if (categoryId) {
            return current.entries[categoryId] !== saved.entries[categoryId];
        }

        // Check if comments or any category has changed
        if (current.teacherComments !== saved.teacherComments) return true;
        return Object.keys(current.entries).some(
            catId => current.entries[catId] !== saved.entries[catId]
        );
    };

    // Total modified students
    const totalModified = students.filter(s => isModified(s.id)).length;

    const handleSaveDraft = async () => {
        startTransition(async () => {
            try {
                const reportsToSave = students.map(student => ({
                    studentId: student.id,
                    teacherComments: grades[student.id]?.teacherComments || "",
                    entries: Object.keys(grades[student.id]?.entries || {}).map(categoryId => ({
                        categoryId,
                        value: grades[student.id].entries[categoryId]
                    }))
                }));

                const res = await fetch(`/api/courses/${courseId}/reports/${template.id}/entries`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        year: selectedYear,
                        periodIndex: selectedPeriod,
                        reports: reportsToSave
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Error al guardar el borrador.");
                }

                toast.success("¡Borrador guardado con éxito!");
                fetchGrades();
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    const handlePublish = async (unpublish = false) => {
        startTransition(async () => {
            try {
                let pubAtValue: string | null = null;
                
                if (!unpublish) {
                    if (publishType === "now") {
                        pubAtValue = new Date().toISOString();
                    } else {
                        if (!publishDate) {
                            toast.error("Por favor selecciona una fecha de programación.");
                            return;
                        }
                        pubAtValue = new Date(publishDate).toISOString();
                    }
                }

                const res = await fetch(`/api/courses/${courseId}/reports/${template.id}/publish`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        year: selectedYear,
                        periodIndex: selectedPeriod,
                        publishedAt: pubAtValue
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Error al publicar los boletines.");
                }

                if (unpublish) {
                    toast.success("Boletines puestos en borrador (despublicados).");
                } else if (publishType === "now") {
                    toast.success("¡Boletines publicados correctamente!");
                } else {
                    toast.success(`Boletines programados para el ${new Date(publishDate).toLocaleDateString()}`);
                }

                setIsPublishOpen(false);
                fetchGrades();
            } catch (err: any) {
                toast.error(err.message);
            }
        });
    };

    // Calculate details for publication status
    const publishedAt = students[0]?.publishedAt || null;
    const isCurrentlyPublished = publishedAt !== null && new Date(publishedAt) <= new Date();
    const isCurrentlyScheduled = publishedAt !== null && new Date(publishedAt) > new Date();

    const getStatusBadge = () => {
        if (isCurrentlyPublished) {
            return (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold rounded-xl text-xs uppercase flex items-center gap-1">
                    <Check size={14} strokeWidth={3} /> Publicado
                </span>
            );
        }
        if (isCurrentlyScheduled) {
            return (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold rounded-xl text-xs uppercase flex items-center gap-1">
                    <Clock size={14} /> Programado ({new Date(publishedAt!).toLocaleDateString()})
                </span>
            );
        }
        return (
            <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 font-bold rounded-xl text-xs uppercase flex items-center gap-1">
                <Ban size={14} /> En Borrador
            </span>
        );
    };

    // Count statistics
    const totalEnrolled = students.length;
    const gradedCount = students.filter(s => {
        const current = grades[s.id];
        if (!current) return false;
        // Graded if at least one entry has value
        return Object.values(current.entries).some(v => v !== "");
    }).length;

    return (
        <div className="space-y-6">
            {/* Cabecera de filtros y estados */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-background/40 border border-border/20 rounded-2xl">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Filtro Período */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Período</label>
                        <div className="flex bg-muted p-1 rounded-xl gap-1">
                            {template.periodLabels.map((label, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedPeriod(idx)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                        selectedPeriod === idx 
                                            ? "bg-card text-foreground shadow-sm" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtro Año */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Año Lectivo</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-muted border-none px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                            {[...Array(5)].map((_, i) => {
                                const y = new Date().getFullYear() - 2 + i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Evaluados</p>
                        <p className="text-xs font-semibold text-foreground">
                            {gradedCount} de {totalEnrolled} Alumnos ({totalEnrolled > 0 ? Math.round((gradedCount / totalEnrolled) * 100) : 0}%)
                        </p>
                    </div>
                    {getStatusBadge()}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                    <span className="font-semibold text-muted-foreground">Cargando planilla de calificaciones...</span>
                </div>
            ) : students.length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-3xl text-muted-foreground">
                    No hay estudiantes activos inscritos en este curso para calificar.
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Grilla / Tabla */}
                    <div className="overflow-x-auto rounded-2xl border border-border/40 bg-background/30 shadow-inner">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-border/40 bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="p-4 w-[250px] sticky left-0 bg-card z-10">Alumno</th>
                                    {template.categories.map(cat => (
                                        <th key={cat.id} className="p-4 text-center">
                                            {cat.name}
                                            {cat.scaleType === 'NUMERIC' && (
                                                <span className="block text-[9px] lowercase font-normal opacity-60">
                                                    ({cat.scaleMin ?? 1} - {cat.scaleMax ?? 10})
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                    <th className="p-4 w-[350px]">Comentarios / Observaciones</th>
                                    <th className="p-4 w-[80px] text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const stGrades = grades[student.id];
                                    if (!stGrades) return null;

                                    const isRowModified = isModified(student.id);

                                    return (
                                        <tr 
                                            key={student.id} 
                                            className={cn(
                                                "border-b border-border/30 hover:bg-muted/10 transition-colors text-sm",
                                                isRowModified && "bg-amber-500/[0.02]"
                                            )}
                                        >
                                            {/* Alumno (Sticky) */}
                                            <td className="p-4 font-semibold sticky left-0 bg-card z-10 border-r border-border/30">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        isRowModified ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
                                                    )} />
                                                    {student.name}
                                                </div>
                                            </td>

                                            {/* Criterios / Categorías */}
                                            {template.categories.map(cat => {
                                                const val = stGrades.entries[cat.id] || "";
                                                const cellModified = isModified(student.id, cat.id);

                                                return (
                                                    <td key={cat.id} className="p-2 text-center align-middle">
                                                        {cat.scaleType === "NUMERIC" ? (
                                                            <input
                                                                type="number"
                                                                min={cat.scaleMin ?? undefined}
                                                                max={cat.scaleMax ?? undefined}
                                                                step="0.1"
                                                                value={val}
                                                                onChange={(e) => handleGradeChange(student.id, cat.id, e.target.value)}
                                                                className={cn(
                                                                    "w-16 h-9 px-2 text-center text-sm font-semibold bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40",
                                                                    cellModified ? "border-amber-400 focus:ring-amber-400" : "border-border/60"
                                                                )}
                                                                placeholder="-"
                                                            />
                                                        ) : (
                                                            <select
                                                                value={val}
                                                                onChange={(e) => handleGradeChange(student.id, cat.id, e.target.value)}
                                                                className={cn(
                                                                    "w-28 h-9 px-2 text-xs font-semibold bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40",
                                                                    cellModified ? "border-amber-400 focus:ring-amber-400" : "border-border/60"
                                                                )}
                                                            >
                                                                <option value="">--</option>
                                                                {(cat.scaleOptions || []).map((opt: any) => (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {opt.value}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            {/* Comentarios del Profesor */}
                                            <td className="p-2">
                                                <textarea
                                                    rows={1}
                                                    value={stGrades.teacherComments}
                                                    onChange={(e) => handleCommentChange(student.id, e.target.value)}
                                                    placeholder="Comentarios adicionales sobre el desempeño..."
                                                    className={cn(
                                                        "w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none h-9 align-middle",
                                                        isModified(student.id) && stGrades.teacherComments !== savedGrades[student.id]?.teacherComments
                                                            ? "border-amber-400 focus:ring-amber-400"
                                                            : "border-border/60"
                                                    )}
                                                />
                                            </td>

                                            {/* Estado Fila */}
                                            <td className="p-2 text-center align-middle">
                                                {isRowModified ? (
                                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-2 py-1 rounded">
                                                        Modificado
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-2 py-1 rounded">
                                                        Guardado
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Barra de Acciones */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                        <div className="text-xs text-muted-foreground font-medium">
                            {totalModified > 0 ? (
                                <span className="text-amber-500 font-semibold flex items-center gap-1">
                                    <AlertTriangle size={14} />
                                    Tienes {totalModified} fila(s) con cambios sin guardar.
                                </span>
                            ) : (
                                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                    <Check size={14} strokeWidth={3} />
                                    Todo guardado. No hay cambios pendientes.
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Restablecer Cambios */}
                            {totalModified > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={fetchGrades}
                                    disabled={isPending}
                                    className="rounded-xl font-semibold text-xs text-muted-foreground border-border/80"
                                >
                                    <Undo2 size={14} className="mr-1" /> Descartar
                                </Button>
                            )}

                            {/* Guardar Borrador */}
                            <Button
                                onClick={handleSaveDraft}
                                disabled={isPending || totalModified === 0}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                                {isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Save size={14} />
                                )}
                                Guardar Borrador
                            </Button>

                            {/* Publicar/Programar */}
                            {publishedAt ? (
                                <Button
                                    onClick={() => handlePublish(true)}
                                    disabled={isPending}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 hover:border-transparent font-semibold rounded-xl text-xs flex items-center gap-1.5"
                                >
                                    {isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Ban size={14} />
                                    )}
                                    Despublicar boletín
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setIsPublishOpen(true)}
                                    disabled={isPending}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                    <Send size={14} />
                                    Publicar / Programar...
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Publicación */}
            {isPublishOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="absolute inset-0 cursor-pointer" 
                        onClick={() => setIsPublishOpen(false)} 
                    />
                    <div className="z-[101] w-full max-w-md bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Sparkles className="text-emerald-500 h-5 w-5" />
                                Publicar Boletín Académico
                            </h3>
                            <button 
                                onClick={() => setIsPublishOpen(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {totalModified > 0 && (
                            <div className="p-3 border border-amber-500/20 bg-amber-500/5 text-amber-600 rounded-xl text-xs flex gap-2 items-start mb-4">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Tienes cambios sin guardar</p>
                                    <p className="opacity-80">Por favor, guarda tu borrador de calificaciones antes de proceder a la publicación.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 text-xs">
                            <p className="text-muted-foreground leading-relaxed">
                                Selecciona el modo de entrega de boletines para el <strong>{template.periodLabels[selectedPeriod]}</strong> en este curso. Los alumnos y tutores solo podrán visualizarlos a partir de la fecha seleccionada.
                            </p>

                            <div className="space-y-2.5">
                                <label className="font-bold text-muted-foreground uppercase block">Modo de Publicación</label>
                                
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 p-3 border rounded-xl hover:bg-muted/40 cursor-pointer font-semibold transition-colors">
                                        <input
                                            type="radio"
                                            name="publishType"
                                            checked={publishType === "now"}
                                            onChange={() => setPublishType("now")}
                                            className="text-primary"
                                        />
                                        <div>
                                            <p className="text-foreground">Publicar Ahora</p>
                                            <p className="text-[10px] font-normal text-muted-foreground">Los boletines quedan inmediatamente visibles en el panel de alumnos/tutores.</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-2 p-3 border rounded-xl hover:bg-muted/40 cursor-pointer font-semibold transition-colors">
                                        <input
                                            type="radio"
                                            name="publishType"
                                            checked={publishType === "future"}
                                            onChange={() => setPublishType("future")}
                                            className="text-primary"
                                        />
                                        <div>
                                            <p className="text-foreground">Programar Publicación</p>
                                            <p className="text-[10px] font-normal text-muted-foreground">Los boletines se mantendrán ocultos hasta la fecha establecida.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {publishType === "future" && (
                                <div className="space-y-1 bg-muted/40 p-3 rounded-xl border border-border/40 animate-in slide-in-from-top-2">
                                    <label className="font-bold text-muted-foreground uppercase block mb-1">Fecha de publicación programada</label>
                                    <input
                                        type="date"
                                        value={publishDate}
                                        onChange={(e) => setPublishDate(e.target.value)}
                                        className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 font-semibold"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setIsPublishOpen(false)}
                                className="rounded-xl border-border hover:bg-muted font-semibold text-xs"
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => handlePublish(false)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                                disabled={isPending || totalModified > 0 || (publishType === "future" && !publishDate)}
                            >
                                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Confirmar Publicación
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
