"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Check, MessageSquare, Send, X } from "lucide-react";
import type { SessionSummary } from "@/app/dashboard/components/StudentPracticeView";
import { cn } from "@/lib/utils";
import { practiceApiError } from "./apiError";
import { reportClientError } from "@/lib/errors/client";
import { FOCUS, GREEN_BUTTON, GREEN_TEXT, GREEN_TINT, MUTED, ORANGE_TEXT } from "./practiceStyles";

/**
 * La conversación (rediseño de la práctica, aprobado en el lienzo el 11/11/2026).
 *
 * Primero la escena, a pantalla completa, y después la charla: ocupa la
 * pantalla, el cuadro para escribir queda fijo abajo y lo que se mueve es sólo
 * la lista de mensajes. Arriba se ve cuántos mensajes faltan para poder terminar.
 *
 * La escena es la consigna que el profe le dejó a la IA, tal cual
 * (`LessonPractice.chatScenario`): no hay un texto escrito para el alumno, y se
 * decidió mostrar lo del profe antes que uno armado por la IA (16/11/2026).
 *
 * Si la IA no contesta, el mensaje del alumno queda y se puede volver a pedir
 * la respuesta. El error no entra a la charla: antes se agregaba como si lo
 * hubiera dicho la IA y viajaba en el historial.
 */

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AIChatbotProps {
    lessonId: string;
    lessonPracticeId: string;
    topic: string;
    /**
     * Sólo para mostrarlo en pantalla. El escenario que usa la IA lo lee el
     * servidor de la base a partir del `lessonPracticeId`: mandarlo en el body
     * era dejar que el cliente escribiera el system prompt (SEC-07).
     */
    scenario: string;
    onComplete: (summary: SessionSummary) => void;
    onExit: () => void;
    isPreview?: boolean;
}

/** Mensajes del alumno para poder terminar. */
const MIN_MESSAGES = 3;
/** El mismo tope que aplica `/api/practice/chat` a cada mensaje. */
const MAX_MESSAGE_CHARS = 1000;

/** La respuesta de la IA, o el motivo para mostrar si no llegó. */
async function requestReply(lessonPracticeId: string, messages: Message[]): Promise<{ reply: string | null; problem: string | null }> {
    try {
        const res = await fetch("/api/practice/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonPracticeId, messages }),
        });
        if (!res.ok) {
            return { reply: null, problem: await practiceApiError(res, "La IA no pudo contestar. Probá de nuevo.") };
        }
        const data: { message?: string } = await res.json();
        const reply = data.message?.trim();
        return reply ? { reply, problem: null } : { reply: null, problem: "La IA no pudo contestar. Probá de nuevo." };
    } catch {
        return { reply: null, problem: "No hay conexión. Revisala y probá de nuevo." };
    }
}

/** Sin los asteriscos de énfasis: se le pide texto plano a la IA, pero a veces igual los manda. */
export function withoutMarkdown(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2");
}

function secondsSince(start: number): number {
    return Math.round((Date.now() - start) / 1000);
}

