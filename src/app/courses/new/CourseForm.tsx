"use client";

import { useTransition, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createCourseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle, AlertCircle, UserSearch, BookOpen, X, Sparkles } from "lucide-react";

interface Teacher {
    id: string;
    name: string;
    email: string;
}

interface Level {
    id: string;
    name: string;
}

interface Classroom {
    id: string;
    name: string;
    capacity: number | null;
}

interface CourseFormProps {
    teachers: Teacher[];
    levels: Level[];
    classrooms: Classroom[];
}

export function CourseForm({ teachers, levels, classrooms }: CourseFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [statusFeedback, setStatusFeedback] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // Form states
    const [name, setName] = useState("");
    const [classroomId, setClassroomId] = useState("");
    const [level, setLevel] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
    const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
    const [color, setColor] = useState("#3b82f6");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const palette = [
        { name: "Rojo 300", value: "#fca5a5" }, { name: "Rojo 500", value: "#ef4444" }, { name: "Rojo 700", value: "#b91c1c" }, { name: "Rojo 900", value: "#7f1d1d" },
        { name: "Naranja 300", value: "#fdba74" }, { name: "Naranja 500", value: "#f97316" }, { name: "Naranja 700", value: "#c2410c" }, { name: "Naranja 900", value: "#7c2d12" },
        { name: "Ámbar 300", value: "#fcd34d" }, { name: "Ámbar 500", value: "#f59e0b" }, { name: "Ámbar 700", value: "#b45309" }, { name: "Ámbar 900", value: "#78350f" },
        { name: "Verde 300", value: "#86efac" }, { name: "Verde 500", value: "#22c55e" }, { name: "Verde 700", value: "#15803d" }, { name: "Verde 900", value: "#14532d" },
        { name: "Teal 300", value: "#5eead4" }, { name: "Teal 500", value: "#14b8a6" }, { name: "Teal 700", value: "#0f766e" }, { name: "Teal 900", value: "#134e4a" },
        { name: "Azul 300", value: "#93c5fd" }, { name: "Azul 500", value: "#3b82f6" }, { name: "Azul 700", value: "#1d4ed8" }, { name: "Azul 900", value: "#1e3a8a" },
        { name: "Indigo 300", value: "#a5b4fc" }, { name: "Indigo 500", value: "#6366f1" }, { name: "Indigo 700", value: "#4338ca" }, { name: "Indigo 900", value: "#312e81" },
        { name: "Rosa 300", value: "#f9a8d4" }, { name: "Rosa 500", value: "#ec4899" }, { name: "Rosa 700", value: "#be185d" }, { name: "Rosa 900", value: "#831843" },
        { name: "Violeta 300", value: "#d8b4fe" }, { name: "Violeta 500", value: "#a855f7" }, { name: "Violeta 700", value: "#7e22ce" }, { name: "Violeta 900", value: "#581c87" },
    ];

    const columns = useMemo(() => [
        palette.slice(0, 4), palette.slice(4, 8), palette.slice(8, 12),
        palette.slice(12, 16), palette.slice(16, 20), palette.slice(20, 24),
        palette.slice(24, 28), palette.slice(28, 32), palette.slice(32, 36),
    ], []);

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearchQuery.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", name);
        formData.append("classroomId", classroomId);
        formData.append("level", level);
        formData.append("teacherId", teacherId);
        formData.append("color", color);
        formData.append("startDate", startDate);
        formData.append("endDate", endDate);

        setStatusFeedback("idle");
        startTransition(async () => {
            const result = await createCourseAction(formData);
            if (result.success) {
                setStatusFeedback("success");
                setTimeout(() => router.push("/courses"), 1500);
            } else {
                setStatusFeedback("error");
                setErrorMsg(result.error ?? "Error al crear curso");
            }
        });
    };

    return (
        <div className="flex justify-center p-4">
            <div className="bg-card w-full max-w-3xl rounded-[2rem] shadow-xl border border-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="px-8 py-5 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-3 tracking-tight">
                            <BookOpen className="transition-colors duration-500" style={{ color }} size={24} />
                            Crear Nuevo Curso
                        </h2>
                        <p className="text-muted-foreground text-xs mt-0.5">Configura los detalles académicos y la identidad visual.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => router.push("/courses")} className="rounded-full w-10 h-10 hover:bg-background/80">
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Section 1: Core Info */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-border/30">
                            <div className="w-1.5 h-5 rounded-full transition-colors duration-500" style={{ backgroundColor: color }} />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Información del Curso</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1 transition-colors group-focus-within:text-foreground">
                                    Nombre de la Clase
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all focus:border-primary shadow-sm placeholder:text-muted-foreground/30"
                                    placeholder="Ej: Inglés Avanzado B2"
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1 transition-colors group-focus-within:text-foreground">
                                    Aula Física
                                </label>
                                <select
                                    value={classroomId}
                                    onChange={(e) => setClassroomId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all focus:border-primary shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="">Sin asignar</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.capacity ? `(Cap. ${c.capacity})` : ""}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1 transition-colors group-focus-within:text-foreground">
                                    Fecha de Inicio
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all focus:border-primary shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1 transition-colors group-focus-within:text-foreground">
                                    Fecha de Fin (Opcional)
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all focus:border-primary shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Assignment & Level */}
                    <div className="space-y-5 bg-muted/10 -mx-8 px-8 py-6 border-y border-border/30">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-border/30">
                            <div className="w-1.5 h-5 rounded-full transition-colors duration-500" style={{ backgroundColor: color }} />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Academia y Profesor</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 group">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1 transition-colors group-focus-within:text-foreground">
                                    Nivel Académico
                                </label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all focus:border-primary shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="">No definido</option>
                                    {levels.map(l => (
                                        <option key={l.id} value={l.name}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5 group relative">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1 transition-colors group-focus-within:text-foreground">
                                    Profesor Responsable
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={teacherSearchQuery}
                                        onChange={(e) => {
                                            setTeacherSearchQuery(e.target.value);
                                            setIsTeacherDropdownOpen(true);
                                            if (teacherId) setTeacherId("");
                                        }}
                                        onFocus={() => setIsTeacherDropdownOpen(true)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all focus:border-primary shadow-sm pr-10"
                                    />
                                    {teacherId ? (
                                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                                    ) : (
                                        <UserSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/20" size={18} />
                                    )}
                                </div>

                                {isTeacherDropdownOpen && filteredTeachers.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-card border border-border/60 shadow-xl rounded-2xl max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2">
                                        {filteredTeachers.map(t => (
                                            <div
                                                key={t.id}
                                                className={`px-5 py-3 cursor-pointer hover:bg-muted transition-all border-b border-border/30 last:border-none flex items-center justify-between ${teacherId === t.id ? 'bg-primary/5 font-bold' : ''}`}
                                                onClick={() => {
                                                    setTeacherId(t.id);
                                                    setTeacherSearchQuery(t.name);
                                                    setIsTeacherDropdownOpen(false);
                                                }}
                                            >
                                                <div className="text-xs">{t.name}</div>
                                                {teacherId === t.id && <CheckCircle size={14} className="text-primary" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Color Palette */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-border/30">
                            <div className="w-1.5 h-5 rounded-full transition-colors duration-500" style={{ backgroundColor: color }} />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Identidad Visual</h3>
                        </div>

                        <div className="flex justify-center">
                            <Card
                                className="relative overflow-hidden w-full max-w-2xl shadow-lg border-border/40 bg-card/60 backdrop-blur-lg animate-in zoom-in-95 duration-700 rounded-[1.5rem]"
                                style={{ filter: `drop-shadow(0 10px 20px ${color}10)` }}
                            >
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-2.5 transition-colors duration-1000 shadow-[1px_0_5px_rgba(0,0,0,0.05)]"
                                    style={{ backgroundColor: color }}
                                />
                                <div className="p-6 flex flex-col md:flex-row gap-2 items-center justify-center mx-auto">
                                    {/* Color Grid Matrix with Vertical Bonding */}
                                    <div className="flex gap-1.5 sm:gap-2 p-3 bg-muted/20 rounded-[1rem] border border-border/30 shadow-inner shrink-0">
                                        {columns.map((col, colIdx) => (
                                            <div key={colIdx} className="flex flex-col gap-0 shadow rounded-lg overflow-hidden border border-white/5">
                                                {col.map((c) => (
                                                    <button
                                                        key={c.value}
                                                        type="button"
                                                        onClick={() => setColor(c.value)}
                                                        className={`w-5 h-5 sm:w-8 sm:h-8 transition-all duration-300 relative group/color ${color === c.value
                                                            ? "z-10 scale-110 shadow-lg rounded-md outline outline-2 outline-foreground"
                                                            : "hover:scale-[1.12] hover:z-10"
                                                            }`}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.name}
                                                    >
                                                        {color === c.value && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-1 h-1 bg-white rounded-full shadow-sm animate-pulse" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Separator - Visible only on md+ screens */}
                                    <div className="hidden md:block w-px h-24 bg-border/40" />

                                    {/* Custom Picker explicitly centered in its column */}
                                    <div className="flex flex-col items-center gap-3 shrink-0">
                                        <div className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-[0.2em]">Croma</div>
                                        <div className="relative group">
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                className="w-12 h-12 rounded-2xl p-1 border-none bg-background shadow-lg cursor-pointer ring-4 ring-border/10 hover:ring-primary/20 transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 bg-muted/20 px-4 py-2 rounded-xl">
                            <AlertCircle size={14} className="text-blue-500" />
                            Sincronización en tiempo real activa.
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 sm:flex-none px-6 h-11 rounded-xl font-bold text-xs"
                                onClick={() => router.push("/courses")}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className={`flex-1 sm:flex-none px-10 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all duration-500 min-w-[150px] ${isPending
                                    ? "bg-muted text-muted-foreground"
                                    : "hover:scale-[1.02] active:scale-95 text-white"
                                    }`}
                                style={{ backgroundColor: isPending ? undefined : color }}
                            >
                                {isPending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Creando...
                                    </div>
                                ) : (
                                    "Crear Curso"
                                )}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Feedback Overlay */}
                {statusFeedback !== "idle" && (
                    <div className={`p-4 text-center animate-in slide-in-from-bottom-full duration-500 ${statusFeedback === 'success' ? 'bg-emerald-500' : 'bg-destructive'} text-white`}>
                        <div className="flex items-center justify-center gap-2 font-bold text-sm">
                            {statusFeedback === 'success' ? <Sparkles size={16} /> : <X size={16} />}
                            {statusFeedback === 'success' ? '¡Curso creado con éxito!' : errorMsg}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
