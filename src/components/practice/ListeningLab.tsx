"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Eye, EyeOff, Lock, RotateCcw, Snail, Volume2, X } from "lucide-react";
import type { SessionSummary } from "@/app/dashboard/components/StudentPracticeView";
import type { ListeningQuestion } from "@/lib/practice/providers/ai/IAIProvider";
import { cn } from "@/lib/utils";
import { practiceApiError } from "./apiError";
import { reportClientError } from "@/lib/errors/client";
import { FOCUS, GREEN_BUTTON, GREEN_TEXT, GREEN_TINT, INDIGO_CHOSEN, MUTED, ORANGE_TEXT } from "./practiceStyles";
import { usePracticeAudio } from "./usePracticeAudio";

/**
 * Listening (rediseño de la práctica, aprobado en el lienzo el 11/11/2026).
 *
 * Las frases se leen antes de escuchar: saber qué te van a preguntar es parte
 * del ejercicio. Se contestan recién cuando el audio sonó una vez. Lo elegido
 * queda en índigo hasta comprobar, sin verde ni rojo antes de tiempo. Al
 * corregir, cada frase dice qué contestó el alumno y, si no era, qué decía el
 * audio (la cita viene del cuestionario y sólo si está en el texto,
 * `src/lib/practice/listening.ts`). El texto se abre ahí mismo, con esas
 * oraciones marcadas.
 */

const RATE_NORMAL = 0.9;
const RATE_SLOW = 0.65;

interface ListeningLabProps {
    lessonId: string;
    lessonPracticeId: string;
    topic: string;
    listeningText: string;
    onComplete: (summary: SessionSummary) => void;
    onExit: () => void;
    isPreview?: boolean;
}

/** Las frases del audio, o `[]` con el motivo si no se pudieron armar. */
async function requestQuiz(lessonPracticeId: string): Promise<{ questions: ListeningQuestion[]; problem: string | null }> {
    try {
        const res = await fetch("/api/practice/generate-listening-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonPracticeId }),
        });
        if (!res.ok) {
            return { questions: [], problem: await practiceApiError(res, "No pudimos preparar las frases de este audio.") };
        }
        const data: { questions?: ListeningQuestion[] } = await res.json();
        return { questions: data.questions ?? [], problem: null };
    } catch (err) {
        // El listening queda sin preguntas, sin cartel.
        reportClientError(err, { action: "practica.generar-preguntas", context: { lessonPracticeId } });
        return { questions: [], problem: null };
    }
}

function secondsSince(start: number): number {
    return Math.round((Date.now() - start) / 1000);
}

/** El texto con las citas marcadas, para ver dónde estaba lo que faltó. */
function markQuotes(text: string, quotes: string[]): ReactNode[] {
    const ranges = quotes
        .map((q) => {
            const at = text.indexOf(q);
            return at === -1 ? null : ([at, at + q.length] as const);
        })
        .filter((r): r is readonly [number, number] => r !== null)
        .sort((a, b) => a[0] - b[0]);

    const parts: ReactNode[] = [];
    let cursor = 0;
    for (const [start, end] of ranges) {
        if (start < cursor) continue;
        if (start > cursor) parts.push(text.slice(cursor, start));
        parts.push(
            <mark key={start} className="rounded bg-[#fff1ea] px-0.5 text-[#c2410c] shadow-[inset_0_-2px_0_#c2410c] dark:bg-orange-500/15 dark:text-orange-300">
                {text.slice(start, end)}
            </mark>,
        );
        cursor = end;
    }
    parts.push(text.slice(cursor));
    return parts;
}

