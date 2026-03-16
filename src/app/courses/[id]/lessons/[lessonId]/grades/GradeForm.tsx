"use client";

import { useState, useTransition, useEffect } from "react";
import { saveLessonGradesAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Save, FileText } from "lucide-react";

type StudentData = { id: string; name: string };
type GradeRecord = { score: string | null; feedback: string | null };

export function GradeForm({
    lessonId,
    courseId,
    students,
    existingGrades,
    readOnly = false
}: {
    lessonId: string;
    courseId: string;
    students: StudentData[];
    existingGrades: Record<string, GradeRecord>;
    readOnly?: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [statusIndicator, setStatusIndicator] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // State dictionary map representing internal form
    const [gradeState, setGradeState] = useState<Record<string, { score: string, feedback: string }>>({});

    useEffect(() => {
        const initialState: Record<string, any> = {};
        for (const student of students) {
            if (existingGrades[student.id]) {
                initialState[student.id] = {
                    score: existingGrades[student.id].score || "",
                    feedback: existingGrades[student.id].feedback || ""
                };
            } else {
                initialState[student.id] = {
                    score: "",
                    feedback: ""
                };
            }
        }
        setGradeState(initialState);
    }, [students, existingGrades]);

    const handleScoreChange = (studentId: string, score: string) => {
        if (readOnly) return;
        setGradeState(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], score }
        }));
    };

    const handleFeedbackChange = (studentId: string, feedback: string) => {
        if (readOnly) return;
        setGradeState(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], feedback }
        }));
    };

    const handleSave = () => {
        if (readOnly) return;
        setStatusIndicator("idle");

        // Formatear payload
        const payload = Object.entries(gradeState).map(([studentId, data]) => ({
            studentId,
            score: data.score.trim() || "",
            feedback: data.feedback.trim() || ""
        }));

        startTransition(async () => {
            const result = await saveLessonGradesAction(lessonId, courseId, payload);
            if (result.success) {
                setStatusIndicator("success");
                setTimeout(() => setStatusIndicator("idle"), 4000);
            } else {
                setStatusIndicator("error");
                setErrorMsg(result.error ?? "Ocurrió un error guardando las notas.");
            }
        });
    };

    if (students.length === 0) {
        return (
            <div className="text-center p-10 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm">
                No hay estudiantes matriculados en este curso para calificar.
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 mt-6">

            <div className="bg-card w-full rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-muted/50 text-muted-foreground uppercase tracking-widest text-[10px] font-bold border-b border-border/40">
                            <tr>
                                <th className="px-5 py-4 w-1/4">Estudiante</th>
                                <th className="px-5 py-4 w-[150px]">Nota / Calif.</th>
                                <th className="px-5 py-4 min-w-[300px]">Feedback / Comentarios</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {students.map((student) => {
                                const currentData = gradeState[student.id];
                                if (!currentData) return null;

                                return (
                                    <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-5 py-4 font-semibold text-foreground">
                                            {student.name}
                                        </td>
                                        <td className="px-5 py-4">
                                            <input
                                                type="text"
                                                placeholder={readOnly ? "-" : "Ej: 8, B+, Aprobado"}
                                                value={currentData.score}
                                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                disabled={readOnly}
                                                className={`w-full px-3 py-2 text-center font-bold rounded-lg border border-input/60 bg-background text-sm outline-none transition-all ${readOnly ? "cursor-default opacity-80" : "focus:ring-2 focus:ring-primary/20 focus:border-primary"}`}
                                            />
                                        </td>
                                        <td className="px-5 py-4 w-full">
                                            <input
                                                type="text"
                                                placeholder={readOnly ? "-" : "Correcciones o comentarios sobre su desempeño..."}
                                                value={currentData.feedback}
                                                onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                                disabled={readOnly}
                                                className={`w-full px-3 py-2 rounded-lg border border-input/60 bg-background text-sm outline-none transition-all ${readOnly ? "cursor-default opacity-70 bg-muted/20" : "focus:ring-2 focus:ring-primary/20 focus:border-primary"}`}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Feedback & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="w-full sm:w-auto">
                    {statusIndicator === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> ¡Notas guardadas con éxito!
                        </div>
                    )}
                    {statusIndicator === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isPending || readOnly}
                    className={`w-full sm:w-auto px-8 flex items-center gap-2 ${readOnly ? "bg-muted text-muted-foreground hover:bg-muted cursor-default border-border" : "premium-gradient shadow-md shadow-primary/20"}`}
                >
                    {isPending ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            Guardando...
                        </>
                    ) : readOnly ? (
                        <>
                            <FileText size={18} /> Registro Histórico (Lectura)
                        </>
                    ) : (
                        <>
                            <Save size={18} /> Guardar Notas
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
