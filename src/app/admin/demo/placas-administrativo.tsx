import type { ReactNode } from "react";
import {
    BarChart3,
    Check,
    ChevronDown,
    CircleAlert,
    Download,
    Mail,
    Percent,
    Printer,
    QrCode,
    Receipt,
    ShieldCheck,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { Adornos, Celular, Columna, DosColumnas, Dibujo, Fuerte, InstitutoDemo, Marco, SUAVE, Subrayado, Tarjeta } from "./piezas";

// Lo administrativo va sobre tinta, como la sección Gestión de la landing: el
// cliente nota que cambió de módulo.

// ─── 4 · La pre-inscripción ──────────────────────────────────────────────────

function Campo({ etiqueta, valor, activo = false, desplegable = false }: { etiqueta?: string; valor: string; activo?: boolean; desplegable?: boolean }) {
    return (
        <span className="flex flex-col gap-[3px]">
            {etiqueta && <span className="text-[10.5px] font-bold">{etiqueta}</span>}
            <span
                className={`flex h-[30px] items-center justify-between rounded-[10px] px-[11px] text-[12px] ${
                    activo ? "border-2 border-lc-violet font-bold" : "border-[1.5px] border-[#e2dff0]"
                }`}
            >
                {valor}
                {desplegable && <ChevronDown size={13} strokeWidth={2.4} className="text-lc-subtle" />}
            </span>
        </span>
    );
}

export function Placa4({ enlace }: { enlace: string | null }) {
    return (
        <Marco numero={4} tono="tinta" enlace={enlace}>
            <DosColumnas>
                <Columna
                    tinta
                    etiqueta="Administrativo"
                    tonoEtiqueta="sky"
                    titulo={
                        <>
                            La pre-inscripción, desde la web del <Subrayado>instituto.</Subrayado>
                        </>
                    }
                    frase="La familia completa el formulario desde el celular y al instituto le llega un mail. Los datos quedan cargados para pasarlo a alumno."
                    puntos={[
                        { marca: 1, tono: "violet", texto: "La familia completa el formulario" },
                        { marca: 2, tono: "yellow", texto: "Al instituto le llega un mail" },
                        { marca: 3, tono: "green", texto: "La secretaría lo activa como alumno" },
                        { marca: 4, tono: "coral", texto: "El alumno entra con su DNI" },
                    ]}
                    nota={
                        <>
                            <Fuerte tinta>Si alguien que ya estaba se vuelve a anotar</Fuerte>, no se duplica la ficha: el mail lo avisa.
                        </>
                    }
                />

                <Dibujo>
                    <Adornos tinta circulo={{ left: 110, top: 70 }} puntos={{ left: 470, top: 500 }} estrella={{ left: 20, top: 40 }} />

                    <Celular left={70} top={20} giro={-3} sobreTinta>
                        <InstitutoDemo />
                        <span className="font-display text-[19px] font-extrabold tracking-[-0.02em]">Inscripción</span>
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-lc-subtle">Paso 01 · Datos del estudiante</span>
                        <Campo etiqueta="Nombre completo *" valor="Tomás Ferreyra" />
                        <Campo etiqueta="DNI *" valor="71234567" activo />
                        <Campo etiqueta="Fecha de nacimiento" valor="14/03/2019" />
                        <Campo etiqueta="Nivel a cursar" valor="Kids 2" desplegable />
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-lc-subtle">Paso 02 · Responsable</span>
                        <Campo valor="Carolina Ferreyra · Madre" />
                        <span className="mt-auto flex h-[42px] items-center justify-center rounded-full bg-lc-violet text-[13px] font-bold text-white">
                            Enviar inscripción
                        </span>
                    </Celular>

                    <Tarjeta oscura style={{ left: 330, top: 80, width: 280, transform: "rotate(3deg)" }} className="gap-2.5 p-[18px]">
                        <span className="flex items-center gap-[9px]">
                            <span className={`flex h-[30px] w-[30px] items-center justify-center rounded-full ${SUAVE.violet}`}>
                                <Mail size={15} strokeWidth={2.2} />
                            </span>
                            <span className="text-[11.5px] text-lc-subtle">Para: Instituto Demo · ahora</span>
                        </span>
                        <span className="font-display text-[16px] font-extrabold leading-[1.25] tracking-[-0.01em]">Nueva preinscripción: Tomás Ferreyra</span>
                        <span className="text-[12.5px] leading-[1.5] text-lc-text">Tomás Ferreyra completó el formulario de inscripción.</span>
                        <span className="self-start rounded-full bg-lc-violet px-3.5 py-2 text-[12px] font-bold text-white">Ver las preinscripciones</span>
                    </Tarjeta>

                    <Tarjeta oscura style={{ left: 360, top: 330, width: 250, transform: "rotate(-2deg)" }} className="gap-2.5 p-4">
                        <span className="flex items-center justify-between">
                            <span className="font-display text-[15px] font-extrabold">Pre-inscriptos</span>
                            <span className={`rounded-full px-[9px] py-[3px] text-[11px] font-bold ${SUAVE.yellow}`}>2</span>
                        </span>
                        {[
                            { iniciales: "TF", nombre: "Tomás Ferreyra", detalle: "Kids 2 · hoy", tono: SUAVE.sky, primero: true },
                            { iniciales: "RL", nombre: "Renata Luna", detalle: "Teens 1 · ayer", tono: SUAVE.coral, primero: false },
                        ].map((p) => (
                            <span
                                key={p.nombre}
                                className={`flex items-center gap-[9px] rounded-[14px] px-2.5 py-[9px] ${p.primero ? "bg-lc-cream" : "border-[1.5px] border-[#ece6da]"}`}
                            >
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${p.tono}`}>{p.iniciales}</span>
                                <span className="flex flex-col gap-px">
                                    <span className="text-[12.5px] font-bold">{p.nombre}</span>
                                    <span className="text-[10.5px] text-lc-subtle">{p.detalle}</span>
                                </span>
                                <span
                                    className={`ml-auto rounded-full px-2.5 py-[5px] text-[11px] font-bold ${
                                        p.primero ? "bg-lc-green-deep text-white" : "border-[1.5px] border-[#e2dff0]"
                                    }`}
                                >
                                    Activar
                                </span>
                            </span>
                        ))}
                    </Tarjeta>
                </Dibujo>
            </DosColumnas>
        </Marco>
    );
}

// ─── 5 · Asistencia por clase ────────────────────────────────────────────────

const ESTADOS = ["P", "A", "T", "J"] as const;
const COLOR_DEL_ESTADO: Record<(typeof ESTADOS)[number], string> = {
    P: "bg-lc-green text-white",
    A: "bg-lc-coral text-lc-ink",
    T: "bg-lc-yellow text-lc-ink",
    J: "bg-[#3a8dff] text-white",
};

const LISTA: { iniciales: string; nombre: string; tono: string; estado: (typeof ESTADOS)[number]; qr?: string }[] = [
    { iniciales: "SR", nombre: "Sofía Romero", tono: SUAVE.coral, estado: "P", qr: "17:58" },
    { iniciales: "JM", nombre: "Joaquín Méndez", tono: SUAVE.sky, estado: "P", qr: "18:01" },
    { iniciales: "VS", nombre: "Valentina Sosa", tono: SUAVE.yellow, estado: "T" },
    { iniciales: "MR", nombre: "Mateo Ruiz", tono: SUAVE.green, estado: "A" },
    { iniciales: "LP", nombre: "Lucía Paz", tono: SUAVE.violet, estado: "J" },
];

export function Placa5({ enlace }: { enlace: string | null }) {
    return (
        <Marco numero={5} tono="tinta" enlace={enlace}>
            <DosColumnas>
                <Columna
                    tinta
                    etiqueta="Administrativo"
                    tonoEtiqueta="sky"
                    titulo={
                        <>
                            Asistencia por clase, con lista o con <Subrayado>el QR.</Subrayado>
                        </>
                    }
                    frase="El docente pasa lista desde el celular, o cada alumno escanea su código al entrar al aula. La familia la ve en el portal, clase por clase."
                    puntos={[
                        { marca: 1, tono: "violet", texto: "Cada alumno tiene su código QR" },
                        { marca: 2, tono: "yellow", texto: "Lo escanea al entrar al aula" },
                        { marca: 3, tono: "green", texto: "El docente completa la lista" },
                        { marca: 4, tono: "coral", texto: "La familia la ve en el portal" },
                    ]}
                    nota={
                        <>
                            <Fuerte tinta>Presente, ausente, tarde o justificado</Fuerte>, alumno por alumno.
                        </>
                    }
                />

                <Dibujo>
                    <Adornos tinta circulo={{ left: 110, top: 70 }} puntos={{ left: 20, top: 500 }} estrella={{ left: 566, top: 24 }} />

                    <Tarjeta oscura style={{ left: 10, top: 40, width: 320, transform: "rotate(-2deg)" }} className="gap-2.5 rounded-[26px] p-5">
                        <span className="flex flex-col gap-0.5 pb-1">
                            <span className="text-[11.5px] text-lc-subtle">Martes · Teens 2</span>
                            <span className="font-display text-[19px] font-extrabold tracking-[-0.02em]">Asistencia</span>
                        </span>
                        {LISTA.map((a) => (
                            <span key={a.nombre} className="flex items-center gap-2 border-t border-[#f1ebe0] py-[7px]">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${a.tono}`}>{a.iniciales}</span>
                                <span className="flex flex-col gap-px">
                                    <span className="text-[12.5px] font-bold">{a.nombre}</span>
                                    {a.qr ? (
                                        <span className="flex items-center gap-[3px] text-[10px] font-bold text-lc-green-deep">
                                            <QrCode size={10} strokeWidth={2.6} />
                                            con QR, {a.qr}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-lc-subtle">por lista</span>
                                    )}
                                </span>
                                <span className="ml-auto flex gap-[3px]">
                                    {ESTADOS.map((e) => (
                                        <span
                                            key={e}
                                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold ${
                                                e === a.estado ? COLOR_DEL_ESTADO[e] : "bg-[#f6f1e9] text-lc-subtle"
                                            }`}
                                        >
                                            {e}
                                        </span>
                                    ))}
                                </span>
                            </span>
                        ))}
                        <span className="mt-1 flex h-10 items-center justify-center rounded-full bg-lc-violet text-[13px] font-bold text-white">Guardar asistencia</span>
                    </Tarjeta>

                    <div className="absolute left-[340px] top-[110px] h-[380px] w-[270px] rotate-[3deg] rounded-[30px] bg-[#0f0c24] p-3 shadow-[0_36px_80px_rgba(0,0,0,0.4),0_0_0_1.5px_rgba(255,255,255,0.12)]">
                        <div className="flex h-full flex-col items-center gap-3 rounded-[20px] bg-lc-cream px-[18px] py-[22px] text-center text-lc-ink">
                            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-lc-subtle">Teens 2 · Escaneá tu código</span>
                            <span className="relative mt-2 flex h-[132px] w-[132px] items-center justify-center">
                                <span className="absolute inset-0 rounded-[22px] border-[3px] border-dashed border-lc-green opacity-60" />
                                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-lc-green text-white shadow-[0_14px_30px_rgba(45,184,138,0.4)]">
                                    <Check size={50} strokeWidth={3} />
                                </span>
                            </span>
                            <span className="font-display text-[32px] font-extrabold leading-none tracking-[-0.03em]">¡Presente!</span>
                            <span className="text-[14px] leading-[1.45] text-lc-text">A darlo todo hoy, Sofía.</span>
                            <span className="mt-auto rounded-full bg-white px-3 py-1.5 text-[11.5px] font-bold text-lc-green-deep">Clase de las 18:00</span>
                        </div>
                    </div>
                </Dibujo>
            </DosColumnas>
        </Marco>
    );
}

// ─── 6 · Sabés quién debe ────────────────────────────────────────────────────

function Chip({ tono, children }: { tono: string; children: ReactNode }) {
    return <span className={`rounded-full px-[7px] py-px text-[10px] font-bold ${tono}`}>{children}</span>;
}

const DEUDORES: { alumno: string; concepto: ReactNode; debe: string }[] = [
    {
        alumno: "Joaquín Méndez · Teens 2",
        concepto: (
            <>
                Cuota del mes <Chip tono={SUAVE.yellow}>pagó $ 20.000 de $ 48.000</Chip>
            </>
        ),
        debe: "$ 28.000",
    },
    {
        alumno: "Martina López · Kids 3",
        concepto: (
            <>
                Cuotas <Chip tono={SUAVE.coral}>2 meses</Chip>
            </>
        ),
        debe: "$ 90.000",
    },
    {
        alumno: "Valentina Sosa · Teens 2",
        concepto: (
            <>
                Cuota del mes <Chip tono={SUAVE.violet}>beca 50 %</Chip>
            </>
        ),
        debe: "$ 24.000",
    },
    { alumno: "Bruno Díaz · Adults B1", concepto: "Cuota del mes", debe: "$ 52.000" },
    { alumno: "Lucas Herrera · First Certificate", concepto: "Derecho de examen", debe: "$ 40.000" },
];

export function Placa6({ enlace }: { enlace: string | null }) {
    return (
        <Marco numero={6} tono="tinta" enlace={enlace}>
            <DosColumnas>
                <Columna
                    tinta
                    etiqueta="Administrativo"
                    tonoEtiqueta="sky"
                    titulo={
                        <>
                            Sabés quién debe y <Subrayado>cuánto.</Subrayado>
                        </>
                    }
                    frase="Cuotas, matrículas y exámenes en el mismo lugar. Cada pago tiene su recibo, y los que deben salen en un reporte listo para imprimir."
                    puntos={[
                        { marca: <Wallet size={17} strokeWidth={2.2} />, tono: "green", texto: "Cuotas, matrículas y exámenes" },
                        { marca: <Percent size={17} strokeWidth={2.4} />, tono: "yellow", texto: "Pagos parciales, recargos y becas" },
                        { marca: <Receipt size={17} strokeWidth={2.2} />, tono: "violet", texto: "Recibo en PDF de cada pago" },
                        { marca: <CircleAlert size={17} strokeWidth={2.4} />, tono: "coral", texto: "Reporte de deudores para imprimir" },
                    ]}
                    nota={
                        <>
                            <Fuerte tinta>Las familias ven en el portal</Fuerte> qué está pago y qué no.
                        </>
                    }
                />

                <Dibujo>
                    <Adornos tinta circulo={{ left: 140, top: 50 }} puntos={{ left: 10, top: 500 }} estrella={{ left: 570, top: 16 }} />

                    <div className="absolute left-0 top-[50px] w-[432px] -rotate-[1.5deg] overflow-hidden rounded-[26px] bg-white text-lc-ink shadow-[0_36px_80px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between px-[22px] pb-3.5 pt-5">
                            <span className="flex items-center gap-2.5">
                                <span className="font-display text-[22px] font-extrabold tracking-[-0.02em]">Deudores</span>
                                <span className="rounded-full bg-[#f6f1e9] px-[11px] py-[5px] text-[12px] font-bold text-lc-text">Este mes</span>
                            </span>
                            <span className="flex items-center gap-1.5 rounded-full border-[1.5px] border-[#e2dff0] px-[13px] py-2 text-[12px] font-bold">
                                <Printer size={13} strokeWidth={2.2} />
                                Imprimir
                            </span>
                        </div>
                        <div className={`mx-[22px] mb-3.5 flex items-center gap-3 rounded-2xl px-[15px] py-[13px] ${SUAVE.coral}`}>
                            <CircleAlert size={20} strokeWidth={2.2} />
                            <span className="text-[13px] font-bold">23 alumnos deben</span>
                            <span className="ml-auto font-display text-[22px] font-extrabold tracking-[-0.02em]">$ 1.338.000</span>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-2.5 bg-[#fcf8f2] px-[22px] py-[9px] text-[10.5px] font-bold uppercase tracking-[0.06em] text-lc-subtle">
                            <span>Alumno · Concepto</span>
                            <span className="text-right">Debe</span>
                        </div>
                        {DEUDORES.map((d, i) => (
                            <div
                                key={d.alumno}
                                className={`grid grid-cols-[minmax(0,1fr)_86px] items-center gap-2.5 border-t border-[#f4efe8] px-[22px] pt-2.5 ${i === DEUDORES.length - 1 ? "pb-[18px]" : "pb-2.5"}`}
                            >
                                <span className="flex flex-col gap-0.5">
                                    <span className="text-[13px] font-bold">{d.alumno}</span>
                                    <span className="flex items-center gap-1.5 text-[11.5px] text-lc-subtle">{d.concepto}</span>
                                </span>
                                <span className="text-right text-[13.5px] font-bold text-lc-coral-deep">{d.debe}</span>
                            </div>
                        ))}
                    </div>

                    <div className="absolute left-[412px] top-[200px] flex w-[208px] rotate-[4deg] flex-col gap-[9px] rounded-[22px] bg-lc-cream p-[18px] text-lc-ink shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
                        <span className="flex items-center gap-[7px] text-[11.5px] font-bold text-lc-green-deep">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lc-green text-white">
                                <Check size={11} strokeWidth={3.2} />
                            </span>
                            Recibo de pago
                        </span>
                        <span className="flex flex-col gap-px">
                            <span className="text-[13px] font-bold">Sofía Romero</span>
                            <span className="text-[11px] text-lc-subtle">Cuota del mes · Teens 2</span>
                        </span>
                        <span className="font-display text-[28px] font-extrabold leading-none tracking-[-0.03em]">$ 48.000</span>
                        <span className="text-[11px] text-lc-subtle">Transferencia</span>
                        <span className="flex items-center gap-1.5 self-start rounded-full bg-lc-violet px-3 py-[7px] text-[11.5px] font-bold text-white">
                            <Download size={12} strokeWidth={2.4} />
                            Descargar PDF
                        </span>
                    </div>
                </Dibujo>
            </DosColumnas>
        </Marco>
    );
}

// ─── 7 · La caja del mes ─────────────────────────────────────────────────────

const MOVIMIENTOS: { concepto: string; medio: string; fecha: string; monto: string; tipo: "entra" | "sale" | "anulado" }[] = [
    { concepto: "Cuota · Sofía Romero", medio: "Transferencia", fecha: "24/09", monto: "+ $ 48.000", tipo: "entra" },
    { concepto: "Sueldo · Laura Gómez", medio: "Honorarios docentes", fecha: "23/09", monto: "− $ 520.000", tipo: "sale" },
    { concepto: "Cuota · Joaquín Méndez", medio: "Efectivo", fecha: "22/09", monto: "+ $ 48.000", tipo: "anulado" },
    { concepto: "Cuota · Joaquín Méndez", medio: "Efectivo", fecha: "22/09", monto: "+ $ 48.000", tipo: "entra" },
    { concepto: "Derecho de examen · Lucas Herrera", medio: "Transferencia", fecha: "21/09", monto: "+ $ 40.000", tipo: "entra" },
];

export function Placa7({ enlace }: { enlace: string | null }) {
    return (
        <Marco numero={7} tono="tinta" enlace={enlace}>
            <DosColumnas>
                <Columna
                    tinta
                    etiqueta="Administrativo"
                    tonoEtiqueta="sky"
                    titulo={
                        <>
                            Cuánto entró y cuánto <Subrayado>te queda.</Subrayado>
                        </>
                    }
                    frase="Gastos, sueldos de los docentes y la rentabilidad de cada mes, sin armar planillas."
                    puntos={[
                        { marca: <TrendingUp size={17} strokeWidth={2.4} />, tono: "sky", texto: "Lo cobrado en el mes" },
                        { marca: <Wallet size={17} strokeWidth={2.2} />, tono: "coral", texto: "Gastos y sueldos de los docentes" },
                        { marca: <BarChart3 size={17} strokeWidth={2.4} />, tono: "green", texto: "La rentabilidad de cada mes" },
                        { marca: <ShieldCheck size={17} strokeWidth={2.2} />, tono: "violet", texto: "Todo queda registrado" },
                    ]}
                    nota={
                        <>
                            <Fuerte tinta>Un pago mal cargado se anula, no se borra</Fuerte>: queda a la vista, y la caja no pierde nada.
                        </>
                    }
                />

                <Dibujo>
                    <span className="absolute left-[420px] top-[-10px] h-[230px] w-[230px] rounded-full bg-[rgba(255,216,196,0.16)]" />
                    <svg viewBox="0 0 24 24" fill="#ffc53d" className="absolute left-[576px] top-[520px] h-10 w-10">
                        <path d="M12 1.5 14.6 9.4 23 12 14.6 14.6 12 22.5 9.4 14.6 1 12 9.4 9.4Z" />
                    </svg>

                    <div className="absolute left-0 top-[30px] w-[610px] overflow-hidden rounded-[26px] bg-white text-lc-ink shadow-[0_40px_90px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between px-[22px] pb-3.5 pt-5">
                            <span className="flex items-center gap-2.5">
                                <span className="font-display text-[22px] font-extrabold tracking-[-0.02em]">Pagos</span>
                                <span className="rounded-full bg-[#f6f1e9] px-[11px] py-[5px] text-[12px] font-bold text-lc-text">Septiembre</span>
                            </span>
                            <span className="rounded-full bg-lc-violet px-[15px] py-[9px] text-[12.5px] font-bold text-white">Registrar pago</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 px-[22px] pb-3.5">
                            {[
                                ["Cobrado en el mes", "$ 4.812.000", SUAVE.sky],
                                ["Gastos operativos", "$ 3.516.000", SUAVE.coral],
                                ["Rentabilidad neta", "+ $ 1.296.000", SUAVE.green],
                            ].map(([etiqueta, valor, tono]) => (
                                <span key={etiqueta} className={`flex flex-col gap-[5px] rounded-2xl px-3.5 py-[13px] ${tono}`}>
                                    <span className="text-[11.5px] font-bold">{etiqueta}</span>
                                    <span className="font-display text-[21px] font-extrabold tracking-[-0.02em]">{valor}</span>
                                </span>
                            ))}
                        </div>
                        <div className="flex flex-col gap-[7px] px-[22px] pb-4">
                            <span className="flex justify-between text-[12px]">
                                <span className="font-bold">Progreso de cobro</span>
                                <span className="text-lc-subtle">$ 4.812.000 de $ 6.150.000</span>
                            </span>
                            <span className="block h-2.5 overflow-hidden rounded-full bg-[#f1ece4]">
                                <span className="block h-full w-[78%] rounded-full bg-lc-violet" />
                            </span>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_60px_110px] gap-2.5 bg-[#fcf8f2] px-[22px] py-[9px] text-[10.5px] font-bold uppercase tracking-[0.06em] text-lc-subtle">
                            <span>Concepto</span>
                            <span>Fecha</span>
                            <span className="text-right">Monto</span>
                        </div>
                        {MOVIMIENTOS.map((m, i) => (
                            <div
                                key={i}
                                className={`grid grid-cols-[minmax(0,1fr)_60px_110px] items-center gap-2.5 border-t border-[#f4efe8] px-[22px] pt-2.5 ${
                                    i === MOVIMIENTOS.length - 1 ? "pb-[18px]" : "pb-2.5"
                                } ${m.tipo === "anulado" ? "bg-[#fffaf5]" : ""}`}
                            >
                                <span className="flex flex-col gap-0.5">
                                    <span className="flex items-center gap-[7px]">
                                        <span className={`text-[13px] font-bold ${m.tipo === "anulado" ? "text-lc-subtle line-through" : ""}`}>{m.concepto}</span>
                                        {m.tipo === "anulado" && (
                                            <span className="rounded-full border-[1.5px] border-lc-coral-deep px-[7px] py-px text-[9.5px] font-extrabold text-lc-coral-deep">ANULADO</span>
                                        )}
                                    </span>
                                    <span className="text-[11px] text-lc-subtle">{m.medio}</span>
                                </span>
                                <span className="text-[12px] text-lc-subtle">{m.fecha}</span>
                                <span
                                    className={`text-right text-[13px] font-bold ${
                                        m.tipo === "anulado" ? "text-lc-subtle line-through" : m.tipo === "sale" ? "text-lc-coral-deep" : "text-lc-green-deep"
                                    }`}
                                >
                                    {m.monto}
                                </span>
                            </div>
                        ))}
                    </div>
                </Dibujo>
            </DosColumnas>
        </Marco>
    );
}