export function ListeningLab({ lessonId, lessonPracticeId, topic, listeningText, onComplete, onExit, isPreview = false }: ListeningLabProps) {
    // `null` es cargando, `[]` es que no se pudo.
    const [questions, setQuestions] = useState<ListeningQuestion[] | null>(null);
    const [answers, setAnswers] = useState<Record<number, boolean>>({});
    const [listenCount, setListenCount] = useState(0);
    const [evaluated, setEvaluated] = useState(false);
    const [showText, setShowText] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const audio = usePracticeAudio(lessonPracticeId);
    const startedAtRef = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const quizRequestRef = useRef(0);

    /**
     * El cuestionario se pide al abrir y no al apretar play: el alumno tiene que
     * poder leer las frases antes de escuchar. Lo que llega de un pedido viejo
     * (si reintentó antes de que contestara el primero) se descarta.
     */
    const loadQuiz = useCallback(() => {
        const request = ++quizRequestRef.current;
        requestQuiz(lessonPracticeId).then(({ questions: loaded, problem }) => {
            if (request !== quizRequestRef.current) return;
            setQuestions(loaded);
            if (problem) setNotice(problem);
        });
    }, [lessonPracticeId]);

    useEffect(() => {
        startedAtRef.current = Date.now();
        loadQuiz();
    }, [loadQuiz]);

    // El texto se abre debajo de las frases: si no se lo trae a la vista, parece que el botón no hizo nada.
    useEffect(() => {
        if (!showText) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        textRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }, [showText]);

    const retryQuiz = () => {
        setQuestions(null);
        setNotice(null);
        loadQuiz();
    };

    const playing = audio.playing === "texto" || audio.playing === "lento";

    const play = async (rate: number, key: "texto" | "lento") => {
        if (playing) {
            audio.stop();
            return;
        }
        setNotice(null);
        // Se cuenta al terminar (o al cortarlo): recién ahí se puede contestar.
        const problem = await audio.play(listeningText, { rate, key, onEnd: () => setListenCount((c) => c + 1) });
        if (problem) setNotice(problem);
    };

    const total = questions?.length ?? 0;
    const answered = Object.keys(answers).length;
    const canAnswer = listenCount > 0 && !evaluated;
    const correct = questions ? questions.filter((q, i) => answers[i] === q.isTrue).length : 0;
    const missedQuotes = questions
        ? questions.filter((q, i) => answers[i] !== q.isTrue && q.evidence).map((q) => q.evidence as string)
        : [];

    const check = () => {
        if (!canAnswer || answered !== total || total === 0) return;
        audio.stop();
        setEvaluated(true);
        scrollRef.current?.scrollTo({ top: 0 });
    };

    const finish = async () => {
        if (!questions || questions.length === 0) {
            onExit();
            return;
        }
        audio.stop();
        setSaving(true);
        const phrasesAttempted = questions.length;
        const phrasesCorrect = correct;
        const accuracyPct = Math.round((phrasesCorrect / phrasesAttempted) * 100);
        const durationSeconds = secondsSince(startedAtRef.current);
        const weakArea = accuracyPct < 50 ? "Comprensión auditiva general" : undefined;

        if (!isPreview) {
            try {
                await fetch("/api/practice/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId, lessonPracticeId, type: "LISTENING",
                        phrasesAttempted, phrasesCorrect, accuracyPct, durationSeconds, weakArea,
                    }),
                });
            } catch (err) {
                reportClientError(err, { action: "practica.guardar-sesion", context: { lessonPracticeId, tipo: "listening" } });
            }
        }
        onComplete({ phrasesAttempted, phrasesCorrect, accuracyPct, durationSeconds, weakArea });
    };

    const exit = () => {
        audio.stop();
        onExit();
    };

    // ── Vista ────────────────────────────────────────────────────────────────

    const title = evaluated ? "Así te fue" : listenCount > 0 ? "Ahora contestá" : "Leé las frases y después escuchá";
    const subtitle = evaluated
        ? "Cada frase dice qué contestaste y qué decía el audio."
        : listenCount > 0
            ? "Si dudás, escuchalo otra vez antes de comprobar."
            : "Saber qué te van a preguntar es parte del ejercicio.";

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background text-foreground animate-in fade-in duration-200">
            <div className="mx-auto flex h-[60px] w-full max-w-lg shrink-0 items-center gap-2 pl-2 pr-5">
                <button
                    type="button"
                    onClick={exit}
                    aria-label="Salir de la práctica"
                    className={cn("flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-muted/60", MUTED, FOCUS)}
                >
                    <X className="size-6" aria-hidden />
                </button>
                <span className={cn("truncate text-xs font-bold uppercase tracking-[0.08em]", GREEN_TEXT)}>Listening · {topic}</span>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 px-5 pb-4 pt-1">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[22px] font-bold tracking-tight text-foreground">{title}</h1>
                        <p className={cn("text-sm leading-snug", MUTED)}>{subtitle}</p>
                    </div>

                    {/* El audio, arriba y siempre a la vista */}
                    {!evaluated && (
                        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                            <button
                                type="button"
                                onClick={() => play(RATE_NORMAL, "texto")}
                                aria-label={playing ? "Cortar el audio" : listenCount > 0 ? "Escuchar de nuevo" : "Escuchar el audio"}
                                className={cn(
                                    "flex size-14 shrink-0 items-center justify-center rounded-full transition-colors",
                                    listenCount > 0 && !playing ? cn(GREEN_TINT, GREEN_TEXT) : cn(GREEN_BUTTON, "shadow-[0_6px_16px_rgba(43,128,105,0.25)]"),
                                    FOCUS,
                                )}
                            >
                                {playing ? (
                                    <span className="size-[18px] rounded-[4px] bg-current" aria-hidden />
                                ) : listenCount > 0 ? (
                                    <RotateCcw className="size-6" aria-hidden />
                                ) : (
                                    <Volume2 className="size-6" aria-hidden />
                                )}
                            </button>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="text-[15px] font-semibold text-foreground">
                                    {playing ? "Sonando…" : listenCount > 0 ? "Escuchar de nuevo" : "Escuchar el audio"}
                                </span>
                                <span className={cn("text-[13px]", MUTED)}>
                                    {listenCount === 0
                                        ? "Todas las veces que quieras"
                                        : `Lo escuchaste ${listenCount} ${listenCount === 1 ? "vez" : "veces"}`}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => play(RATE_SLOW, "lento")}
                                disabled={playing && audio.playing !== "lento"}
                                className={cn("inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-45", FOCUS)}
                            >
                                <Snail className="size-4" aria-hidden />
                                {audio.playing === "lento" ? "Cortar" : "Más lento"}
                            </button>
                        </div>
                    )}

                    {notice && <p role="alert" className={cn("text-[13px] font-medium", ORANGE_TEXT)}>{notice}</p>}

                    {/* Las frases */}
                    {questions === null ? (
                        <div className="flex flex-col gap-2" aria-busy="true">
                            <p className={cn("text-sm", MUTED)}>Preparando las frases…</p>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-[104px] rounded-xl border border-border bg-muted/30 motion-safe:animate-pulse" />
                            ))}
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-5">
                            <p className="text-sm leading-relaxed text-foreground">
                                No pudimos preparar las frases de este audio. Podés escucharlo igual, o probar de nuevo.
                            </p>
                            <button type="button" onClick={retryQuiz} className={cn("h-11 rounded-xl border border-border px-4 text-sm font-semibold", FOCUS)}>
                                Probar de nuevo
                            </button>
                        </div>
                    ) : (
                        <>
                            {!evaluated && (
                                <div className="flex items-center justify-between gap-3 pt-0.5">
                                    <h2 className="text-base font-bold text-foreground">¿Verdadero o falso?</h2>
                                    {listenCount === 0 ? (
                                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", MUTED)}>
                                            <Lock className="size-3.5" aria-hidden />
                                            Se contestan después del audio
                                        </span>
                                    ) : (
                                        <span className={cn("text-xs font-semibold", MUTED)}>{answered} de {total} contestadas</span>
                                    )}
                                </div>
                            )}

                            <ul className="flex flex-col gap-2">
                                {questions.map((q, i) => {
                                    const answer = answers[i];
                                    if (evaluated) {
                                        const right = answer === q.isTrue;
                                        return (
                                            <li
                                                key={i}
                                                className={cn(
                                                    "flex flex-col gap-1.5 rounded-xl border-[1.5px] p-3",
                                                    right
                                                        ? "border-[#38b397] bg-[#f3fbf8] dark:bg-primary/10"
                                                        : "border-[#c2410c] bg-[#fff7f3] dark:border-orange-400 dark:bg-orange-500/10",
                                                )}
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <p lang="en" className="flex-1 text-[15px] font-medium leading-snug text-foreground">{q.statement}</p>
                                                    <span
                                                        role="img"
                                                        aria-label={right ? "Bien" : "Para revisar"}
                                                        className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-white", right ? "bg-[#2b8069]" : "bg-[#c2410c]")}
                                                    >
                                                        {right ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <X className="size-3.5" strokeWidth={3} aria-hidden />}
                                                    </span>
                                                </div>
                                                <span className={cn("text-[13px] font-semibold", right ? GREEN_TEXT : ORANGE_TEXT)}>
                                                    Contestaste {answer ? "Verdadero" : "Falso"}
                                                    {!right && ` · era ${q.isTrue ? "Verdadero" : "Falso"}`}
                                                </span>
                                                {!right && q.evidence && (
                                                    <p className="text-[13px] leading-snug text-foreground">
                                                        En el audio: <span lang="en" className="font-semibold">«{q.evidence}»</span>
                                                    </p>
                                                )}
                                            </li>
                                        );
                                    }
                                    return (
                                        <li key={i} className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3">
                                            <p lang="en" className="text-[15px] font-medium leading-snug text-foreground">{q.statement}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {([true, false] as const).map((value) => (
                                                    <button
                                                        key={String(value)}
                                                        type="button"
                                                        disabled={!canAnswer}
                                                        aria-pressed={canAnswer ? answer === value : undefined}
                                                        onClick={() => setAnswers((prev) => ({ ...prev, [i]: value }))}
                                                        className={cn(
                                                            "h-11 rounded-[10px] text-sm transition-colors",
                                                            !canAnswer
                                                                ? "cursor-not-allowed border border-[#ececec] bg-[#f7f7f7] font-semibold text-[#9a9a9a] dark:border-border dark:bg-muted/40 dark:text-muted-foreground"
                                                                : answer === value
                                                                    ? INDIGO_CHOSEN
                                                                    : "border border-border bg-card font-semibold text-foreground hover:bg-muted/40",
                                                            FOCUS,
                                                        )}
                                                    >
                                                        {value ? "Verdadero" : "Falso"}
                                                    </button>
                                                ))}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            {evaluated && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowText((v) => !v)}
                                            aria-expanded={showText}
                                            className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/40", FOCUS)}
                                        >
                                            {showText ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                                            {showText ? "Ocultar el texto" : "Ver el texto"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => play(RATE_NORMAL, "texto")}
                                            className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/40", FOCUS)}
                                        >
                                            <RotateCcw className="size-4" aria-hidden />
                                            {playing ? "Cortar" : "Escuchar otra vez"}
                                        </button>
                                    </div>
                                    {showText && (
                                        <p ref={textRef} lang="en" className="scroll-mb-4 rounded-xl bg-muted/40 p-4 text-[15px] leading-relaxed text-foreground">
                                            {markQuotes(listeningText, missedQuotes)}
                                        </p>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {evaluated ? (
                <footer role="status" className="shrink-0 bg-[#e8f6f2] dark:bg-primary/10">
                    <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
                        <div className="flex items-start gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2b8069] text-white">
                                <Check className="size-[18px]" strokeWidth={3} aria-hidden />
                            </span>
                            <div className="flex flex-col gap-1">
                                <p className={cn("text-lg font-bold", GREEN_TEXT)}>{correct} de {total} bien</p>
                                <p className="text-sm leading-relaxed text-foreground">
                                    {correct === total
                                        ? "Entendiste todo lo que preguntaba."
                                        : total - correct === 1
                                            ? "La que faltó queda marcada. Podés leer el texto para ver dónde estaba."
                                            : "Las que faltaron quedan marcadas. Podés leer el texto para ver dónde estaban."}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => void finish()}
                            className={cn("h-[52px] w-full rounded-xl text-base font-bold disabled:opacity-60", GREEN_BUTTON, FOCUS)}
                        >
                            {saving ? "Guardando…" : "Terminar"}
                        </button>
                    </div>
                </footer>
            ) : (
                <footer className="shrink-0 border-t border-border bg-background">
                    <div className="mx-auto w-full max-w-lg px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                        {questions && questions.length === 0 ? (
                            <button type="button" onClick={exit} className={cn("h-[52px] w-full rounded-xl border border-border text-base font-bold text-foreground", FOCUS)}>
                                Salir
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={check}
                                disabled={!canAnswer || answered !== total || total === 0}
                                className={cn(
                                    "h-[52px] w-full rounded-xl text-base font-bold",
                                    GREEN_BUTTON,
                                    "disabled:cursor-not-allowed disabled:bg-[#e6e6e6] disabled:text-[#7a7a7a] disabled:hover:bg-[#e6e6e6] dark:disabled:bg-muted dark:disabled:text-muted-foreground",
                                    FOCUS,
                                )}
                            >
                                Comprobar
                            </button>
                        )}
                    </div>
                </footer>
            )}
        </div>
    );
}
