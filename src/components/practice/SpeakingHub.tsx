"use client";

import { useState, useRef, useEffect } from "react";
import {
    Mic2, Pause, Volume2, RefreshCw, ChevronRight,
    CheckCircle2, XCircle, Loader2, LogOut, AlertCircle, Sparkles
} from "lucide-react";
import type { SessionSummary } from "@/app/dashboard/components/StudentPracticeView";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationResult {
    score: number;
    isCorrect: boolean;
    feedback: string;
    weakArea?: string;
}

interface AttemptRecord {
    phrase: string;
    transcript: string;
    result: EvaluationResult;
}

type Phase =
    | "idle"         // Phrase shown, waiting for interaction
    | "playing"      // TTS audio playing
    | "recording"    // Mic active
    | "transcribed"  // Got transcript, show "Evaluar" button
    | "evaluating"   // Calling /api/practice/evaluate
    | "result"       // Showing feedback
    | "saving";      // Saving session to DB

interface SpeakingHubProps {
    lessonId: string;
    lessonPracticeId: string;
    phrases: string[];
    onComplete: (summary: SessionSummary) => void;
    onExit: () => void;
    isPreview?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpeakingHub({ lessonId, lessonPracticeId, phrases: initialPhrases, onComplete, onExit, isPreview = false }: SpeakingHubProps) {
    const [phrases, setPhrases] = useState<string[]>(initialPhrases);
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>("idle");
    const [transcript, setTranscript] = useState("");
    const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
    const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDynamic, setIsDynamic] = useState(false);

    const recognitionRef = useRef<any>(null);
    const startTimeRef = useRef<number>(Date.now());

    const currentPhrase = phrases[phraseIndex] ?? "";
    const totalPhrases = phrases.length;
    const isLastPhrase = phraseIndex >= totalPhrases - 1;

    // Sync state if props change (e.g. user navigates to another lesson)
    useEffect(() => {
        setPhrases(initialPhrases);
        setPhraseIndex(0);
        setIsDynamic(false);
        setAttempts([]);
        setTranscript("");
        setCurrentResult(null);
        setPhase("idle");
    }, [initialPhrases]);

    // ── DYNAMIC GENERATION ────────────────────────────────────────────────────

