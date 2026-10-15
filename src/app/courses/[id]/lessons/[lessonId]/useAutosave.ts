"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

export type Autosave = {
    state: SaveState;
    error: string | null;
    /** Guarda ya lo pendiente. Devuelve si quedó guardado. */
    flush: () => Promise<boolean>;
};

const AUTOSAVE_DELAY_MS = 800;

/**
 * Guarda `value` un rato después de que deja de cambiar. `save` devuelve el
 * mensaje de error, o `null` si salió bien.
 *
 * Nunca hay dos guardados a la vez: el que llega mientras otro está en vuelo
 * espera y manda el valor más nuevo. Así el orden de llegada al servidor es el
 * mismo que el de escritura, y un guardado viejo no pisa a uno nuevo.
 */
export function useAutosave<T>(value: T, save: (value: T) => Promise<string | null>, enabled: boolean): Autosave {
    const serialized = JSON.stringify(value);

    // Lo último que se sabe guardado. «Pendiente» se deduce comparando contra
    // esto y no se lleva como estado aparte: así no se desincroniza, y montar dos
    // veces en desarrollo no dispara un guardado de más.
    const [savedSnapshot, setSavedSnapshot] = useState(serialized);
    const [saving, setSaving] = useState(false);
    const [savedOnce, setSavedOnce] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const latest = useRef(value);
    const saveRef = useRef(save);
    const snapshot = useRef(serialized);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inFlight = useRef<Promise<void> | null>(null);
    const failed = useRef(false);

    useEffect(() => {
        latest.current = value;
    }, [value]);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);

    const flush = useCallback(async () => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        while (inFlight.current) await inFlight.current;

        const sending = latest.current;
        const body = JSON.stringify(sending);
        if (body === snapshot.current) return !failed.current;

        setSaving(true);
        const run = (async () => {
            let message: string | null;
            try {
                message = await saveRef.current(sending);
            } catch {
                message = "No se pudo guardar. Revisá la conexión y seguí escribiendo: se vuelve a intentar.";
            }
            failed.current = message !== null;
            if (message) {
                setError(message);
            } else {
                snapshot.current = body;
                setSavedSnapshot(body);
                setSavedOnce(true);
                setError(null);
            }
            setSaving(false);
        })();
        inFlight.current = run;
        await run;
        inFlight.current = null;
        return !failed.current;
    }, []);

    useEffect(() => {
        if (!enabled || serialized === snapshot.current) return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    }, [serialized, enabled, flush]);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const state: SaveState = saving
        ? "saving"
        : error
          ? "error"
          : serialized !== savedSnapshot
            ? "pending"
            : savedOnce
              ? "saved"
              : "idle";

    return { state, error, flush };
}

export function isUnsaved(state: SaveState) {
    return state === "pending" || state === "saving";
}
