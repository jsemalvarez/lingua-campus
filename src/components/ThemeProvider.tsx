"use client";

import * as React from "react";

// Tres estados posibles: sistema, claro o oscuro
export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextValue {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    // El tema efectivo que se está aplicando (resuelto)
    resolvedTheme: "light" | "dark";
}

export const ThemeContext = React.createContext<ThemeContextValue>({
    mode: "system",
    setMode: () => { },
    resolvedTheme: "light",
});

export function useTheme() {
    return React.useContext(ThemeContext);
}

const STORAGE_KEY = "lingua-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = React.useState<ThemeMode>("system");
    const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

    // Al montar, leer from localStorage (si hay)
    React.useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (stored && ["system", "light", "dark"].includes(stored)) {
            setModeState(stored);
        }
    }, []);

    // Resolver el tema efectivo y aplicar la clase "dark" al <html>
    React.useEffect(() => {
        const root = document.documentElement;

        const applyTheme = (isDark: boolean) => {
            if (isDark) {
                root.classList.add("dark");
                setResolvedTheme("dark");
            } else {
                root.classList.remove("dark");
                setResolvedTheme("light");
            }
        };

        if (mode === "dark") {
            applyTheme(true);
        } else if (mode === "light") {
            applyTheme(false);
        } else {
            // system: seguir prefers-color-scheme
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            applyTheme(mq.matches);

            // Escuchar cambios del sistema
            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            mq.addEventListener("change", handler);
            return () => mq.removeEventListener("change", handler);
        }
    }, [mode]);

    const setMode = React.useCallback((newMode: ThemeMode) => {
        // Agregar clase para transición suave al cambiar tema
        const root = document.documentElement;
        root.classList.add("theme-transition");
        setModeState(newMode);
        localStorage.setItem(STORAGE_KEY, newMode);
        // Remover la clase después de que termine la transición
        window.setTimeout(() => root.classList.remove("theme-transition"), 300);
    }, []);

    return (
        <ThemeContext.Provider value={{ mode, setMode, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
