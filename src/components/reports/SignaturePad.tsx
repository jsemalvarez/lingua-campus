"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Un punto del trazo. El tiempo va en milisegundos desde que arrancó la firma,
 * no como fecha absoluta: lo que sirve para comparar dos firmas es la dinámica
 * —el orden, la velocidad, las pausas—, no cuándo se hicieron.
 */
export type StrokePoint = { x: number; y: number; t: number };

/** Una firma es una lista de trazos, y cada trazo una lista de puntos. */
export type StrokeData = { strokes: StrokePoint[][]; width: number; height: number };

export function isEmptyStroke(data: StrokeData | null): boolean {
    return !data || data.strokes.every((s) => s.length < 2);
}

interface SignaturePadProps {
    value: StrokeData | null;
    onChange: (value: StrokeData | null) => void;
    /** Sólo dibuja el trazo recibido, sin dejar firmar. Para mostrar la anterior. */
    readOnly?: boolean;
    className?: string;
    ariaLabel?: string;
}

/**
 * Canvas para firmar con el dedo o el mouse. Guarda los puntos, no una imagen.
 *
 * Las coordenadas se guardan normalizadas de 0 a 1 sobre el tamaño del canvas,
 * para que la misma firma hecha en un celular y en una notebook se pueda
 * comparar y se pueda volver a dibujar en cualquier tamaño.
 */
export function SignaturePad({
    value,
    onChange,
    readOnly = false,
    className,
    ariaLabel = "Recuadro para firmar"
}: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const startedAt = useRef<number>(0);
    const currentStroke = useRef<StrokePoint[]>([]);

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const ratio = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
            canvas.width = width * ratio;
            canvas.height = height * ratio;
        }

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = getComputedStyle(canvas).color;

        for (const stroke of value?.strokes ?? []) {
            if (stroke.length === 0) continue;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x * width, stroke[0].y * height);
            for (const point of stroke.slice(1)) {
                ctx.lineTo(point.x * width, point.y * height);
            }
            // Un punto suelto no dibuja línea: lo marcamos igual.
            if (stroke.length === 1) ctx.lineTo(stroke[0].x * width + 0.5, stroke[0].y * height);
            ctx.stroke();
        }
    }, [value]);

    useEffect(() => {
        redraw();
        window.addEventListener("resize", redraw);
        return () => window.removeEventListener("resize", redraw);
    }, [redraw]);

    const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
            t: Math.round(performance.now() - startedAt.current)
        };
    };

    // Los trazos ya terminados, sacados de `value` al empezar cada trazo nuevo.
    // Tenerlos aparte evita duplicar el que se está dibujando: mientras el dedo
    // se mueve, lo que se emite es "los terminados más este".
    const committed = useRef<StrokePoint[][]>([]);

    const emit = (e: React.PointerEvent<HTMLCanvasElement>, strokes: StrokePoint[][]) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onChange({
            strokes,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        });
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (readOnly) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        committed.current = value?.strokes ?? [];
        if (committed.current.length === 0) startedAt.current = performance.now();
        setIsDrawing(true);
        currentStroke.current = [pointFrom(e)];
        emit(e, [...committed.current, currentStroke.current]);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (readOnly || !isDrawing) return;
        currentStroke.current = [...currentStroke.current, pointFrom(e)];
        emit(e, [...committed.current, currentStroke.current]);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (readOnly || !isDrawing) return;
        setIsDrawing(false);
        committed.current = [...committed.current, currentStroke.current];
        emit(e, committed.current);
        currentStroke.current = [];
    };

    return (
        <canvas
            ref={canvasRef}
            role="img"
            aria-label={ariaLabel}
            className={cn(
                "w-full h-40 rounded-2xl border border-dashed border-muted-foreground/40 text-foreground",
                readOnly ? "bg-muted/20" : "bg-background touch-none cursor-crosshair",
                className
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        />
    );
}
