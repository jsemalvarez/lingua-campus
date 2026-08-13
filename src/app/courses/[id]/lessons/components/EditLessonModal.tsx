"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { editLessonAction } from "../actions";
import { Button } from "@/components/ui/Button";
import {
    X, Calendar, BookOpen, FileText, CheckCircle, AlertCircle, Edit2,
    Sparkles, ChevronDown, ChevronUp, Mic2, Headphones, MessageSquare,
    Eye, EyeOff, Wand2, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { practiceApiError } from "@/components/practice/apiError";
import { checkDraftInputs } from "@/lib/practice/draft";

interface Schedule {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
}

interface LessonPractice {
    speakingPhrases: string[];
    listeningText: string | null;
    chatScenario: string | null;
    isPublished: boolean;
}

interface EditLessonModalProps {
    courseId: string;
    lesson: {
        id: string;
        date: Date;
        topic: string;
        content: string | null;
        type: "CLASS" | "TP" | "EXAM";
        scheduleId: string | null;
    };
    lessonPractice?: LessonPractice | null;
    schedules?: Schedule[];
}

const daysMapping = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function EditLessonModal({ courseId, lesson, lessonPractice, schedules = [] }: EditLessonModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [mounted, setMounted] = useState(false);
    // Auto-expand if the lesson already has practice material
    const [showPractice, setShowPractice] = useState(!!lessonPractice);
    const [practicePublished, setPracticePublished] = useState(lessonPractice?.isPublished ?? false);

    // Las tres secciones de práctica son estado y no `defaultValue` porque el
    // botón "Generar práctica" las escribe (PED-01).
    const [speakingPhrases, setSpeakingPhrases] = useState(lessonPractice?.speakingPhrases.join("\n") ?? "");
    const [listeningText, setListeningText] = useState(lessonPractice?.listeningText ?? "");
    const [chatScenario, setChatScenario] = useState(lessonPractice?.chatScenario ?? "");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [justGenerated, setJustGenerated] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    /**
     * El formulario se carga al abrir y no cuando cambian las props: sincronizar
     * con `lessonPractice` haría que un `router.refresh()` del padre le borre al
     * docente lo que está escribiendo, o el borrador que acaba de generar.
     */
    const openModal = () => {
        setShowPractice(!!lessonPractice);
        setPracticePublished(lessonPractice?.isPublished ?? false);
        setSpeakingPhrases(lessonPractice?.speakingPhrases.join("\n") ?? "");
        setListeningText(lessonPractice?.listeningText ?? "");
        setChatScenario(lessonPractice?.chatScenario ?? "");
        setGenerateError(null);
        setJustGenerated(false);
        setStatus("idle");
        setIsOpen(true);
    };

    const initialDateStr = new Date(lesson.date).toISOString().split("T")[0];
    const labelName = lesson.type === "CLASS" ? "Clase" : lesson.type === "TP" ? "TP" : "Examen";

    // Se mira la clase **guardada**, que es la que va a leer el servidor. Una
    // clase recién generada en tanda no tiene tema propio ni contenidos, así que
    // el botón le explica qué falta en vez de gastar una llamada en un borrador
    // sobre el título "Clase Programada".
    const draftInputs = checkDraftInputs(lesson.topic, lesson.content);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const formData = new FormData(e.currentTarget);
        formData.append("courseId", courseId);
        formData.append("lessonId", lesson.id);

        startTransition(async () => {
            const result = await editLessonAction(formData);
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

    /**
     * Pide el borrador de práctica a la IA a partir de la clase (PED-01). No
     * guarda nada: llena los tres campos y el docente decide qué hacer con eso.
     */
    const handleGenerate = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isGenerating || !draftInputs.ready) return;

        // El servidor lee el tema y los contenidos **guardados**, así que lo que
        // el docente esté escribiendo recién ahora todavía no cuenta.
        const formData = e.currentTarget.form ? new FormData(e.currentTarget.form) : null;
        const pendingTopic = String(formData?.get("topic") ?? "").trim();
        const pendingContent = String(formData?.get("content") ?? "").trim();
        const lessonEdited =
            pendingTopic !== lesson.topic.trim() || pendingContent !== (lesson.content ?? "").trim();

        if (lessonEdited && !confirm(
            "El tema o los contenidos tienen cambios sin guardar. La IA va a usar la última versión guardada de la clase. ¿Generar igual?"
        )) return;

        const hasMaterial = !!(speakingPhrases.trim() || listeningText.trim() || chatScenario.trim());
        if (hasMaterial && !confirm(
            "Ya hay material de práctica cargado y se va a reemplazar por el que genere la IA. ¿Continuar?"
        )) return;

        setIsGenerating(true);
        setGenerateError(null);
        setJustGenerated(false);

        try {
            const res = await fetch("/api/practice/generate-draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonId: lesson.id })
            });

            if (!res.ok) {
                // El 409 dice qué le falta a la clase, igual que el cartel del
                // botón. Se muestra tal cual: si llegó hasta acá es porque alguien
                // cambió la clase desde otra pantalla mientras este modal estaba
                // abierto, y el motivo importa.
                const detail = res.status === 409 ? (await res.text().catch(() => "")).trim() : "";
                setGenerateError(detail || await practiceApiError(res, "No pudimos generar el material. Probá de nuevo en un momento."));
                return;
            }

            const draft = await res.json();
            setSpeakingPhrases(Array.isArray(draft.speakingPhrases) ? draft.speakingPhrases.join("\n") : "");
            setListeningText(draft.listeningText ?? "");
            setChatScenario(draft.chatScenario ?? "");
            setJustGenerated(true);
        } catch {
            setGenerateError("No pudimos generar el material. Probá de nuevo en un momento.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen || !mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                onClick={openModal}
            >
                <Edit2 size={16} />
            </Button>
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 pb-8 bg-background/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95 my-auto">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Edit2 className="text-blue-500" /> Editar {labelName}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <input type="hidden" name="type" value={lesson.type} />

                    {/* Fecha */}
                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Fecha
                        </label>
                        <input
                            type="date"
                            name="date"
                            defaultValue={initialDateStr}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-text focus:border-blue-500"
                        />
                    </div>

                    {/* Horario */}
                    {schedules.length > 0 && (
                        <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Horario Correspondiente
                            </label>
                            <select
                                name="scheduleId"
                                className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all focus:border-blue-500"
                                defaultValue={lesson.scheduleId || ""}
                            >
                                <option value="">Seleccionar horario</option>
                                {schedules.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {daysMapping[s.dayOfWeek]} {s.startTime} - {s.endTime}{s.room ? ` (${s.room})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tema */}
                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <BookOpen size={14} /> Tema / Título Principal
                        </label>
                        <input
                            type="text"
                            name="topic"
                            defaultValue={lesson.topic}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all focus:border-blue-500"
                        />
                    </div>

                    {/* Contenidos */}
                    <div className="space-y-1.5 focus-within:text-blue-500 transition-colors">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <FileText size={14} /> Contenidos / Tareas (Opcional)
                        </label>
                        <textarea
                            name="content"
                            rows={3}
                            defaultValue={lesson.content || ""}
                            className="w-full px-4 py-2.5 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none focus:border-blue-500"
                        />
                    </div>

                    {/* ── SECCIÓN DE PRÁCTICA (solo en CLASS) ── */}
                    {lesson.type === "CLASS" && (
                        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">

                            {/* Toggle header */}
                            <button
                                type="button"
                                onClick={() => setShowPractice(!showPractice)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-violet-500/10 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                                        <Sparkles size={14} className="text-violet-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                                            Material de Práctica con IA
                                            {lessonPractice && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${lessonPractice.isPublished
                                                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                                                    }`}>
                                                    {lessonPractice.isPublished ? "Publicado" : "Borrador"}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[11px] text-violet-500/70 dark:text-violet-400/60 font-medium">
                                            {lessonPractice
                                                ? "Esta clase tiene material de práctica cargado"
                                                : "Opcional · Los alumnos practicarán lo visto en esta clase"
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="text-violet-400">
                                    {showPractice ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </button>

                            {/* Contenido expandible */}
                            {showPractice && (
                                <div className="px-5 pb-5 space-y-5 border-t border-violet-500/15">

                                    {/* Generar con IA a partir de la clase */}
                                    <div className="pt-4 space-y-2">
                                        <button
                                            type="button"
                                            onClick={handleGenerate}
                                            disabled={isGenerating || isPending || !draftInputs.ready}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                                        >
                                            {isGenerating
                                                ? <><Loader2 size={15} className="animate-spin" /> Generando material...</>
                                                : <><Wand2 size={15} /> Generar práctica con IA</>
                                            }
                                        </button>
                                        {draftInputs.ready ? (
                                            <p className="text-[11px] text-muted-foreground font-medium text-center">
                                                A partir del tema y los contenidos <strong>guardados</strong> de esta clase.
                                                Después revisá lo generado antes de publicar.
                                            </p>
                                        ) : (
                                            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[12px] font-medium">
                                                <AlertCircle size={15} className="flex-shrink-0 mt-px" /> {draftInputs.reason}
                                            </div>
                                        )}

                                        {generateError && (
                                            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[12px] font-medium">
                                                <AlertCircle size={15} className="flex-shrink-0 mt-px" /> {generateError}
                                            </div>
                                        )}
                                        {justGenerated && !generateError && (
                                            <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[12px] font-medium">
                                                <Sparkles size={15} className="flex-shrink-0 mt-px" />
                                                Borrador listo. Revisalo, corregí lo que haga falta y guardá los cambios: todavía no se guardó nada.
                                            </div>
                                        )}
                                    </div>

                                    {/* Speaking */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                                            <Mic2 size={14} /> Frases para Speaking
                                        </label>
                                        <textarea
                                            name="speakingPhrases"
                                            rows={4}
                                            value={speakingPhrases}
                                            onChange={(e) => setSpeakingPhrases(e.target.value)}
                                            disabled={isGenerating}
                                            placeholder={"She sells sea shells by the seashore.\nThe weather is better in the south.\nHow much wood would a woodchuck chuck..."}
                                            className="w-full px-4 py-3 rounded-xl border border-violet-300/40 bg-background text-sm outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none focus:border-violet-400 font-mono placeholder:font-sans placeholder:text-muted-foreground/50 disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                        <p className="text-[11px] text-muted-foreground font-medium">
                                            Una frase por línea. La IA las usará como base para generar los ejercicios del alumno.
                                        </p>
                                    </div>

                                    {/* Listening */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                                            <Headphones size={14} /> Texto para Listening{" "}
                                            <span className="text-[11px] font-normal text-muted-foreground">(Opcional)</span>
                                        </label>
                                        <textarea
                                            name="listeningText"
                                            rows={3}
                                            value={listeningText}
                                            onChange={(e) => setListeningText(e.target.value)}
                                            disabled={isGenerating}
                                            placeholder="Escribí un párrafo breve en inglés. Se convertirá en audio automáticamente para que los alumnos practiquen su comprensión auditiva."
                                            className="w-full px-4 py-3 rounded-xl border border-violet-300/40 bg-background text-sm outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none focus:border-violet-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Chatbot */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                                            <MessageSquare size={14} /> Escenario para Chatbot{" "}
                                            <span className="text-[11px] font-normal text-muted-foreground">(Opcional)</span>
                                        </label>
                                        <textarea
                                            name="chatScenario"
                                            rows={2}
                                            value={chatScenario}
                                            onChange={(e) => setChatScenario(e.target.value)}
                                            disabled={isGenerating}
                                            placeholder="Ej: Simula ser un mozo en un café. El alumno es un turista de habla inglesa. Nivel B1."
                                            className="w-full px-4 py-3 rounded-xl border border-violet-300/40 bg-background text-sm outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none focus:border-violet-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Publicar toggle */}
                                    <div
                                        onClick={() => setPracticePublished(!practicePublished)}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${practicePublished
                                            ? "border-violet-400/50 bg-violet-500/10"
                                            : "border-border/50 bg-background hover:border-violet-400/30 hover:bg-violet-500/5"
                                            }`}
                                    >
                                        <input
                                            type="hidden"
                                            name="practicePublished"
                                            value={practicePublished ? "true" : "false"}
                                        />
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${practicePublished
                                            ? "bg-violet-500 border-violet-500"
                                            : "border-muted-foreground/40"
                                            }`}>
                                            {practicePublished && (
                                                <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white">
                                                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold flex items-center gap-1.5">
                                                {practicePublished
                                                    ? <><Eye size={13} className="text-violet-500" /> Práctica visible para los alumnos</>
                                                    : <><EyeOff size={13} className="text-muted-foreground" /> Guardar como borrador</>
                                                }
                                            </p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {practicePublished
                                                    ? "Los alumnos podrán practicar esta clase al guardar."
                                                    : "Podés publicarla más tarde volviendo a editar la clase."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Feedback */}
                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <CheckCircle size={18} /> {labelName} editada exitosamente.
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-border/40 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        {/*
                          * No se puede guardar mientras la IA escribe: los campos de
                          * práctica están deshabilitados y un `<textarea disabled>` no
                          * viaja en el FormData. `editLessonAction` leería cero frases,
                          * lo interpretaría como "el docente vació la práctica" y
                          * limpiaría la fila — la rama de BUG-03.
                          */}
                        <Button type="submit" disabled={isPending || isGenerating} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
