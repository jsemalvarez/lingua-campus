"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { changeStudentCourseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { X, BookOpen, CheckCircle, AlertCircle, Edit2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Course {
    id: string;
    name: string;
    level: string | null;
}

interface ChangeCourseModalProps {
    enrollmentId: string;
    currentCourseId: string;
    currentCourseName: string;
    availableCourses: Course[];
}

export function ChangeCourseModal({ 
    enrollmentId, 
    currentCourseId, 
    currentCourseName, 
    availableCourses 
}: ChangeCourseModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [mounted, setMounted] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState(currentCourseId);

    const filteredCourses = availableCourses.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.level && c.level.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCourseId === currentCourseId) {
            setIsOpen(false);
            return;
        }

        setStatus("idle");
        startTransition(async () => {
            const result = await changeStudentCourseAction(enrollmentId, selectedCourseId);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    setIsOpen(false);
                    setStatus("idle");
                    router.refresh();
                }, 1500);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Ocurrió un error");
            }
        });
    };

    if (!isOpen || !mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                title="Cambiar de curso"
            >
                <Edit2 size={14} />
            </Button>
        );
    }

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
            onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
            }}
        >
            <div 
                className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="text-primary" size={20} /> Cambiar Curso
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); setStatus("idle"); }}>
                        <X size={20} />
                    </Button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Curso Actual
                        </label>
                        <div className="px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm font-medium">
                            {currentCourseName}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Seleccionar Nuevo Curso
                        </label>
                        
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar curso o nivel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:border-primary"
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-border/60 rounded-xl divide-y divide-border/40">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map(course => (
                                    <button
                                        key={course.id}
                                        type="button"
                                        onClick={() => setSelectedCourseId(course.id)}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between hover:bg-muted/50 ${
                                            selectedCourseId === course.id ? 'bg-primary/5 text-primary font-semibold' : 'text-foreground/80'
                                        }`}
                                    >
                                        <div>
                                            <p>{course.name}</p>
                                            {course.level && (
                                                <p className="text-xs text-muted-foreground font-normal">{course.level}</p>
                                            )}
                                        </div>
                                        {selectedCourseId === course.id && (
                                            <CheckCircle size={16} className="text-primary" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground italic">
                                    No se encontraron cursos...
                                </div>
                            )}
                        </div>
                    </div>

                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> Curso actualizado exitosamente.
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-border/40 mt-6">
                        <Button type="button" variant="ghost" onClick={() => { setIsOpen(false); setStatus("idle"); }} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isPending || selectedCourseId === currentCourseId} 
                            className="premium-gradient text-white font-bold px-6 shadow-md hover:shadow-lg transition-all"
                        >
                            {isPending ? "Procesando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
