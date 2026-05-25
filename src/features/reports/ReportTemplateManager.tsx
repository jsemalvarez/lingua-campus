"use client";

import * as React from "react";
import {
    Plus, ClipboardList, Trash2, Pencil, GripVertical,
    ChevronDown, ChevronUp, Hash, Type, ToggleLeft, Copy,
    CheckCircle2, Clock, AlertCircle, MessageSquare,
    PenLine, Users2, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScaleType = "NUMERIC" | "CONCEPTUAL" | "LETTER" | "CUSTOM";

interface ScaleOption {
    label: string;
    value: string;
}

interface ReportCategory {
    id: string;
    name: string;
    scaleType: ScaleType;
    scaleMin?: number;
    scaleMax?: number;
    scaleOptions: ScaleOption[];
}

type PeriodType = "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "CUSTOM";

interface SpecialFields {
    teacherComments: boolean;   // Fila "Comentarios del Profesor"
    teacherSignature: boolean;  // Columna "Firma del Profesor"
    parentSignature: boolean;   // Columna "Firma del Padre/Tutor"
    studentSignature: boolean;  // Columna "Firma del Alumno"
}

interface ReportTemplate {
    id: string;
    name: string;
    periodType: PeriodType;
    periodLabels: string[];
    categories: ReportCategory[];
    specialFields: SpecialFields;
    isActive: boolean;
    createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_PRESETS: Record<PeriodType, { label: string; labels: string[] }> = {
    MONTHLY: {
        label: "Mensual (12 períodos)",
        labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    },
    BIMONTHLY: {
        label: "Bimestral (6 períodos)",
        labels: ["1° Bimestre", "2° Bimestre", "3° Bimestre", "4° Bimestre", "5° Bimestre", "6° Bimestre"],
    },
    QUARTERLY: {
        label: "Trimestral (3 períodos)",
        labels: ["1° Trimestre", "2° Trimestre", "3° Trimestre"],
    },
    CUSTOM: {
        label: "Personalizado",
        labels: [],
    },
};

const SCALE_PRESETS: Record<ScaleType, { label: string; icon: React.ElementType; description: string }> = {
    NUMERIC: { label: "Numérica", icon: Hash, description: "Rango de números (ej: 1 a 10)" },
    CONCEPTUAL: { label: "Conceptual", icon: CheckCircle2, description: "E / MB / B / R" },
    LETTER: { label: "Letras", icon: Type, description: "A / B / C / D / F" },
    CUSTOM: { label: "Personalizada", icon: ToggleLeft, description: "Definís vos las opciones" },
};

const DEFAULT_SCALE_OPTIONS: Record<ScaleType, ScaleOption[]> = {
    NUMERIC: [],
    CONCEPTUAL: [
        { label: "Excelente", value: "E" },
        { label: "Muy Bueno", value: "MB" },
        { label: "Bueno", value: "B" },
        { label: "Regular", value: "R" },
    ],
    LETTER: [
        { label: "A", value: "A" },
        { label: "B", value: "B" },
        { label: "C", value: "C" },
        { label: "D", value: "D" },
        { label: "F", value: "F" },
    ],
    CUSTOM: [],
};

const DEFAULT_SPECIAL_FIELDS: SpecialFields = {
    teacherComments: true,
    teacherSignature: true,
    parentSignature: true,
    studentSignature: false,
};

const SPECIAL_FIELD_META: {
    key: keyof SpecialFields;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
}[] = [
    {
        key: "teacherComments",
        label: "Comentarios del Profesor",
        description: "Fila de texto libre al pie del informe",
        icon: MessageSquare,
        color: "text-blue-500",
    },
    {
        key: "teacherSignature",
        label: "Firma del Profesor",
        description: "Columna de firma del docente",
        icon: PenLine,
        color: "text-violet-500",
    },
    {
        key: "parentSignature",
        label: "Firma del Padre/Tutor",
        description: "Columna de firma del tutor legal",
        icon: Users2,
        color: "text-emerald-500",
    },
    {
        key: "studentSignature",
        label: "Firma del Alumno",
        description: "Columna de firma del propio alumno",
        icon: UserCheck,
        color: "text-amber-500",
    },
];

// ─── Demo seed data ───────────────────────────────────────────────────────────

const SEED_TEMPLATES: ReportTemplate[] = [
    {
        id: "tpl-1",
        name: "Boletín Trimestral — Adultos",
        periodType: "QUARTERLY",
        periodLabels: ["1° Trimestre", "2° Trimestre", "3° Trimestre"],
        isActive: true,
        createdAt: "2025-03-01T00:00:00Z",
        specialFields: { teacherComments: true, teacherSignature: true, parentSignature: true, studentSignature: false },
        categories: [
            { id: "c1", name: "Oral Work", scaleType: "NUMERIC", scaleMin: 1, scaleMax: 10, scaleOptions: [] },
            { id: "c2", name: "Written Work", scaleType: "NUMERIC", scaleMin: 1, scaleMax: 10, scaleOptions: [] },
            { id: "c3", name: "Listening Comprehension", scaleType: "NUMERIC", scaleMin: 1, scaleMax: 10, scaleOptions: [] },
            { id: "c4", name: "Reading Comprehension", scaleType: "NUMERIC", scaleMin: 1, scaleMax: 10, scaleOptions: [] },
            { id: "c5", name: "Attitude in Class", scaleType: "CONCEPTUAL", scaleOptions: DEFAULT_SCALE_OPTIONS.CONCEPTUAL },
        ],
    },
    {
        id: "tpl-2",
        name: "Boletín Trimestral — Niños",
        periodType: "QUARTERLY",
        periodLabels: ["1° Trimestre", "2° Trimestre", "3° Trimestre"],
        isActive: true,
        createdAt: "2025-03-01T00:00:00Z",
        specialFields: { teacherComments: true, teacherSignature: true, parentSignature: true, studentSignature: false },
        categories: [
            { id: "c6", name: "Participación Oral", scaleType: "CONCEPTUAL", scaleOptions: DEFAULT_SCALE_OPTIONS.CONCEPTUAL },
            { id: "c7", name: "Comprensión", scaleType: "CONCEPTUAL", scaleOptions: DEFAULT_SCALE_OPTIONS.CONCEPTUAL },
            { id: "c8", name: "Producción Escrita", scaleType: "CONCEPTUAL", scaleOptions: DEFAULT_SCALE_OPTIONS.CONCEPTUAL },
            { id: "c9", name: "Comportamiento", scaleType: "CONCEPTUAL", scaleOptions: DEFAULT_SCALE_OPTIONS.CONCEPTUAL },
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function newCategory(): ReportCategory {
    return { id: uid(), name: "", scaleType: "NUMERIC", scaleMin: 1, scaleMax: 10, scaleOptions: [] };
}

function newTemplate(): ReportTemplate {
    return {
        id: uid(),
        name: "",
        periodType: "QUARTERLY",
        periodLabels: [...PERIOD_PRESETS.QUARTERLY.labels],
        categories: [newCategory()],
        specialFields: { ...DEFAULT_SPECIAL_FIELDS },
        isActive: true,
        createdAt: new Date().toISOString(),
    };
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                checked ? "bg-primary" : "bg-muted"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    checked ? "translate-x-4" : "translate-x-0"
                )}
            />
        </button>
    );
}

// ─── Scale badge ─────────────────────────────────────────────────────────────

function ScaleBadge({ scale }: { scale: ScaleType }) {
    const colors: Record<ScaleType, string> = {
        NUMERIC: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        CONCEPTUAL: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
        LETTER: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        CUSTOM: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
    const { icon: Icon } = SCALE_PRESETS[scale];
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide", colors[scale])}>
            <Icon size={10} />
            {SCALE_PRESETS[scale].label}
        </span>
    );
}

// ─── Period selector ─────────────────────────────────────────────────────────

function PeriodTypeSelector({ value, onChange }: { value: PeriodType; onChange: (type: PeriodType, labels: string[]) => void }) {
    const options: PeriodType[] = ["MONTHLY", "BIMONTHLY", "QUARTERLY", "CUSTOM"];
    return (
        <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt, opt !== "CUSTOM" ? [...PERIOD_PRESETS[opt].labels] : [])}
                    className={cn(
                        "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                        value === opt
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/30 hover:border-border/80 hover:bg-muted/50 text-foreground"
                    )}
                >
                    <span className="font-semibold text-sm">{PERIOD_PRESETS[opt].label}</span>
                    {opt !== "CUSTOM" && (
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                            {PERIOD_PRESETS[opt].labels.join(" · ")}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

// ─── Scale type selector ──────────────────────────────────────────────────────

function ScaleTypeSelector({ value, onChange }: { value: ScaleType; onChange: (t: ScaleType) => void }) {
    const options: ScaleType[] = ["NUMERIC", "CONCEPTUAL", "LETTER", "CUSTOM"];
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const { icon: Icon, label, description } = SCALE_PRESETS[opt];
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        title={description}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                            value === opt
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon size={12} />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Category Editor row ──────────────────────────────────────────────────────

function CategoryRow({ cat, index, total, onChange, onRemove, onMove }: {
    cat: ReportCategory;
    index: number;
    total: number;
    onChange: (updated: ReportCategory) => void;
    onRemove: () => void;
    onMove: (dir: "up" | "down") => void;
}) {
    function handleScaleChange(t: ScaleType) {
        onChange({ ...cat, scaleType: t, scaleMin: t === "NUMERIC" ? 1 : undefined, scaleMax: t === "NUMERIC" ? 10 : undefined, scaleOptions: DEFAULT_SCALE_OPTIONS[t] });
    }
    function handleOptionChange(idx: number, field: "label" | "value", val: string) {
        onChange({ ...cat, scaleOptions: cat.scaleOptions.map((o, i) => (i === idx ? { ...o, [field]: val } : o)) });
    }
    function addOption() { onChange({ ...cat, scaleOptions: [...cat.scaleOptions, { label: "", value: "" }] }); }
    function removeOption(idx: number) { onChange({ ...cat, scaleOptions: cat.scaleOptions.filter((_, i) => i !== idx) }); }

    return (
        <div className="group bg-card/50 border border-border/60 rounded-xl p-4 transition-all hover:border-border/90 hover:shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
                    <button type="button" disabled={index === 0} onClick={() => onMove("up")} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors p-0.5"><ChevronUp size={14} /></button>
                    <GripVertical size={14} className="text-border" />
                    <button type="button" disabled={index === total - 1} onClick={() => onMove("down")} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors p-0.5"><ChevronDown size={14} /></button>
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <Input placeholder="Nombre de la categoría (ej: Oral Work, Participación...)" value={cat.name} onChange={(e) => onChange({ ...cat, name: e.target.value })} className="h-9 text-sm font-medium bg-background/60" />
                        </div>
                        <button type="button" onClick={onRemove} className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100" title="Eliminar categoría">
                            <Trash2 size={15} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Escala de nota</span>
                        <ScaleTypeSelector value={cat.scaleType} onChange={handleScaleChange} />
                    </div>
                    {cat.scaleType === "NUMERIC" && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">Rango:</span>
                            <Input type="number" value={cat.scaleMin ?? 1} onChange={(e) => onChange({ ...cat, scaleMin: Number(e.target.value) })} className="h-8 w-20 text-sm text-center bg-background/60" min={0} />
                            <span className="text-muted-foreground text-xs">hasta</span>
                            <Input type="number" value={cat.scaleMax ?? 10} onChange={(e) => onChange({ ...cat, scaleMax: Number(e.target.value) })} className="h-8 w-20 text-sm text-center bg-background/60" min={1} />
                        </div>
                    )}
                    {cat.scaleType !== "NUMERIC" && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Opciones disponibles</span>
                                {(cat.scaleType === "CONCEPTUAL" || cat.scaleType === "LETTER") && (
                                    <span className="text-[10px] text-muted-foreground/70">(podés personalizar)</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {cat.scaleOptions.map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-1 bg-muted/40 rounded-lg px-2 py-1.5 border border-border/50">
                                        <Input value={opt.value} onChange={(e) => handleOptionChange(oi, "value", e.target.value)} placeholder="Valor" className="h-6 w-10 text-xs text-center border-none bg-transparent p-0 font-bold focus-visible:ring-0" />
                                        {cat.scaleType === "CUSTOM" && (
                                            <>
                                                <span className="text-muted-foreground text-xs">·</span>
                                                <Input value={opt.label} onChange={(e) => handleOptionChange(oi, "label", e.target.value)} placeholder="Etiqueta" className="h-6 w-20 text-xs border-none bg-transparent p-0 focus-visible:ring-0" />
                                            </>
                                        )}
                                        <button type="button" onClick={() => removeOption(oi)} className="text-muted-foreground hover:text-red-500 transition-colors ml-0.5"><Trash2 size={10} /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addOption} className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-semibold px-2 py-1.5 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 transition-colors">
                                    <Plus size={10} /> Agregar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Special Fields Panel ─────────────────────────────────────────────────────

function SpecialFieldsPanel({ value, onChange }: { value: SpecialFields; onChange: (sf: SpecialFields) => void }) {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-semibold">Campos especiales del informe</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Elementos estructurales que se agregan al informe además de las categorías de nota.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPECIAL_FIELD_META.map(({ key, label, description, icon: Icon, color }) => (
                    <div
                        key={key}
                        className={cn(
                            "flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all",
                            value[key]
                                ? "border-border bg-card"
                                : "border-border/40 bg-muted/20 opacity-60"
                        )}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("p-1.5 rounded-lg bg-muted shrink-0", color)}>
                                <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold leading-tight truncate">{label}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                            </div>
                        </div>
                        <Toggle checked={value[key]} onChange={(v) => onChange({ ...value, [key]: v })} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Grid Preview ─────────────────────────────────────────────────────────────

function GridPreview({ categories, specialFields }: { categories: ReportCategory[]; specialFields: SpecialFields }) {
    const sigCols = [
        specialFields.teacherSignature && "Firma Profesor",
        specialFields.parentSignature && "Firma Tutor",
        specialFields.studentSignature && "Firma Alumno",
    ].filter(Boolean) as string[];

    const demoStudents = ["García, Ana", "Miro, Juan F.", "Pérez, Sofía"];

    return (
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 overflow-x-auto">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vista previa de la grilla del profesor</p>
            <table className="text-xs w-full min-w-max">
                <thead>
                    <tr>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground bg-muted/60 rounded-l-lg whitespace-nowrap">Alumno</th>
                        {categories.map((cat) => (
                            <th key={cat.id} className="py-2 px-3 font-semibold text-center bg-muted/60 text-muted-foreground whitespace-nowrap max-w-[90px]">
                                {cat.name || "Sin nombre"}
                            </th>
                        ))}
                        {specialFields.teacherComments && (
                            <th className="py-2 px-3 font-semibold text-center bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap border-l border-border/40">
                                <span className="flex items-center gap-1 justify-center"><MessageSquare size={10} /> Comentarios</span>
                            </th>
                        )}
                        {sigCols.map((col) => (
                            <th key={col} className="py-2 px-3 font-semibold text-center bg-violet-500/10 text-violet-600 dark:text-violet-400 whitespace-nowrap border-l border-border/40">
                                <span className="flex items-center gap-1 justify-center"><PenLine size={10} /> {col.replace("Firma ", "")}</span>
                            </th>
                        ))}
                        {/* Empty rounded right corner */}
                        <th className="bg-muted/60 rounded-r-lg w-2" />
                    </tr>
                </thead>
                <tbody>
                    {demoStudents.map((name) => (
                        <tr key={name} className="border-t border-border/30">
                            <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">{name}</td>
                            {categories.map((cat) => (
                                <td key={cat.id} className="py-2 px-3 text-center">
                                    <span className="inline-block w-12 h-6 bg-background border border-border/60 rounded-md" />
                                </td>
                            ))}
                            {specialFields.teacherComments && (
                                <td className="py-2 px-3 text-center border-l border-border/20">
                                    <span className="inline-block w-24 h-6 bg-blue-500/5 border border-blue-500/20 rounded-md" />
                                </td>
                            )}
                            {sigCols.map((col) => (
                                <td key={col} className="py-2 px-3 text-center border-l border-border/20">
                                    <span className="inline-block w-16 h-6 bg-violet-500/5 border border-violet-500/20 rounded-md" />
                                </td>
                            ))}
                            <td />
                        </tr>
                    ))}
                    {/* Teacher comments row */}
                    {specialFields.teacherComments && (
                        <tr className="border-t-2 border-border/50">
                            <td colSpan={1} className="py-2 px-3 font-semibold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                <span className="flex items-center gap-1.5"><MessageSquare size={11} /> Comentarios del Profesor</span>
                            </td>
                            <td colSpan={categories.length + sigCols.length + 1} className="py-2 px-3">
                                <span className="inline-block w-full h-14 bg-blue-500/5 border border-blue-500/20 rounded-lg" />
                            </td>
                            <td />
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ─── Template Editor ──────────────────────────────────────────────────────────

function TemplateEditor({ initial, onSave, onCancel }: { initial: ReportTemplate; onSave: (t: ReportTemplate) => Promise<void>; onCancel: () => void }) {
    const [tpl, setTpl] = React.useState<ReportTemplate>(initial);
    const [step, setStep] = React.useState<"meta" | "categories">("meta");
    const [saving, setSaving] = React.useState(false);

    function updateCategory(idx: number, updated: ReportCategory) {
        const cats = [...tpl.categories]; cats[idx] = updated; setTpl({ ...tpl, categories: cats });
    }
    function removeCategory(idx: number) {
        if (tpl.categories.length <= 1) return;
        setTpl({ ...tpl, categories: tpl.categories.filter((_, i) => i !== idx) });
    }
    function moveCategory(idx: number, dir: "up" | "down") {
        const cats = [...tpl.categories];
        const ni = dir === "up" ? idx - 1 : idx + 1;
        if (ni < 0 || ni >= cats.length) return;
        [cats[idx], cats[ni]] = [cats[ni], cats[idx]];
        setTpl({ ...tpl, categories: cats });
    }
    function handlePeriodChange(type: PeriodType, labels: string[]) { setTpl({ ...tpl, periodType: type, periodLabels: labels }); }
    function handleLabelChange(idx: number, val: string) {
        const labels = [...tpl.periodLabels]; labels[idx] = val; setTpl({ ...tpl, periodLabels: labels });
    }
    function addCustomPeriod() { setTpl({ ...tpl, periodLabels: [...tpl.periodLabels, `Período ${tpl.periodLabels.length + 1}`] }); }
    function removeCustomPeriod(idx: number) {
        if (tpl.periodLabels.length <= 1) return;
        setTpl({ ...tpl, periodLabels: tpl.periodLabels.filter((_, i) => i !== idx) });
    }
    async function handleSave() {
        if (!tpl.name.trim()) return;
        setSaving(true);
        try {
            await onSave(tpl);
        } catch (error) {
            console.error("Error saving template:", error);
        } finally {
            setSaving(false);
        }
    }

    const canProceed = tpl.name.trim().length > 2 && tpl.periodLabels.length > 0;
    const canSave = canProceed && tpl.categories.every((c) => c.name.trim().length > 0);

    return (
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0"><ClipboardList size={18} /></div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-base truncate">{initial.name ? `Editar: ${initial.name}` : "Nueva Plantilla de Informe"}</h3>
                        <p className="text-xs text-muted-foreground">Definí los períodos, categorías y campos especiales</p>
                    </div>
                </div>
                {/* Step pills */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {(["meta", "categories"] as const).map((s, i) => (
                        <React.Fragment key={s}>
                            {i > 0 && <span className="text-border text-xs">→</span>}
                            <button
                                type="button"
                                onClick={() => s === "categories" ? (canProceed && setStep(s)) : setStep(s)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    step === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                    s === "categories" && !canProceed ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"
                                )}
                            >
                                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{i + 1}</span>
                                {s === "meta" ? "Nombre & Períodos" : "Categorías & Campos"}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
                {/* ── Step 1 ── */}
                {step === "meta" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Nombre del informe</label>
                            <Input autoFocus placeholder='ej: "Boletín Trimestral Adultos", "Informe Mensual"...' value={tpl.name} onChange={(e) => setTpl({ ...tpl, name: e.target.value })} className="h-11 text-base font-medium" />
                            <p className="text-xs text-muted-foreground">Este nombre lo verá el profesor al cargar las notas.</p>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-semibold">Tipo de período</label>
                            <PeriodTypeSelector value={tpl.periodType} onChange={handlePeriodChange} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                Etiquetas de los períodos
                                <span className="text-[11px] font-normal text-muted-foreground">(podés renombrarlos)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {tpl.periodLabels.map((lbl, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-muted/40 border border-border/60 rounded-lg overflow-hidden">
                                        <span className="text-[10px] text-muted-foreground font-mono px-2 border-r border-border/40">{i + 1}</span>
                                        <Input value={lbl} onChange={(e) => handleLabelChange(i, e.target.value)} className="h-8 border-none bg-transparent text-sm font-medium px-2 w-36 focus-visible:ring-0" />
                                        {tpl.periodType === "CUSTOM" && (
                                            <button type="button" onClick={() => removeCustomPeriod(i)} className="px-2 h-8 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
                                        )}
                                    </div>
                                ))}
                                {tpl.periodType === "CUSTOM" && (
                                    <button type="button" onClick={addCustomPeriod} className="flex items-center gap-1.5 h-8 px-3 text-xs text-primary font-semibold border border-dashed border-primary/30 rounded-lg hover:border-primary/60 hover:bg-primary/5 transition-all">
                                        <Plus size={12} /> Agregar período
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Preview pill row */}
                        <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vista previa del selector de período</p>
                            <div className="flex flex-wrap gap-2">
                                {tpl.periodLabels.map((lbl, i) => (
                                    <span key={i} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", i === 0 ? "bg-primary/10 border-primary/40 text-primary" : "bg-muted border-border text-muted-foreground")}>
                                        {lbl || `Período ${i + 1}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2 ── */}
                {step === "categories" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Categories */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Categorías de evaluación</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Columnas de nota del informe. Arrastrá para reordenar.</p>
                                </div>
                                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                    {tpl.categories.length} {tpl.categories.length === 1 ? "categoría" : "categorías"}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {tpl.categories.map((cat, i) => (
                                    <CategoryRow key={cat.id} cat={cat} index={i} total={tpl.categories.length} onChange={(u) => updateCategory(i, u)} onRemove={() => removeCategory(i)} onMove={(d) => moveCategory(i, d)} />
                                ))}
                            </div>
                            <button type="button" onClick={() => setTpl({ ...tpl, categories: [...tpl.categories, newCategory()] })} className="w-full flex items-center justify-center gap-2 h-11 border-2 border-dashed border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
                                <Plus size={16} /> Agregar categoría
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border/50" />

                        {/* Special fields */}
                        <SpecialFieldsPanel value={tpl.specialFields} onChange={(sf) => setTpl({ ...tpl, specialFields: sf })} />

                        {/* Divider */}
                        <div className="border-t border-border/50" />

                        {/* Live preview */}
                        <GridPreview categories={tpl.categories} specialFields={tpl.specialFields} />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">Cancelar</Button>
                <div className="flex items-center gap-2">
                    {step === "meta" && (
                        <Button size="sm" onClick={() => setStep("categories")} disabled={!canProceed} className="premium-gradient border-none text-white font-semibold px-6">
                            Siguiente: Categorías & Campos →
                        </Button>
                    )}
                    {step === "categories" && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setStep("meta")}>← Atrás</Button>
                            <Button size="sm" onClick={handleSave} disabled={!canSave || saving} className="premium-gradient border-none text-white font-semibold px-6 min-w-[130px]">
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Guardando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Guardar Plantilla</span>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({ template, onEdit, onDuplicate, onDelete }: { template: ReportTemplate; onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
    const [expanded, setExpanded] = React.useState(false);
    const activeSpecial = SPECIAL_FIELD_META.filter(({ key }) => template.specialFields[key]);

    return (
        <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden hover:border-border/90 hover:shadow-md transition-all group backdrop-blur-sm">
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5"><ClipboardList size={18} /></div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-base truncate">{template.name}</h3>
                                {template.isActive ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                                        <CheckCircle2 size={9} /> Activa
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[10px] font-bold uppercase">
                                        <AlertCircle size={9} /> Inactiva
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                    <Clock size={11} />
                                    {PERIOD_PRESETS[template.periodType]?.label || "Personalizado"} · {template.periodLabels.length} períodos
                                </span>
                                <span className="text-border text-xs">·</span>
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    {template.categories.length} {template.categories.length === 1 ? "categoría" : "categorías"}
                                </span>
                                {activeSpecial.length > 0 && (
                                    <>
                                        <span className="text-border text-xs">·</span>
                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                            {activeSpecial.map(({ key, icon: Icon, color }) => (
                                                <span key={key} className={cn("inline-flex", color)} title={SPECIAL_FIELD_META.find(f => f.key === key)?.label}>
                                                    <Icon size={11} />
                                                </span>
                                            ))}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={onDuplicate} title="Duplicar" className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Copy size={15} /></button>
                        <button type="button" onClick={onEdit} title="Editar" className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil size={15} /></button>
                        <button type="button" onClick={onDelete} title="Eliminar" className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"><Trash2 size={15} /></button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                    {template.periodLabels.map((lbl, i) => (
                        <span key={i} className="px-2.5 py-1 bg-muted/60 border border-border/50 rounded-lg text-[11px] font-semibold text-muted-foreground">{lbl}</span>
                    ))}
                </div>
            </div>

            <button type="button" onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-5 py-3 bg-muted/20 border-t border-border/40 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                <span>Ver categorías y campos ({template.categories.length + activeSpecial.length})</span>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded && (
                <div className="px-5 pb-5 pt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {template.categories.map((cat, i) => (
                        <div key={cat.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/40">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-mono w-4 text-right">{i + 1}.</span>
                                <span className="text-sm font-medium">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ScaleBadge scale={cat.scaleType} />
                                {cat.scaleType === "NUMERIC" && <span className="text-[11px] text-muted-foreground">{cat.scaleMin} – {cat.scaleMax}</span>}
                                {cat.scaleType !== "NUMERIC" && cat.scaleOptions.length > 0 && <span className="text-[11px] text-muted-foreground">{cat.scaleOptions.map((o) => o.value).join(" / ")}</span>}
                            </div>
                        </div>
                    ))}
                    {activeSpecial.length > 0 && (
                        <div className="pt-1 border-t border-border/30">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">Campos especiales</p>
                            {activeSpecial.map(({ key, label, icon: Icon, color }) => (
                                <div key={key} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-muted/20 border border-border/30 mb-1.5">
                                    <Icon size={12} className={color} />
                                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                                    <CheckCircle2 size={11} className="ml-auto text-emerald-500" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Delete confirm banner ────────────────────────────────────────────────────

function DeleteConfirmBanner({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                ¿Eliminar <strong>"{name}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">Cancelar</Button>
                <Button variant="destructive" size="sm" onClick={onConfirm} className="w-auto">Eliminar</Button>
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ReportTemplateManager() {
    const [templates, setTemplates] = React.useState<ReportTemplate[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [creatingNew, setCreatingNew] = React.useState(false);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadTemplates() {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch("/api/reports/templates");
                if (!response.ok) {
                    throw new Error("Error al cargar las plantillas de informes.");
                }
                const data = await response.json();
                setTemplates(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Error de conexión con el servidor.");
            } finally {
                setLoading(false);
            }
        }
        loadTemplates();
    }, []);

    const editingTemplate = editingId ? templates.find((t) => t.id === editingId) : null;
    const showEditor = creatingNew || editingId !== null;

    async function handleSave(updated: ReportTemplate) {
        setError(null);
        const isEditing = templates.some((t) => t.id === updated.id);

        try {
            if (isEditing) {
                const response = await fetch(`/api/reports/templates/${updated.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updated)
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Error al actualizar la plantilla.");
                }
                const saved = await response.json();
                setTemplates(templates.map((t) => (t.id === saved.id ? saved : t)));
            } else {
                const { id, ...newTplData } = updated;
                const response = await fetch("/api/reports/templates", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newTplData)
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Error al crear la plantilla.");
                }
                const saved = await response.json();
                setTemplates([saved, ...templates]);
            }
            setEditingId(null);
            setCreatingNew(false);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al guardar la plantilla.");
            throw err; // bubble up to editor for loading state
        }
    }

    async function handleDuplicate(tpl: ReportTemplate) {
        setError(null);
        try {
            const { id, createdAt, categories, ...copyData } = tpl;
            const cleanCategories = categories.map(({ id: _, ...cat }) => cat);

            const response = await fetch("/api/reports/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...copyData,
                    name: `${tpl.name} (copia)`,
                    categories: cleanCategories
                })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al duplicar la plantilla.");
            }
            const saved = await response.json();
            setTemplates([saved, ...templates]);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al duplicar la plantilla.");
        }
    }

    async function handleDelete(id: string) {
        setError(null);
        try {
            const response = await fetch(`/api/reports/templates/${id}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al eliminar la plantilla.");
            }
            setTemplates(templates.filter((t) => t.id !== id));
            setDeletingId(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al eliminar la plantilla.");
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-muted-foreground font-medium">Cargando plantillas de informes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-500/10 text-red-600 border border-red-500/20 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium">
                    <span className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </span>
                    <button onClick={() => setError(null)} className="text-xs underline hover:opacity-80">Descartar</button>
                </div>
            )}
            {!showEditor && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">
                        {templates.length === 0
                            ? "No hay plantillas todavía. Creá la primera."
                            : `${templates.length} plantilla${templates.length !== 1 ? "s" : ""} configurada${templates.length !== 1 ? "s" : ""}`}
                    </p>
                    <Button onClick={() => { setCreatingNew(true); setEditingId(null); }} className="premium-gradient border-none text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 h-10 px-5">
                        <Plus size={16} /> Nueva Plantilla
                    </Button>
                </div>
            )}

            {deletingId && !showEditor && (
                <DeleteConfirmBanner
                    name={templates.find((t) => t.id === deletingId)?.name ?? ""}
                    onConfirm={() => handleDelete(deletingId)}
                    onCancel={() => setDeletingId(null)}
                />
            )}

            {showEditor && (
                <TemplateEditor
                    initial={editingTemplate ?? newTemplate()}
                    onSave={handleSave}
                    onCancel={() => { setCreatingNew(false); setEditingId(null); }}
                />
            )}

            {!showEditor && (
                templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-border/40 rounded-2xl bg-muted/10">
                        <div className="p-4 rounded-2xl bg-primary/10 text-primary mb-4"><ClipboardList size={36} /></div>
                        <h3 className="text-lg font-bold mb-1">Sin plantillas de informe</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mb-6">Creá tu primera plantilla para que los profesores puedan cargar notas periódicas.</p>
                        <Button onClick={() => setCreatingNew(true)} className="premium-gradient border-none text-white font-bold flex items-center gap-2">
                            <Plus size={16} /> Crear primera plantilla
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {templates.map((tpl) => (
                            <TemplateCard
                                key={tpl.id}
                                template={tpl}
                                onEdit={() => { setEditingId(tpl.id); setCreatingNew(false); setDeletingId(null); }}
                                onDuplicate={() => handleDuplicate(tpl)}
                                onDelete={() => setDeletingId(tpl.id)}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
