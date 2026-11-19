"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SpeakingHub, type SpeakingReview } from "@/components/practice/SpeakingHub";
import { ListeningLab } from "@/components/practice/ListeningLab";
import { AIChatbot } from "@/components/practice/AIChatbot";
import { PracticeClose } from "@/components/practice/PracticeClose";
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
    /** Speaking: cada frase corregida, en el orden de la clase, y lo que faltó la última vez. */
    phrases?: { text: string; ok: boolean; missing: string[] }[];
    /** Conversación: la charla, para releerla en el cierre. No se guarda. */
    messages?: { role: "user" | "assistant"; content: string }[];
    /** Speaking: la sesión guardada, para que el repaso del cierre la complete. */
    sessionId?: string;
}

type PracticeType = "SPEAKING" | "LISTENING" | "CHAT";

type View =
    | { mode: "landing" }
    /** `review`: «Repasar la frase» del cierre, sólo esas frases y para completar la vez anterior. */
    | { mode: "session"; item: PracticeData; type: PracticeType; review?: { phrases: string[]; context: SpeakingReview } }
    | { mode: "summary"; item: PracticeData; summary: SessionSummary; type: PracticeType };

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
                const { item, type, review } = view;
                const onComplete = (summary: SessionSummary) => setView({ mode: "summary", item, summary, type });

                if (type === "LISTENING" && item.listeningText) {
                    // Su pantalla corregida ya es el cierre: «Terminar» guarda y vuelve a la práctica.
                    return (
                        <ListeningLab
                            key={item.lessonPracticeId}
                            lessonId={item.lessonId}
                            lessonPracticeId={item.lessonPracticeId}
                            topic={item.topic}
                            listeningText={item.listeningText}
                            onComplete={handleExit}
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
                            phrases={review?.phrases ?? item.speakingPhrases}
                            review={review?.context}
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

            {view.mode === "summary" && view.type !== "LISTENING" && (
                <PracticeClose
                    type={view.type}
                    topic={view.item.topic}
                    scenario={view.item.chatScenario}
                    summary={view.summary}
                    // El repaso es un Speaking con sólo esas frases que completa la vez
                    // anterior: la clase pasa a «3 de 3» si salen (decisión del 17/11/2026).
                    onReview={(phrases) => setView({
                        mode: "session",
                        item: view.item,
                        type: "SPEAKING",
                        review: {
                            phrases,
                            context: {
                                sessionId: view.summary.sessionId,
                                previous: view.summary.phrases ?? [],
                                durationSeconds: view.summary.durationSeconds,
                                weakArea: view.summary.weakArea,
                            },
                        },
                    })}
                    onAgain={() => setView({ mode: "session", item: view.item, type: view.type })}
                    onExit={handleExit}
                />
            )}

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
