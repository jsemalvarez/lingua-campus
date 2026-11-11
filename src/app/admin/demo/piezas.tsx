import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import { LogoMark } from "@/components/landing/lingua/LogoMark";
import { PESTANA_EN_VIVO, RECORRIDO, TOTAL, hrefDePlaca } from "./recorrido";

// Las piezas que comparten las diez placas. Son las del lienzo aprobado, en la
// estética Cálida de la landing: crema para lo pedagógico y el cierre, tinta
// para lo administrativo, como la sección Gestión de la landing.

export type Tono = "crema" | "tinta";
export type Suave = "violet" | "yellow" | "green" | "coral" | "sky";

export const FONDO: Record<Tono, string> = { crema: "#fff6ea", tinta: "#1f1a3d" };

export const SUAVE: Record<Suave, string> = {
    violet: "bg-lc-violet-soft text-lc-violet-deep",
    yellow: "bg-lc-yellow-soft text-lc-yellow-deep",
    green: "bg-lc-green-soft text-lc-green-deep",
    coral: "bg-lc-coral-soft text-lc-coral-deep",
    sky: "bg-lc-sky-soft text-lc-sky-deep",
};

export const SALIR = "/admin/institutes";

// ─── El marco: cabecera y pie ────────────────────────────────────────────────

export function Marco({
    numero,
    tono,
    enlace,
    pie,
    children,
}: {
    numero: number;
    tono: Tono;
    /** La URL de «Verlo en vivo»; `null` si el instituto demo no está armado. */
    enlace?: string | null;
    /** Un pie distinto del de siempre: la portada y la última placa. */
    pie?: ReactNode;
    children: ReactNode;
}) {
    const tinta = tono === "tinta";
    return (
        <div
            className={`relative flex h-[810px] w-[1440px] flex-col overflow-hidden px-16 py-9 font-body ${
                tinta ? "bg-lc-ink text-white" : "bg-lc-cream text-lc-ink"
            }`}
        >
            <Cabecera numero={numero} tinta={tinta} />
            <div className="relative flex min-h-0 grow flex-col">{children}</div>
            <footer
                className={`relative z-10 flex items-center justify-between border-t-[1.5px] border-dashed pt-[22px] ${
                    tinta ? "border-white/[0.16]" : "border-[#e8dcc8]"
                }`}
            >
                {pie ?? <PieDeSiempre numero={numero} tinta={tinta} enlace={enlace ?? null} />}
            </footer>
        </div>
    );
}

function Cabecera({ numero, tinta }: { numero: number; tinta: boolean }) {
    const paso = RECORRIDO[numero];
    return (
        <header className="relative z-10 flex h-12 items-center justify-between">
            <div className="flex items-center gap-[11px]">
                <LogoMark size={40} variant={tinta ? "ink" : "cream"} />
                <span className="font-display text-[20px] font-extrabold tracking-[-0.02em]">Lingua Campus</span>
            </div>

            {numero > 0 && (
                <div className="flex items-center gap-3.5">
                    <span className={`text-[13.5px] font-bold ${tinta ? "text-lc-lavender" : "text-lc-text"}`}>
                        {paso.seccion} · {numero} de {TOTAL}
                    </span>
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        {Array.from({ length: TOTAL }, (_, i) => {
                            const hecha = i < numero;
                            const actual = i === numero - 1;
                            const color = hecha ? (tinta ? "bg-lc-violet-light" : "bg-lc-violet") : tinta ? "bg-white/[0.16]" : "bg-[#e8dcc8]";
                            return <span key={i} className={`h-2.5 rounded-full ${actual ? "w-[30px]" : "w-2.5"} ${color}`} />;
                        })}
                    </div>
                </div>
            )}

            <Link
                href={SALIR}
                className={`flex h-11 items-center gap-2 rounded-full border-[1.5px] px-[18px] text-[14px] font-bold transition-colors ${
                    tinta
                        ? "border-white/[0.22] text-white hover:bg-white/[0.08]"
                        : "border-[#e2dff0] bg-white text-lc-ink hover:border-lc-violet"
                }`}
            >
                <X size={16} strokeWidth={2.2} aria-hidden="true" />
                Salir de la demo
            </Link>
        </header>
    );
}

