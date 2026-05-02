"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Mail, ChevronRight, BookOpen } from "lucide-react";
import type { ThreadPreview } from "@/app/actions/messages";

function formatRelativeTime(date: Date | null): string {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "ahora";
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return "ayer";
    if (diffDays < 7) return `hace ${diffDays}d`;
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

interface Props {
    threads: ThreadPreview[];
    currentUserId: string;
    isStudent: boolean;
}

export function MessagesInboxClient({ threads, currentUserId, isStudent }: Props) {
    if (threads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Mail className="text-muted-foreground" size={28} />
                </div>
                <div>
                    <p className="text-lg font-semibold">Bandeja vacía</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        No tenés mensajes todavía.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {threads.map((thread) => {
                const isUnread = thread.unreadCount > 0;
                return (
                    <Link
                        key={thread.id}
                        href={`/messages/${thread.id}`}
                        className={cn(
                            "group flex items-start gap-4 p-4 rounded-xl border transition-all duration-150",
                            "hover:shadow-md hover:-translate-y-0.5",
                            isUnread
                                ? "bg-primary/5 border-primary/20 hover:bg-primary/8"
                                : "bg-card border-border/60 hover:bg-muted/40"
                        )}
                    >
                        {/* Unread dot */}
                        <div className="mt-1.5 shrink-0">
                            <div
                                className={cn(
                                    "h-2.5 w-2.5 rounded-full transition-all",
                                    isUnread ? "bg-primary shadow-sm shadow-primary/50" : "bg-transparent"
                                )}
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Row 1: subject + time */}
                            <div className="flex items-start justify-between gap-2">
                                <p
                                    className={cn(
                                        "text-sm leading-snug truncate",
                                        isUnread ? "font-bold text-foreground" : "font-semibold text-foreground/80"
                                    )}
                                >
                                    {thread.subject}
                                </p>
                                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                                    {formatRelativeTime(thread.lastMessageAt ?? thread.createdAt)}
                                </span>
                            </div>

                            {/* Row 2: author + course badge */}
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">
                                    {thread.authorName}
                                </span>
                                {thread.courseName && (
                                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                        <BookOpen size={9} />
                                        {thread.courseName}
                                    </span>
                                )}
                                {thread.type === "COURSE_BLAST" && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium dark:bg-amber-900/30 dark:text-amber-400">
                                        Curso completo
                                    </span>
                                )}
                            </div>

                            {/* Row 3: message preview */}
                            {thread.lastMessageBody && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {thread.lastMessageBody}
                                </p>
                            )}
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0 mt-2 text-muted-foreground/40 group-hover:text-primary/50 transition-colors">
                            <ChevronRight size={16} />
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
