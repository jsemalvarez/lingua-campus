"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/app/actions/messages";
import { ArrowLeft, Send, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ThreadDetail } from "@/app/actions/messages";

interface Props {
    thread: ThreadDetail;
    currentUserId: string;
    isStudent: boolean;
}

function formatDateTime(date: Date): string {
    return new Date(date).toLocaleString("es-AR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function ThreadViewClient({ thread, currentUserId, isStudent }: Props) {
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [thread.messages]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;
        setSending(true);
        setError(null);

        try {
            await sendMessage({
                threadId: thread.id,
                body,
                senderUserId: isStudent ? undefined : currentUserId,
                senderStudentId: isStudent ? currentUserId : undefined,
            });
            setBody("");
        } catch (err: any) {
            setError(err.message ?? "Error al enviar el mensaje.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            {/* Header */}
            <div className="space-y-3">
                <Link
                    href="/messages"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft size={15} />
                    Volver a mensajes
                </Link>

                <div className="bg-card border border-border/60 rounded-2xl p-5">
                    <h1 className="text-xl font-bold text-foreground">{thread.subject}</h1>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {thread.courseName && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted font-medium">
                                <BookOpen size={11} />
                                {thread.courseName}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Users size={11} />
                            {thread.participants.length}{" "}
                            {thread.participants.length === 1 ? "participante" : "participantes"}
                        </span>
                        <span>
                            {new Date(thread.createdAt).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                    </div>

                    {/* Participants list */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {thread.participants.map((p) => (
                            <span
                                key={p.id}
                                className={cn(
                                    "text-[11px] px-2 py-0.5 rounded-full font-medium",
                                    p.isAuthor
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {p.name}
                                {p.isAuthor && " (autor)"}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
                {thread.messages.map((msg) => {
                    const isMine = msg.isCurrentUser;
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col gap-1",
                                isMine ? "items-end" : "items-start"
                            )}
                        >
                            {/* Sender name + time */}
                            <div
                                className={cn(
                                    "flex items-center gap-2 text-xs text-muted-foreground px-1",
                                    isMine && "flex-row-reverse"
                                )}
                            >
                                <span className="font-medium">{msg.senderName}</span>
                                <span>·</span>
                                <span>{formatDateTime(msg.createdAt)}</span>
                            </div>

                            {/* Bubble */}
                            <div
                                className={cn(
                                    "max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
                                    isMine
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-card border border-border/60 text-foreground rounded-tl-sm"
                                )}
                            >
                                {msg.body}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="sticky bottom-4">
                <form
                    onSubmit={handleSend}
                    className="bg-card border border-border/60 rounded-2xl p-4 shadow-lg space-y-3"
                >
                    {error && (
                        <p className="text-sm text-red-500 px-1">{error}</p>
                    )}
                    <textarea
                        id="reply-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                handleSend(e as any);
                            }
                        }}
                        placeholder="Escribí tu respuesta..."
                        rows={3}
                        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Ctrl + Enter para enviar
                        </p>
                        <Button
                            type="submit"
                            disabled={sending || !body.trim()}
                            className="gap-2 h-9 px-4 rounded-xl text-sm font-semibold"
                        >
                            <Send size={14} />
                            {sending ? "Enviando..." : "Responder"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