function PieDeSiempre({ numero, tinta, enlace }: { numero: number; tinta: boolean; enlace: string | null }) {
    const paso = RECORRIDO[numero];
    const siguiente = numero < TOTAL ? RECORRIDO[numero + 1] : null;
    return (
        <>
            <div className="flex items-center gap-4">
                {paso.enVivo &&
                    (enlace ? (
                        <>
                            <a
                                href={enlace}
                                target={PESTANA_EN_VIVO}
                                className={`flex h-[54px] items-center gap-[9px] rounded-full bg-lc-violet px-[26px] text-[16.5px] font-bold text-white transition-colors hover:bg-lc-violet-deep ${
                                    tinta
                                        ? "shadow-[0_0_0_1.5px_rgba(255,255,255,0.18),0_10px_24px_rgba(0,0,0,0.3)]"
                                        : "shadow-[0_10px_24px_rgba(75,62,240,0.25)]"
                                }`}
                            >
                                Verlo en vivo
                                <ArrowUpRight size={18} strokeWidth={2.2} aria-hidden="true" />
                            </a>
                            <span className={`text-[14.5px] ${tinta ? "text-lc-lavender" : "text-lc-text"}`}>{paso.enVivo.leyenda}</span>
                        </>
                    ) : (
                        <span className={`text-[14.5px] ${tinta ? "text-lc-lavender" : "text-lc-text"}`}>
                            Para verlo en vivo, falta armar el instituto demo con <code>scripts/instituto-demo.js</code>.
                        </span>
                    ))}
            </div>
            <div className="flex items-center gap-2.5">
                {numero > 0 && (
                    <Link
                        href={hrefDePlaca(numero - 1)}
                        scroll={false}
                        className={`flex h-12 items-center gap-2 rounded-full px-[18px] text-[15px] font-bold ${tinta ? "text-white" : "text-lc-ink"}`}
                    >
                        <ArrowLeft size={17} strokeWidth={2.2} aria-hidden="true" />
                        Anterior
                    </Link>
                )}
                {siguiente && (
                    <Link
                        href={hrefDePlaca(numero + 1)}
                        scroll={false}
                        className={`flex h-12 items-center gap-2.5 rounded-full border-[1.5px] px-[22px] text-[15px] font-bold transition-colors ${
                            tinta
                                ? "border-white/[0.22] bg-white/[0.06] text-white hover:bg-white/[0.12]"
                                : "border-[#e2dff0] bg-white text-lc-ink hover:border-lc-violet"
                        }`}
                    >
                        <span className={`font-medium ${tinta ? "text-lc-lavender" : "text-lc-text"}`}>Siguiente:</span>
                        {siguiente.titulo}
                        <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
                    </Link>
                )}
            </div>
        </>
    );
}

// ─── La columna de texto ─────────────────────────────────────────────────────

/** El subrayado a mano de los títulos, como en la landing. */
export function Subrayado({ children }: { children: ReactNode }) {
    return (
        <span className="relative whitespace-nowrap">
            {children}
            <svg
                viewBox="0 0 200 16"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[10px] left-[-2%] h-[18px] w-[104%]"
            >
                <path d="M3 11 C 55 3, 120 2, 197 8" stroke="#ff6b4a" strokeWidth={5} strokeLinecap="round" />
            </svg>
        </span>
    );
}

export function Etiqueta({ tono, children }: { tono: Suave; children: ReactNode }) {
    return <span className={`self-start rounded-full px-[15px] py-[7px] text-[13.5px] font-bold ${SUAVE[tono]}`}>{children}</span>;
}

export type Punto = { marca: ReactNode; tono: Suave; texto: ReactNode; detalle?: string };

/**
 * Lo de la izquierda de cada placa: etiqueta, título, frase, cuatro puntos y
 * una nota al pie.
 */
