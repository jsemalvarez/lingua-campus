"use client";

import { useEffect, useRef, useState } from "react";
import { practiceApiError } from "./apiError";

interface PlayOptions {
    rate: number;
    /** Qué está sonando, para que la pantalla lo marque (`"frase"`, `"w3"`…). */
    key: string;
    /** Directo con la voz del navegador, sin pasar por el servidor: para una palabra suelta. */
    preferBrowser?: boolean;
    /**
     * Cuando termina de sonar, o cuando se corta (con `stop` o porque empezó otro
     * audio). No se llama si el audio no llegó a sonar.
     */
    onEnd?: () => void;
}

/**
 * El audio de la práctica: un solo sonido a la vez.
 *
 * `/api/practice/tts` sintetiza en el servidor o contesta 204 para usar la voz
 * del navegador, según el instituto. Después del primer 204 ya no se le pregunta:
 * va directo con la del navegador.
 */
export function usePracticeAudio(lessonPracticeId: string) {
    const [playing, setPlaying] = useState<string | null>(null);
    const contextRef = useRef<AudioContext | null>(null);
    const modeRef = useRef<"server" | "browser" | null>(null);
    /** Sube con cada audio: lo que llega de uno viejo se descarta. */
    const tokenRef = useRef(0);
    const pendingEndRef = useRef<(() => void) | null>(null);

    // Al desmontar no queda nada sonando, y lo que llegue tarde se descarta.
    useEffect(() => {
        const tokens = tokenRef;
        const context = contextRef;
        return () => {
            tokens.current++;
            window.speechSynthesis?.cancel();
            context.current?.close().catch(() => {});
        };
    }, []);

    const settle = () => {
        const onEnd = pendingEndRef.current;
        pendingEndRef.current = null;
        onEnd?.();
    };

    const stop = () => {
        tokenRef.current++;
        window.speechSynthesis?.cancel();
        contextRef.current?.close().catch(() => {});
        contextRef.current = null;
        setPlaying(null);
        settle();
    };

    /** Hace sonar `text`. Devuelve un mensaje para mostrar si no pudo, o `null`. */
    const play = async (text: string, { rate, key, preferBrowser = false, onEnd }: PlayOptions): Promise<string | null> => {
        stop();
        const token = ++tokenRef.current;
        pendingEndRef.current = onEnd ?? null;
        setPlaying(key);

        const done = () => {
            if (token !== tokenRef.current) return;
            setPlaying(null);
            settle();
        };
        const fail = (message: string) => {
            if (token !== tokenRef.current) return null;
            pendingEndRef.current = null;
            setPlaying(null);
            return message;
        };
        const withBrowser = (): boolean => {
            const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
            if (!synth) return false;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-US";
            utterance.rate = rate;
            utterance.onend = done;
            utterance.onerror = done;
            synth.speak(utterance);
            return true;
        };

        if ((preferBrowser || modeRef.current === "browser") && withBrowser()) return null;

        try {
            const res = await fetch("/api/practice/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonPracticeId, text, language: "en-US", speed: rate }),
            });
            if (token !== tokenRef.current) return null;
            if (res.status === 204) {
                modeRef.current = "browser";
                return withBrowser() ? null : fail("Este navegador no puede leer el audio en voz alta.");
            }
            if (!res.ok) return fail(await practiceApiError(res, "No se pudo reproducir el audio. Probá de nuevo."));

            modeRef.current = "server";
            const context = new AudioContext();
            contextRef.current = context;
            const decoded = await context.decodeAudioData(await res.arrayBuffer());
            if (token !== tokenRef.current) {
                context.close().catch(() => {});
                return null;
            }
            const source = context.createBufferSource();
            source.buffer = decoded;
            source.connect(context.destination);
            source.onended = () => {
                context.close().catch(() => {});
                if (contextRef.current === context) contextRef.current = null;
                done();
            };
            source.start();
            return null;
        } catch {
            return fail("No se pudo reproducir el audio. Probá de nuevo.");
        }
    };

    return { playing, play, stop };
}
