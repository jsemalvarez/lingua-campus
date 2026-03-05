"use client";

import * as React from "react";
import { useTheme, ThemeMode } from "@/components/ThemeProvider";
import { Monitor, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemeMode; icon: React.ElementType; label: string }[] = [
    { value: "system", icon: Monitor, label: "Sistema" },
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Oscuro" },
];

interface ThemeToggleProps {
    /** "icon" muestra solo el icono activo; "full" muestra las 3 opciones */
    variant?: "icon" | "full";
    className?: string;
}

/**
 * Botón de tema con diseño mobile-first.
 * - variant="icon" → togglea entre claro/oscuro (compacto, para navbars)
 * - variant="full"  → muestra las 3 opciones en pill (para settings)
 */
export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
    const { mode, setMode, resolvedTheme } = useTheme();

    if (variant === "full") {
        return (
            <div
                className={cn(
                    "inline-flex items-center rounded-xl border border-border bg-muted/50 p-1 gap-0.5",
                    className
                )}
                role="group"
                aria-label="Seleccionar tema"
            >
                {OPTIONS.map(({ value, icon: Icon, label }) => {
                    const isActive = mode === value;
                    return (
                        <button
                            key={value}
                            onClick={() => setMode(value)}
                            title={label}
                            aria-pressed={isActive}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                isActive
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <Icon size={13} />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    // Variant "icon": cicla sistema → claro → oscuro → sistema
    const cycle: ThemeMode[] = ["system", "light", "dark"];
    const nextMode = cycle[(cycle.indexOf(mode) + 1) % cycle.length];
    const CurrentIcon = OPTIONS.find((o) => o.value === mode)?.icon ?? Monitor;

    return (
        <button
            onClick={() => setMode(nextMode)}
            aria-label={`Tema actual: ${mode}. Clic para cambiar a ${nextMode}`}
            title={`Tema: ${OPTIONS.find(o => o.value === mode)?.label}`}
            className={cn(
                "relative h-9 w-9 rounded-xl flex items-center justify-center",
                "border border-border/60 bg-background/80",
                "text-foreground/70 hover:text-foreground hover:bg-muted",
                "transition-all duration-200 hover:border-border",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                className
            )}
        >
            <CurrentIcon size={17} className="transition-transform duration-300" />
        </button>
    );
}
