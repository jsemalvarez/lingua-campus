"use client";

import { useState, useTransition, useEffect } from "react";
import { saveLessonAttendanceAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Save, Check, X, Clock, FileWarning } from "lucide-react";

type StudentData = { id: string; name: string };
type AttendanceRecord = { status: "PRESENT" | "ABSENT" | "LATE" | "JUSTIFIED"; notes: string | null };

export function AttendanceForm({
    lessonId,
    courseId,
    students,
    existingAttendances,
    readOnly = false
}: {
    lessonId: string;
    courseId: string;
    students: StudentData[];
    existingAttendances: Record<string, AttendanceRecord>;
    readOnly?: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [statusIndicator, setStatusIndicator] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // State dictionary map representing internal form
    const [attendanceState, setAttendanceState] = useState<Record<string, { status: "PRESENT" | "ABSENT" | "LATE" | "JUSTIFIED", notes: string }>>({});

    useEffect(() => {
        // Inicializar el estado de presentismo por default a PRESENT, a menos que exista un registro previo
        const initialState: Record<string, any> = {};
        for (const student of students) {
            if (existingAttendances[student.id]) {
                initialState[student.id] = {
                    status: existingAttendances[student.id].status,
                    notes: existingAttendances[student.id].notes || ""
                };
            } else {
                initialState[student.id] = {
                    status: "PRESENT",
                    notes: ""
                };
            }
        }
        setAttendanceState(initialState);
    }, [students, existingAttendances]);

    const handleStatusChange = (studentId: string, newStatus: "PRESENT" | "ABSENT" | "LATE" | "JUSTIFIED") => {
        if (readOnly) return;
        setAttendanceState(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status: newStatus }
        }));
    };

    const handleNotesChange = (studentId: string, notes: string) => {
        if (readOnly) return;
        setAttendanceState(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], notes }
        }));
    };

    const handleSave = () => {
        if (readOnly) return;
        setStatusIndicator("idle");

        // Formatear payload
        const payload = Object.entries(attendanceState).map(([studentId, data]) => ({
            studentId,
            status: data.status,
            notes: data.notes.trim() || undefined
        }));

        startTransition(async () => {
            const result = await saveLessonAttendanceAction(lessonId, courseId, payload);
            if (result.success) {
                setStatusIndicator("success");
                setTimeout(() => setStatusIndicator("idle"), 4000);
            } else {
                setStatusIndicator("error");
                setErrorMsg(result.error ?? "Ocurrió un error guardando el parte.");
            }
        });
    };

    if (students.length === 0) {
        return (
            <div className="text-center p-10 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm">
                No hay estudiantes matriculados en este curso para tomar asistencia.
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
                                <th className="px-5 py-4 w-[400px]">Presentismo</th>
                                <th className="px-5 py-4 min-w-[200px]">Notas / Comentarios</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {students.map((student) => {
                                const currentData = attendanceState[student.id];
                                if (!currentData) return null;

                                return (
                                    <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-5 py-4 font-semibold text-foreground">
                                            {student.name}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Botones de Estado Rápidos */}
                                                <button
                                                    onClick={() => handleStatusChange(student.id, "PRESENT")}
                                                    disabled={readOnly}
                                                    className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${currentData.status === "PRESENT"
                                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                        } ${readOnly ? "cursor-default opacity-80" : ""}`}
                                                >
                                                    <Check size={14} /> P
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, "ABSENT")}
                                                    disabled={readOnly}
                                                    className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${currentData.status === "ABSENT"
                                                            ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                        } ${readOnly ? "cursor-default opacity-80" : ""}`}
                                                >
                                                    <X size={14} /> A
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, "LATE")}
                                                    disabled={readOnly}
                                                    className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${currentData.status === "LATE"
                                                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                        } ${readOnly ? "cursor-default opacity-80" : ""}`}
                                                >
                                                    <Clock size={14} /> T
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, "JUSTIFIED")}
                                                    disabled={readOnly}
                                                    className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${currentData.status === "JUSTIFIED"
                                                            ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                        } ${readOnly ? "cursor-default opacity-80" : ""}`}
                                                >
                                                    <FileWarning size={14} /> J
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 w-full">
                                            <input
                                                type="text"
                                                placeholder={readOnly ? "Sin notas" : "Ej: Faltó por enfermedad, llovió..."}
                                                value={currentData.notes}
                                                onChange={(e) => handleNotesChange(student.id, e.target.value)}
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
                            <CheckCircle size={18} /> ¡Asistencia guardada con éxito!
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
                            <FileWarning size={18} /> Registro Histórico (Lectura)
                        </>
                    ) : (
                        <>
                            <Save size={18} /> Guardar Asistencia
                        </>
                    )}
                </Button>
            </div>

            <div className="mt-8 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400 text-xs font-medium lg:w-max">
                <span className="font-bold flex items-center gap-1.5 mb-1"><AlertCircle size={14} /> Leyenda Rápida:</span>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                    <li><strong className="text-emerald-600 dark:text-emerald-500">P:</strong> Presente</li>
                    <li><strong className="text-red-600 dark:text-red-500">A:</strong> Ausente</li>
                    <li><strong className="text-amber-600 dark:text-amber-500">T:</strong> Tardanza / Llegada tarde</li>
                    <li><strong className="text-blue-600 dark:text-blue-500">J:</strong> Justificado</li>
                </ul>
            </div>
        </div>
    );
}