export function AIChatbot({ lessonId, lessonPracticeId, topic, scenario, onComplete, onExit, isPreview = false }: AIChatbotProps) {
    const [started, setStarted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [waiting, setWaiting] = useState(false);
    const [problem, setProblem] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const startedAtRef = useRef(0);
    const logRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    /** Sube con cada pedido y al salir: lo que llega de uno viejo se descarta. */
    const requestRef = useRef(0);

    useEffect(() => {
        const requests = requestRef;
        return () => {
            requests.current++;
        };
    }, []);

    // Lo nuevo queda a la vista moviendo sólo la lista, no la página.
    useEffect(() => {
        const log = logRef.current;
        if (!log) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        log.scrollTo({ top: log.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    }, [messages.length, waiting, problem]);

    const userTurns = messages.filter((m) => m.role === "user").length;
    const remaining = Math.max(0, MIN_MESSAGES - userTurns);
    const canFinish = remaining === 0;

    /** Pide la respuesta a `history`; si no llega, `history` queda igual y se puede reintentar. */
    const ask = async (history: Message[]) => {
        const request = ++requestRef.current;
        setWaiting(true);
        setProblem(null);
        const { reply, problem: failure } = await requestReply(lessonPracticeId, history);
        if (request !== requestRef.current) return;
        setWaiting(false);
        if (reply) setMessages([...history, { role: "assistant", content: reply }]);
        else setProblem(failure);
    };

    const start = () => {
        startedAtRef.current = Date.now();
        setStarted(true);
        void ask([]);
    };

    const send = () => {
        const text = input.trim();
        if (!text || waiting || problem || saving) return;
        const next: Message[] = [...messages, { role: "user", content: text }];
        setMessages(next);
        setInput("");
        // Dentro del toque, para que en el celular no se cierre el teclado.
        inputRef.current?.focus();
        void ask(next);
    };

    const finish = async () => {
        if (!canFinish || saving) return;
        requestRef.current++;
        setSaving(true);
        const durationSeconds = secondsSince(startedAtRef.current);
        // La conversación no se corrige: se guardan los mensajes del alumno y el
        // tiempo, sin porcentaje (antes, un 80 % fijo). Los promedios del curso,
        // de Progreso y del panel la dejan afuera por tipo (16/11/2026).
        const record = { phrasesAttempted: userTurns, phrasesCorrect: 0, accuracyPct: 0, durationSeconds };

        if (!isPreview) {
            try {
                await fetch("/api/practice/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ lessonId, lessonPracticeId, type: "CHAT", ...record }),
                });
            } catch (err) {
                reportClientError(err, { action: "practica.guardar-sesion", context: { lessonPracticeId, tipo: "chat" } });
            }
        }
        onComplete({ ...record, messages });
    };

    const exit = () => {
        requestRef.current++;
        onExit();
    };

    const closeButton = (
        <button
            type="button"
            onClick={exit}
            aria-label="Salir de la práctica"
            className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-muted/60", MUTED, FOCUS)}
        >
            <X className="size-6" aria-hidden />
        </button>
    );

    // ── La escena ────────────────────────────────────────────────────────────

    if (!started) {
        const tips = [
            "Escribí en inglés, aunque te equivoques.",
            "Si no sabés una palabra, contá lo que querés decir con otras.",
            `Con ${MIN_MESSAGES} mensajes tuyos ya podés terminar.`,
        ];
        return (
            <div className="fixed inset-0 z-[60] flex flex-col bg-background text-foreground animate-in fade-in duration-200">
                <div className="mx-auto flex h-[60px] w-full max-w-lg shrink-0 items-center gap-2 pl-2 pr-5">
                    {closeButton}
                    <span className={cn("truncate text-xs font-bold uppercase tracking-[0.08em]", GREEN_TEXT)}>Conversación · {topic}</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 pb-5 pt-3">
                        <div className="flex flex-col gap-3.5">
                            <span className={cn("flex size-14 items-center justify-center rounded-2xl", GREEN_TINT, GREEN_TEXT)}>
                                <MessageSquare className="size-7" aria-hidden />
                            </span>
                            <div className="flex flex-col gap-1.5">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">Una charla en inglés</h1>
                                <p className={cn("text-[15px] leading-normal", MUTED)}>La IA hace el papel que preparó tu profe. Vos contestás como vos.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                            <span className={cn("text-[11px] font-bold uppercase tracking-[0.08em]", MUTED)}>Lo que preparó tu profe</span>
                            {/* Sin `pre-line`: hay escenas con saltos de línea a mitad de oración. */}
                            <p className="text-[17px] font-medium leading-normal text-foreground">{scenario}</p>
                        </div>

                        <ul className="flex flex-col gap-3.5">
                            {tips.map((tip) => (
                                <li key={tip} className="flex items-start gap-3 text-[15px] leading-snug text-foreground">
                                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", GREEN_TINT, GREEN_TEXT)}>
                                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                                    </span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <footer className="shrink-0 border-t border-border bg-background">
                    <div className="mx-auto w-full max-w-lg px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                        <button type="button" onClick={start} className={cn("h-[52px] w-full rounded-xl text-base font-bold", GREEN_BUTTON, FOCUS)}>
                            Empezar la conversación
                        </button>
                    </div>
                </footer>
            </div>
        );
    }

    // ── La charla ────────────────────────────────────────────────────────────

    const filled = Math.min(userTurns, MIN_MESSAGES);

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background text-foreground animate-in fade-in duration-200">
            <div className="shrink-0 border-b border-border bg-background">
                <div className="mx-auto flex h-[60px] w-full max-w-lg items-center gap-2 pl-2 pr-4">
                    {closeButton}
                    <div className="flex min-w-0 flex-1 flex-col gap-px">
                        <span className="text-[15px] font-bold text-foreground">Conversación</span>
                        <span className={cn("truncate text-xs", MUTED)}>{topic}</span>
                    </div>
                    <span role="img" aria-label={`${filled} de ${MIN_MESSAGES} mensajes`} className="flex shrink-0 items-center gap-1">
                        {Array.from({ length: MIN_MESSAGES }, (_, i) => (
                            <span key={i} className={cn("size-2 rounded-full", i < filled ? "bg-[#38b397]" : "bg-[#e6e6e6] dark:bg-muted")} />
                        ))}
                    </span>
                </div>
            </div>

            <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f7f7f7] dark:bg-muted/20">
                <div role="log" aria-live="polite" aria-label="La charla" className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-end gap-3 p-4">
                    {messages.map((m, i) =>
                        m.role === "assistant" ? (
                            <div key={i} className="flex items-end gap-2">
                                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", GREEN_TINT, GREEN_TEXT)}>
                                    <Bot className="size-4" aria-hidden />
                                </span>
                                <p lang="en" className="max-w-[78%] whitespace-pre-line rounded-2xl rounded-bl-[4px] border border-border bg-card px-3.5 py-2.5 text-[15px] leading-snug text-foreground">
                                    <span className="sr-only">La IA: </span>
                                    {withoutMarkdown(m.content)}
                                </p>
                            </div>
                        ) : (
                            <div key={i} className="flex justify-end">
                                <p lang="en" className="max-w-[78%] whitespace-pre-line break-words rounded-2xl rounded-br-[4px] bg-[#dff3ec] px-3.5 py-2.5 text-[15px] leading-snug text-[#1f3d35] dark:bg-primary/20 dark:text-foreground">
                                    <span className="sr-only">Vos: </span>
                                    {m.content}
                                </p>
                            </div>
                        ),
                    )}

                    {waiting && (
                        <div className="flex items-end gap-2">
                            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", GREEN_TINT, GREEN_TEXT)}>
                                <Bot className="size-4" aria-hidden />
                            </span>
                            <span className="flex gap-1 rounded-2xl rounded-bl-[4px] border border-border bg-card px-4 py-3.5">
                                <span className="sr-only">La IA está escribiendo</span>
                                {[0, 150, 300].map((delay) => (
                                    <span
                                        key={delay}
                                        className="size-1.5 rounded-full bg-[#9a9a9a] motion-safe:animate-bounce"
                                        style={{ animationDelay: `${delay}ms` }}
                                        aria-hidden
                                    />
                                ))}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <footer className="shrink-0 border-t border-border bg-background">
                <div className="mx-auto flex w-full max-w-lg flex-col gap-2.5 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5">
                    {problem && (
                        <div role="alert" className="flex items-center justify-between gap-3">
                            <p className={cn("text-[13px] font-medium leading-snug", ORANGE_TEXT)}>{problem}</p>
                            <button
                                type="button"
                                onClick={() => void ask(messages)}
                                disabled={saving}
                                className={cn("h-9 shrink-0 rounded-lg border border-border px-3 text-[13px] font-semibold text-foreground hover:bg-muted/40 disabled:opacity-60", FOCUS)}
                            >
                                Probar de nuevo
                            </button>
                        </div>
                    )}
                    {/* Con los mensajes hechos se puede terminar aunque la IA no haya contestado el último. */}
                    {canFinish ? (
                        <button
                            type="button"
                            onClick={() => void finish()}
                            disabled={saving}
                            className={cn("h-11 w-full rounded-xl border-[1.5px] border-[#2b8069] text-[15px] font-bold disabled:opacity-60 dark:border-primary", GREEN_TINT, GREEN_TEXT, FOCUS)}
                        >
                            {saving ? "Guardando…" : "Terminar la conversación"}
                        </button>
                    ) : !problem && (
                        <p className={cn("text-center text-xs font-medium", MUTED)}>
                            {remaining === 1 ? "Te falta 1 mensaje para poder terminar" : `Te faltan ${remaining} mensajes para poder terminar`}
                        </p>
                    )}

                    <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            send();
                        }}
                    >
                        <label htmlFor="practice-chat-message" className="sr-only">Tu mensaje</label>
                        <input
                            ref={inputRef}
                            id="practice-chat-message"
                            type="text"
                            lang="en"
                            autoComplete="off"
                            enterKeyHint="send"
                            maxLength={MAX_MESSAGE_CHARS}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribí en inglés…"
                            disabled={saving}
                            className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-[#fafafa] px-3.5 text-[15px] text-foreground placeholder:text-[#6b6b6b] focus:border-[#2b8069] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 dark:bg-muted/30 dark:placeholder:text-muted-foreground"
                        />
                        <button
                            type="submit"
                            aria-label="Enviar"
                            disabled={!input.trim() || waiting || !!problem || saving}
                            className={cn(
                                "flex size-12 shrink-0 items-center justify-center rounded-xl",
                                GREEN_BUTTON,
                                "disabled:cursor-not-allowed disabled:bg-[#e6e6e6] disabled:text-[#7a7a7a] disabled:hover:bg-[#e6e6e6] dark:disabled:bg-muted dark:disabled:text-muted-foreground",
                                FOCUS,
                            )}
                        >
                            <Send className="size-5" aria-hidden />
                        </button>
                    </form>
                </div>
            </footer>
        </div>
    );
}
