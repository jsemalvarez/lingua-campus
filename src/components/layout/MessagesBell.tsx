"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUnreadThreadCount } from "@/app/actions/messages";

const POLL_INTERVAL_MS = 60_000; // 60 s

interface Props {
    userId: string;
    isStudent: boolean;
    instituteId: string;
    isAdmin: boolean;
    /** Visual variant: "icon" renders a square icon button (navbar right side),
     *  "mobile" renders the full bottom-tab entry */
    variant: "icon" | "mobile";
    isActive: boolean;
    label?: string;
}

export function MessagesBell({
    userId,
    isStudent,
    instituteId,
    isAdmin,
    variant,
    isActive,
    label = "Mensajes",
}: Props) {
    const [unreadCount, setUnreadCount] = useState(0);

    async function refresh() {
        try {
            const count = await getUnreadThreadCount({ userId, isStudent, instituteId, isAdmin });
            setUnreadCount(count);
        } catch {
            // silent — badge stays at last known value
        }
    }

    // ── Initial load + polling every 60 s ──
    useEffect(() => {
        refresh();
        const timer = setInterval(refresh, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, isStudent, instituteId, isAdmin]);

    const badge = unreadCount > 0 ? (
        <span
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none animate-in zoom-in duration-200"
            aria-label={`${unreadCount} mensajes sin leer`}
        >
            {unreadCount > 9 ? "9+" : unreadCount}
        </span>
    ) : null;

    if (variant === "icon") {
        return (
            <Link
                href="/messages"
                title={label}
                className={cn(
                    "relative flex h-8 w-8 sm:h-9 sm:w-9 rounded-xl items-center justify-center transition-colors",
                    isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
            >
                <Mail size={20} />
                {badge}
            </Link>
        );
    }

    // Mobile bottom-tab variant
    return (
        <Link
            href="/messages"
            className={cn(
                "flex items-center justify-center flex-1 py-1 rounded-xl transition-all",
                isActive ? "text-primary" : "text-foreground/40 hover:text-foreground/60"
            )}
        >
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all",
                    isActive && "bg-primary/5"
                )}
            >
                <Mail size={20} className="mb-0.5" />
                {badge}
                <span className="text-[10px] font-bold uppercase tracking-tight">
                    {label.charAt(0)}
                </span>
            </div>
        </Link>
    );
}
