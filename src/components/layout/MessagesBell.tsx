"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUnreadThreadCount } from "@/app/actions/messages";
import { supabaseClient } from "@/lib/supabase-client";

/**
 * Red de seguridad, no el mecanismo principal.
 *
 * El aviso real llega por el canal en vivo. Este intervalo existe sólo para el
 * caso en que Realtime esté apagado en el proyecto de Supabase — que es el que
 * ya contempla `NotificationBell`— y por eso es largo: antes era de 60 segundos
 * y cada vuelta levantaba, para un admin, todos los hilos del instituto con sus
 * participantes. Ahora la consulta cuenta en SQL, pero sigue sin haber motivo
 * para preguntar seguido algo que nos van a avisar.
 */
const FALLBACK_POLL_MS = 5 * 60_000;

interface Props {
    userId: string;
    /** Visual variant: "icon" renders a square icon button (navbar right side),
     *  "mobile" renders the full bottom-tab entry */
    variant: "icon" | "mobile";
    isActive: boolean;
    label?: string;
}

export function MessagesBell({ userId, variant, isActive, label = "Mensajes" }: Props) {
    const [unreadCount, setUnreadCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            setUnreadCount(await getUnreadThreadCount());
        } catch {
            // silent — badge stays at last known value
        }
    }, []);

    // ── Carga inicial + red de seguridad ──
    useEffect(() => {
        refresh();
        const timer = setInterval(refresh, FALLBACK_POLL_MS);
        return () => clearInterval(timer);
    }, [userId, refresh]);

    // ── Aviso en vivo, por el mismo canal que usa la campana ──
    //
    // El mensaje que llega sólo dice "pasó algo en este hilo": el contador se
    // vuelve a pedir al servidor en vez de sumar uno de este lado. Sumar acá
    // sería llevar una segunda cuenta que se despega de la real en cuanto haya
    // dos pestañas abiertas.
    useEffect(() => {
        if (!supabaseClient || !userId) return;

        const channel = supabaseClient
            .channel(`user:${userId}`)
            .on("broadcast", { event: "new_message" }, () => {
                refresh();
            })
            .subscribe((status) => {
                if (status === "CHANNEL_ERROR") {
                    console.warn(
                        "[MessagesBell] Canal en vivo no disponible (¿Realtime apagado?); queda el refresco periódico"
                    );
                }
            });

        return () => {
            supabaseClient?.removeChannel(channel);
        };
    }, [userId, refresh]);

    // Volver a la pestaña es el otro momento en que conviene mirar: si el aviso
    // se perdió mientras estaba en segundo plano, acá se recupera.
    useEffect(() => {
        function onFocus() {
            if (document.visibilityState === "visible") refresh();
        }
        document.addEventListener("visibilitychange", onFocus);
        return () => document.removeEventListener("visibilitychange", onFocus);
    }, [refresh]);

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
                <Mail size={20} />
                {badge}
            </div>
        </Link>
    );
}
