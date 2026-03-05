"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createEnrollmentAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, BookOpen, Search } from "lucide-react";

interface CourseOption {
    id: string;
    name: string;
    level: string | null;
}

interface StudentOption {
    id: string;
    name: string;
    email: string | null;
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

                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                    <label className="text-sm font-semibold flex items-center gap-2">
                        <Search size={16} /> Seleccionar Estudiante
                    </label>
                    <select
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring bg-background text-sm font-medium outline-none transition-all appearance-none"
                        required
                    >
                        <option value="" disabled>Busca y selecciona un alumno...</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} {s.email ? `- ${s.email}` : ""}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                        ¿No lo encuentras? <span className="text-primary cursor-pointer hover:underline" onClick={() => router.push("/students/new")}>Regístralo primero</span>
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
