import Link from "next/link";
import { ArrowRight, Check, Download, FileText, Headphones, MessageCircle, Mic, Sparkles } from "lucide-react";
import { RECORRIDO, hrefDePlaca } from "./recorrido";
import {
    Adornos,
    Celular,
    Columna,
    DosColumnas,
    Dibujo,
    Etiqueta,
    Fuerte,
    InstitutoDemo,
    Marco,
    SUAVE,
    Subrayado,
    Tarjeta,
    type Suave,
} from "./piezas";

// ─── 0 · Portada ─────────────────────────────────────────────────────────────

const GRUPOS: { etiqueta: string | null; tono: Suave; placas: number[] }[] = [
    { etiqueta: "Pedagógico", tono: "yellow", placas: [1, 2, 3] },
    { etiqueta: "Administrativo", tono: "sky", placas: [4, 5, 6, 7] },
    { etiqueta: null, tono: "coral", placas: [8, 9] },
];

export function Portada() {
    return (
        <Marco
            numero={0}
            tono="crema"
            pie={
                <>
                    <div className="flex items-center gap-3">
                        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white text-lc-green-deep">
                            <Check size={18} strokeWidth={2.4} aria-hidden="true" />
                        </span>
                        <span className="text-[15.5px] text-lc-text">
                            Lo usa <Fuerte>Modern English School</Fuerte>, de Mar del Plata, con más de 200 alumnos.
                        </span>
                    </div>
                    <Link
                        href={hrefDePlaca(1)}
                        scroll={false}
                        className="flex h-14 items-center gap-2.5 rounded-full bg-lc-violet px-7 text-[17px] font-bold text-white shadow-[0_12px_28px_rgba(75,62,240,0.28)] transition-colors hover:bg-lc-violet-deep"
                    >
                        Empezar el recorrido
                        <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
                    </Link>
                </>
            }
        >
            <main className="grid grow grid-cols-[minmax(0,1fr)_560px] items-center gap-16">
                <div className="flex flex-col gap-[26px]">
                    <Etiqueta tono="violet">Para institutos de inglés</Etiqueta>
                    <h1 className="m-0 font-display text-[72px] font-extrabold leading-none tracking-[-0.045em]">
                        Tus alumnos pueden practicar con IA lo que vieron <Subrayado>en clase.</Subrayado>
                    </h1>
                    <p className="m-0 mt-2 max-w-[600px] text-[21px] leading-[1.55] text-lc-text">
                        Con el tema de cada clase, la IA arma la práctica y el docente la revisa. Y la administración del instituto
                        está en el mismo sistema.
                    </p>
                </div>

                <div className="relative h-[610px]">
                    <Adornos circulo={{ left: 150, top: 40, size: 460 }} puntos={{ left: -30, top: 500 }} estrella={{ left: 508, top: 4 }} />
                    <nav
                        aria-label="El recorrido de hoy"
                        className="absolute left-5 top-[30px] flex w-[500px] -rotate-[1.5deg] flex-col gap-[18px] rounded-[30px] bg-white px-[30px] pb-[26px] pt-7 shadow-[0_30px_70px_rgba(31,26,61,0.16)]"
                    >
                        <span className="font-display text-[24px] font-extrabold tracking-[-0.02em]">El recorrido de hoy</span>
                        {GRUPOS.map((grupo, g) => (
                            <div key={g} className={`flex flex-col gap-[9px] ${g > 0 ? "border-t-[1.5px] border-dashed border-[#e8dcc8] pt-4" : ""}`}>
                                {grupo.etiqueta && (
                                    <span className={`self-start rounded-full px-[11px] py-1 text-[12px] font-bold ${SUAVE[grupo.tono]}`}>{grupo.etiqueta}</span>
                                )}
                                {grupo.placas.map((n) => (
                                    <Link
                                        key={n}
                                        href={hrefDePlaca(n)}
                                        scroll={false}
                                        className="flex items-center gap-[11px] rounded-full text-[15.5px] font-bold text-lc-ink transition-colors hover:text-lc-violet-deep"
                                    >
                                        <span
                                            className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full font-display text-[13px] font-extrabold ${
                                                n === 8 ? SUAVE.coral : n === 9 ? SUAVE.green : "bg-lc-cream"
                                            }`}
                                        >
                                            {n}
                                        </span>
                                        {RECORRIDO[n].titulo}
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </nav>
                </div>
            </main>
        </Marco>
    );
}

// ─── 1 · Armar la clase ──────────────────────────────────────────────────────

export function Placa1({ enlace }: { enlace: string | null }) {
    return (
        <Marco numero={1} tono="crema" enlace={enlace}>
            <DosColumnas>
                <Columna
                    etiqueta="Pedagógico"
                    tonoEtiqueta="yellow"
                    titulo={
                        <>
                            Armar la clase, con ideas <Subrayado>listas para usar.</Subrayado>
                        </>
                    }
                    frase="El docente elige el tema y las palabras. Para cada momento de la clase recibe ideas con el contenido listo, pensadas para la edad del grupo."
                    puntos={[
                        { marca: 1, tono: "violet", texto: "Inicio", detalle: "Para entrar en tema" },
                        { marca: 2, tono: "yellow", texto: "Actividad principal", detalle: "El centro de la clase" },
                        { marca: 3, tono: "green", texto: "Cierre", detalle: "Corto y con energía" },
                        { marca: 4, tono: "coral", texto: "Tarea", detalle: "Para seguir en casa" },
                    ]}
                    nota={
                        <>
                            Con <Fuerte>Kahoot, Wordwall, Quizlet y Canva</Fuerte>, y una guía para usarlas por primera vez.
                        </>
                    }
                />

                <Dibujo alto={590}>
                    <Adornos circulo={{ left: 130, top: 60 }} puntos={{ left: 470, top: 500 }} estrella={{ left: 10, top: 20 }} />

                    <div className="absolute left-10 top-[30px] flex w-[470px] -rotate-2 flex-col gap-[15px] rounded-[28px] bg-white p-[22px] pb-5 shadow-[0_30px_70px_rgba(31,26,61,0.18)]">
                        <div className="flex items-start justify-between gap-3">
                            <span className="flex flex-col gap-[3px]">
                                <span className="text-[12px] text-lc-subtle">Martes · Teens 2 · 13 a 15 años</span>
                                <span className="font-display text-[20px] font-extrabold tracking-[-0.02em]">Unit 7 · Ordering food</span>
                            </span>
                            <span className={`shrink-0 rounded-full px-[11px] py-1.5 text-[12px] font-bold ${SUAVE.green}`}>40 de 60 min</span>
                        </div>

                        <div className="flex flex-col gap-[7px]">
                            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-lc-subtle">Las palabras de hoy</span>
                            <div className="flex flex-wrap gap-1.5">
                                {["menu", "waiter", "bill", "to order", "I'd like…", "dessert"].map((p) => (
                                    <span key={p} className={`rounded-full px-[11px] py-[5px] text-[12.5px] font-bold ${SUAVE.violet}`}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                            <span className="flex h-8 items-center justify-center rounded-full bg-lc-violet text-[12px] font-bold text-white">Inicio</span>
                            {["Principal", "Cierre", "Tarea"].map((m) => (
                                <span key={m} className="flex h-8 items-center justify-center gap-[5px] rounded-full bg-lc-cream text-[12px] font-bold">
                                    <span className="h-[7px] w-[7px] rounded-full bg-lc-green-deep" />
                                    {m}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-col gap-[9px] rounded-[20px] border-2 border-lc-violet bg-lc-cream p-[15px]">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lc-violet text-white">
                                    <Check size={12} strokeWidth={3} />
                                </span>
                                <span className="font-display text-[16px] font-extrabold tracking-[-0.01em]">Trivia: ¿qué se dice en el café?</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {["Kahoot", "10 min", "Toda la clase"].map((t) => (
                                    <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <span className="text-[12.5px] leading-[1.45] text-lc-text">
                                Seis preguntas rápidas con las palabras de hoy, con la respuesta correcta ya marcada.
                            </span>
                            <span className="flex items-center gap-[7px] self-start rounded-full bg-lc-violet px-3.5 py-2 text-[12px] font-bold text-white">
                                <Download size={13} strokeWidth={2.4} />
                                Descargar para Kahoot
                            </span>
                        </div>

                        {[
                            ["Role play: el mozo y el turista", "De a dos · 8 min"],
                            ["Wordwall: uní la palabra", "Cada uno · 8 min"],
                        ].map(([titulo, detalle]) => (
                            <div key={titulo} className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#ece6da] px-3.5 py-[11px]">
                                <span className="h-5 w-5 rounded-full border-2 border-[#d9d3ec]" />
                                <span className="text-[13.5px] font-bold">{titulo}</span>
                                <span className="ml-auto text-[11.5px] text-lc-subtle">{detalle}</span>
                            </div>
                        ))}
                    </div>

                    <div className="absolute left-[400px] top-[360px] flex w-[220px] rotate-[4deg] flex-col gap-[9px] rounded-[22px] bg-lc-ink p-[15px] text-white shadow-[0_24px_54px_rgba(31,26,61,0.3)]">
                        <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-lc-lavender">Pregunta 1 de 6</span>
                        <span className="font-display text-[15px] font-extrabold leading-[1.25]">How do you ask for the bill?</span>
                        <span className="flex items-center gap-[7px] rounded-xl bg-lc-green px-2.5 py-[7px] text-[12px] font-bold text-lc-ink">
                            <Check size={12} strokeWidth={3} />
                            Could we have the bill, please?
                        </span>
                        <span className="rounded-xl bg-white/10 px-2.5 py-[7px] text-[12px]">Give me the menu.</span>
                        <span className="rounded-xl bg-white/10 px-2.5 py-[7px] text-[12px]">I&apos;d like a table.</span>
                    </div>
                </Dibujo>
            </DosColumnas>
        </Marco>
    );
}

// ─── 2 · De la clase de hoy a la práctica en casa ────────────────────────────

export function Placa2({ enlace }: { enlace: string | null }) {
    const modos = [
        { nombre: "Speaking", detalle: "6 frases para decir", tono: "bg-lc-coral-soft text-lc-coral-deep", icono: <Mic size={20} strokeWidth={2.2} /> },
        { nombre: "Listening", detalle: "Un audio con preguntas", tono: "bg-lc-sky-soft text-lc-sky-deep", icono: <Headphones size={20} strokeWidth={2.2} /> },
        { nombre: "Chat", detalle: "Pedir en un café, en inglés", tono: "bg-lc-green-soft text-lc-green-deep", icono: <MessageCircle size={20} strokeWidth={2.2} /> },
    ];
    return (
        <Marco numero={2} tono="crema" enlace={enlace}>
            <DosColumnas>
                <Columna
                    etiqueta="Pedagógico"
                    tonoEtiqueta="yellow"
                    titulo={
                        <>
                            De la clase de hoy a la práctica <Subrayado>en casa.</Subrayado>
                        </>
                    }
                    frase="El docente no la arma desde cero, y a los alumnos no les llega nada sin que el docente lo revise."
                    puntos={[
                        { marca: 1, tono: "violet", texto: "El docente carga la clase" },
                        { marca: 2, tono: "yellow", texto: "La IA arma la práctica" },
                        { marca: 3, tono: "green", texto: "El docente la revisa y la publica" },
                        { marca: 4, tono: "coral", texto: "El alumno practica desde el celular" },
                    ]}
                />

                <Dibujo>
                    <Adornos circulo={{ left: 100, top: 70 }} puntos={{ left: 40, top: 480 }} estrella={{ left: 560, top: 30 }} />

                    <Celular left={300} top={20} giro={3}>
                        <InstitutoDemo />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-display text-[20px] font-extrabold tracking-[-0.02em]">Hola, Sofía</span>
                            <span className="text-[11.5px] text-lc-subtle">Tu práctica de esta semana</span>
                        </div>
                        <div className="flex flex-col gap-[3px] rounded-[18px] bg-lc-cream px-[13px] py-3">
                            <span className="text-[10.5px] text-lc-subtle">Martes · Teens 2</span>
                            <span className="font-display text-[15px] font-extrabold tracking-[-0.01em]">Unit 7 · Ordering food</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {modos.map((m) => (
                                <div key={m.nombre} className={`flex items-center gap-2.5 rounded-2xl p-2.5 ${m.tono}`}>
                                    {m.icono}
                                    <span className="flex flex-col gap-px">
                                        <span className="text-[13.5px] font-bold">{m.nombre}</span>
                                        <span className="text-[10.5px] text-lc-ink">{m.detalle}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                        <span className="mt-auto flex h-[42px] items-center justify-center rounded-full bg-lc-violet text-[13px] font-bold text-white">
                            Empezar a practicar
                        </span>
                    </Celular>

                    <Tarjeta style={{ left: 30, top: 120, width: 250, transform: "rotate(-4deg)" }} className="gap-3 p-4">
                        <div className="flex items-center gap-2">
                            <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold ${SUAVE.sky}`}>LG</span>
                            <span className="text-[12px] font-bold">Miss Laura</span>
                            <span className="ml-auto text-[10.5px] text-lc-subtle">Docente</span>
                        </div>
                        <span className="flex items-center gap-[7px] self-start rounded-full bg-lc-violet px-3.5 py-2 text-[12.5px] font-bold text-white">
                            <Sparkles size={13} strokeWidth={2} />
                            Generar práctica
                        </span>
                        <div className="flex flex-col gap-2 text-[12.5px]">
                            {[
                                ["#ff6b4a", "Speaking", "6 frases"],
                                ["#3a8dff", "Listening", "con preguntas"],
                                ["#2db88a", "Chat", "un mozo"],
                            ].map(([color, modo, detalle]) => (
                                <span key={modo} className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                                    <span className="font-bold">{modo}</span>
                                    <span className="ml-auto text-lc-subtle">{detalle}</span>
                                </span>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 border-t-[1.5px] border-dashed border-[#e8dcc8] pt-2.5">
                            <span className="rounded-full border-[1.5px] border-[#e2dff0] px-3 py-1.5 text-[12px] font-bold">Editar</span>
                            <span className="rounded-full bg-lc-green-deep px-3 py-1.5 text-[12px] font-bold text-white">Publicada</span>
                        </div>
                    </Tarjeta>
                </Dibujo>
            </DosColumnas>
        </Marco>
    );
}

// ─── 3 · El boletín, firmado en el celular ───────────────────────────────────

export function Placa3({ enlace }: { enlace: string | null }) {
    return (
        <Marco numero={3} tono="crema" enlace={enlace}>
            <DosColumnas>
                <Columna
                    etiqueta="Pedagógico"
                    tonoEtiqueta="yellow"
                    titulo={
                        <>
                            El boletín, firmado en el <Subrayado>celular.</Subrayado>
                        </>
                    }
                    frase="Cada informe lleva la firma del docente y la de la dirección. La familia lo lee en el celular y lo firma con el dedo."
                    puntos={[
                        { marca: 1, tono: "violet", texto: "El docente carga las notas y firma" },
                        { marca: 2, tono: "yellow", texto: "La dirección las revisa y firma" },
                        { marca: 3, tono: "green", texto: "La familia lo firma con el dedo" },
                        { marca: 4, tono: "coral", texto: "El instituto ve las firmas, curso por curso" },
                    ]}
                    nota={
                        <>
                            <Fuerte>Si una nota cambia después de firmada</Fuerte>, queda a la vista.
                        </>
                    }
                />

                <Dibujo>
                    <Adornos circulo={{ left: 100, top: 70 }} puntos={{ left: 40, top: 480 }} estrella={{ left: 560, top: 30 }} />

                    <Celular left={300} top={20} giro={3}>
                        <InstitutoDemo />
                        <div className="flex items-center gap-2.5">
                            <span className={`flex h-[38px] w-[38px] items-center justify-center rounded-full font-display text-[16px] font-extrabold ${SUAVE.coral}`}>S</span>
                            <span className="flex flex-col gap-px">
                                <span className="font-display text-[15px] font-extrabold tracking-[-0.01em]">Sofía Romero</span>
                                <span className="text-[11px] text-lc-subtle">Teens 2 · Miss Laura</span>
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 rounded-[18px] bg-lc-cream p-[13px]">
                            <span className="flex items-center gap-[7px]">
                                <FileText size={15} strokeWidth={2.2} className="text-lc-violet-deep" />
                                <span className="font-display text-[14px] font-extrabold">Informe · 2.º trimestre</span>
                            </span>
                            {[
                                ["Speaking", "Very good", SUAVE.green],
                                ["Listening", "Excellent", SUAVE.violet],
                                ["Writing", "Good", SUAVE.yellow],
                            ].map(([cat, nota, tono]) => (
                                <span key={cat} className="flex items-center justify-between text-[12px]">
                                    <span>{cat}</span>
                                    <span className={`rounded-full px-[9px] py-0.5 font-bold ${tono}`}>{nota}</span>
                                </span>
                            ))}
                            <span className="text-[11px] italic leading-[1.5] text-lc-text">“Sofía participa mucho y ya se anima a hablar sin leer.”</span>
                            <span className="flex flex-col gap-1 border-t border-[#efe6d8] pt-2 text-[10.5px] font-bold text-lc-green-deep">
                                <span className="flex items-center gap-[5px]">
                                    <Check size={12} strokeWidth={3} />
                                    Firmado por Laura Gómez, docente
                                </span>
                                <span className="flex items-center gap-[5px]">
                                    <Check size={12} strokeWidth={3} />
                                    Revisado por la dirección
                                </span>
                            </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-lc-subtle">Tu firma</span>
                            <span className="flex h-[62px] items-center justify-center rounded-[14px] border-2 border-dashed border-[#d9d3ec]">
                                <svg width="140" height="42" viewBox="0 0 150 46" fill="none">
                                    <path
                                        d="M6 34 C 16 8, 26 44, 38 24 S 56 10, 66 30 S 88 40, 98 20 S 120 26, 144 22"
                                        stroke="#1f1a3d"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                        </div>
                        <span className="mt-auto flex h-[42px] items-center justify-center rounded-full bg-lc-violet text-[13px] font-bold text-white">Firmar</span>
                    </Celular>

                    <Tarjeta style={{ left: 20, top: 110, width: 262, transform: "rotate(-4deg)" }} className="gap-3 p-[18px]">
                        <span className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-bold">Firmas de los informes</span>
                            <span className="text-[11px] text-lc-subtle">Teens 2 · 2.º trimestre</span>
                        </span>
                        <span className="flex items-baseline gap-[7px]">
                            <span className="font-display text-[34px] font-extrabold leading-none tracking-[-0.03em]">14 de 18</span>
                            <span className="text-[12px] text-lc-text">familias firmaron</span>
                        </span>
                        <span className="block h-[9px] overflow-hidden rounded-full bg-[#f1ebe0]">
                            <span className="block h-full w-[78%] rounded-full bg-lc-green" />
                        </span>
                        <div className="flex flex-col gap-[7px] border-t-[1.5px] border-dashed border-[#e8dcc8] pt-2.5 text-[12px]">
                            {[
                                ["bg-lc-violet", "Docente"],
                                ["bg-lc-yellow", "Dirección"],
                            ].map(([color, quien]) => (
                                <span key={quien} className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${color}`} />
                                    <span className="font-bold">{quien}</span>
                                    <span className="ml-auto font-bold text-lc-green-deep">Firmó</span>
                                </span>
                            ))}
                        </div>
                    </Tarjeta>
                </Dibujo>
            </DosColumnas>
        </Marco>
    );
}
