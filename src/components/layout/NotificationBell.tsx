"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabaseClient } from "@/lib/supabase-client";
import {
    getUnreadNotifications,
    getRecentNotifications,
    markAsRead,
    markAllAsRead,
} from "@/app/actions/notifications";

type Notification = {
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    link: string | null;
    createdAt: Date;
};

export function NotificationBell({ userId, isStudent = false }: { userId: string, isStudent?: boolean }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isPending, startTransition] = useTransition();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Carga inicial ──
    useEffect(() => {
        async function loadInitial() {
            const [unread, recent] = await Promise.all([
                getUnreadNotifications(userId, isStudent),
                getRecentNotifications(userId, isStudent),
            ]);
            setUnreadCount(unread.length);
            setNotifications(recent as Notification[]);
        }
        loadInitial();
    }, [userId, isStudent]);

    // ── Supabase Broadcast subscription ──
    useEffect(() => {
        if (!supabaseClient || !userId) return;

        const channel = supabaseClient
            .channel(`user:${userId}`)
            .on(
                "broadcast",
                { event: "new_notification" },
                (payload) => {
                    const newNotif = payload.payload as Notification;
                    setNotifications((prev) => [newNotif, ...prev.slice(0, 14)]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("[NotificationBell] Broadcast channel connected ✓");
                } else if (status === "CHANNEL_ERROR") {
                    console.warn("[NotificationBell] Broadcast channel error (Realtime might be disabled in Supabase project)");
                }
            });

        return () => {
            supabaseClient?.removeChannel(channel);
        };
    }, [userId]);

    // ── Cerrar al hacer clic afuera ──
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleOpen() {
        setOpen((prev) => !prev);
    }

    function handleMarkAll() {
        startTransition(async () => {
            await markAllAsRead(userId, isStudent);
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        });
    }

    function handleMarkOne(id: string) {
        startTransition(async () => {
            await markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        });
    }

    const typeIcon: Record<string, string> = {
        NEW_ENROLLMENT: "📋",
        PAYMENT_RECEIVED: "💳",
        DEFAULT: "🔔",
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* ── Bell Button ── */}
            <button
                onClick={handleOpen}
                title="Notificaciones"
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 rounded-xl items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none animate-in zoom-in duration-200">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* ── Dropdown ── */}
            {open && (
                <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <span className="font-semibold text-sm text-foreground">
                            Notificaciones
                            {unreadCount > 0 && (
                                <span className="ml-2 text-xs text-muted-foreground font-normal">
                                    ({unreadCount} sin leer)
                                </span>
                            )}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                disabled={isPending}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                            >
                                {isPending ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <CheckCheck size={12} />
                                )}
                                Marcar todas
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <Bell size={28} className="mb-2 opacity-30" />
                                <p className="text-sm">Sin notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 px-4 py-3 transition-colors group ${
                                        n.read
                                            ? "bg-transparent"
                                            : "bg-primary/5 dark:bg-primary/10"
                                    }`}
                                >
                                    <span className="text-lg mt-0.5 shrink-0">
                                        {typeIcon[n.type] ?? typeIcon.DEFAULT}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium leading-tight ${n.read ? "text-foreground/70" : "text-foreground"}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {n.body}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                                            {formatDistanceToNow(new Date(n.createdAt), {
                                                addSuffix: true,
                                                locale: es,
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {n.link && (
                                            <Link
                                                href={n.link}
                                                onClick={() => setOpen(false)}
                                                className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                title="Ver"
                                            >
                                                <ExternalLink size={13} />
                                            </Link>
                                        )}
                                        {!n.read && (
                                            <button
                                                onClick={() => handleMarkOne(n.id)}
                                                className="p-1 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50 transition-colors"
                                                title="Marcar como leída"
                                            >
                                                <Check size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
