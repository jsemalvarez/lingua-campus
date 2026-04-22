"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
    Sparkles, Gamepad2, Mic2, Headphones, MessageSquare,
    Zap, Star, ArrowLeft, CheckCircle2
} from "lucide-react";
import { SpeakingHub } from "@/components/practice/SpeakingHub";
import { ListeningLab } from "@/components/practice/ListeningLab";
import { AIChatbot } from "@/components/practice/AIChatbot";
import { format, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PracticeSession {
    type: "SPEAKING" | "LISTENING" | "CHAT";
    accuracyPct: number;
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

function getLastSession(sessions: PracticeSession[], type: PracticeType) {
    return sessions
        .filter((s) => s.type === type)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] ?? null;
}

function fmtSeconds(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ─── ModeIconButton ───────────────────────────────────────────────────────────

const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800",
    violet: "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/60 border-violet-200 dark:border-violet-800",
    emerald: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800",
};

function ModeIconButton({ icon, onClick, session, color, tooltip }: {
    icon: React.ReactNode;
    onClick: () => void;
    session: PracticeSession | null;
    color: keyof typeof colorMap;
    tooltip: string;
}) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={cn(
                "relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95",
                colorMap[color]
            )}
        >
            {icon}
            {session && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                </span>
            )}
        </button>
    );
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

