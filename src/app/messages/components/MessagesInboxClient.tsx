"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Mail,
    ChevronRight,
    ChevronLeft,
    BookOpen,
    Search,
    User,
    X,
    Loader2,
} from "lucide-react";
import type { InboxPage } from "@/app/actions/messages";

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

type Filters = {
    q: string;
    curso: string;
    alumno: string;
    sinleer: boolean;
};

interface Props {
    inbox: InboxPage;
    filters: Filters;
}

export function MessagesInboxClient({ inbox, filters }: Props) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [search, setSearch] = useState(filters.q);

    /**
     * Los filtros viven en la URL y no en estado: así la búsqueda se puede
     * compartir y volver atrás hace lo que uno espera. Cambiar cualquiera
     * vuelve a la página 1 — quedarse en la 3 de un resultado de dos páginas es
     * la forma más rápida de mostrar una bandeja vacía que sí tiene cosas.
     */
    function go(next: Partial<Filters & { pagina: number }>) {
        const merged = { ...filters, pagina: 1, ...next };
        const params = new URLSearchParams();
        if (merged.q) params.set("q", merged.q);
        if (merged.curso) params.set("curso", merged.curso);
        if (merged.alumno) params.set("alumno", merged.alumno);
        if (merged.sinleer) params.set("sinleer", "1");
        if (merged.pagina > 1) params.set("pagina", String(merged.pagina));

        const qs = params.toString();
        startTransition(() => router.push(qs ? `/messages?${qs}` : "/messages"));
    }

    // La búsqueda espera a que dejen de tipear. Sin esto, cada tecla es una
    // consulta y una entrada en el historial del navegador.
    useEffect(() => {
        if (search === filters.q) return;
        const timer = setTimeout(() => go({ q: search }), 350);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const hasFilters = !!(filters.q || filters.curso || filters.alumno || filters.sinleer);
    const totalPages = Math.max(1, Math.ceil(inbox.total / inbox.pageSize));

    return (
        <div className="space-y-4">
            {/* ── Buscador y filtros ── */}
            <div className="space-y-3">
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por asunto..."
                        aria-label="Buscar por asunto"
                        className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                    />
                    {pending && (
                        <Loader2
                            size={15}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
                        />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => go({ sinleer: !filters.sinleer })}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                            filters.sinleer
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        )}
                    >
                        Sin leer
                    </button>

                    {inbox.courses.length > 1 && (
                        <select
                            value={filters.curso}
                            onChange={(e) => go({ curso: e.target.value })}
                            aria-label="Filtrar por curso"
                            className="bg-muted/50 border border-border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">Todos los cursos</option>
                            {inbox.courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {inbox.students.length > 1 && (
                        <select
                            value={filters.alumno}
                            onChange={(e) => go({ alumno: e.target.value })}
                            aria-label="Filtrar por alumno"
                            className="bg-muted/50 border border-border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">Todos los alumnos</option>
                            {inbox.students.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                go({ q: "", curso: "", alumno: "", sinleer: false });
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={12} />
                            Limpiar
                        </button>
                    )}

                    {inbox.total > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                            {inbox.total} {inbox.total === 1 ? "hilo" : "hilos"}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Lista ── */}
            {inbox.threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                        <Mail className="text-muted-foreground" size={28} />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">
                            {hasFilters ? "Sin resultados" : "Bandeja vacía"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {hasFilters
                                ? "Probá con otro asunto o sacá algún filtro."
                                : "No tenés mensajes todavía."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {inbox.threads.map((thread) => {
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
                                            isUnread
                                                ? "bg-primary shadow-sm shadow-primary/50"
                                                : "bg-transparent"
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
                                                isUnread
                                                    ? "font-bold text-foreground"
                                                    : "font-semibold text-foreground/80"
                                            )}
                                        >
                                            {thread.subject}
                                        </p>
                                        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                                            {formatRelativeTime(
                                                thread.lastMessageAt ?? thread.createdAt
                                            )}
                                        </span>
                                    </div>

                                    {/* Row 2: autor · sobre quién · curso */}
                                    <div className="flex items-center flex-wrap gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">
                                            {thread.authorName}
                                        </span>
                                        {/* De quién habla el hilo. Va acá y no adentro del
                                            hilo a propósito: si hay que abrirlo para saber
                                            de quién le hablan, el dato no sirvió de nada. */}
                                        {thread.studentName && (
                                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                <User size={9} />
                                                sobre {thread.studentName}
                                            </span>
                                        )}
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
            )}

            {/* ── Paginación ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        type="button"
                        disabled={inbox.page <= 1}
                        onClick={() => go({ pagina: inbox.page - 1 })}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-border bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    >
                        <ChevronLeft size={13} />
                        Anterior
                    </button>
                    <span className="text-xs text-muted-foreground">
                        Página {inbox.page} de {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={inbox.page >= totalPages}
                        onClick={() => go({ pagina: inbox.page + 1 })}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-border bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    >
                        Siguiente
                        <ChevronRight size={13} />
                    </button>
                </div>
            )}
        </div>
    );
}
