"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const ANCHO = 1440;
const ALTO = 810;

/**
 * El escenario de las placas: el dibujo es de 1440 × 810, como el lienzo, y se
 * escala entero a la pantalla —o a la ventana que se comparte— sin reacomodarse.
 * Lo que sobra a los costados va del color de fondo de la placa.
 *
 * Con el teclado: flechas para pasar, Escape para salir.
 */
export function Escenario({
    fondo,
    anterior,
    siguiente,
    salir,
    children,
}: {
    fondo: string;
    anterior: string | null;
    siguiente: string | null;
    salir: string;
    children: ReactNode;
}) {
    const router = useRouter();
    const [escala, setEscala] = useState<number | null>(null);

    useLayoutEffect(() => {
        const medir = () => setEscala(Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO));
        medir();
        window.addEventListener("resize", medir);
        return () => window.removeEventListener("resize", medir);
    }, []);

    useEffect(() => {
        const alApretar = (e: KeyboardEvent) => {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            if ((e.key === "ArrowRight" || e.key === "PageDown") && siguiente) router.push(siguiente, { scroll: false });
            else if ((e.key === "ArrowLeft" || e.key === "PageUp") && anterior) router.push(anterior, { scroll: false });
            else if (e.key === "Escape") router.push(salir);
        };
        window.addEventListener("keydown", alApretar);
        return () => window.removeEventListener("keydown", alApretar);
    }, [router, anterior, siguiente, salir]);

    return (
        <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: fondo }}>
            <div
                className="shrink-0"
                style={{
                    width: ANCHO,
                    height: ALTO,
                    transform: `scale(${escala ?? 1})`,
                    // Hasta medir la ventana no se muestra: evita el salto del
                    // primer cuadro a tamaño real.
                    visibility: escala === null ? "hidden" : "visible",
                }}
            >
                {children}
            </div>
        </div>
    );
}