export function Columna({
    tinta = false,
    etiqueta,
    tonoEtiqueta,
    titulo,
    frase,
    puntos,
    nota,
}: {
    tinta?: boolean;
    etiqueta: string;
    tonoEtiqueta: Suave;
    titulo: ReactNode;
    frase: ReactNode;
    puntos: Punto[];
    nota?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-6">
            <Etiqueta tono={tonoEtiqueta}>{etiqueta}</Etiqueta>
            <h1 className="m-0 font-display text-[66px] font-extrabold leading-[1.01] tracking-[-0.04em]">{titulo}</h1>
            <p className={`m-0 mt-1.5 max-w-[560px] text-[20.5px] leading-[1.55] ${tinta ? "text-lc-lavender" : "text-lc-text"}`}>{frase}</p>
            <ul className="m-0 mt-1.5 grid max-w-[610px] list-none grid-cols-2 gap-3 p-0">
                {puntos.map((p, i) => (
                    <li
                        key={i}
                        className={`flex items-center gap-3 rounded-[20px] px-4 py-[13px] ${tinta ? "bg-white/[0.07]" : "bg-white"}`}
                    >
                        <span
                            className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full font-display text-[16px] font-extrabold ${SUAVE[p.tono]}`}
                        >
                            {p.marca}
                        </span>
                        <span className="flex flex-col gap-px">
                            <span className="text-[16px] font-bold leading-[1.3]">{p.texto}</span>
                            {p.detalle && <span className={`text-[13.5px] ${tinta ? "text-lc-lavender" : "text-lc-subtle"}`}>{p.detalle}</span>}
                        </span>
                    </li>
                ))}
            </ul>
            {nota && <p className={`m-0 text-[15.5px] leading-[1.5] ${tinta ? "text-lc-lavender" : "text-lc-text"}`}>{nota}</p>}
        </div>
    );
}

/** Lo destacado de la nota al pie. */
export function Fuerte({ tinta = false, children }: { tinta?: boolean; children: ReactNode }) {
    return <strong className={tinta ? "text-white" : "text-lc-ink"}>{children}</strong>;
}

/** La grilla de siempre: texto a la izquierda y el dibujo a la derecha. */
export function DosColumnas({ children }: { children: ReactNode }) {
    return <main className="grid grow grid-cols-[minmax(0,1fr)_620px] items-center gap-14">{children}</main>;
}

// ─── El dibujo ───────────────────────────────────────────────────────────────

export function Dibujo({ alto = 580, children }: { alto?: number; children: ReactNode }) {
    return (
        <div aria-hidden="true" className="relative" style={{ height: alto }}>
            {children}
        </div>
    );
}

/** El círculo durazno, los puntitos y la estrella de fondo. */
export function Adornos({
    tinta = false,
    circulo,
    puntos,
    estrella,
}: {
    tinta?: boolean;
    circulo: { left: number; top: number; size?: number };
    puntos: { left: number; top: number };
    estrella: { left: number; top: number };
}) {
    const size = circulo.size ?? 440;
    return (
        <>
            <span
                className={`absolute rounded-full ${tinta ? "bg-[rgba(255,216,196,0.16)]" : "bg-lc-peach"}`}
                style={{ left: circulo.left, top: circulo.top, width: size, height: size }}
            />
            <span
                className="absolute h-[84px] w-[140px] bg-[length:16px_16px] opacity-[0.18]"
                style={{
                    left: puntos.left,
                    top: puntos.top,
                    backgroundImage: `radial-gradient(${tinta ? "#ffffff" : "#1f1a3d"} 1.6px, transparent 1.8px)`,
                }}
            />
            <svg viewBox="0 0 24 24" fill="#ffc53d" className="absolute h-10 w-10" style={{ left: estrella.left, top: estrella.top }}>
                <path d="M12 1.5 14.6 9.4 23 12 14.6 14.6 12 22.5 9.4 14.6 1 12 9.4 9.4Z" />
            </svg>
        </>
    );
}

/** Un celular de 266 × 540, girado. */
export function Celular({
    left,
    top,
    giro,
    sobreTinta = false,
    children,
}: {
    left: number;
    top: number;
    giro: number;
    sobreTinta?: boolean;
    children: ReactNode;
}) {
    return (
        <div
            className={`absolute h-[540px] w-[266px] rounded-[46px] p-2.5 ${
                sobreTinta
                    ? "bg-[#0f0c24] shadow-[0_36px_80px_rgba(0,0,0,0.4),0_0_0_1.5px_rgba(255,255,255,0.12)]"
                    : "bg-lc-ink shadow-[0_36px_80px_rgba(31,26,61,0.28)]"
            }`}
            style={{ left, top, transform: `rotate(${giro}deg)` }}
        >
            <div className="flex h-full flex-col gap-3 rounded-[37px] bg-white px-[15px] pb-[15px] pt-[26px] text-lc-ink">{children}</div>
        </div>
    );
}

/** Una tarjeta blanca flotante, girada. */
export function Tarjeta({
    style,
    className = "",
    oscura = false,
    children,
}: {
    style: CSSProperties;
    className?: string;
    oscura?: boolean;
    children: ReactNode;
}) {
    return (
        <div
            className={`absolute flex flex-col rounded-[22px] text-lc-ink ${
                oscura ? "shadow-[0_24px_60px_rgba(0,0,0,0.35)]" : "shadow-[0_20px_50px_rgba(31,26,61,0.16)]"
            } bg-white ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}

/** El encabezado del instituto adentro de los celulares. */
export function InstitutoDemo({ chico = false }: { chico?: boolean }) {
    return (
        <span className="flex items-center gap-2">
            <span
                className={`flex items-center justify-center rounded-[9px] bg-lc-green font-extrabold text-white ${chico ? "h-[27px] w-[27px] text-[12px]" : "h-[27px] w-[27px] text-[12px]"}`}
            >
                D
            </span>
            <span className="text-[13px] font-bold">Instituto Demo</span>
        </span>
    );
}
