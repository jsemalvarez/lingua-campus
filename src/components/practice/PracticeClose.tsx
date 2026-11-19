"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Eye, EyeOff, MessageSquare, Mic, RotateCcw } from "lucide-react";
import type { SessionSummary } from "@/app/dashboard/components/StudentPracticeView";
import { listWords } from "@/lib/practice/words";
import { cn } from "@/lib/utils";
import { withoutMarkdown } from "./AIChatbot";
import { FOCUS, GREEN_BUTTON, GREEN_TEXT, GREEN_TINT, MUTED, ORANGE_TEXT } from "./practiceStyles";

/**
 * El cierre de un ejercicio (rediseño de la práctica, aprobado en el lienzo el
 * 11/11/2026). Dice lo que pasó, sin porcentajes ni «¡Perfecto!».
 *
 * - Speaking: cuántas frases salieron bien, cuáles quedan para repasar y qué
 *   palabras faltaron la última vez, y un botón para repasar sólo esas. En el
 *   lienzo había un recuadro «Para practicar» con un consejo general; lo que
 *   devuelve la IA ahí es una etiqueta técnica en inglés («final sibilant»),
 *   así que va lo que el campus sabe de cierto: las palabras que faltaron.
 * - Conversación: mensajes y tiempo, sin nota, y la charla para releerla.
 *
 * Listening no pasa por acá: su pantalla corregida ya es el cierre.
 */

interface PracticeCloseProps {
    type: "SPEAKING" | "CHAT";
    topic: string;
    /** La consigna de la conversación, la misma que se mostró al empezar. */
    scenario?: string | null;
    summary: SessionSummary;
    /** Speaking: decir de nuevo sólo estas frases. */
    onReview: (phrases: string[]) => void;
    onAgain: () => void;
    onExit: () => void;
}

