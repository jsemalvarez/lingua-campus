"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Headphones, Volume2, Loader2, LogOut, Eye, EyeOff,
    ChevronRight, CheckCircle2, Sparkles, AlertCircle, XCircle, Lock
} from "lucide-react";
import type { SessionSummary } from "@/app/dashboard/components/StudentPracticeView";
import { practiceApiError } from "./apiError";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * El estado del audio y nada más.
 *
 * Que el alumno ya haya escuchado lo dice `listenCount`, y que ya haya corregido
 * lo dice `isEvaluated`. Antes había un `done_listening` que hacía las tres cosas
 * a la vez, y era justamente lo que mantenía el cuestionario escondido hasta el
 * final del audio: las preguntas se dibujaban sólo en esa fase.
 */
type Phase =
    | "idle"
    | "playing"
    | "saving";

interface ListeningQuestion {
    statement: string;
    isTrue: boolean;
}

interface ListeningLabProps {
    lessonId: string;
    lessonPracticeId: string;
    listeningText: string;
    onComplete: (summary: SessionSummary) => void;
    onExit: () => void;
    isPreview?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ListeningLab({
    lessonId,
    lessonPracticeId,
    listeningText,
    onComplete,
    onExit,
    isPreview = false,
}: ListeningLabProps) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [listenCount, setListenCount] = useState(0);
    const [showText, setShowText] = useState(false);
    
    // Quiz state
    const [questions, setQuestions] = useState<ListeningQuestion[] | null>(null);
    const [answers, setAnswers] = useState<Record<number, boolean>>({});
    const [isEvaluated, setIsEvaluated] = useState(false);
    
