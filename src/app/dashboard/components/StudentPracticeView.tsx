"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { SpeakingHub } from "@/components/practice/SpeakingHub";
import { ListeningLab } from "@/components/practice/ListeningLab";
import { AIChatbot } from "@/components/practice/AIChatbot";
import { PracticeHome } from "@/components/practice/PracticeHome";

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
            {/* Los tres ejercicios van a pantalla completa, sin la barra del campus
                (rediseño de la práctica). La página de inicio sólo ofrece los modos
                que la clase tiene, así que no queda un caso sin ejercicio. */}
            {view.mode === "session" && (() => {
                const { item, type } = view;
                const onComplete = (summary: SessionSummary) => setView({ mode: "summary", item, summary, type });

                if (type === "LISTENING" && item.listeningText) {
                    return (
                        <ListeningLab
                            key={item.lessonPracticeId}
                            lessonId={item.lessonId}
                            lessonPracticeId={item.lessonPracticeId}
                            topic={item.topic}
                            listeningText={item.listeningText}
                            onComplete={onComplete}
                            onExit={handleExit}
                            isPreview={isPreview}
                        />
                    );
                }
                if (type === "SPEAKING") {
                    return (
                        <SpeakingHub
                            key={item.lessonPracticeId}
                            lessonId={item.lessonId}
                            lessonPracticeId={item.lessonPracticeId}
                            topic={item.topic}
                            phrases={item.speakingPhrases}
                            onComplete={onComplete}
                            onExit={handleExit}
                            isPreview={isPreview}
                        />
                    );
                }
                if (type === "CHAT" && item.chatScenario) {
                    return (
                        <AIChatbot
                            key={item.lessonPracticeId}
                            lessonId={item.lessonId}
                            lessonPracticeId={item.lessonPracticeId}
                            topic={item.topic}
                            scenario={item.chatScenario}
                            onComplete={onComplete}
                            onExit={handleExit}
                            isPreview={isPreview}
                        />
                    );
                }
                return null;
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
