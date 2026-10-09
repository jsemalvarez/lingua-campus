"use client";

import { AlertCircle, CloudCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isUnsaved, type Autosave } from "./useAutosave";

/**
 * Los mismos ajustes de contraste que la página de recursos: en modo claro el
 * gris `muted-foreground` y el verde `primary` no llegan a 4,5:1 con texto chico.
 */
export const MUTED = "text-neutral-500 dark:text-muted-foreground";
export const PRIMARY_TEXT = "text-[#1f7360] dark:text-primary";
export const PRIMARY_BUTTON = "bg-[#23806a] text-white shadow-sm hover:bg-[#1f7360] disabled:hover:bg-[#23806a]";
export const FIELD =
    "w-full rounded-lg border border-neutral-300 bg-background px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-border sm:text-[15px]";

export function SectionHeader({
    n,
    titleId,
    title,
    description,
    tone = "green",
}: {
    n: number;
    titleId: string;
    title: string;
    description: string;
    tone?: "green" | "violet";
}) {
    return (
        <div className="flex items-start gap-3 sm:gap-3.5">
            <span
                aria-hidden="true"
                className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold sm:size-[34px] sm:text-[15px]",
                    tone === "violet"
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                        : cn("bg-primary/10", PRIMARY_TEXT)
                )}
            >
                {n}
            </span>
            <div className="space-y-1">
                <h2 id={titleId} className="text-xl font-bold tracking-tight sm:text-2xl">
                    {title}
                </h2>
                <p className={cn("max-w-2xl text-[13.5px] leading-normal sm:text-sm", MUTED)}>{description}</p>
            </div>
        </div>
    );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
    return (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[13.5px] leading-normal text-red-700 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {children}
        </p>
    );
}

export function SaveStatus({ states }: { states: Autosave[] }) {
    const all = states.map((s) => s.state);
    const status = all.includes("error")
        ? "error"
        : all.some(isUnsaved)
          ? "saving"
          : all.includes("saved")
            ? "saved"
            : "idle";

    return (
        <p role="status" aria-live="polite" className={cn("inline-flex items-center gap-1.5 text-[13px]", MUTED)}>
            {status === "saving" && <Loader2 className="size-3.5 animate-spin" />}
            {status === "error" && <AlertCircle className="size-3.5 text-red-600" />}
            {(status === "saved" || status === "idle") && <CloudCheck className={cn("size-4", PRIMARY_TEXT)} />}
            {status === "saving"
                ? "Guardando…"
                : status === "error"
                  ? "Hay algo sin guardar"
                  : status === "saved"
                    ? "Guardado"
                    : "Se guarda solo"}
        </p>
    );
}
