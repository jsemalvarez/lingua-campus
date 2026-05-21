"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createThread } from "@/app/actions/messages";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Send, Users, User, BookOpen, GraduationCap, ChevronDown, ChevronUp, X } from "lucide-react";

type Student = { id: string; name: string; guardians: { id: string; name: string }[] };
type Course = { id: string; name: string; color: string; students: Student[] };
type Teacher = { id: string; name: string };

interface Props {
    senderUserId: string;
    instituteId: string;
    courses: Course[];
    allTeachers: Teacher[];
    isAdmin: boolean;
    activeRole: string;
}

type RecipientType = "course" | "students" | "teachers";

export function ComposeClient({ senderUserId, instituteId, courses, allTeachers, isAdmin, activeRole }: Props) {
    const router = useRouter();
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Recipient selection state
    const [recipientType, setRecipientType] = useState<RecipientType>("students");
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [includeGuardians, setIncludeGuardians] = useState(true);
    const [sendToAllCourse, setSendToAllCourse] = useState(false);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
    const [showStudentPicker, setShowStudentPicker] = useState(false);

    const selectedCourse = courses.find((c) => c.id === selectedCourseId);

    function toggleStudent(id: string) {
        setSelectedStudentIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleTeacher(id: string) {
        setSelectedTeacherIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAllStudents() {
        if (!selectedCourse) return;
        if (selectedStudentIds.size === selectedCourse.students.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(selectedCourse.students.map((s) => s.id)));
        }
    }

    const recipientSummary = () => {
        if (recipientType === "course" && selectedCourseId) {
            return `Todo el curso: ${selectedCourse?.name}`;
        }
        if (recipientType === "students") {
            const parts = [];
            if (selectedStudentIds.size > 0) parts.push(`${selectedStudentIds.size} alumno(s)`);
            if (includeGuardians) parts.push("+ sus tutores");
            return parts.join(" ") || "Ningún destinatario seleccionado";
        }
        if (recipientType === "teachers") {
            return selectedTeacherIds.size > 0
                ? `${selectedTeacherIds.size} profesor(es)`
                : "Ningún profesor seleccionado";
        }
        return "";
    };

    const canSend = () => {
        if (!subject.trim() || !body.trim()) return false;
        if (recipientType === "course") return !!selectedCourseId;
        if (recipientType === "students") return selectedStudentIds.size > 0;
        if (recipientType === "teachers") return selectedTeacherIds.size > 0;
        return false;
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSend()) return;
        setSending(true);
        setError(null);

        try {
            const { threadId } = await createThread({
                instituteId,
                subject,
                body,
                type: recipientType === "course" ? "COURSE_BLAST" : "DIRECT",
                courseId: selectedCourseId || undefined,
                senderUserId,
                senderRole: activeRole,
                recipientStudentIds:
                    recipientType === "students" ? Array.from(selectedStudentIds) : [],
                recipientUserIds:
                    recipientType === "teachers" ? Array.from(selectedTeacherIds) : [],
                includeGuardians,
            });
            router.push(`/messages/${threadId}`);
        } catch (err: any) {
            setError(err.message ?? "Error al enviar el mensaje.");
            setSending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Recipient Type Selector ── */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-semibold text-foreground">Para:</p>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setRecipientType("students")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                            recipientType === "students"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        )}
                    >
                        <User size={14} /> Alumnos
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecipientType("course")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                            recipientType === "course"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        )}
                    >
                        <BookOpen size={14} /> Curso completo
                    </button>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setRecipientType("teachers")}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                                recipientType === "teachers"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            )}
                        >
                            <GraduationCap size={14} /> Profesores
                        </button>
                    )}
                </div>

                {/* ── Course selector (for both "course" and "students" types) ── */}
                {(recipientType === "course" || recipientType === "students") && (
                    <div className="space-y-3">
                        <select
                            id="course-select"
                            value={selectedCourseId}
                            onChange={(e) => {
                                setSelectedCourseId(e.target.value);
                                setSelectedStudentIds(new Set());
                            }}
                            className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">
                                {recipientType === "course"
                                    ? "Seleccioná un curso..."
                                    : "Filtrar por curso (opcional)"}
                            </option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Student picker for "students" type */}
                        {recipientType === "students" && selectedCourse && (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setShowStudentPicker((v) => !v)}
                                    className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors px-1"
                                >
                                    <span>
                                        {selectedStudentIds.size === 0
                                            ? "Seleccionar alumnos"
                                            : `${selectedStudentIds.size} alumno(s) seleccionado(s)`}
                                    </span>
                                    {showStudentPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>

                                {showStudentPicker && (
                                    <div className="border border-border/60 rounded-xl overflow-hidden">
                                        {/* Select all */}
                                        <button
                                            type="button"
                                            onClick={toggleAllStudents}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium bg-muted/40 hover:bg-muted transition-colors text-left"
                                        >
                                            <div
                                                className={cn(
                                                    "h-4 w-4 rounded border-2 flex items-center justify-center transition-all",
                                                    selectedStudentIds.size === selectedCourse.students.length
                                                        ? "bg-primary border-primary"
                                                        : "border-border"
                                                )}
                                            >
                                                {selectedStudentIds.size === selectedCourse.students.length && (
                                                    <span className="text-primary-foreground text-[10px]">✓</span>
                                                )}
                                            </div>
                                            Seleccionar todos
                                        </button>
                                        {selectedCourse.students.map((student) => (
                                            <button
                                                type="button"
                                                key={student.id}
                                                onClick={() => toggleStudent(student.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left border-t border-border/40"
                                            >
                                                <div
                                                    className={cn(
                                                        "h-4 w-4 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                                        selectedStudentIds.has(student.id)
                                                            ? "bg-primary border-primary"
                                                            : "border-border"
                                                    )}
                                                >
                                                    {selectedStudentIds.has(student.id) && (
                                                        <span className="text-primary-foreground text-[10px]">✓</span>
                                                    )}
                                                </div>
                                                <span>{student.name}</span>
                                                {student.guardians.length > 0 && (
                                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                                        {student.guardians.length} tutor(es)
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedStudentIds.size > 0 && (
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors px-1">
                                        <input
                                            type="checkbox"
                                            checked={includeGuardians}
                                            onChange={(e) => setIncludeGuardians(e.target.checked)}
                                            className="h-4 w-4 accent-primary rounded"
                                        />
                                        <Users size={13} />
                                        Incluir también a los tutores de estos alumnos
                                    </label>
                                )}
                            </div>
                        )}

                        {/* Checkbox for Course type */}
                        {recipientType === "course" && selectedCourseId && (
                            <div className="pt-2 border-t border-border/40 mt-3">
                                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:opacity-80 transition-opacity px-1 font-medium bg-primary/5 py-2 rounded-xl border border-primary/20">
                                    <input
                                        type="checkbox"
                                        checked={includeGuardians}
                                        onChange={(e) => setIncludeGuardians(e.target.checked)}
                                        className="h-4 w-4 accent-primary rounded ml-2"
                                    />
                                    <Users size={16} className="text-primary" />
                                    <span className="text-primary">Incluir también a los tutores del curso</span>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Teacher picker ── */}
                {recipientType === "teachers" && isAdmin && (
                    <div className="border border-border/60 rounded-xl overflow-hidden">
                        {allTeachers.map((teacher, idx) => (
                            <button
                                type="button"
                                key={teacher.id}
                                onClick={() => toggleTeacher(teacher.id)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left",
                                    idx > 0 && "border-t border-border/40"
                                )}
                            >
                                <div
                                    className={cn(
                                        "h-4 w-4 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                        selectedTeacherIds.has(teacher.id)
                                            ? "bg-primary border-primary"
                                            : "border-border"
                                    )}
                                >
                                    {selectedTeacherIds.has(teacher.id) && (
                                        <span className="text-primary-foreground text-[10px]">✓</span>
                                    )}
                                </div>
                                {teacher.name}
                            </button>
                        ))}
                        {allTeachers.length === 0 && (
                            <p className="text-sm text-muted-foreground p-4 text-center">
                                No hay profesores registrados.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Summary pill ── */}
                {canSend() && (
                    <div className="flex items-center gap-2 text-xs px-3 py-2 bg-primary/8 text-primary rounded-xl font-medium">
                        <Users size={12} />
                        {recipientSummary()}
                    </div>
                )}
            </div>

            {/* ── Subject ── */}
            <div className="space-y-1.5">
                <label htmlFor="subject" className="text-sm font-semibold text-foreground">
                    Asunto
                </label>
                <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ej: Tarea pendiente — clase del martes"
                    required
                    className="w-full bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />
            </div>

            {/* ── Body ── */}
            <div className="space-y-1.5">
                <label htmlFor="message-body" className="text-sm font-semibold text-foreground">
                    Mensaje
                </label>
                <textarea
                    id="message-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Escribí tu mensaje acá..."
                    rows={7}
                    required
                    className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
                    <X size={14} />
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between pt-2">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Cancelar
                </button>
                <Button
                    type="submit"
                    disabled={sending || !canSend()}
                    className="gap-2 h-10 px-6 rounded-xl font-semibold shadow-sm"
                >
                    <Send size={15} />
                    {sending ? "Enviando..." : "Enviar mensaje"}
                </Button>
            </div>
        </form>
    );
}
