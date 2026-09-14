"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createFamilyThread, type FamilySubject } from "@/app/actions/messages";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Send, GraduationCap, Building2, X, User, BookOpen } from "lucide-react";

interface Props {
    subjects: FamilySubject[];
    isStudent: boolean;
}

type Destination = "TEACHER" | "ADMIN";

/** Asuntos sugeridos, para no dejar el campo en blanco. */
const SUGGESTIONS: Record<Destination, string[]> = {
    TEACHER: ["Tarea", "Inasistencia", "Consulta sobre la clase", "Cómo viene cursando"],
    ADMIN: ["Cuotas", "Certificado", "Horarios", "Datos de contacto"],
};

export function FamilyComposeClient({ subjects, isStudent }: Props) {
    const router = useRouter();

    // Con un solo alumno y un solo curso no se elige nada: se entra a escribir.
    // En producción es el caso del 83% de los tutores y de casi todos los
    // alumnos — sólo 1 de 205 cursa más de una materia.
    const [studentId, setStudentId] = useState(subjects[0]?.studentId ?? "");
    const subject = useMemo(
        () => subjects.find((s) => s.studentId === studentId) ?? subjects[0],
        [subjects, studentId]
    );

    const [courseId, setCourseId] = useState(subjects[0]?.courses[0]?.courseId ?? "");
    const course = useMemo(
        () => subject?.courses.find((c) => c.courseId === courseId) ?? subject?.courses[0],
        [subject, courseId]
    );

    const [destination, setDestination] = useState<Destination>("TEACHER");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function pickStudent(id: string) {
        setStudentId(id);
        // El curso pertenece al alumno: cambiar de hijo sin resetear el curso
        // dejaría seleccionado uno que no es suyo.
        const next = subjects.find((s) => s.studentId === id);
        setCourseId(next?.courses[0]?.courseId ?? "");
    }

    const teacherAvailable = !!course?.teacherId;
    const effectiveDestination: Destination = teacherAvailable ? destination : "ADMIN";

    const canSend =
        !!subject && !!course && !!title.trim() && !!body.trim() && !sending;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSend || !subject || !course) return;
        setSending(true);
        setError(null);

        try {
            const { threadId } = await createFamilyThread({
                studentId: subject.studentId,
                courseId: course.courseId,
                destination: effectiveDestination,
                subject: title,
                body,
            });
            router.push(`/messages/${threadId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al enviar el mensaje.");
            setSending(false);
        }
    }

    if (!subject || !course) {
        return (
            <p className="text-sm text-muted-foreground">
                No tenés cursos activos sobre los que escribir.
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Sobre quién y de qué curso ── */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
                {subjects.length > 1 ? (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">¿Sobre quién escribís?</p>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map((s) => (
                                <button
                                    type="button"
                                    key={s.studentId}
                                    onClick={() => pickStudent(s.studentId)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                                        s.studentId === subject.studentId
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                    )}
                                >
                                    <User size={14} />
                                    {s.studentName}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    !isStudent && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User size={14} className="text-primary" />
                            Sobre <span className="font-semibold text-foreground">{subject.studentName}</span>
                        </p>
                    )
                )}

                {subject.courses.length > 1 ? (
                    <div className="space-y-2">
                        <label htmlFor="curso" className="text-sm font-semibold text-foreground">
                            Curso
                        </label>
                        <select
                            id="curso"
                            value={course.courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            {subject.courses.map((c) => (
                                <option key={c.courseId} value={c.courseId}>
                                    {c.courseName}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen size={14} className="text-primary" />
                        <span className="font-semibold text-foreground">{course.courseName}</span>
                    </p>
                )}
            </div>

            {/* ── A quién ── */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">¿A quién le escribís?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                        type="button"
                        disabled={!teacherAvailable}
                        onClick={() => setDestination("TEACHER")}
                        className={cn(
                            "flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                            !teacherAvailable && "opacity-50 cursor-not-allowed",
                            effectiveDestination === "TEACHER" && teacherAvailable
                                ? "bg-primary/10 border-primary text-foreground"
                                : "bg-muted/40 border-border hover:bg-muted"
                        )}
                    >
                        <GraduationCap size={18} className="mt-0.5 text-primary shrink-0" />
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold">Profesor del curso</span>
                            <span className="block text-xs text-muted-foreground truncate">
                                {teacherAvailable
                                    ? course.teacherName
                                    : "Este curso todavía no tiene profesor"}
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setDestination("ADMIN")}
                        className={cn(
                            "flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                            effectiveDestination === "ADMIN"
                                ? "bg-primary/10 border-primary text-foreground"
                                : "bg-muted/40 border-border hover:bg-muted"
                        )}
                    >
                        <Building2 size={18} className="mt-0.5 text-primary shrink-0" />
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold">Administración</span>
                            <span className="block text-xs text-muted-foreground truncate">
                                Cuotas, certificados, horarios
                            </span>
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Asunto ── */}
            <div className="space-y-2">
                <label htmlFor="asunto" className="text-sm font-semibold text-foreground">
                    Asunto
                </label>
                <input
                    id="asunto"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    placeholder="¿De qué se trata?"
                    required
                    className="w-full bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />
                {/* Un campo en blanco es la peor fricción de esta pantalla: el
                    asunto es lo que después permite encontrar el hilo. */}
                <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS[effectiveDestination].map((s) => (
                        <button
                            type="button"
                            key={s}
                            onClick={() => setTitle(s)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Mensaje ── */}
            <div className="space-y-1.5">
                <label htmlFor="cuerpo" className="text-sm font-semibold text-foreground">
                    Mensaje
                </label>
                <textarea
                    id="cuerpo"
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
                    onClick={() => router.push("/messages")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Cancelar
                </button>
                <Button
                    type="submit"
                    disabled={!canSend}
                    className="gap-2 h-10 px-6 rounded-xl font-semibold shadow-sm"
                >
                    <Send size={15} />
                    {sending ? "Enviando..." : "Enviar mensaje"}
                </Button>
            </div>
        </form>
    );
}
