"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mic2, Headphones, MessageSquare, ArrowLeft } from "lucide-react";
import { SpeakingHub } from "@/components/practice/SpeakingHub";
import { ListeningLab } from "@/components/practice/ListeningLab";
import { AIChatbot } from "@/components/practice/AIChatbot";
import { PracticeHome, lastSession as getLastSession } from "@/components/practice/PracticeHome";
import { format, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PracticeSession {
    type: "SPEAKING" | "LISTENING" | "CHAT";
    accuracyPct: number;
    /** Frases dichas en Speaking, preguntas en Listening, mensajes en la conversación. */
    phrasesAttempted: number;
    phrasesCorrect: number;
    completedAt: string;
}

export interface PracticeData {
    lessonPracticeId: string;
    lessonId: string;
    topic: string;
    date: string;
    courseId: string;
    courseName: string;
    courseColor: string;
    speakingPhrases: string[];
    listeningText: string | null;
    chatScenario: string | null;
    sessions: PracticeSession[];
}

export interface SessionSummary {
    phrasesAttempted: number;
    phrasesCorrect: number;
    accuracyPct: number;
    durationSeconds: number;
    weakArea?: string;
}

type PracticeType = "SPEAKING" | "LISTENING" | "CHAT";

type View =
    | { mode: "landing" }
    | { mode: "session"; item: PracticeData; type: PracticeType }
    | { mode: "summary"; item: PracticeData; summary: SessionSummary; type: PracticeType };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtSeconds(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ─── Sidebar panels ───────────────────────────────────────────────────────────

const TIPS: Record<PracticeType, { title: string; items: string[] }> = {
    SPEAKING: {
        title: "Consejos para Speaking",
        items: [
            "Hablá despacio y con claridad — la precisión vale más que la velocidad.",
            "Prestá atención a los sonidos que no existen en español: /θ/, /ɪ/, /æ/.",
            "Si te equivocás, no pares — los errores son parte del aprendizaje.",
            "Grabate y escuchate para detectar tus propios patrones.",
        ],
    },
    LISTENING: {
        title: "Consejos para Listening",
        items: [
            "No trates de entender cada palabra — enfocate en el mensaje general.",
            "Escuchá las palabras clave: verbos y sustantivos dan el sentido.",
            "Escuchar varias veces está bien — así aprenden los nativos.",
            "Intentá predecir lo que va a decir antes de escuchar de nuevo.",
        ],
    },
    CHAT: {
        title: "Consejos para el Chatbot",
        items: [
            "Escribí en inglés aunque cometas errores — fluidez primero.",
            "Si no sabés una palabra, intentá con sinónimos o describila.",
            "Respondé con oraciones completas para practicar más.",
            "La IA va a corregirte naturalmente — prestá atención.",
        ],
    },
};

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function StudentPracticeView({ practiceData, isPreview = false }: { practiceData: PracticeData[], isPreview?: boolean }) {
    const [view, setView] = useState<View>({ mode: "landing" });

    // Cada vista arranca desde arriba. Si no, al entrar a un ejercicio desde una
    // clase de más abajo la página quedaba scrolleada y el ejercicio fuera de vista.
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [view]);

    // Common handlers
    // Al volver al inicio queda abierta la clase de la que venía, y la lista se
    // pide de nuevo para que lo recién hecho ya diga «Hecha».
    const router = useRouter();
    const [lastPracticeId, setLastPracticeId] = useState<string | null>(null);
    const handleExit = () => {
        if (view.mode !== "landing") setLastPracticeId(view.item.lessonPracticeId);
        setView({ mode: "landing" });
        router.refresh();
    };

    // ── MAIN RENDER ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background">
            {view.mode === "session" && (() => {
                const { item, type } = view;
                const onComplete = (summary: SessionSummary) => setView({ mode: "summary", item, summary, type });

                const prevSpeaking = getLastSession(item.sessions, "SPEAKING");
                const prevListening = getLastSession(item.sessions, "LISTENING");
                const prevChat = getLastSession(item.sessions, "CHAT");

                return (
                    <main className="min-h-screen mt-14 animate-in fade-in">
                        {/* Top bar */}
                        <div className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-14 z-10">
                            <div className="container mx-auto px-4 sm:px-6 max-w-[1600px] flex items-center gap-3 h-12">
                                <button onClick={handleExit} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                                    <ArrowLeft size={15} /> Volver
                                </button>
                            </div>
                        </div>

                        {/* 3-column layout */}
                        <div className="container mx-auto px-4 sm:px-6 max-w-[1600px] py-8">
                            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 items-start">

                                {/* ── LEFT SIDEBAR: Context & Shortcuts ── */}
                                <aside className="space-y-6 order-2 lg:order-1">
                                    {/* Lesson info */}
                                    <div
                                        className="rounded-2xl p-5 space-y-2"
                                        style={{
                                            borderLeft: `4px solid ${item.courseColor}`,
                                            background: `linear-gradient(135deg, ${item.courseColor}18, ${item.courseColor}06 60%, transparent)`,
                                            boxShadow: `0 0 0 1px ${item.courseColor}20, 0 4px 16px ${item.courseColor}14`,
                                        }}
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clase en curso</p>
                                        <p className="font-black text-[15px] leading-snug">{item.topic}</p>
                                        <p className="text-[11px] text-muted-foreground font-medium">{item.courseName}</p>
                                    </div>

                                    {/* Previous sessions for this lesson */}
                                    {(prevSpeaking || prevListening || prevChat) && (
                                        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tu progreso en esta clase</p>
                                            <div className="space-y-3">
                                                {[
                                                    { session: prevSpeaking, label: "Speaking", emoji: "🎤" },
                                                    { session: prevListening, label: "Listening", emoji: "🎧" },
                                                    { session: prevChat, label: "Chatbot", emoji: "💬" },
                                                ].filter(({ session }) => !!session).map(({ session, label, emoji }) => (
                                                    <div key={label} className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">{emoji} {label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-1000"
                                                                    style={{
                                                                        width: `${session!.accuracyPct}%`,
                                                                        backgroundColor: session!.accuracyPct >= 80 ? "#10b981"
                                                                            : session!.accuracyPct >= 60 ? "#f59e0b" : "#ef4444"
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-[11px] font-bold">{Math.round(session!.accuracyPct)}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* OTHER MODES (Shortcuts for current lesson) */}
                                    {(item.speakingPhrases.length > 0 || !!item.listeningText || !!item.chatScenario) && (
                                        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Otros modos de esta clase</p>
                                            <div className="space-y-2">
                                                {item.speakingPhrases.length > 0 && type !== "SPEAKING" && (
                                                    <button onClick={() => setView({ mode: "session", item, type: "SPEAKING" })}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-all active:scale-[0.98]">
                                                        <Mic2 size={14} /> Speaking
                                                    </button>
                                                )}
                                                {!!item.listeningText && type !== "LISTENING" && (
                                                    <button onClick={() => setView({ mode: "session", item, type: "LISTENING" })}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-all active:scale-[0.98]">
                                                        <Headphones size={14} /> Listening
                                                    </button>
                                                )}
                                                {!!item.chatScenario && type !== "CHAT" && (
                                                    <button onClick={() => setView({ mode: "session", item, type: "CHAT" })}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all active:scale-[0.98]">
                                                        <MessageSquare size={14} /> Chatbot
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quote */}
                                    <div className="rounded-2xl border border-border/40 bg-muted/40 p-5 text-center space-y-2">
                                        <p className="text-2xl">🌟</p>
                                        <p className="text-xs text-muted-foreground italic leading-relaxed font-medium">
                                            "Your only limit is your mind. Keep practicing!"
                                        </p>
                                    </div>
                                </aside>

                                {/* ── CENTER: Practice component ── */}
                                <div className="order-1 lg:order-2">
                                    {type === "SPEAKING" && <SpeakingHub lessonId={item.lessonId} lessonPracticeId={item.lessonPracticeId} phrases={item.speakingPhrases} onComplete={onComplete} onExit={handleExit} isPreview={isPreview} />}
                                    {type === "LISTENING" && item.listeningText && <ListeningLab lessonId={item.lessonId} lessonPracticeId={item.lessonPracticeId} listeningText={item.listeningText} onComplete={onComplete} onExit={handleExit} isPreview={isPreview} />}
                                    {type === "CHAT" && item.chatScenario && <AIChatbot lessonId={item.lessonId} lessonPracticeId={item.lessonPracticeId} scenario={item.chatScenario} onComplete={onComplete} onExit={handleExit} isPreview={isPreview} />}
                                </div>

                                {/* ── RIGHT SIDEBAR: Practice Navigator (Course lessons) ── */}
                                <aside className="order-3 rounded-2xl" style={{ boxShadow: `0 0 0 1px ${item.courseColor}20, 0 4px 16px ${item.courseColor}40` }}>
                                    <div className={`overflow-hidden p-6 space-y-6`}>
                                        {/* Header */}
                                        <div className="flex items-center gap-4 px-2">
                                            <div className="w-[3px] h-14 rounded-full shrink-0" style={{ backgroundColor: item.courseColor }} />
                                            <div>
                                                <p
                                                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                                                    style={{ color: item.courseColor }}
                                                >
                                                    PráctICAS
                                                </p>
                                                <h3 className="text-[15px] font-black text-foreground/90 mt-1">
                                                    {item.courseName}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar space-y-3">
                                            {practiceData
                                                .filter(p => p.courseName === item.courseName)
                                                .map((practice) => {
                                                    const isActive = practice.lessonPracticeId === item.lessonPracticeId;
                                                    const fmtDate = format(addHours(new Date(practice.date), 12), "d MMM", { locale: es }).toUpperCase();

                                                    const hasSpeaking = practice.speakingPhrases.length > 0;
                                                    const hasListening = !!practice.listeningText;
                                                    const hasChat = !!practice.chatScenario;

                                                    const targetType = (hasSpeaking && type === "SPEAKING") ? "SPEAKING" :
                                                        (hasListening && type === "LISTENING") ? "LISTENING" :
                                                            (hasChat && type === "CHAT") ? "CHAT" :
                                                                (hasSpeaking ? "SPEAKING" : hasListening ? "LISTENING" : "CHAT");

                                                    return (
                                                        <button
                                                            key={practice.lessonPracticeId}
                                                            onClick={() => setView({ mode: "session", item: practice, type: targetType as any })}
                                                            className={`w-full text-left transition-all relative rounded-2xl group mb-2 min-h-[72px]`}
                                                            style={{
                                                                // @ts-ignore
                                                                "--hover-color": practice.courseColor,
                                                            } as any}
                                                        >
                                                            {/* Base Inactive Layer (Gray) */}
                                                            <div 
                                                                className={cn(
                                                                    "absolute inset-0 rounded-2xl border-l-4 transition-all duration-300",
                                                                    isActive ? "opacity-0" : "opacity-100 group-hover:opacity-0"
                                                                )}
                                                                style={{
                                                                    borderLeftColor: "rgb(156 163 175 / 0.2)",
                                                                    background: `linear-gradient(to right, rgb(156 163 175 / 0.05), transparent)`,
                                                                    boxShadow: `0 0 0 1px rgb(156 163 175 / 0.1)`
                                                                }}
                                                            />
                                                            
                                                            {/* Active/Hover Layer (Course Color) */}
                                                            <div 
                                                                className={cn(
                                                                    "absolute inset-0 rounded-2xl border-l-4 transition-all duration-300",
                                                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                                )}
                                                                style={{
                                                                    borderLeftColor: practice.courseColor,
                                                                    background: `linear-gradient(to right, ${practice.courseColor}25, ${practice.courseColor}05 50%, transparent)`,
                                                                    boxShadow: `0 0 0 1px ${practice.courseColor}20, 0 4px 16px ${practice.courseColor}14`
                                                                }}
                                                            />

                                                            <div className="relative px-6 py-3 flex flex-col h-full justify-center">
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 font-mono group-hover:text-muted-foreground/70 transition-colors">
                                                                        {fmtDate}
                                                                    </span>
                                                                    <div className={cn(
                                                                        "flex gap-2.5 transition-all",
                                                                        isActive ? "opacity-40" : "opacity-20 group-hover:opacity-100 group-hover:[color:var(--hover-color)]"
                                                                    )}>
                                                                        {hasSpeaking && <Mic2 size={13} strokeWidth={3} />}
                                                                        {hasListening && <Headphones size={13} strokeWidth={3} />}
                                                                        {hasChat && <MessageSquare size={13} strokeWidth={3} />}
                                                                    </div>
                                                                </div>

                                                                <p className={cn(
                                                                    "text-[15px] font-black leading-tight transition-colors",
                                                                    isActive ? "text-indigo-400" : "text-muted-foreground group-hover:[color:var(--hover-color)]"
                                                                )}>
                                                                    {practice.topic}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </div>
                    </main>
                );
            })()}

            {view.mode === "summary" && (() => {
                const { summary, item, type } = view;
                const scoreColor = summary.accuracyPct >= 80 ? "text-emerald-500" : summary.accuracyPct >= 60 ? "text-amber-500" : "text-red-500";
                const typeLabel: Record<string, string> = { SPEAKING: "Speaking", LISTENING: "Listening", CHAT: "Chatbot" };

                return (
                    <main className="container mx-auto px-4 sm:px-6 py-8 max-w-lg animate-in fade-in mt-14">
                        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-lg">
                            <div className="h-2" style={{ backgroundColor: item.courseColor }} />
                            <div className="p-8 text-center space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
                                    <Sparkles size={28} className="text-violet-500" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium mb-1">¡{typeLabel[type]} completado!</p>
                                    <h2 className="text-4xl font-black"><span className={scoreColor}>{summary.accuracyPct}%</span></h2>
                                    <p className="text-sm text-muted-foreground mt-1">Precisión general</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="p-3 rounded-xl bg-muted/50">
                                        <p className="text-xl font-bold">{summary.phrasesCorrect}/{summary.phrasesAttempted}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Correctas</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/50">
                                        <p className="text-xl font-bold">{fmtSeconds(summary.durationSeconds)}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Duración</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/50">
                                        <p className="text-xl font-bold">{summary.weakArea ? "⚠" : "✓"}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{summary.weakArea ? "A mejorar" : "¡Perfecto!"}</p>
                                    </div>
                                </div>
                                {summary.weakArea && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 text-left">
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">Área para practicar más</p>
                                        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{summary.weakArea}</p>
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 pt-2">
                                    <button onClick={() => setView({ mode: "session", item, type })} className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm transition-colors">
                                        Practicar de nuevo
                                    </button>
                                    <button onClick={handleExit} className="w-full py-2.5 rounded-xl border border-border hover:bg-muted/50 font-semibold text-sm transition-colors">
                                        Volver al inicio
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                );
            })()}

            {view.mode === "landing" && (
                <PracticeHome
                    practiceData={practiceData}
                    isPreview={isPreview}
                    initialOpenId={lastPracticeId}
                    onStart={(item, type) => setView({ mode: "session", item, type })}
                />
            )}
        </div>
    );
}