    const generateAIPhrases = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch("/api/practice/generate-phrases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seedPhrases: initialPhrases, count: 5 })
            });

            if (!res.ok) throw new Error("Error de API");

            const data = await res.json();
            if (data.phrases && Array.isArray(data.phrases)) {
                setPhrases(data.phrases);
                setIsDynamic(true);
                // Reset progress
                setPhraseIndex(0);
                setAttempts([]);
                setTranscript("");
                setCurrentResult(null);
                setPhase("idle");
            }
        } catch (err) {
            setError("No pudimos generar frases nuevas. Probá con las originales.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Check mic permission on mount
    useEffect(() => {
        if (typeof navigator !== "undefined" && navigator.mediaDevices) {
            navigator.permissions
                .query({ name: "microphone" as PermissionName })
                .then((result) => {
                    // Only disable button when permission was explicitly denied.
                    // "prompt" means the browser hasn't asked yet — allow the click
                    // so the native permission dialog fires when the user presses Grabar.
                    if (result.state === "denied") {
                        setHasMicPermission(false);
                    }
                })
                .catch(() => {
                    // Permissions API not supported — leave as null (button enabled)
                });
        }
    }, []);

    // ── TTS ──────────────────────────────────────────────────────────────────

    const playPhrase = async () => {
        if (phase === "playing" || phase === "recording") return;
        setPhase("playing");
        setError(null);

        try {
            const res = await fetch("/api/practice/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: currentPhrase, language: "en-US", speed: 0.85 })
            });

            if (res.status === 204) {
                // Browser TTS fallback
                if (typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(currentPhrase);
                    utterance.lang = "en-US";
                    utterance.rate = 0.85;
                    utterance.onend = () => setPhase("idle");
                    utterance.onerror = () => setPhase("idle");
                    window.speechSynthesis.speak(utterance);
                } else {
                    setPhase("idle");
                }
            } else if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const audioCtx = new AudioContext();
                const decoded = await audioCtx.decodeAudioData(arrayBuffer);
                const source = audioCtx.createBufferSource();
                source.buffer = decoded;
                source.connect(audioCtx.destination);
                source.onended = () => { setPhase("idle"); audioCtx.close(); };
                source.start();
            } else {
                setPhase("idle");
                setError("No se pudo reproducir el audio.");
            }
        } catch (err) {
            console.error("TTS error:", err);
            setPhase("idle");
        }
    };

    // ── STT ──────────────────────────────────────────────────────────────────

    const startRecording = () => {
        if (typeof window === "undefined") return;

        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            setError("Tu navegador no soporta reconocimiento de voz. Usá Google Chrome.");
            return;
        }

        // Stop TTS if playing
        window.speechSynthesis?.cancel();

        const rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onresult = (e: any) => {
            const text = e.results[0][0].transcript;
            setTranscript(text);
            setPhase("transcribed");
        };

        rec.onerror = (e: any) => {
            setPhase("idle");
            if (e.error === "not-allowed") {
                setError("Permiso de micrófono denegado. Habilitá el micrófono en tu navegador.");
                setHasMicPermission(false);
            } else if (e.error === "no-speech") {
                setError("No se detectó voz. Intentá de nuevo.");
            } else {
                setError(`Error de micrófono: ${e.error}`);
            }
        };

        rec.onend = () => {
            if (phase === "recording") setPhase("idle");
        };

        recognitionRef.current = rec;
        setTranscript("");
        setCurrentResult(null);
        setError(null);
        setPhase("recording");
        rec.start();
    };

    const stopRecording = () => {
        recognitionRef.current?.stop();
        setPhase("idle");
    };

    // ── EVALUATION ───────────────────────────────────────────────────────────

    const evaluatePhrase = async () => {
        if (!transcript) return;
        setPhase("evaluating");
        setError(null);

        try {
            const res = await fetch("/api/practice/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ expected: currentPhrase, actual: transcript, language: "English" })
            });

            if (!res.ok) throw new Error("API error");

            const result: EvaluationResult = await res.json();
            setCurrentResult(result);
            setAttempts((prev) => [...prev, { phrase: currentPhrase, transcript, result }]);
            setPhase("result");
        } catch (err) {
            setPhase("transcribed");
            setError("Error al evaluar la pronunciación. Intentá de nuevo.");
        }
    };

    // ── NEXT / FINISH ─────────────────────────────────────────────────────────

    const nextPhrase = () => {
        if (isLastPhrase) {
            finishSession();
        } else {
            setPhraseIndex((i) => i + 1);
            setTranscript("");
            setCurrentResult(null);
            setError(null);
            setPhase("idle");
        }
    };

    const finishSession = async () => {
        setPhase("saving");

        const phrasesAttempted = attempts.length;
        const phrasesCorrect = attempts.filter((a) => a.result.isCorrect).length;
        const accuracyPct = phrasesAttempted > 0
            ? Math.round((phrasesCorrect / phrasesAttempted) * 100)
            : 0;
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

        // Most frequent weak area
        const weakAreas = attempts.map((a) => a.result.weakArea).filter(Boolean) as string[];
        const weakArea = weakAreas.length > 0
            ? weakAreas.sort((a, b) =>
                weakAreas.filter((v) => v === b).length - weakAreas.filter((v) => v === a).length
            )[0]
            : undefined;

        // Save session to DB if not in preview mode
        if (!isPreview) {
            try {
                await fetch("/api/practice/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId, lessonPracticeId, type: "SPEAKING",
                        phrasesAttempted, phrasesCorrect, accuracyPct, durationSeconds, weakArea
                    })
                });
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }

        onComplete({ phrasesAttempted, phrasesCorrect, accuracyPct, durationSeconds, weakArea });
    };

    const retryPhrase = () => {
        setTranscript("");
        setCurrentResult(null);
        setError(null);
        setPhase("idle");
    };

    // ── RENDER ────────────────────────────────────────────────────────────────

    const isBusy = phase === "playing" || phase === "evaluating" || phase === "saving";

    return (
        <div className="space-y-5">
            {/* Progress dots */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {phrases.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${i < phraseIndex
                                ? "w-5 bg-violet-400"
                                : i === phraseIndex
                                    ? "w-7 bg-violet-600"
                                    : "w-2 bg-muted"
                            }`}
                        />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1 font-medium">
                        {phraseIndex + 1} de {totalPhrases}
                    </span>
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
                {/* Phrase display */}
                <div className="p-8 text-center border-b border-border/40 relative overflow-hidden">
                    {/* Dynamic AI Badge */}
                    {isDynamic && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
                            <Sparkles size={12} className="animate-pulse" /> Modo IA
                        </div>
                    )}

                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                        Pronunciá la siguiente frase
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold leading-relaxed text-foreground font-mono">
                        "{currentPhrase}"
                    </p>

                    {/* Generate Variations Button (only at start or if not dynamic yet) */}
                    {!isDynamic && phraseIndex === 0 && (
                        <button
                            onClick={generateAIPhrases}
                            disabled={isGenerating}
                            className="mt-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/20 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <><Loader2 size={12} className="animate-spin" /> Generando...</>
                            ) : (
                                <><Sparkles size={12} /> Generar variaciones con IA</>
                            )}
                        </button>
                    )}
                </div>

                {/* Controls */}
                <div className="p-6 space-y-5">
                    {/* TTS + Record buttons */}
                    {(phase === "idle" || phase === "playing" || phase === "recording") && (
                        <div className="flex gap-3 justify-center">
                            {/* Play button */}
                            <button
                                onClick={playPhrase}
                                disabled={isBusy || phase === "recording"}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${phase === "playing"
                                    ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600 border border-blue-300/50"
                                    : "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {phase === "playing"
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <Volume2 size={16} />
                                }
                                Escuchar
                            </button>

                            {/* Record button */}
                            <button
                                onClick={phase === "recording" ? stopRecording : startRecording}
                                disabled={isBusy || hasMicPermission === false}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${phase === "recording"
                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                                    : "bg-violet-100 dark:bg-violet-950/50 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {phase === "recording"
                                    ? <><Pause size={16} /> Grabando...</>
                                    : <><Mic2 size={16} /> Grabar</>
                                }
                            </button>
                        </div>
                    )}

                    {/* Transcript */}
                    {(transcript || phase === "transcribed") && (
                        <div className="rounded-xl bg-muted/50 border border-border/40 p-4">
                            <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                                Lo que dijiste
                            </p>
                            <p className="text-sm font-medium italic text-foreground/80">
                                "{transcript || "..."}"
                            </p>
                        </div>
                    )}

                    {/* Evaluate button */}
                    {phase === "transcribed" && (
                        <button
                            onClick={evaluatePhrase}
                            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors shadow-md shadow-violet-500/20"
                        >
                            Evaluar pronunciación →
                        </button>
                    )}

                    {/* Evaluating spinner */}
                    {phase === "evaluating" && (
                        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                            <Loader2 size={18} className="animate-spin text-violet-500" />
                            <span className="text-sm font-medium">Analizando tu pronunciación...</span>
                        </div>
                    )}

                    {/* Saving spinner */}
                    {phase === "saving" && (
                        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                            <Loader2 size={18} className="animate-spin text-violet-500" />
                            <span className="text-sm font-medium">Guardando sesión...</span>
                        </div>
                    )}

                    {/* Result */}
                    {phase === "result" && currentResult && (
                        <div className="space-y-4">
                            {/* Score banner */}
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${currentResult.isCorrect
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                            }`}>
                                {currentResult.isCorrect
                                    ? <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                    : <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                }
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-lg font-black ${currentResult.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                            {currentResult.score}%
                                        </span>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${currentResult.isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                                            {currentResult.isCorrect ? "¡Correcto!" : "Para mejorar"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80">{currentResult.feedback}</p>
                                    {currentResult.weakArea && (
                                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                                            📍 Área a practicar: <span className="font-bold">{currentResult.weakArea}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={retryPhrase}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border hover:bg-muted/50 font-semibold text-sm transition-colors"
                                >
                                    <RefreshCw size={14} /> Reintentar
                                </button>
                                <button
                                    onClick={nextPhrase}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors"
                                >
                                    {isLastPhrase ? "Finalizar sesión" : "Siguiente frase"}
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Session score bar */}
            {attempts.length > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>
                        Sesión: <span className="font-bold text-foreground">{attempts.filter(a => a.result.isCorrect).length}/{attempts.length}</span> correctas
                    </span>
                    <span>
                        Precisión parcial: <span className="font-bold text-violet-600 dark:text-violet-400">
                            {Math.round(attempts.filter(a => a.result.isCorrect).length / attempts.length * 100)}%
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
}