    const [currentText, setCurrentText] = useState(listeningText);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDynamic, setIsDynamic] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    /**
     * Descarta la respuesta que llega tarde. Pasa cuando el alumno pide un texto
     * nuevo con IA mientras el cuestionario original todavía viaja: sin esto, el
     * original le pisaría las preguntas al texto generado.
     */
    const quizRequestRef = useRef(0);

    /**
     * El cuestionario se pide al abrir la práctica y no al apretar play: el
     * alumno tiene que poder leer las preguntas **antes** de escuchar, así que
     * para cuando mire la pantalla ya tienen que estar pedidas.
     *
     * `questions` dice en qué está: `null` es cargando, `[]` es que no se pudo,
     * y con preguntas adentro es el ejercicio listo.
     */
    const loadOriginalQuiz = useCallback(async () => {
        const token = ++quizRequestRef.current;
        setQuestions(null);

        try {
            // El servidor arma el cuestionario sobre el texto original de la
            // práctica, que lee de la base. Sólo se lo llama cuando el texto es
            // el original: el generado ya viene con sus preguntas.
            const res = await fetch("/api/practice/generate-listening-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonPracticeId })
            });
            const data = res.ok ? await res.json() : null;
            if (token !== quizRequestRef.current) return;

            if (!res.ok) {
                setError(await practiceApiError(res, "No pudimos preparar las preguntas de esta práctica."));
                setQuestions([]);
                return;
            }

            setQuestions(data.questions || []);
        } catch (err) {
            console.error("Error loading original quiz:", err);
            if (token === quizRequestRef.current) setQuestions([]);
        }
    }, [lessonPracticeId]);

    useEffect(() => {
        setCurrentText(listeningText);
        setIsDynamic(false);
        setListenCount(0);
        setShowText(false);
        setAnswers({});
        setIsEvaluated(false);
        setPhase("idle");
        setError(null);
        loadOriginalQuiz();
    }, [listeningText, loadOriginalQuiz]);

    const generateAIText = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch("/api/practice/generate-listening", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonPracticeId })
            });

            if (!res.ok) {
                setError(await practiceApiError(res, "No pudimos generar un texto nuevo. Probá con el original."));
                return;
            }

            const data = await res.json();
            if (data.text) {
                setCurrentText(data.text);
                // Estas preguntas mandan sobre las del texto original, que
                // pueden estar todavía en camino desde que se abrió la práctica.
                quizRequestRef.current++;
                setQuestions(data.questions || []);
                setAnswers({});
                setIsEvaluated(false);
                setIsDynamic(true);
                // Reset progress
                setListenCount(0);
                setShowText(false);
                setPhase("idle");
            }
        } catch (err) {
            setError("No pudimos generar un texto nuevo. Probá con el original.");
        } finally {
            setIsGenerating(false);
        }
    };

    // ── TTS ──────────────────────────────────────────────────────────────────

    const playText = async () => {
        if (phase === "playing") return;
        setPhase("playing");
        setError(null);

        try {
            const res = await fetch("/api/practice/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonPracticeId, text: currentText, language: "en-US", speed: 0.9 }),
            });

            // `listenCount` es la llave del cuestionario: sube sólo cuando el
            // audio terminó, así que el alumno no puede contestar antes.
            const onFinish = () => {
                setListenCount((c) => c + 1);
                setPhase("idle");
            };

            if (res.status === 204) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(currentText);
                utterance.lang = "en-US";
                utterance.rate = 0.9;
                utterance.onend = onFinish;
                utterance.onerror = onFinish;
                window.speechSynthesis.speak(utterance);
            } else if (res.ok) {
                const buf = await res.arrayBuffer();
                const ctx = new AudioContext();
                const decoded = await ctx.decodeAudioData(buf);
                const source = ctx.createBufferSource();
                source.buffer = decoded;
                source.connect(ctx.destination);
                source.onended = () => { onFinish(); ctx.close(); };
                source.start();
            } else {
                setError(await practiceApiError(res, "No se pudo reproducir el audio."));
                setPhase("idle");
            }
        } catch {
            // Sin cartel el botón se reacomoda solo y no se entiende por qué no
            // sonó nada: antes esto caía en `done_listening`, que al menos
            // destapaba las preguntas.
            setError("No se pudo reproducir el audio.");
            setPhase("idle");
        }
    };

    // ── SUBMIT ────────────────────────────────────────────────────────────────

    /**
     * Las preguntas se leen desde que se abre la práctica; se contestan recién
     * cuando el audio terminó al menos una vez. El `disabled` de los botones es
     * el cartel: la regla es ésta.
     */
    const canAnswer = listenCount > 0 && !isEvaluated;

    const handleAnswer = (index: number, value: boolean) => {
        if (!canAnswer) return;
        setAnswers(prev => ({ ...prev, [index]: value }));
    };

    /**
     * Volver a pedir el cuestionario cuando no vino ninguno.
     *
     * Siempre sobre el texto original, que es el que el servidor puede releer de
     * la base: si el alumno estaba con un texto generado, se vuelve al del
     * profesor, que es lo único que queda en pie cuando la generación no dio
     * preguntas.
     */
    const retryQuiz = () => {
        if (isDynamic) {
            setCurrentText(listeningText);
            setIsDynamic(false);
            setListenCount(0);
            setAnswers({});
            setIsEvaluated(false);
        }
        setError(null);
        loadOriginalQuiz();
    };

    const handleCorregir = () => {
        if (!canAnswer || !questions) return;
        if (Object.keys(answers).length !== questions.length) return;
        setIsEvaluated(true);
    };

    const saveSessionAndExit = async () => {
        if (!questions) return;
        setPhase("saving");

        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        
        const phrasesAttempted = questions.length;
        let phrasesCorrect = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.isTrue) phrasesCorrect++;
        });
        
        const accuracyPct = phrasesAttempted > 0 ? Math.round((phrasesCorrect / phrasesAttempted) * 100) : 0;

        if (!isPreview) {
            try {
                await fetch("/api/practice/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId,
                        lessonPracticeId,
                        type: "LISTENING",
                        phrasesAttempted,
                        phrasesCorrect,
                        accuracyPct,
                        durationSeconds,
                        weakArea: accuracyPct < 50 ? "Comprensión auditiva general" : undefined,
                    }),
                });
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }

        onComplete({
            phrasesAttempted,
            phrasesCorrect,
            accuracyPct,
            durationSeconds,
            weakArea: accuracyPct < 50 ? "Comprensión auditiva general" : undefined,
        });
    };

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {/* Header bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400">
                    <Headphones size={16} /> Listening Lab
                </div>
                <button
                    onClick={onExit}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                    <LogOut size={13} /> Salir
                </button>
            </div>

            {/* Main card */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                {/* Instructions */}
                <div className="p-8 text-center border-b border-border/40 relative overflow-hidden">
                    {/* Dynamic AI Badge */}
                    {isDynamic && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
                            <Sparkles size={12} className="animate-pulse" /> Modo IA
                        </div>
                    )}

                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Leé las preguntas y después escuchá
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Saber qué te van a preguntar es parte del ejercicio. Las frases quedan a la vista mientras suena el audio, y las contestás cuando termine. Podés escucharlo las veces que quieras.
                    </p>

                    {/* Generate Variations Button */}
                    {!isDynamic && listenCount === 0 && phase !== "playing" && (
                        <button
                            onClick={generateAIText}
                            disabled={isGenerating}
                            className="mt-6 inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/20 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <><Loader2 size={12} className="animate-spin" /> Generando...</>
                            ) : (
                                <><Sparkles size={12} /> Generar texto nuevo con IA</>
                            )}
                        </button>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 flex items-start justify-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm max-w-sm mx-auto text-left">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-5">
                    {/* Cuestionario: va antes del audio y se queda a la vista mientras suena */}
                    {questions === null ? (
                        <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 animate-pulse">
                            <Loader2 size={24} className="animate-spin text-violet-500" />
                            <p className="text-sm font-medium">Preparando preguntas de comprensión...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="py-6 text-center space-y-3">
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                No pudimos preparar las preguntas de este texto. Podés escuchar el audio igual.
                            </p>
                            <button
                                onClick={retryQuiz}
                                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                            >
                                Volver a intentar
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center space-y-1.5">
                                <p className="text-sm font-bold">¿Verdadero o Falso?</p>
                                {!canAnswer && !isEvaluated && (
                                    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                        <Lock size={12} /> Leelas ahora; se contestan cuando termine el audio
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                {questions.map((q, idx) => {
                                    const isCorrect = answers[idx] === q.isTrue;
                                    const evaluatedClasses = isEvaluated
                                        ? (isCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-500 bg-red-50/50 dark:bg-red-950/20")
                                        : "border-border/50 bg-muted/20";

                                    // Antes de escuchar los botones están apagados;
                                    // después de corregir siguen legibles, para que
                                    // se vea qué contestó.
                                    const stateClasses = listenCount === 0
                                        ? "opacity-50 cursor-not-allowed"
                                        : "disabled:opacity-80 disabled:cursor-default";

                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border space-y-3 ${evaluatedClasses}`}>
                                            <div className="flex items-start gap-2">
                                                {isEvaluated && (
                                                    isCorrect ? <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                                              : <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                                )}
                                                <p className="text-sm font-medium text-foreground">{q.statement}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAnswer(idx, true)}
                                                    disabled={!canAnswer}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${answers[idx] === true
                                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"} ${stateClasses}`}
                                                >
                                                    Verdadero
                                                </button>
                                                <button
                                                    onClick={() => handleAnswer(idx, false)}
                                                    disabled={!canAnswer}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${answers[idx] === false
                                                        ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"} ${stateClasses}`}
                                                >
                                                    Falso
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Play button */}
                    <div className="flex justify-center">
                        <button
                            onClick={playText}
                            disabled={phase === "playing" || phase === "saving"}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all ${phase === "playing"
                                ? "bg-violet-100 dark:bg-violet-950/50 text-violet-600 border border-violet-300"
                                : "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {phase === "playing"
                                ? <><Loader2 size={18} className="animate-spin" /> Reproduciendo...</>
                                : <><Volume2 size={18} /> {listenCount === 0 ? "Escuchar audio" : "Escuchar de nuevo"}</>
                            }
                        </button>
                    </div>

                    {listenCount > 0 && (
                        <p className="text-center text-xs text-muted-foreground">
                            Escuchado {listenCount} {listenCount === 1 ? "vez" : "veces"}
                        </p>
                    )}

                    {/* Cierre: comparar con el texto y corregir */}
                    {questions !== null && questions.length > 0 && (
                        <div className="space-y-4">
                            {/* Show/hide text toggle */}
                            <button
                                onClick={() => setShowText((v) => !v)}
                                disabled={!isEvaluated}
                                className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors border border-dashed rounded-xl ${!isEvaluated ? "text-muted-foreground/50 border-border/30 cursor-not-allowed bg-muted/10" : "text-muted-foreground hover:text-foreground border-border/50"}`}
                            >
                                {!isEvaluated
                                    ? <><Lock size={13} /> Ver el texto para comparar (Disponible al corregir)</>
                                    : showText
                                        ? <><EyeOff size={13} /> Ocultar texto</>
                                        : <><Eye size={13} /> Ver el texto para comparar</>
                                }
                            </button>

                            {showText && (
                                <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-sm leading-relaxed italic text-foreground/80">
                                    "{currentText}"
                                </div>
                            )}

                            {/* Submit */}
                            {!isEvaluated ? (
                                <button
                                    onClick={handleCorregir}
                                    disabled={!canAnswer || Object.keys(answers).length !== questions.length}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-md shadow-violet-500/20"
                                >
                                    Corregir <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={saveSessionAndExit}
                                    disabled={phase === "saving"}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-md shadow-emerald-500/20"
                                >
                                    {phase === "saving"
                                        ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                                        : <><CheckCircle2 size={16} /> Finalizar sesión <ChevronRight size={16} /></>
                                    }
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
