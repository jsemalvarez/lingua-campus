"use client";

import { useState } from "react";
import {
    Mic2, Headphones, MessageSquare, Sparkles, ChevronRight,
    CheckCircle2, Clock, BookOpen, ArrowLeft, Calendar
} from "lucide-react";
import { SpeakingHub } from "@/components/practice/SpeakingHub";
import { format, addHours } from "date-fns";
import { es } from "date-fns/locale";

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

type View =
    | { mode: "list" }
    | { mode: "session"; item: PracticeData; type: "SPEAKING" }
    | { mode: "summary"; item: PracticeData; summary: SessionSummary };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLastSession(sessions: PracticeSession[], type: "SPEAKING" | "LISTENING" | "CHAT") {
    return sessions.filter((s) => s.type === type).sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0] ?? null;
}

function fmtSeconds(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StudentPracticeView({ practiceData }: { practiceData: PracticeData[] }) {
    const [view, setView] = useState<View>({ mode: "list" });

    // ── SESSION VIEW ──────────────────────────────────────────────────────────
    if (view.mode === "session") {
        const { item } = view;
        return (
            <main className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl animate-in fade-in mt-14">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setView({ mode: "list" })}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>
                    <div className="h-4 w-px bg-border" />
                    <span className="text-sm font-semibold truncate">{item.topic}</span>
                    <div
                        className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: item.courseColor }}
                    >
                        {item.courseName}
                    </div>
                </div>

                <SpeakingHub
                    lessonId={item.lessonId}
                    lessonPracticeId={item.lessonPracticeId}
                    phrases={item.speakingPhrases}
                    onComplete={(summary) => setView({ mode: "summary", item, summary })}
                    onExit={() => setView({ mode: "list" })}
                />
            </main>
        );
    }

    // ── SUMMARY VIEW ──────────────────────────────────────────────────────────
    if (view.mode === "summary") {
        const { summary, item } = view;
        const scoreColor = summary.accuracyPct >= 80
            ? "text-emerald-500"
            : summary.accuracyPct >= 60
                ? "text-amber-500"
                : "text-red-500";

        return (
            <main className="container mx-auto px-4 sm:px-6 py-8 max-w-lg animate-in fade-in mt-14">
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-lg">
                    {/* Top band */}
                    <div className="h-2" style={{ backgroundColor: item.courseColor }} />

                    <div className="p-8 text-center space-y-6">
                        <div className="flex items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                                <Sparkles size={28} className="text-violet-500" />
                            </div>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-sm font-medium mb-1">¡Sesión completada!</p>
                            <h2 className="text-4xl font-black">
                                <span className={scoreColor}>{summary.accuracyPct}%</span>
                            </h2>
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
                                <p className="text-xl font-bold truncate">{summary.weakArea ? "⚠" : "✓"}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                                    {summary.weakArea ? "A mejorar" : "¡Perfecto!"}
                                </p>
                            </div>
                        </div>

                        {summary.weakArea && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 text-left">
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                                    Área para practicar más
                                </p>
                                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                                    {summary.weakArea}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                onClick={() => setView({ mode: "session", item, type: "SPEAKING" })}
                                className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm transition-colors"
                            >
                                Practicar de nuevo
                            </button>
                            <button
                                onClick={() => setView({ mode: "list" })}
                                className="w-full py-2.5 rounded-xl border border-border hover:bg-muted/50 font-semibold text-sm transition-colors"
                            >
                                Volver al listado
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    return (
        <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl animate-in fade-in mt-14 mb-24">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[11px] font-bold uppercase tracking-wider mb-3">
                    <Sparkles size={12} /> Práctica con IA
                </div>
                <h1 className="text-3xl font-black tracking-tight">Mis Prácticas</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Reforzá lo aprendido en clase con ejercicios asistidos por IA.
                </p>
            </div>

            {/* Empty State */}
            {practiceData.length === 0 && (
                <div className="rounded-2xl border border-dashed border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={24} className="text-violet-500" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Aún no hay prácticas disponibles</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Cuando tu profesor cargue material de práctica para alguna clase de tus cursos, aparecerá acá automáticamente.
                    </p>
                </div>
            )}

            {/* Practice Cards Grid */}
            {practiceData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {practiceData.map((item) => {
                        const speakingSession = getLastSession(item.sessions, "SPEAKING");
                        const hasSpeaking = item.speakingPhrases.length > 0;
                        const hasListening = !!item.listeningText;
                        const hasChat = !!item.chatScenario;
                        const formattedDate = format(
                            addHours(new Date(item.date), 12),
                            "d 'de' MMMM",
                            { locale: es }
                        );

                        return (
                            <div
                                key={item.lessonPracticeId}
                                className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-md transition-all"
                            >
                                {/* Color band top */}
                                <div className="h-1.5" style={{ backgroundColor: item.courseColor }} />

                                <div className="p-5 space-y-4">
                                    {/* Course + date */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                                            style={{ backgroundColor: item.courseColor }}
                                        >
                                            {item.courseName}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar size={11} /> {formattedDate}
                                        </span>
                                    </div>

                                    {/* Topic */}
                                    <div>
                                        <h3 className="font-bold text-base leading-snug">{item.topic}</h3>
                                    </div>

                                    {/* Available modes */}
                                    <div className="flex flex-wrap gap-2">
                                        {hasSpeaking && (
                                            <ModeChip
                                                icon={<Mic2 size={11} />}
                                                label="Speaking"
                                                color="blue"
                                                session={speakingSession}
                                            />
                                        )}
                                        {hasListening && (
                                            <ModeChip
                                                icon={<Headphones size={11} />}
                                                label="Listening"
                                                color="violet"
                                                session={getLastSession(item.sessions, "LISTENING")}
                                                comingSoon
                                            />
                                        )}
                                        {hasChat && (
                                            <ModeChip
                                                icon={<MessageSquare size={11} />}
                                                label="Chatbot"
                                                color="emerald"
                                                session={getLastSession(item.sessions, "CHAT")}
                                                comingSoon
                                            />
                                        )}
                                    </div>

                                    {/* CTA */}
                                    <button
                                        onClick={() => hasSpeaking && setView({ mode: "session", item, type: "SPEAKING" })}
                                        disabled={!hasSpeaking}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-bold text-sm transition-colors border border-violet-500/20 group-hover:border-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {speakingSession ? "Repasar" : "Empezar"}
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModeChip({
    icon,
    label,
    color,
    session,
    comingSoon = false
}: {
    icon: React.ReactNode;
    label: string;
    color: "blue" | "violet" | "emerald";
    session: PracticeSession | null;
    comingSoon?: boolean;
}) {
    const colorClasses = {
        blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        violet: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800",
        emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
    };

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${colorClasses[color]} ${comingSoon ? "opacity-50" : ""}`}>
            {icon}
            {label}
            {session ? (
                <>
                    <CheckCircle2 size={10} />
                    <span>{Math.round(session.accuracyPct)}%</span>
                </>
            ) : comingSoon ? (
                <span className="text-[9px] opacity-60">(pronto)</span>
            ) : null}
        </div>
    );
}
