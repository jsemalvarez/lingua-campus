"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Mic, MicOff, RotateCcw, Snail, Volume1, Volume2, X } from "lucide-react";
import type { SessionSummary } from "@/app/dashboard/components/StudentPracticeView";
import { checkReading, gradeReading, listWords, splitWords, type ReadingGrade } from "@/lib/practice/words";
import { cn } from "@/lib/utils";
import { FOCUS, GREEN_BUTTON, GREEN_TEXT, GREEN_TINT, MUTED, ORANGE_BUTTON, ORANGE_TEXT } from "./practiceStyles";
import { usePracticeAudio } from "./usePracticeAudio";

/**
 * Speaking, de a una palabra (rediseño de la práctica, aprobado en el lienzo el
 * 11/11/2026).
 *
 * El alumno ve la frase con cada palabra suelta: la que toca va en índigo y, a
 * medida que habla, las que salen se pintan de verde. Al terminar de hablar el
 * campus compara lo que reconoció el navegador contra la frase
 * (`src/lib/practice/words.ts`) y decide bien, casi o todavía no, sin esperar a
 * nadie. La IA queda para el comentario de lo que faltó: si no contesta, el
 * ejercicio sigue igual.
 *
 * Tocar una palabra la hace escuchar sola, sin restar. Se puede probar de nuevo,
 * seguir o saltear; la frase que quedó casi o todavía no vuelve una vez al final.
 * Sin micrófono se explica por qué y se sigue escuchando y repitiendo, sin
 * corregir.
 */

// ─── Reconocimiento de voz del navegador ─────────────────────────────────────

