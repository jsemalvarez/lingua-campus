"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createEnrollmentAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, BookOpen, Search } from "lucide-react";
import Link from "next/link";

interface CourseOption {
    id: string;
    name: string;
    level: string | null;
}

interface StudentOption {
    id: string;
    name: string;
    email: string | null;
    _count: { enrollments: number };
}

interface EnrollmentFormProps {
    courses: CourseOption[];
    students: StudentOption[];
    preselectedCourseId?: string;
}

export function EnrollmentForm({ courses, students, preselectedCourseId }: EnrollmentFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [statusFeedback, setStatusFeedback] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // State
    const [courseId, setCourseId] = useState(preselectedCourseId || "");
    const [studentId, setStudentId] = useState("");
    const [filterNoCourse, setFilterNoCourse] = useState(false);

    // Searchable Select State
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesFilter = filterNoCourse ? s._count.enrollments === 0 : true;
        
        return matchesSearch && matchesFilter;
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatusFeedback("idle");

        if (!courseId || !studentId) {
            setStatusFeedback("error");
            setErrorMsg("Debes seleccionar un estudiante y un curso.");
            return;
        }

        const formData = new FormData();
        formData.append("courseId", courseId);
        formData.append("studentId", studentId);

        startTransition(async () => {
            const result = await createEnrollmentAction(formData);
            if (result.success) {
                setStatusFeedback("success");
                setTimeout(() => {
                    router.push(`/courses/${courseId}`);
                }, 1200); // feedback
            } else {
                setStatusFeedback("error");
                setErrorMsg(result.error ?? "No se pudo inscribir al alumno.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold">Detalles de Inscripción</h2>

            <div className="space-y-4">
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                    <label className="text-sm font-semibold flex items-center gap-2">
                        <BookOpen size={16} /> Seleccionar Curso
                    </label>
                    <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring bg-background text-sm font-medium outline-none transition-all appearance-none"
                        required
                    >
                        <option value="" disabled>Seleccione un curso de la oferta...</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.level ? `(${c.level})` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3 focus-within:text-blue-600 transition-colors relative z-20">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Search size={16} /> Buscar Estudiante
                        </label>
                        <button
                            type="button"
                            onClick={() => setFilterNoCourse(!filterNoCourse)}
                            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md transition-all border ${
                                filterNoCourse 
                                ? "bg-primary/10 border-primary/30 text-primary shadow-sm" 
                                : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {filterNoCourse ? "Viendo: Sin Curso" : "Filtrar: Sin Curso"}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={filterNoCourse ? "Buscar alumnos sin curso..." : "Empieza a escribir el nombre..."}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsDropdownOpen(true);
                                if (studentId) setStudentId(""); // Clear selection if writing again
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring bg-background text-sm font-medium outline-none transition-all placeholder:font-normal"
                        />
                        {studentId && (
                            <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                        )}
                    </div>

                    {isDropdownOpen && searchQuery && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(s => (
                                    <div
                                        key={s.id}
                                        className={`px-4 py-3 cursor-pointer text-sm hover:bg-muted transition-colors ${studentId === s.id ? 'bg-primary/5 text-primary font-medium' : ''}`}
                                        onClick={() => {
                                            setStudentId(s.id);
                                            setSearchQuery(s.name);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>
                                                {s.name} <span className="text-muted-foreground text-xs ml-1">{s.email ? `(${s.email})` : ""}</span>
                                            </span>
                                            {s._count.enrollments > 0 && (
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                                                    {s._count.enrollments} {s._count.enrollments === 1 ? 'CURSO' : 'CURSOS'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-muted-foreground italic">
                                    No se encontraron alumnos con ese nombre...
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-3 text-right relative z-10 w-full">
                        ¿No lo encuentras? <Link href="/students/new" className="text-primary font-medium hover:underline cursor-pointer relative z-20">Regístralo primero</Link>
                    </p>
                </div>
            </div>

            {/* Feedback Mensajes */}
            {statusFeedback === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-top-2">
                    <CheckCircle size={18} />
                    ¡Alumno inscripto exitosamente! Redirigiendo...
                </div>
            )}
            {statusFeedback === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    {errorMsg}
                </div>
            )}

            <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" className="premium-gradient shadow-md shadow-primary/20 px-6 h-11" disabled={isPending || courses.length === 0 || students.length === 0}>
                    {isPending ? "Procesando..." : "Confirmar Inscripción"}
                </Button>
            </div>
        </form>
    );
}
