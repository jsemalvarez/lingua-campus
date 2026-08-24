"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * El selector de período del panel de uso (FEAT-11).
 *
 * **Un solo reloj.** "Últimos 30 días" no es un modo aparte: es una opción más
 * del mismo control que el mes, y todos los mosaicos de la zona de actividad
 * obedecen lo que esté elegido. Si convivieran una ventana móvil y un mes
 * calendario en la misma pantalla, sería el problema de los dos relojes que ya
 * arrastran los KPI de finanzas.
 *
 * **Mes y año separados, y no una lista de meses.** Una sola lista crece con el
 * tiempo: doce opciones el primer año, treinta y seis al tercero. Partido, el
 * mes son siempre doce y el año crece de a uno.
 *
 * Va por la URL y no por estado del cliente, al revés que el filtro de
 * deudores: acá el período cambia lo que el servidor **agrega**, no lo que se
 * filtra de una lista ya traída. De paso el período queda en el enlace.
 */
export function PeriodSelector({
    valor,
    anios,
    anioActual,
    mesActual,
}: {
    valor: string;
    /** Años con datos, del más nuevo al más viejo. */
    anios: number[];
    anioActual: number;
    /** Mes en curso, 1-12. Acota los meses ofrecidos del año actual. */
    mesActual: number;
}) {
    const router = useRouter();

    // Sin esto el cambio de período es mudo: la pantalla se queda mostrando los
    // números del mes anterior mientras el servidor recalcula, y no hay forma de
    // saber si el clic tomó.
    const [cargando, iniciar] = useTransition();

    const esRolling = valor === "30d";
    const [anioSel, mesSel] = esRolling
        ? [anioActual, mesActual]
        : valor.split("-").map(Number);

    // `scroll: false` es lo que evita que la pantalla salte al encabezado cada
    // vez que se cambia de mes: el período no cambia de página, cambia lo que
    // muestra la que ya se está mirando.
    const irA = (p: string) =>
        iniciar(() => router.push(`/dashboard/usage?p=${p}`, { scroll: false }));

    const dosDigitos = (n: number) => String(n).padStart(2, "0");

    /** Un mes futuro no tiene nada que mostrar, así que no se ofrece. */
    const mesDisponible = (mes: number, anio: number) => anio < anioActual || mes <= mesActual;

    const elegirMes = (mes: number) => irA(`${anioSel}-${dosDigitos(mes)}`);

    const elegirAnio = (anio: number) => {
        // Al saltar a un año donde el mes elegido todavía no existe, se cae al
        // último disponible en vez de dejar el período en el vacío.
        const mes = mesDisponible(mesSel, anio) ? mesSel : anio === anioActual ? mesActual : 12;
        irA(`${anio}-${dosDigitos(mes)}`);
    };

    const claseSelect = (activo: boolean) =>
        `appearance-none bg-transparent h-8 pl-3 pr-7 text-[13px] font-medium outline-none cursor-pointer rounded-md transition-colors ${activo ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
        }`;

    return (
        <div
            className={`flex items-center gap-2 border border-border rounded-lg p-1 bg-card transition-opacity ${cargando ? "opacity-60 pointer-events-none" : ""
                }`}
        >
            {cargando && <Loader2 size={14} className="animate-spin text-muted-foreground ml-1.5" />}
            <button
                type="button"
                onClick={() => irA("30d")}
                className={`h-8 px-3.5 rounded-md text-[13px] font-semibold transition-colors ${esRolling ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
                    }`}
            >
                Últimos 30 días
            </button>

            <div
                className={`flex items-center rounded-md transition-colors ${esRolling ? "" : "bg-primary"
                    }`}
            >
                <div className="relative flex items-center">
                    <select
                        aria-label="Mes"
                        value={mesSel}
                        onChange={(e) => elegirMes(Number(e.target.value))}
                        className={claseSelect(!esRolling)}
                    >
                        {MESES.map((nombre, i) => (
                            <option
                                key={nombre}
                                value={i + 1}
                                disabled={!mesDisponible(i + 1, anioSel)}
                                className="text-foreground bg-background"
                            >
                                {nombre}
                            </option>
                        ))}
                    </select>
                    <Flecha activo={!esRolling} />
                </div>

                <div className="relative flex items-center">
                    <select
                        aria-label="Año"
                        value={anioSel}
                        onChange={(e) => elegirAnio(Number(e.target.value))}
                        className={claseSelect(!esRolling)}
                    >
                        {anios.map((a) => (
                            <option key={a} value={a} className="text-foreground bg-background">
                                {a}
                            </option>
                        ))}
                    </select>
                    <Flecha activo={!esRolling} />
                </div>
            </div>
        </div>
    );
}

function Flecha({ activo }: { activo: boolean }) {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`absolute right-2 pointer-events-none ${activo ? "text-primary-foreground" : "text-muted-foreground"}`}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}
