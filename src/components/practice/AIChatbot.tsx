"use client";

import { useState, useRef, useEffect } from "react";
import {
    MessageSquare, Send, Loader2, LogOut, CheckCircle2, Bot, User
} from "lucide-react";
import type { SessionSummary } from "@/app/dashboard/components/StudentPracticeView";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AIChatbotProps {
    lessonId: string;
    lessonPracticeId: string;
    scenario: string;
    onComplete: (summary: SessionSummary) => void;
    onExit: () => void;
    isPreview?: boolean;
}

const MIN_EXCHANGES = 3; // minimum turns before "Finalizar" appears

// ─── Component ────────────────────────────────────────────────────────────────

export function AIChatbot({
    lessonId,
    lessonPracticeId,
    scenario,
    onComplete,
    onExit,
    isPreview = false,
}: AIChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const startTimeRef = useRef<number>(Date.now());

    const userTurns = messages.filter((m) => m.role === "user").length;
    const canFinish = userTurns >= MIN_EXCHANGES;

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Start conversation: AI sends the first message
    const startChat = async () => {
        setIsStarted(true);
        setIsLoading(true);
        startTimeRef.current = Date.now();

        try {
            const res = await fetch("/api/practice/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [],
                    scenario,
                }),
            });

            const data = await res.json();
            if (data.message) {
                setMessages([{ role: "assistant", content: data.message }]);
            }
        } catch {
            setMessages([{ role: "assistant", content: "Hello! Let's practice. How can I help you?" }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // Send a user message
    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const userMsg: Message = { role: "user", content: text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/practice/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    scenario,
                }),
            });

            const data = await res.json();
            if (data.message) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
            }
        } catch {
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "Sorry, I couldn't respond. Please try again.",
            }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // Finish session
    const finishSession = async () => {
        setIsSaving(true);
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const phrasesAttempted = userTurns;

        if (!isPreview) {
            try {
                await fetch("/api/practice/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lessonId,
                        lessonPracticeId,
                        type: "CHAT",
                        phrasesAttempted,
                        phrasesCorrect: phrasesAttempted,
                        accuracyPct: 80, // chat is self-paced; fixed passing score
                        durationSeconds,
                    }),
                });
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }

        onComplete({
            phrasesAttempted,
            phrasesCorrect: phrasesAttempted,
            accuracyPct: 80,
            durationSeconds,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <MessageSquare size={16} /> AI Chatbot
                    {userTurns > 0 && (
                        <span className="text-[10px] font-bold text-muted-foreground">
                            · {userTurns} mensaje{userTurns > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
                <button
                    onClick={onExit}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                    <LogOut size={13} /> Salir
                </button>
            </div>

            {/* Scenario card */}
            <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/20 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mb-1">Escenario</p>
                <p className="text-xs text-foreground/70 leading-relaxed">{scenario}</p>
            </div>

            {/* Chat area */}
            {!isStarted ? (
                <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                        <Bot size={24} className="text-emerald-500" />
                    </div>
                    <h3 className="font-bold mb-2">Conversación con IA</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                        La IA va a jugar el rol del escenario. Conversá en inglés de forma natural.
                    </p>
                    <button
                        onClick={startChat}
                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors shadow-md shadow-emerald-500/20"
                    >
                        Iniciar conversación →
                    </button>
                </div>
            ) : (
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col" style={{ height: "400px" }}>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                {/* Avatar */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-violet-500/10 text-violet-500"
                                }`}>
                                    {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "assistant"
                                    ? "bg-muted/60 text-foreground rounded-tl-sm"
                                    : "bg-violet-600 text-white rounded-tr-sm"
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                    <Bot size={14} />
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/60">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-border/40 p-3 flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribí en inglés..."
                            disabled={isLoading || isSaving}
                            className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 disabled:opacity-50"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading || isSaving}
                            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Finish button — appears after MIN_EXCHANGES */}
            {canFinish && !isSaving && (
                <button
                    onClick={finishSession}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors shadow-md shadow-violet-500/20 animate-in fade-in"
                >
                    <CheckCircle2 size={16} /> Finalizar conversación
                </button>
            )}

            {isSaving && (
                <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground text-sm">
                    <Loader2 size={16} className="animate-spin text-violet-500" /> Guardando sesión...
                </div>
            )}

            {isStarted && !canFinish && userTurns > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                    Quedan {MIN_EXCHANGES - userTurns} intercambio{MIN_EXCHANGES - userTurns !== 1 ? "s" : ""} para poder finalizar
                </p>
            )}
        </div>
    );
}
