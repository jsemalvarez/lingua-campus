"use client";

import { useTransition, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateCourseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle, AlertCircle, X, BookOpen, Sparkles, UserSearch, Pencil } from "lucide-react";
import { createPortal } from "react-dom";

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

interface EditCourseModalProps {
    courseId: string;
    currentName: string;
    currentClassroomId: string | null;
    currentLevel: string | null;
    currentTeacherId: string | null;
    currentColor: string | null;
    teachers: Teacher[];
    levels: Level[];
    classrooms: Classroom[];
    currentStartDate: Date | null;
    currentEndDate: Date | null;
}

export function EditCourseModal({ 
    courseId, 
    currentName, 
    currentClassroomId, 
    currentLevel, 
    currentTeacherId, 
    currentColor,
    teachers, 
    levels, 
    classrooms,
    currentStartDate,
    currentEndDate
}: EditCourseModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // Form states
    const [name, setName] = useState(currentName);
    const [classroomId, setClassroomId] = useState(currentClassroomId || "");
    const [level, setLevel] = useState(currentLevel || "");
    const [teacherId, setTeacherId] = useState(currentTeacherId || "");
    const [teacherSearchQuery, setTeacherSearchQuery] = useState(
        teachers.find(t => t.id === currentTeacherId)?.name || ""
    );
    const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
    const [color, setColor] = useState(currentColor || "#3b82f6");
    const [startDate, setStartDate] = useState(currentStartDate ? new Date(currentStartDate).toISOString().split('T')[0] : "");
    const [endDate, setEndDate] = useState(currentEndDate ? new Date(currentEndDate).toISOString().split('T')[0] : "");

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
        formData.append("id", courseId);
        formData.append("name", name);
        formData.append("classroomId", classroomId);
        formData.append("level", level);
        formData.append("teacherId", teacherId);
        formData.append("color", color);
        formData.append("startDate", startDate);
        formData.append("endDate", endDate);

        setStatus("idle");
        startTransition(async () => {
            const result = await updateCourseAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    setIsOpen(false);
                    router.refresh();
                }, 1500);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Error al actualizar curso");
            }
        });
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="w-8 h-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
            >
                <Pencil size={16} className="group-hover:rotate-12 transition-transform" />
            </Button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-500 overflow-y-auto">
                    <div className="bg-card w-full max-w-3xl rounded-[1.5rem] shadow-2xl border border-border/60 overflow-hidden animate-in zoom-in-95 duration-500 my-auto">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight">
                                    <BookOpen className="transition-colors duration-500" style={{ color }} size={20} /> 
                                    Editar Curso
                                </h2>
                                <p className="text-muted-foreground font-medium text-[10px] mt-0.5">Gestión de detalles académicos y visuales.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full w-8 h-8">
                                <X size={16} />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Section 1: Core Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-1 border-b border-border/10">
                                    <div className="w-1 h-4 rounded-full transition-colors duration-500" style={{ backgroundColor: color }} />
                                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Información General</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
                                            Nombre del Curso
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:border-primary shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
                                            Aula
                                        </label>
                                        <select
                                            value={classroomId}
                                            onChange={(e) => setClassroomId(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:border-primary shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">Sin asignar</option>
                                            {classrooms.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Assignment & Level */}
                            <div className="space-y-4 bg-muted/20 -mx-6 px-6 py-4 border-y border-border/20">
                                <div className="flex items-center gap-2 pb-1 border-b border-border/10">
                                    <div className="w-1 h-4 rounded-full transition-colors duration-500" style={{ backgroundColor: color }} />
                                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Academia</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 focus-within:text-emerald-500 transition-colors">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
                                            Nivel
                                        </label>
                                        <select
                                            value={level}
                                            onChange={(e) => setLevel(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:border-primary shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">No definido</option>
                                            {levels.map(l => (
                                                <option key={l.id} value={l.name}>{l.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 focus-within:text-emerald-500 transition-colors relative text-left">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
                                            Profesor
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
                                                className="w-full px-4 py-2 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:border-primary shadow-sm pr-10"
                                            />
                                            {teacherId ? (
                                                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                                            ) : (
                                                <UserSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/20" size={16} />
                                            )}
                                        </div>

                                        {isTeacherDropdownOpen && filteredTeachers.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-card border border-border/40 shadow-xl rounded-xl max-h-48 overflow-auto animate-in fade-in slide-in-from-top-1">
                                                {filteredTeachers.map(t => (
                                                    <div
                                                        key={t.id}
                                                        className={`px-4 py-2 cursor-pointer hover:bg-muted transition-all border-b border-border/10 last:border-none flex items-center justify-between ${teacherId === t.id ? 'bg-primary/5 font-bold' : ''}`}
                                                        onClick={() => {
                                                            setTeacherId(t.id);
                                                            setTeacherSearchQuery(t.name);
                                                            setIsTeacherDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className="text-xs">{t.name}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                                    <div className="space-y-1.5 focus-within:text-indigo-500 transition-colors">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
                                            Fecha de Inicio
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:border-primary shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5 focus-within:text-indigo-500 transition-colors">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
                                            Fecha de Fin
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-input/60 bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:border-primary shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Color Palette */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-1 border-b border-border/10">
                                    <div className="w-1 h-4 rounded-full transition-colors duration-500" style={{ backgroundColor: color }} />
                                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Identidad Visual</h3>
                                </div>
                                
                                <div className="flex justify-center">
                                    <Card 
                                        className="relative overflow-hidden w-full max-w-xl shadow-md border-border/20 bg-card/40 backdrop-blur-md animate-in zoom-in-95 duration-700 rounded-2xl"
                                        style={{ filter: `drop-shadow(0 8px 15px ${color}10)` }}
                                    >
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 w-2 transition-colors duration-1000" 
                                            style={{ backgroundColor: color }}
                                        />
                                        
                                        <div className="p-5 flex flex-col md:flex-row gap-2 items-center justify-center mx-auto">
                                            <div className="flex gap-1.5 p-2 bg-muted/20 rounded-xl border border-border/20 shrink-0">
                                                {columns.map((col, colIdx) => (
                                                    <div key={colIdx} className="flex flex-col gap-0 shadow-sm rounded overflow-hidden border border-white/5">
                                                        {col.map((c) => (
                                                            <button
                                                                key={c.value}
                                                                type="button"
                                                                onClick={() => setColor(c.value)}
                                                                className={`w-4 h-4 sm:w-6 sm:h-6 transition-all duration-300 relative ${
                                                                    color === c.value 
                                                                    ? "z-10 scale-110 shadow-md ring-2 ring-foreground" 
                                                                    : "hover:scale-110"
                                                                }`}
                                                                style={{ backgroundColor: c.value }}
                                                                title={c.name}
                                                            >
                                                                {color === c.value && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full animate-pulse" /></div>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="hidden md:block w-px h-16 bg-border/20" />
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                <div className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-wider">Manual</div>
                                                <div className="relative group">
                                                    <input 
                                                        type="color" 
                                                        value={color} 
                                                        onChange={(e) => setColor(e.target.value)}
                                                        className="w-10 h-10 rounded-xl p-1 border-none bg-background shadow-lg cursor-pointer ring-2 ring-border/10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-[9px] text-muted-foreground italic flex items-center gap-1.5 bg-muted/10 px-3 py-1.5 rounded-lg border border-border/10">
                                    <AlertCircle size={10} className="text-amber-500" /> Los cambios son globales.
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl px-6 h-9 font-bold text-xs flex-1 sm:flex-none">
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isPending}
                                        className={`rounded-xl px-8 h-10 font-black text-[9px] uppercase tracking-widest transition-all duration-500 shadow-md flex-1 sm:flex-none min-w-[120px] ${
                                            isPending ? "bg-muted text-muted-foreground" : "text-white"
                                        }`}
                                        style={{ backgroundColor: isPending ? undefined : color }}
                                    >
                                        {isPending ? "Espere..." : "Actualizar"}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {status !== "idle" && (
                            <div className={`p-4 text-center transition-all ${status === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
                                <div className="flex items-center justify-center gap-2 font-bold text-sm">
                                    {status === 'success' ? <Sparkles size={16} /> : <X size={16} />}
                                    {status === 'success' ? '¡Hecho!' : errorMsg}
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