export function StudentPracticeView({ practiceData }: { practiceData: PracticeData[] }) {
    const [view, setView] = useState<View>({ mode: "landing" });

    // ── Logic & Prep ──────────────────────────────────────────────────────────

    // Group practices by course
    const courseGroups = practiceData.reduce<Record<string, PracticeData[]>>((acc, item) => {
        if (!acc[item.courseId]) acc[item.courseId] = [];
        acc[item.courseId].push(item);
        return acc;
    }, {});

    // Common handlers
    const handleExit = () => setView({ mode: "landing" });

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
                                    {type === "SPEAKING" && <SpeakingHub lessonId={item.lessonId} lessonPracticeId={item.lessonPracticeId} phrases={item.speakingPhrases} onComplete={onComplete} onExit={handleExit} />}
                                    {type === "LISTENING" && item.listeningText && <ListeningLab lessonId={item.lessonId} lessonPracticeId={item.lessonPracticeId} listeningText={item.listeningText} onComplete={onComplete} onExit={handleExit} />}
                                    {type === "CHAT" && item.chatScenario && <AIChatbot lessonId={item.lessonId} lessonPracticeId={item.lessonPracticeId} scenario={item.chatScenario} onComplete={onComplete} onExit={handleExit} />}
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
                <main className="container mx-auto px-4 sm:px-6 py-20 animate-in mt-12 mb-24 max-w-5xl">
                    {/* HERO */}
                    <div className="text-center space-y-6 mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            <Sparkles size={14} /> Nueva Dimensión de Aprendizaje
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none">
                            Aula de Práctica<br /> <span className="text-primary italic">Automática</span>
                        </h1>
                        <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                            Entrenás Speaking, Listening y conversación con IA directamente desde el contenido que tu profesor preparó para cada clase.
                        </p>
                    </div>

                    {/* FEATURE CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {[
                            { icon: Mic2, title: "Speaking Hub", desc: "Pronunciá frases y recibí feedback instantáneo de la IA." },
                            { icon: Headphones, title: "Listening Lab", desc: "Escuchá el audio de la clase y evaluá tu comprensión." },
                            { icon: MessageSquare, title: "AI Chatbot", desc: "Practicá conversaciones reales en inglés con la IA." },
                            { icon: Gamepad2, title: "Daily Quest", desc: "Próximamente: desafíos y puntos para motivarte." },
                        ].map((feat, i) => (
                            <Card key={i} className="p-8 rounded-[2.5rem] border-none shadow-xl bg-card hover:translate-y-[-8px] transition-all duration-500 group">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/20">
                                    <feat.icon size={28} />
                                </div>
                                <h3 className="font-black text-lg mb-2">{feat.title}</h3>
                                <p className="text-xs text-muted-foreground font-medium">{feat.desc}</p>
                            </Card>
                        ))}
                    </div>

                    {/* AVAILABLE PRACTICES — grouped by course */}
                    {practiceData.length > 0 && (
                        <div className="mb-20">
                            {/* Section title */}
                            <div className="flex items-center gap-3 mb-8">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-3">
                                    Prácticas disponibles
                                </span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            {/* One group per course */}
                            <div className="space-y-8">
                                {Object.values(courseGroups).map((groupItems) => {
                                    const { courseId, courseName, courseColor } = groupItems[0];

                                    return (
                                        <div key={courseId}>
                                            {/* Course badge header */}
                                            <div className="mb-3">
                                                <span
                                                    className="inline-flex items-center text-[11px] font-bold px-3 py-1 rounded-full text-white shadow-sm"
                                                    style={{ backgroundColor: courseColor }}
                                                >
                                                    {courseName}
                                                </span>
                                            </div>

                                            {/* Practice rows */}
                                            <div className="space-y-3">
                                                {groupItems.map((item) => {
                                                    const hasSpeaking = item.speakingPhrases.length > 0;
                                                    const hasListening = !!item.listeningText;
                                                    const hasChat = !!item.chatScenario;
                                                    const formattedDate = format(
                                                        addHours(new Date(item.date), 12),
                                                        "d MMM",
                                                        { locale: es }
                                                    );

                                                    return (
                                                        <div
                                                            key={item.lessonPracticeId}
                                                            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                                                            style={{
                                                                borderLeft: `4px solid ${courseColor}`,
                                                                background: `linear-gradient(to right, ${courseColor}20, ${courseColor}06 40%, transparent 70%)`,
                                                                boxShadow: `0 0 0 1px ${courseColor}20, 0 2px 8px rgba(0,0,0,0.07), 0 6px 20px ${courseColor}18`,
                                                            }}
                                                        >
                                                            {/* Left: date + topic */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                                                                    {formattedDate}
                                                                </p>
                                                                <p className="font-black text-[15px] leading-snug truncate">
                                                                    {item.topic}
                                                                </p>
                                                            </div>

                                                            {/* Right: Actions */}
                                                            <div className="flex items-center gap-2">
                                                                {hasSpeaking && (
                                                                    <ModeIconButton
                                                                        icon={<Mic2 size={18} />}
                                                                        color="blue"
                                                                        tooltip="Práctica de Habla"
                                                                        onClick={() => setView({ mode: "session", item, type: "SPEAKING" })}
                                                                        session={getLastSession(item.sessions, "SPEAKING")}
                                                                    />
                                                                )}
                                                                {hasListening && (
                                                                    <ModeIconButton
                                                                        icon={<Headphones size={18} />}
                                                                        color="violet"
                                                                        tooltip="Práctica de Escucha"
                                                                        onClick={() => setView({ mode: "session", item, type: "LISTENING" })}
                                                                        session={getLastSession(item.sessions, "LISTENING")}
                                                                    />
                                                                )}
                                                                {hasChat && (
                                                                    <ModeIconButton
                                                                        icon={<MessageSquare size={18} />}
                                                                        color="emerald"
                                                                        tooltip="Chat con IA"
                                                                        onClick={() => setView({ mode: "session", item, type: "CHAT" })}
                                                                        session={getLastSession(item.sessions, "CHAT")}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* COMING SOON CARD */}
                    <Card className="p-8 rounded-[2.5rem] border-dashed border-2 border-border bg-muted/30 text-center">
                        <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-black text-xl mb-2">Más prácticas en camino</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
                            Tus profesores están preparando nuevas experiencias de Speaking y escenarios de Chat para tus próximas lecciones.
                        </p>
                    </Card>
                </main>
            )}
        </div>
    );
}