interface Recognition {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─── Cómo se ve cada palabra ─────────────────────────────────────────────────

type WordLook = "neutral" | "toca" | "bien" | "falta";

const WORD_LOOK: Record<WordLook, string> = {
    neutral: "hover:bg-muted/60",
    toca: "bg-[#eef0fb] text-[#2e3192] shadow-[inset_0_-3px_0_#2e3192] dark:bg-indigo-500/20 dark:text-indigo-200 dark:shadow-[inset_0_-3px_0_#a5b4fc]",
    bien: "bg-[#e8f6f2] text-[#23705b] dark:bg-primary/15 dark:text-primary",
    falta: "bg-[#fff1ea] text-[#c2410c] shadow-[inset_0_-3px_0_#c2410c] dark:bg-orange-500/15 dark:text-orange-300 dark:shadow-[inset_0_-3px_0_#fb923c]",
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Phase = "ready" | "listening" | "result" | "saving";

/**
 * Por qué no hay micrófono: bloqueado por el navegador, un navegador que no
 * reconoce la voz, o el alumno que eligió «No puedo hablar ahora».
 */
type MicState = "ok" | "blocked" | "unsupported" | "declined";

interface PhraseResult {
    grade: ReadingGrade;
    matched: boolean[];
    count: number;
    transcript: string;
}

/**
 * Lo que trae «Repasar la frase» desde el cierre: la vez anterior, para
 * completarla en lugar de guardar otra sesión (decisión del 17/11/2026).
 */
export interface SpeakingReview {
    /** La sesión que se completa. Sin id (no se llegó a guardar) se guarda como nueva. */
    sessionId?: string;
    /** Las frases de la vez anterior y cómo salieron. */
    previous: NonNullable<SessionSummary["phrases"]>;
    durationSeconds: number;
    weakArea?: string;
}

interface SpeakingHubProps {
    lessonId: string;
    lessonPracticeId: string;
    topic: string;
    /** Las frases a decir: las de la clase, o en un repaso sólo las que quedaron. */
    phrases: string[];
    review?: SpeakingReview;
    onComplete: (summary: SessionSummary) => void;
    onExit: () => void;
    isPreview?: boolean;
}

const RATE_NORMAL = 0.85;
const RATE_SLOW = 0.6;
const RATE_WORD = 0.75;

function secondsSince(start: number): number {
    return Math.round((Date.now() - start) / 1000);
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SpeakingHub({ lessonId, lessonPracticeId, topic, phrases, review, onComplete, onExit, isPreview = false }: SpeakingHubProps) {
    // El orden en que se dicen las frases. La que queda casi o todavía no, si el
    // alumno sigue, se agrega una vez al final para repasarla.
    const [queue, setQueue] = useState<number[]>(() => phrases.map((_, i) => i));
    const [requeued, setRequeued] = useState<number[]>([]);
    const [pos, setPos] = useState(0);
    const [phase, setPhase] = useState<Phase>("ready");
    const [mic, setMic] = useState<MicState>(() => (recognitionConstructor() ? "ok" : "unsupported"));
    const [live, setLive] = useState("");
    const [result, setResult] = useState<PhraseResult | null>(null);
    const [comment, setComment] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const audio = usePracticeAudio(lessonPracticeId);
    const speaking = audio.playing;

    const recognitionRef = useRef<Recognition | null>(null);
    const cancelledRef = useRef(false);
    const commentRequestRef = useRef(0);
    const startedAtRef = useRef(0);
    /** Por frase: si salió bien alguna vez. Lo que se guarda al terminar. */
    const outcomesRef = useRef(new Map<number, boolean>());
    /** Por frase: las palabras que faltaron la última vez. Para el cierre. */
    const missingRef = useRef(new Map<number, string[]>());
    const weakAreasRef = useRef<string[]>([]);

    const phraseIndex = queue[pos];
    const phrase = phrases[phraseIndex] ?? "";
    const words = useMemo(() => splitWords(phrase), [phrase]);
    const isRepeat = pos >= phrases.length;
    const willRequeue = !!result && result.grade !== "bien" && !requeued.includes(phraseIndex);
    const isLast = pos >= queue.length - 1 && !willRequeue;
    const liveCheck = useMemo(() => (phase === "listening" ? checkReading(words, live) : null), [phase, words, live]);
    const missing = result ? words.filter((_, i) => !result.matched[i]).map((w) => w.text) : [];

    // El micrófono bloqueado se sabe antes de tocar «Grabar», si el navegador lo dice.
    useEffect(() => {
        startedAtRef.current = Date.now();
        try {
            navigator.permissions
                ?.query({ name: "microphone" as PermissionName })
                .then((status) => {
                    if (status.state === "denied") setMic((m) => (m === "ok" ? "blocked" : m));
                })
                .catch(() => {});
        } catch {
            // Algún navegador no sabe preguntar por el micrófono: se ve al grabar.
        }
    }, []);

    // Al salir no queda nada escuchando (el audio lo corta `usePracticeAudio`).
    useEffect(() => {
        return () => {
            cancelledRef.current = true;
            recognitionRef.current?.abort();
        };
    }, []);

    // ── Escuchar ─────────────────────────────────────────────────────────────

    const stopAudio = () => audio.stop();

    /**
     * La frase pasa por el servidor, según el instituto. Una palabra suelta va
     * directo con la voz del navegador: tocar palabras no gasta cuota.
     */
    const speak = async (text: string, rate: number, key: string, preferBrowser = false) => {
        if (phase === "listening" || phase === "saving") return;
        setNotice(null);
        const problem = await audio.play(text, { rate, key, preferBrowser });
        if (problem) setNotice(problem);
    };

    // ── Hablar ───────────────────────────────────────────────────────────────

    const requestComment = (transcript: string, missingWords: string[]) => {
        const request = ++commentRequestRef.current;
        fetch("/api/practice/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonPracticeId, expected: phrase, actual: transcript, missing: missingWords }),
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { feedback?: string; weakArea?: string } | null) => {
                if (!data || request !== commentRequestRef.current) return;
                if (data.feedback) setComment(data.feedback);
                if (data.weakArea) weakAreasRef.current.push(data.weakArea);
            })
            .catch(() => {});
    };

    const startListening = () => {
        const Constructor = recognitionConstructor();
        if (!Constructor) {
            setMic("unsupported");
            return;
        }
        stopAudio();
        commentRequestRef.current++;
        setNotice(null);
        setResult(null);
        setComment(null);
        setLive("");

        let transcript = "";
        let failure: "blocked" | "network" | "device" | null = null;
        cancelledRef.current = false;

        const recognition = new Constructor();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            transcript = Array.from(event.results, (r) => r[0].transcript).join(" ").trim();
            setLive(transcript);
        };
        recognition.onerror = (event) => {
            if (event.error === "not-allowed" || event.error === "service-not-allowed") failure = "blocked";
            else if (event.error === "network") failure = "network";
            else if (event.error === "audio-capture") failure = "device";
        };
        recognition.onend = () => {
            recognitionRef.current = null;
            if (cancelledRef.current) return;
            if (failure === "blocked") {
                setMic("blocked");
                setPhase("ready");
                return;
            }
            if (!transcript) {
                setPhase("ready");
                setNotice(
                    failure === "network" ? "No se pudo usar el reconocimiento de voz. Revisá la conexión y probá de nuevo."
                        : failure === "device" ? "No encontramos un micrófono. Revisá que esté conectado y probá de nuevo."
                            : "No te escuché. Tocá el micrófono y probá de nuevo.",
                );
                return;
            }

            const check = checkReading(words, transcript);
            const grade = gradeReading(check, words.length);
            setResult({ grade, matched: check.matched, count: check.count, transcript });
            setPhase("result");
            outcomesRef.current.set(phraseIndex, outcomesRef.current.get(phraseIndex) === true || grade === "bien");
            const missingWords = words.filter((_, i) => !check.matched[i]).map((w) => w.text);
            missingRef.current.set(phraseIndex, missingWords);
            if (grade !== "bien") requestComment(transcript, missingWords);
        };

        recognitionRef.current = recognition;
        setMic("ok");
        setPhase("listening");
        try {
            recognition.start();
        } catch {
            recognitionRef.current = null;
            setPhase("ready");
        }
    };

    const stopListening = () => recognitionRef.current?.stop();

    const cancelListening = () => {
        cancelledRef.current = true;
        recognitionRef.current?.abort();
        recognitionRef.current = null;
    };

    // ── Avanzar ──────────────────────────────────────────────────────────────

    const finish = async () => {
        // En el orden de la clase, sólo las que se corrigieron: las salteadas sin decir no cuentan.
        const corrected = phrases
            .map((text, i) => ({ text, i, ok: outcomesRef.current.get(i) }))
            .filter((p): p is { text: string; i: number; ok: boolean } => p.ok !== undefined)
            .map(({ text, i, ok }) => ({ text, ok, missing: ok ? [] : missingRef.current.get(i) ?? [] }));
        // Sin ninguna frase corregida (sin micrófono, o todo salteado) no hay nada
        // que medir: no se guarda una sesión con 0 de 0.
        if (corrected.length === 0) {
            onExit();
            return;
        }
        setPhase("saving");
        const seconds = secondsSince(startedAtRef.current);
        const areas = weakAreasRef.current;
        const newWeakArea = areas.length > 0
            ? [...areas].sort((a, b) => areas.filter((v) => v === b).length - areas.filter((v) => v === a).length)[0]
            : undefined;

        // Un repaso completa la vez anterior: la frase que sale ahora pasa a bien,
        // y la que vuelve a fallar queda con lo que faltó esta vez.
        const again = new Map(corrected.map((p) => [p.text, p]));
        const merged = review ? review.previous.map((p) => (p.ok ? p : again.get(p.text) ?? p)) : corrected;
        const phrasesAttempted = merged.length;
        const phrasesCorrect = merged.filter((p) => p.ok).length;
        const accuracyPct = Math.round((phrasesCorrect / phrasesAttempted) * 100);
        const durationSeconds = (review?.durationSeconds ?? 0) + seconds;
        const weakArea = newWeakArea ?? review?.weakArea;
        let sessionId = review?.sessionId;

        if (!isPreview) {
            try {
                if (review && sessionId) {
                    await fetch("/api/practice/session", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId, phrasesCorrect, extraSeconds: seconds, weakArea: newWeakArea }),
                    });
                } else {
                    const res = await fetch("/api/practice/session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            lessonId, lessonPracticeId, type: "SPEAKING",
                            phrasesAttempted, phrasesCorrect, accuracyPct, durationSeconds, weakArea,
                        }),
                    });
                    if (res.ok) sessionId = ((await res.json()) as { sessionId?: string }).sessionId;
                }
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }
        onComplete({ phrasesAttempted, phrasesCorrect, accuracyPct, durationSeconds, weakArea, phrases: merged, sessionId });
    };

    /** A la próxima frase. `review` la deja para repasar al final, si todavía no volvió. */
    const goNext = (review: boolean) => {
        cancelListening();
        stopAudio();
        commentRequestRef.current++;
        let nextQueue = queue;
        if (review && !requeued.includes(phraseIndex)) {
            nextQueue = [...queue, phraseIndex];
            setQueue(nextQueue);
            setRequeued([...requeued, phraseIndex]);
        }
        setResult(null);
        setComment(null);
        setNotice(null);
        setLive("");
        if (pos + 1 >= nextQueue.length) {
            void finish();
            return;
        }
        setPos(pos + 1);
        setPhase("ready");
    };

    const exit = () => {
        cancelListening();
        stopAudio();
        onExit();
    };

    // ── Vista ────────────────────────────────────────────────────────────────

    const lookOf = (index: number): WordLook => {
        if (phase === "result" && result) return result.matched[index] ? "bien" : "falta";
        if (phase === "listening" && liveCheck) {
            if (index === liveCheck.next) return "toca";
            return index < liveCheck.next && liveCheck.matched[index] ? "bien" : "neutral";
        }
        if (phase === "ready" && mic === "ok") return index === 0 ? "toca" : "neutral";
        return "neutral";
    };

    const listening = phase === "listening";
    const done = pos + (phase === "result" && result?.grade === "bien" ? 1 : 0);
    const progress = Math.min(100, Math.round((done / queue.length) * 100));
    const nextLabel = isLast ? "Terminar" : "Seguir";

    const hint = result && missing.length === 1
        ? <>Tocá <strong lang="en" className={cn("font-bold", ORANGE_TEXT)}>{missing[0]}</strong> para escucharla sola.</>
        : result && missing.length > 1
            ? "Tocá las palabras en naranja para escucharlas."
            : "Tocá una palabra para escucharla sola.";

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background text-foreground animate-in fade-in duration-200">
            {/* Salir y avance */}
            <div className="mx-auto flex h-16 w-full max-w-lg shrink-0 items-center gap-3 pl-2 pr-5">
                <button
                    type="button"
                    onClick={exit}
                    aria-label="Salir de la práctica"
                    className={cn("flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-muted/60", MUTED, FOCUS)}
                >
                    <X className="size-6" aria-hidden />
                </button>
                <div aria-hidden className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className={cn("whitespace-nowrap text-[13px] font-semibold", MUTED)}>
                    {isRepeat ? "Repaso" : `${pos + 1} de ${phrases.length}`}
                </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-5 px-5 pb-5 pt-2">
                    <div className="flex flex-col gap-1.5">
                        <span className={cn("text-xs font-bold uppercase tracking-[0.08em]", GREEN_TEXT)}>Speaking · {topic}</span>
                        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
                            {isRepeat ? "Repasá esta frase" : "Decí esta frase en voz alta"}
                        </h1>
                    </div>

                    {/* La frase, de a una palabra */}
                    <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card px-[15px] pb-5 pt-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                        <p lang="en" aria-live={listening ? "polite" : undefined} className="text-[26px] font-semibold leading-[1.5] tracking-[-0.01em] text-[#3a3a3a] dark:text-foreground">
                            {words.map((word, i) => (
                                <span key={i}>
                                    {word.before}
                                    <button
                                        type="button"
                                        disabled={listening}
                                        onClick={() => speak(word.text, RATE_WORD, `w${i}`, true)}
                                        className={cn(
                                            "my-0.5 inline-block rounded-lg px-[5px] transition-colors disabled:cursor-default",
                                            WORD_LOOK[lookOf(i)],
                                            speaking === `w${i}` && "ring-2 ring-primary/60",
                                            FOCUS,
                                        )}
                                    >
                                        {word.text}
                                    </button>
                                    {/* La puntuación va pegada a la palabra, no al borde de su fondo. */}
                                    {word.after && <span className="-ml-1">{word.after}</span>}{" "}
                                </span>
                            ))}
                        </p>

                        {!listening && (
                            <p className={cn("mx-[5px] flex items-center gap-1.5 text-[13px]", MUTED)}>
                                <Volume1 className={cn("size-4 shrink-0", missing.length > 0 && ORANGE_TEXT)} aria-hidden />
                                <span>{hint}</span>
                            </p>
                        )}

                        <div className={cn("flex flex-wrap gap-2 px-[5px]", listening && "opacity-45")}>
                            <button
                                type="button"
                                disabled={listening}
                                onClick={() => speak(phrase, RATE_NORMAL, "frase")}
                                className={cn("inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed", GREEN_TINT, GREEN_TEXT, FOCUS)}
                            >
                                <Volume2 className="size-[18px]" aria-hidden />
                                {speaking === "frase" ? "Escuchando…" : "Escuchar"}
                            </button>
                            <button
                                type="button"
                                disabled={listening}
                                onClick={() => speak(phrase, RATE_SLOW, "lento")}
                                className={cn("inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed", FOCUS)}
                            >
                                <Snail className="size-[18px]" aria-hidden />
                                {speaking === "lento" ? "Escuchando…" : "Más lento"}
                            </button>
                        </div>

                        {notice && (phase !== "ready" || mic !== "ok") && (
                            <p role="alert" className={cn("mx-[5px] text-[13px] font-medium", ORANGE_TEXT)}>{notice}</p>
                        )}

                        {result && result.grade !== "bien" && (
                            <div className="mx-[5px] flex flex-col gap-1 border-t border-[#f0f0f0] pt-3.5 dark:border-border">
                                <span className={cn("text-xs font-semibold", MUTED)}>Se escuchó</span>
                                <p lang="en" className="text-[17px] font-medium leading-snug text-foreground">{result.transcript}</p>
                            </div>
                        )}
                    </div>

                    {/* Sin micrófono */}
                    {mic === "blocked" && (
                        <div className="flex flex-col gap-3 rounded-2xl bg-[#eef0fb] p-5 dark:bg-indigo-500/15">
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2e3192] dark:bg-background dark:text-indigo-200">
                                    <MicOff className="size-5" aria-hidden />
                                </span>
                                <p className="text-base font-bold text-[#2e3192] dark:text-indigo-200">El micrófono está bloqueado</p>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">
                                Este navegador no tiene permiso para usar el micrófono. Podés dárselo desde la configuración del navegador, en los permisos de este sitio.
                            </p>
                            <button
                                type="button"
                                onClick={startListening}
                                className={cn("h-11 self-start rounded-xl border-[1.5px] border-[#2e3192] bg-white px-4 text-sm font-bold text-[#2e3192] dark:border-indigo-300 dark:bg-transparent dark:text-indigo-200", FOCUS)}
                            >
                                Ya le di permiso
                            </button>
                        </div>
                    )}
                    {mic === "unsupported" && (
                        <div className="flex flex-col gap-3 rounded-2xl bg-[#eef0fb] p-5 dark:bg-indigo-500/15">
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2e3192] dark:bg-background dark:text-indigo-200">
                                    <MicOff className="size-5" aria-hidden />
                                </span>
                                <p className="text-base font-bold text-[#2e3192] dark:text-indigo-200">Este navegador no reconoce la voz</p>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">
                                Para que se corrija lo que decís, abrí el campus en Google Chrome.
                            </p>
                        </div>
                    )}
                    {mic === "declined" && (
                        <p className={cn("text-center text-sm", MUTED)}>
                            Cuando puedas hablar,{" "}
                            <button type="button" onClick={() => setMic("ok")} className={cn("font-semibold underline underline-offset-[3px]", GREEN_TEXT, FOCUS)}>
                                volvé a usar el micrófono
                            </button>
                            .
                        </p>
                    )}

                    {/* El micrófono */}
                    {mic === "ok" && (phase === "ready" || listening) && (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3.5 py-4">
                            {listening ? (
                                <>
                                    <div className="flex size-[172px] items-center justify-center rounded-full bg-primary/10 motion-safe:animate-pulse">
                                        <div className="flex size-[132px] items-center justify-center rounded-full bg-primary/20">
                                            <button
                                                type="button"
                                                onClick={stopListening}
                                                aria-label="Terminar"
                                                className={cn("flex size-24 items-center justify-center rounded-full shadow-[0_8px_20px_rgba(43,128,105,0.28)]", GREEN_BUTTON, FOCUS)}
                                            >
                                                <span className="size-[22px] rounded-[5px] bg-current" aria-hidden />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[15px] font-semibold text-foreground">Te escucho…</p>
                                    <p className={cn("text-[13px]", MUTED)}>Cuando termines, tocá para cortar</p>
                                </>
                            ) : (
                                <>
                                    <div className={cn("flex size-[132px] items-center justify-center rounded-full", GREEN_TINT)}>
                                        <button
                                            type="button"
                                            onClick={startListening}
                                            aria-label="Grabar"
                                            className={cn("flex size-24 items-center justify-center rounded-full shadow-[0_8px_20px_rgba(43,128,105,0.28)]", GREEN_BUTTON, FOCUS)}
                                        >
                                            <Mic className="size-10" aria-hidden />
                                        </button>
                                    </div>
                                    <p className="text-[15px] font-semibold text-foreground">Tocá el micrófono y decí la frase</p>
                                    {notice && <p role="alert" className={cn("max-w-xs text-center text-[13px] font-medium", ORANGE_TEXT)}>{notice}</p>}
                                    <button
                                        type="button"
                                        onClick={() => setMic("declined")}
                                        className={cn("h-11 px-3 text-sm font-semibold underline underline-offset-[3px]", MUTED, FOCUS)}
                                    >
                                        No puedo hablar ahora
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Abajo, siempre en el mismo lugar */}
            {phase === "result" && result?.grade === "bien" ? (
                <footer role="status" className="shrink-0 bg-[#e8f6f2] dark:bg-primary/10">
                    <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
                        <div className="flex items-start gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2b8069] text-white">
                                <Check className="size-[18px]" strokeWidth={3} aria-hidden />
                            </span>
                            <div className="flex flex-col gap-1.5">
                                <p className={cn("text-lg font-bold", GREEN_TEXT)}>¡Bien dicha!</p>
                                <p className="text-sm leading-relaxed text-foreground">
                                    {words.length === 1 ? "Salió la palabra." : `Salieron las ${words.length} palabras.`}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={() => goNext(false)} className={cn("h-[52px] w-full rounded-xl text-base font-bold", GREEN_BUTTON, FOCUS)}>
                            {nextLabel}
                        </button>
                        <button type="button" onClick={startListening} className={cn("h-11 w-full text-[15px] font-bold", GREEN_TEXT, FOCUS)}>
                            Decirla otra vez
                        </button>
                    </div>
                </footer>
            ) : phase === "result" && result ? (
                <footer role="status" className="shrink-0 bg-[#fff1ea] dark:bg-orange-500/10">
                    <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
                        <div className="flex items-start gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#c2410c] text-white">
                                <RotateCcw className="size-[18px]" strokeWidth={2.5} aria-hidden />
                            </span>
                            <div className="flex flex-col gap-1.5">
                                <p className={cn("text-lg font-bold", ORANGE_TEXT)}>
                                    {result.grade === "todavia"
                                        ? "Todavía no"
                                        : missing.length === 1
                                            ? `Casi. Faltó «${missing[0]}»`
                                            : missing.length <= 3
                                                ? `Casi. Faltaron ${listWords(missing)}`
                                                : "Casi. Faltaron algunas"}
                                </p>
                                <p className="text-sm leading-relaxed text-foreground">
                                    {result.count === 0
                                        ? "No salió ninguna palabra todavía."
                                        : `Salieron ${result.count} de ${words.length} palabras.`}
                                    {result.grade === "todavia" && " Escuchala con «Más lento» y probá de nuevo."}
                                </p>
                                {comment && <p className="text-sm leading-relaxed text-foreground">{comment}</p>}
                                {willRequeue && (
                                    <p className={cn("text-[13px] leading-snug", MUTED)}>Si seguís, esta frase vuelve al final para repasarla.</p>
                                )}
                            </div>
                        </div>
                        <button type="button" onClick={startListening} className={cn("flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-base font-bold", ORANGE_BUTTON, FOCUS)}>
                            <Mic className="size-[18px]" aria-hidden />
                            Probar de nuevo
                        </button>
                        <button type="button" onClick={() => goNext(true)} className={cn("h-11 w-full text-[15px] font-bold", ORANGE_TEXT, FOCUS)}>
                            {isLast ? "Terminar" : "Seguir con la próxima"}
                        </button>
                    </div>
                </footer>
            ) : (
                <footer className="shrink-0 border-t border-border bg-background">
                    <div className="mx-auto flex w-full max-w-lg flex-col gap-2.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                        {mic !== "ok" ? (
                            <>
                                <p className={cn("text-center text-[13px] leading-snug", MUTED)}>
                                    Podés escuchar las frases y repetirlas en voz alta. Esta vez no se corrigen.
                                </p>
                                <button
                                    type="button"
                                    disabled={phase === "saving"}
                                    onClick={() => goNext(false)}
                                    className={cn("h-[52px] w-full rounded-xl text-base font-bold disabled:opacity-60", GREEN_BUTTON, FOCUS)}
                                >
                                    {phase === "saving" ? "Guardando…" : isLast ? "Terminar" : "Seguir sin micrófono"}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                disabled={phase === "saving"}
                                onClick={() => goNext(false)}
                                className={cn("flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-[#d9d9d9] bg-background text-base font-bold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-60 dark:border-border", FOCUS)}
                            >
                                {phase === "saving" ? "Guardando…" : isLast ? "Saltear y terminar" : "Saltear esta frase"}
                                {phase !== "saving" && <ChevronRight className="size-[18px]" aria-hidden />}
                            </button>
                        )}
                    </div>
                </footer>
            )}
        </div>
    );
}
