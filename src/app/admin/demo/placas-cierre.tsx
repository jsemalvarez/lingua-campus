import Link from "next/link";
import type { ReactNode } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Bell,
    CalendarCheck,
    Check,
    ChevronRight,
    FileText,
    Lock,
    Megaphone,
    MessageCircle,
    PenLine,
    Receipt,
    RotateCcw,
    Sheet,
    Siren,
} from "lucide-react";
import { LogoMark } from "@/components/landing/lingua/LogoMark";
import { hrefDePlaca } from "./recorrido";
import { Adornos, Celular, Columna, DosColumnas, Dibujo, Etiqueta, Fuerte, InstitutoDemo, Marco, SUAVE, Subrayado, Tarjeta } from "./piezas";

// ─── 8 · Las familias, al tanto ──────────────────────────────────────────────

export function Placa8() {
    return (
        <Marco numero={8} tono="crema">
            <DosColumnas>
                <Columna
                    etiqueta="Familias"
                    tonoEtiqueta="coral"
                    titulo={
                        <>
                            Las familias, al tanto sin tener que <Subrayado>preguntar.</Subrayado>
                        </>
                    }
                    frase="Asistencia, notas, los temas de cada clase, el boletín y las cuotas, en un portal desde el celular."
                    puntos={[
                        { marca: <PenLine size={17} strokeWidth={2.2} />, tono: "violet", texto: "El boletín, firmado en el celular" },
                        { marca: <CalendarCheck size={17} strokeWidth={2.2} />, tono: "green", texto: "Asistencia y notas, clase por clase" },
                        { marca: <Receipt size={17} strokeWidth={2.2} />, tono: "yellow", texto: "Cuotas y recibos para descargar" },
                        { marca: <MessageCircle size={17} strokeWidth={2.2} />, tono: "sky", texto: "Mensajes con el docente" },
                    ]}
                    nota={
                        <>
                            <Fuerte>Los más chicos entran con su DNI</Fuerte>, aunque no tengan email.
                        </>
                    }
                />

                <Dibujo>
                    <Adornos circulo={{ left: 100, top: 70 }} puntos={{ left: 470, top: 490 }} estrella={{ left: 40, top: 40 }} />

                    <Celular left={300} top={20} giro={3}>
                        <div className="flex items-center justify-between">
                            <InstitutoDemo />
                            <span className="relative flex">
                                <Bell size={17} strokeWidth={2} className="text-lc-subtle" />
                                <span className="absolute -right-px -top-px h-2 w-2 rounded-full bg-lc-coral shadow-[0_0_0_2px_#ffffff]" />
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className={`flex h-[38px] w-[38px] items-center justify-center rounded-full font-display text-[16px] font-extrabold ${SUAVE.coral}`}>S</span>
                            <span className="flex flex-col gap-px">
                                <span className="font-display text-[15px] font-extrabold tracking-[-0.01em]">Sofía Romero</span>
                                <span className="text-[11px] text-lc-subtle">Teens 2 · Miss Laura</span>
                            </span>
                        </div>
                        <div className="flex flex-col gap-[5px] rounded-[18px] bg-lc-cream px-[13px] py-3">
                            <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-lc-subtle">Última clase</span>
                            <span className="font-display text-[15px] font-extrabold tracking-[-0.01em]">Unit 7 · Ordering food</span>
                            <span className={`flex items-center gap-1 self-start rounded-full px-[9px] py-[3px] text-[10.5px] font-bold ${SUAVE.green}`}>
                                <Check size={10} strokeWidth={3.2} />
                                Presente
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className={`flex flex-col gap-0.5 rounded-2xl p-[11px] ${SUAVE.green}`}>
                                <span className="text-[10.5px] font-bold">Asistencia</span>
                                <span className="font-display text-[17px] font-extrabold text-lc-ink">18 de 19</span>
                            </span>
                            <span className={`flex flex-col gap-0.5 rounded-2xl p-[11px] ${SUAVE.yellow}`}>
                                <span className="text-[10.5px] font-bold">Cuotas</span>
                                <span className="font-display text-[17px] font-extrabold text-lc-ink">Al día</span>
                            </span>
                        </div>
                        <span className={`flex items-center gap-[9px] rounded-2xl px-[11px] py-2.5 ${SUAVE.violet}`}>
                            <FileText size={16} strokeWidth={2.2} />
                            <span className="flex flex-col gap-px">
                                <span className="text-[12.5px] font-bold text-lc-ink">Nuevo informe</span>
                                <span className="text-[10.5px]">2.º trimestre</span>
                            </span>
                            <ChevronRight size={14} strokeWidth={2.4} className="ml-auto" />
                        </span>
                        <span className="flex items-center gap-[9px] rounded-2xl border-[1.5px] border-[#ece6da] px-[11px] py-2.5">
                            <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold ${SUAVE.sky}`}>LG</span>
                            <span className="flex flex-col gap-px">
                                <span className="text-[12.5px] font-bold">Miss Laura te escribió</span>
                                <span className="text-[10.5px] text-lc-subtle">Sofía estuvo genial en el…</span>
                            </span>
                            <span className="ml-auto h-2 w-2 rounded-full bg-lc-coral" />
                        </span>
                    </Celular>

                    <Tarjeta style={{ left: 30, top: 130, width: 258, transform: "rotate(-4deg)" }} className="gap-2.5 p-[17px]">
                        <span className="flex items-center gap-2">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${SUAVE.sky}`}>
                                <Megaphone size={14} strokeWidth={2.2} />
                            </span>
                            <span className="flex flex-col gap-px">
                                <span className="text-[12px] font-bold">Aviso para Teens 2</span>
                                <span className="text-[10.5px] text-lc-subtle">Miss Laura · ayer</span>
                            </span>
                        </span>
                        <span className="text-[13px] leading-[1.5]">
                            En la próxima clase repasamos para la prueba oral. Pueden practicar las frases desde el campus.
                        </span>
                    </Tarjeta>

                    <Tarjeta style={{ left: 60, top: 400, width: 214, transform: "rotate(2deg)" }} className="flex-row items-center gap-2.5 rounded-[20px] px-[15px] py-[13px]">
                        <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-full ${SUAVE.yellow}`}>
                            <Receipt size={16} strokeWidth={2.2} />
                        </span>
                        <span className="flex flex-col gap-px">
                            <span className="text-[12.5px] font-bold">Cuota del mes</span>
                            <span className="text-[11px] font-bold text-lc-green-deep">Pagada · ver recibo</span>
                        </span>
                    </Tarjeta>
                </Dibujo>
            </DosColumnas>
        </Marco>
    );
}

// ─── 9 · Empezar es simple ───────────────────────────────────────────────────

function Tarjetita({ fondo, titulo, children, dibujo }: { fondo: string; titulo: string; children: ReactNode; dibujo: ReactNode }) {
    return (
        <article className={`flex flex-col gap-[18px] rounded-[26px] px-[18px] pb-6 pt-[18px] ${fondo}`}>
            <div aria-hidden="true" className="flex h-[118px] flex-col justify-center rounded-[18px] bg-white px-3.5 py-3">
                {dibujo}
            </div>
            <div className="flex flex-col gap-2 px-1">
                <h2 className="m-0 font-display text-[21px] font-bold leading-[1.2] tracking-[-0.02em]">{titulo}</h2>
                <p className="m-0 text-[15px] leading-[1.55] text-lc-body">{children}</p>
            </div>
        </article>
    );
}

function Planilla({ children }: { children: ReactNode }) {
    return (
        <span className="flex items-center gap-1.5 rounded-[10px] border border-[#cdeedd] bg-[#f3faf6] px-2.5 py-[7px] text-[11.5px] font-bold text-lc-green-deep">
            <Sheet size={13} strokeWidth={2.2} />
            {children}
        </span>
    );
}

export function Placa9() {
    return (
        <Marco
            numero={9}
            tono="crema"
            pie={
                <>
                    <Link href={hrefDePlaca(8)} scroll={false} className="flex h-12 items-center gap-2 pr-[18px] text-[15px] font-bold text-lc-ink">
                        <ArrowLeft size={17} strokeWidth={2.2} aria-hidden="true" />
                        Anterior
                    </Link>
                    <Link
                        href={hrefDePlaca(0)}
                        scroll={false}
                        className="flex h-[54px] items-center gap-2.5 rounded-full bg-lc-violet px-[26px] text-[16.5px] font-bold text-white shadow-[0_10px_24px_rgba(75,62,240,0.25)] transition-colors hover:bg-lc-violet-deep"
                    >
                        <RotateCcw size={18} strokeWidth={2.2} aria-hidden="true" />
                        Volver al recorrido
                    </Link>
                </>
            }
        >
            <span aria-hidden="true" className="absolute left-[1056px] top-[-194px] h-[380px] w-[380px] rounded-full bg-[rgba(255,197,61,0.2)]" />
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="#ff6b4a" className="absolute left-[1186px] top-[4px] h-10 w-10">
                <path d="M12 1.5 14.6 9.4 23 12 14.6 14.6 12 22.5 9.4 14.6 1 12 9.4 9.4Z" />
            </svg>

            <main className="relative flex grow flex-col justify-center gap-6">
                <div className="flex items-end justify-between gap-12">
                    <div className="flex flex-col gap-[18px]">
                        <Etiqueta tono="sky">Sin vueltas</Etiqueta>
                        <h1 className="m-0 font-display text-[72px] font-extrabold leading-none tracking-[-0.045em]">
                            Empezar es <Subrayado>simple.</Subrayado>
                        </h1>
                    </div>
                    <p className="m-0 mb-1.5 max-w-[520px] text-[20.5px] leading-[1.55] text-lc-text">
                        Nos ocupamos de la parte pesada del cambio, para que tu equipo siga con las clases.
                    </p>
                </div>

                <div className="grid grid-cols-4 gap-[18px]">
                    <Tarjetita
                        fondo="bg-lc-violet-soft"
                        titulo="Tu campus, en minutos."
                        dibujo={
                            <div className="flex flex-col gap-[11px]">
                                <span className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-[#f6f4ff] p-[9px] text-[11px] font-semibold text-lc-text">
                                    <Lock size={13} strokeWidth={2.4} className="shrink-0 text-lc-violet-deep" />
                                    tuinstituto.lingua-campus.com.ar
                                </span>
                                <span className={`flex items-center gap-1.5 self-start rounded-full py-1.5 pl-2 pr-3 text-[12.5px] font-bold ${SUAVE.green}`}>
                                    <Check size={15} strokeWidth={2.8} />
                                    Instituto creado
                                </span>
                            </div>
                        }
                    >
                        Damos de alta tu instituto en el momento, con su propia dirección para entrar. El dominio propio llega cuando lo aprueba nic.ar.
                    </Tarjetita>
                    <Tarjetita
                        fondo="bg-lc-yellow-soft"
                        titulo="Migramos tus datos, sin costo."
                        dibujo={
                            <div className="flex items-center justify-center gap-3">
                                <span className="flex flex-col gap-1.5">
                                    <Planilla>alumnos.xlsx</Planilla>
                                    <Planilla>cuotas</Planilla>
                                </span>
                                <ArrowRight size={22} strokeWidth={2.4} className="shrink-0 text-lc-yellow-deep" />
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-lc-cream shadow-[0_6px_14px_rgba(31,26,61,0.08)]">
                                    <LogoMark size={38} />
                                </span>
                            </div>
                        }
                    >
                        Pasamos tus alumnos, cursos y cuotas desde tus planillas. El tiempo depende de cuántos datos tengas.
                    </Tarjetita>
                    <Tarjetita
                        fondo="bg-lc-green-soft"
                        titulo="Soporte real, en menos de 48 horas hábiles."
                        dibujo={
                            <div className="flex flex-col gap-2">
                                <span className="max-w-[85%] self-start rounded-[14px_14px_14px_4px] bg-[#f1eef7] px-[11px] py-[7px] text-[12.5px] leading-[1.4]">
                                    ¿Cómo registro un pago parcial? <span className="text-[10.5px] text-lc-subtle">lun 22:10</span>
                                </span>
                                <span className="max-w-[85%] self-end rounded-[14px_14px_4px_14px] bg-lc-violet px-[11px] py-[7px] text-[12.5px] leading-[1.4] text-white">
                                    ¡Buen día! Te muestro, es así: <span className="text-[10.5px] text-[#d9d4ff]">mar 9:15</span>
                                </span>
                            </div>
                        }
                    >
                        Tus consultas y los cambios que nos pidas no quedan en espera: te responde alguien del equipo.
                    </Tarjetita>
                    <Tarjetita
                        fondo="bg-lc-coral-soft"
                        titulo="Sin permanencia."
                        dibujo={
                            <div className="flex flex-col items-center gap-[11px]">
                                <div className="flex gap-2">
                                    {["Oct", "Nov"].map((mes) => (
                                        <span key={mes} className={`flex items-center gap-[5px] rounded-full px-[11px] py-[7px] text-[12.5px] font-bold ${SUAVE.coral}`}>
                                            <Check size={13} strokeWidth={2.8} />
                                            {mes}
                                        </span>
                                    ))}
                                    <span className="flex items-center rounded-full border-[1.5px] border-dashed border-[#e9b8a3] px-3 py-1.5 text-[12.5px] font-bold text-lc-subtle">
                                        Dic
                                    </span>
                                </div>
                                <span className="text-[12.5px] font-bold text-lc-body">Mes a mes</span>
                            </div>
                        }
                    >
                        Pagás mes a mes, sin contrato anual, y te das de baja cuando quieras.
                    </Tarjetita>
                </div>

                <div className="flex items-center gap-[18px] rounded-3xl bg-lc-ink px-[26px] py-[18px] text-white">
                    <span aria-hidden="true" className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full ${SUAVE.coral}`}>
                        <Siren size={22} strokeWidth={2.2} />
                    </span>
                    <p className="m-0 text-[16.5px] leading-[1.5] text-[#e6e1f5]">
                        <strong className="mr-1.5 font-display text-[19px] font-bold tracking-[-0.015em] text-white">Emergencias, todos los días.</strong>
                        Cuando surge un imprevisto que no puede esperar, lo atendemos enseguida, los fines de semana y también los feriados.
                    </p>
                </div>
            </main>
        </Marco>
    );
}