function minutesText(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return "menos de un minuto";
    return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

function Shell({ icon, title, subtitle, children, footer }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
    const titleRef = useRef<HTMLHeadingElement>(null);
    // El foco al título: el lector de pantalla anuncia el cierre y no queda en un botón que ya no está.
    useEffect(() => {
        titleRef.current?.focus();
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background text-foreground animate-in fade-in duration-200">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-5 pb-4 pt-8">
                    <div className="flex flex-col gap-3.5">
                        <span className={cn("flex size-14 items-center justify-center rounded-2xl", GREEN_TINT, GREEN_TEXT)}>{icon}</span>
                        <div className="flex flex-col gap-1">
                            <h1 ref={titleRef} tabIndex={-1} className="text-2xl font-bold tracking-tight text-foreground outline-none">{title}</h1>
                            <p className={cn("text-sm", MUTED)}>{subtitle}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
            <footer className="shrink-0 border-t border-border bg-background">
                <div className="mx-auto flex w-full max-w-lg flex-col gap-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">{footer}</div>
            </footer>
        </div>
    );
}

const PRIMARY = cn("h-[52px] w-full rounded-xl text-base font-bold", GREEN_BUTTON, FOCUS);
const SECONDARY = cn("h-12 w-full rounded-xl border border-border bg-card text-[15px] font-semibold text-foreground hover:bg-muted/40", FOCUS);

export function PracticeClose({ type, topic, scenario, summary, onReview, onAgain, onExit }: PracticeCloseProps) {
    const [showChat, setShowChat] = useState(false);

    if (type === "CHAT") {
        const messages = summary.messages ?? [];
        const count = summary.phrasesAttempted;
        const seconds = summary.durationSeconds;
        return (
            <Shell
                icon={<MessageSquare className="size-7" aria-hidden />}
                title="Terminaste la conversación"
                subtitle={topic}
                footer={
                    <>
                        <button type="button" onClick={onExit} className={PRIMARY}>Volver a la práctica</button>
                        <button type="button" onClick={onAgain} className={SECONDARY}>Conversar de nuevo</button>
                    </>
                }
            >
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border px-4 py-3.5">
                        <span className="text-2xl font-bold text-foreground">{count}</span>
                        <span className={cn("text-[13px]", MUTED)}>{count === 1 ? "mensaje tuyo" : "mensajes tuyos"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border px-4 py-3.5">
                        <span className="text-2xl font-bold text-foreground">{seconds < 60 ? `${seconds} s` : `${Math.round(seconds / 60)} min`}</span>
                        <span className={cn("text-[13px]", MUTED)}>de charla</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <span className={cn("text-[11px] font-bold uppercase tracking-[0.08em]", MUTED)}>Lo que preparó tu profe</span>
                    {scenario && <p className="text-[15px] leading-normal text-foreground">{scenario}</p>}
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowChat((v) => !v)}
                            aria-expanded={showChat}
                            className={cn("mt-1 inline-flex h-11 items-center gap-2 self-start rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground hover:bg-muted/40", FOCUS)}
                        >
                            {showChat ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                            {showChat ? "Ocultar la conversación" : "Releer la conversación"}
                        </button>
                    )}
                    {showChat && (
                        <ul className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                            {messages.map((m, i) => (
                                <li key={i} className={cn("flex", m.role === "user" && "justify-end")}>
                                    <p
                                        lang="en"
                                        className={cn(
                                            "max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3 py-2 text-sm leading-snug",
                                            m.role === "user"
                                                ? "rounded-br-[4px] bg-[#dff3ec] text-[#1f3d35] dark:bg-primary/20 dark:text-foreground"
                                                : "rounded-bl-[4px] bg-muted/50 text-foreground",
                                        )}
                                    >
                                        <span className="sr-only">{m.role === "user" ? "Vos: " : "La IA: "}</span>
                                        {m.role === "assistant" ? withoutMarkdown(m.content) : m.content}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Shell>
        );
    }

    // ── Speaking ─────────────────────────────────────────────────────────────

    const phrases = summary.phrases ?? [];
    const total = phrases.length || summary.phrasesAttempted;
    const good = phrases.length ? phrases.filter((p) => p.ok).length : summary.phrasesCorrect;
    const toReview = phrases.filter((p) => !p.ok);

    return (
        <Shell
            icon={<Mic className="size-7" aria-hidden />}
            title="Terminaste el Speaking"
            subtitle={`${topic} · ${minutesText(summary.durationSeconds)}`}
            footer={
                toReview.length > 0 ? (
                    <>
                        <button type="button" onClick={() => onReview(toReview.map((p) => p.text))} className={PRIMARY}>
                            {toReview.length === 1 ? "Repasar la frase" : `Repasar las ${toReview.length} frases`}
                        </button>
                        <button type="button" onClick={onExit} className={SECONDARY}>Volver a la práctica</button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={onExit} className={PRIMARY}>Volver a la práctica</button>
                        <button type="button" onClick={onAgain} className={SECONDARY}>Decirlas de nuevo</button>
                    </>
                )
            }
        >
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <p className="text-lg font-bold text-foreground">
                    {good} de {total} {total === 1 ? "frase bien dicha" : "frases bien dichas"}
                </p>
                {phrases.length > 0 && (
                    <>
                        <div aria-hidden className="grid gap-1" style={{ gridTemplateColumns: `repeat(${phrases.length}, minmax(0, 1fr))` }}>
                            {phrases.map((p, i) => (
                                <span key={i} className={cn("h-2 rounded-full", p.ok ? "bg-[#38b397]" : "bg-[#c2410c] dark:bg-orange-400")} />
                            ))}
                        </div>
                        <ul className="flex flex-col">
                            {phrases.map((p, i) => (
                                <li key={i} className="flex min-h-9 items-start gap-2.5 border-t border-[#f0f0f0] py-2 dark:border-border">
                                    {p.ok ? (
                                        <Check role="img" aria-label="Bien" className={cn("mt-0.5 size-4 shrink-0", GREEN_TEXT)} strokeWidth={3} />
                                    ) : (
                                        <RotateCcw role="img" aria-label="Para repasar" className={cn("mt-0.5 size-4 shrink-0", ORANGE_TEXT)} strokeWidth={2.5} />
                                    )}
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span lang="en" className={cn("text-sm leading-snug text-foreground", !p.ok && "font-semibold")}>{p.text}</span>
                                        {!p.ok && p.missing.length > 0 && (
                                            <span className={cn("text-xs leading-snug", MUTED)}>
                                                {p.missing.length === 1 ? "Faltó" : "Faltaron"} {listWords(p.missing)}
                                            </span>
                                        )}
                                    </div>
                                    {!p.ok && <span className={cn("shrink-0 text-xs font-semibold leading-5", ORANGE_TEXT)}>Para repasar</span>}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </Shell>
    );
}
