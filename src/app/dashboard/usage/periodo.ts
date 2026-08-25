import { getMonthName } from "@/lib/utils";

/**
 * El período de la zona de actividad del panel de uso (FEAT-11).
 *
 * **Vive acá y no en la pantalla porque ya no lo resuelve una sola.** El panel y
 * los cuatro listados que salen de sus números tienen que recortar el mismo
 * rango: si el mosaico dice "7 clases sin parte" sobre un recorte y la lista que
 * abre usa otro, no hay forma de que el administrador sepa cuál de los dos
 * números es el bueno.
 */

export interface Periodo {
    clave: string;
    desde: Date;
    hasta: Date;
    etiqueta: string;
}

/** Un día de calendario del instituto, a medianoche UTC. */
function diaUTC(anio: number, mes1: number, dia: number): Date {
    return new Date(Date.UTC(anio, mes1 - 1, dia));
}

export function formatoCorto(d: Date): string {
    return `${d.getUTCDate()} ${getMonthName(d.getUTCMonth() + 1).slice(0, 3).toLowerCase()}`;
}

/**
 * Resuelve el período elegido. El `hasta` nunca pasa de hoy: una clase que
 * todavía no se dictó no puede estar sin parte de asistencia.
 */
export function resolverPeriodo(p: string | undefined, hoy: Date): Periodo {
    const mes = /^(\d{4})-(\d{2})$/.exec(p ?? "");

    if (mes) {
        const anio = Number(mes[1]);
        const m = Number(mes[2]);
        if (m >= 1 && m <= 12) {
            const desde = diaUTC(anio, m, 1);
            const finDeMes = new Date(Date.UTC(anio, m, 0));
            return {
                clave: `${mes[1]}-${mes[2]}`,
                desde,
                hasta: finDeMes > hoy ? hoy : finDeMes,
                etiqueta: `${getMonthName(m)} ${anio}`,
            };
        }
    }

    const desde = new Date(hoy);
    desde.setUTCDate(desde.getUTCDate() - 29);
    return {
        clave: "30d",
        desde,
        hasta: hoy,
        etiqueta: `${formatoCorto(desde)} – ${formatoCorto(hoy)}`,
    };
}

/**
 * Los años que se pueden elegir: desde el de la clase más vieja hasta el
 * actual, del más nuevo al más viejo. Se calculan de los datos y no de una
 * ventana fija, así el instituto puede mirar todo su historial y la lista crece
 * de a un año en vez de acumular meses.
 */
export function aniosDisponibles(primeraClase: Date | null, hoy: Date): number[] {
    const actual = hoy.getUTCFullYear();
    const primero = primeraClase ? primeraClase.getUTCFullYear() : actual;
    const anios: number[] = [];
    for (let a = actual; a >= Math.min(primero, actual); a--) anios.push(a);
    return anios;
}

/**
 * El filtro de clases del período, tal como lo arma el panel. Lo comparten los
 * mosaicos y sus listados por el mismo motivo que el período.
 */
export function clasesDelPeriodo(instituteId: string, periodo: Periodo) {
    return {
        status: "ACTIVE" as const,
        date: { gte: periodo.desde, lte: periodo.hasta },
        course: { instituteId },
    };
}
