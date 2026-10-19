import { getMonthName } from "@/lib/utils";

/**
 * Todo lo de fechas del campus: cómo se leen, cuál es «hoy» y qué abarca un mes.
 *
 * **La regla.** Nada fuera de este archivo calcula «hoy», «este mes» ni los
 * límites de un período con el reloj de quien corre el código. El servidor
 * (Vercel y Postgres) está en UTC y el navegador en la zona de cada uno: a partir
 * de las 21 de Argentina el servidor ya está en mañana, y una de cada cuatro
 * asistencias de producción se carga después de esa hora. «Hoy» es el día del
 * calendario del instituto, y sale de acá.
 *
 * Fechas para mostrar, con el mismo texto en el servidor y en el navegador.
 *
 * **Dos clases de fecha en la base.**
 * - `"day"`: un día sin hora, `@db.Date` (`Lesson.date`, `Expense.date`,
 *   `MiscellaneousIncome.date`). Se guarda a medianoche UTC, así que se lee en
 *   UTC: en la zona de Argentina cae a las 21 del día anterior, y un curso de
 *   martes y jueves aparecía lunes y miércoles.
 * - `"moment"`: un instante (`Payment.date`, `createdAt`). Se muestra en hora
 *   argentina, que es donde están los institutos, y no en la del servidor (UTC
 *   en Vercel) ni en la del navegador.
 *
 * **Los nombres no salen de un idioma.** `dayjs.locale("es")` es global y lo
 * prenden algunas vistas al cargarse: en el servidor queda en español en cuanto
 * alguien abre una, y en el navegador depende de qué pantallas se cargaron. Salía
 * «oct» de un lado y «Oct» del otro, y React no podía hidratar. `Intl` en
 * castellano tampoco sirve: según la versión de ICU da «oct» u «oct.». De `Intl`
 * se toman sólo números, y los nombres salen de `getMonthName` y de la lista de
 * días de acá.
 */
export type DateKind = "day" | "moment";

/**
 * Está fijo porque hoy hay un solo instituto y es argentino. El día que haya uno
 * en otro huso, esto pasa a ser un campo de `Institute`, y todo lo que sigue lo
 * recibe por parámetro: por eso no hay otro lugar del campus que lo nombre.
 */
export const INSTITUTE_TIME_ZONE = "America/Argentina/Buenos_Aires";

const TIME_ZONE: Record<DateKind, string> = {
    day: "UTC",
    moment: INSTITUTE_TIME_ZONE,
};

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function dateParts(value: Date | string, kind: DateKind) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE[kind],
        day: "numeric",
        month: "numeric",
        year: "numeric",
    }).formatToParts(new Date(value));
    const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
    const day = part("day");
    const month = part("month");
    const year = part("year");
    return {
        day,
        month,
        year,
        weekday: WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()],
        monthName: getMonthName(month).toLowerCase(),
    };
}

export type DateStyle =
    /** 20 oct 2026 */
    | "short"
    /** 20 de octubre de 2026 */
    | "long"
    /** 20 oct */
    | "dayMonth"
    /** 20 de octubre */
    | "dayMonthLong"
    /** octubre de 2026 */
    | "monthYear"
    /** martes 20 */
    | "weekdayDay"
    /** oct */
    | "month"
    /** 05 */
    | "dayNumber"
    /** 20/10 */
    | "numericDayMonth"
    /** 20/10/26 */
    | "numeric"
    /** 20/10/2026 */
    | "numericFull";

const pad = (n: number) => String(n).padStart(2, "0");

export function formatDate(value: Date | string, kind: DateKind, style: DateStyle): string {
    const { day, month, year, weekday, monthName } = dateParts(value, kind);
    const shortMonth = monthName.slice(0, 3);
    switch (style) {
        case "short": return `${day} ${shortMonth} ${year}`;
        case "long": return `${day} de ${monthName} de ${year}`;
        case "dayMonth": return `${day} ${shortMonth}`;
        case "dayMonthLong": return `${day} de ${monthName}`;
        case "monthYear": return `${monthName} de ${year}`;
        case "weekdayDay": return `${weekday} ${day}`;
        case "month": return shortMonth;
        case "dayNumber": return pad(day);
        case "numericDayMonth": return `${pad(day)}/${pad(month)}`;
        case "numeric": return `${pad(day)}/${pad(month)}/${String(year).slice(-2)}`;
        case "numericFull": return `${pad(day)}/${pad(month)}/${year}`;
    }
}

// ─── Hoy, el mes y sus límites ───────────────────────────────────────────────

/** `YYYY-MM-DD` de un día (`@db.Date` o medianoche UTC). */
export function dayKey(day: Date | string): string {
    return new Date(day).toISOString().slice(0, 10);
}

/** El día de `YYYY-MM-DD`, como lo guarda Postgres un `@db.Date`: medianoche UTC. */
export function dayFromKey(key: string): Date {
    return new Date(`${key}T00:00:00.000Z`);
}

/** `YYYY-MM-DD` de hoy en el calendario del instituto. Sirve también de `value` de un `<input type="date">`. */
export function instituteTodayKey(now: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: INSTITUTE_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
}

/**
 * Hoy en el calendario del instituto, a medianoche UTC: se compara directo con
 * un `@db.Date` (`date: { gte: instituteToday() }` son las clases de hoy en
 * adelante, también a las 23). Sus `getUTC*` dan el día, el mes y el año de hoy.
 */
export function instituteToday(now: Date = new Date()): Date {
    return dayFromKey(instituteTodayKey(now));
}

export interface YearMonth {
    year: number;
    /** 1 a 12, como `Fee.month`. */
    month: number;
}

/** El mes en curso en el calendario del instituto. */
export function instituteMonth(now: Date = new Date()): YearMonth {
    const today = instituteToday(now);
    return { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
}

/** El mes `n` meses después (o antes, con `n` negativo). */
export function addMonths({ year, month }: YearMonth, n: number): YearMonth {
    const index = year * 12 + (month - 1) + n;
    return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/**
 * Los días de un mes, a medianoche UTC. Para filtrar un `@db.Date` va
 * `{ gte: first, lte: last }`; para una columna con hora que guarda días, como
 * `Transaction.date` (FIN-34), `{ gte: first, lt: next }`.
 *
 * No se arma con `dayjs(...).startOf("month")`: eso da la medianoche de la zona
 * de quien lo corre, y Prisma recorta a fecha el límite de un `@db.Date`. En el
 * navegador, el 30/09 a las 23:59 de Argentina es el 01/10 en UTC, y la
 * liquidación de septiembre traía las clases del 1° de octubre.
 */
export function monthDays({ year, month }: YearMonth): { first: Date; last: Date; next: Date } {
    return {
        first: new Date(Date.UTC(year, month - 1, 1)),
        last: new Date(Date.UTC(year, month, 0)),
        next: new Date(Date.UTC(year, month, 1)),
    };
}

/** Los días de un año, como `monthDays`. */
export function yearDays(year: number): { first: Date; last: Date; next: Date } {
    return {
        first: new Date(Date.UTC(year, 0, 1)),
        last: new Date(Date.UTC(year, 11, 31)),
        next: new Date(Date.UTC(year + 1, 0, 1)),
    };
}

/**
 * Edad cumplida en un día. Las dos fechas se leen como días (en UTC): el
 * nacimiento está guardado a medianoche UTC, a la de Argentina (03:00) o a la
 * del horario de verano de 2007-2009 (02:00), y en UTC las tres dan el día
 * correcto; leído en hora argentina, el primer grupo cae un día antes.
 */
export function ageOn(birthDate: Date | string, on: Date = instituteToday()): number {
    const birth = new Date(birthDate);
    let age = on.getUTCFullYear() - birth.getUTCFullYear();
    const monthDiff = on.getUTCMonth() - birth.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && on.getUTCDate() < birth.getUTCDate())) age--;
    return age;
}

/**
 * El instante en que empezó hoy en el instituto: su medianoche (03:00 UTC en
 * Argentina). Para ventanas de tiempo que tienen que cortar con el día del
 * instituto y no con el de UTC, como la cuota diaria de IA.
 */
export function instituteDayStart(now: Date = new Date()): Date {
    const zone = new Intl.DateTimeFormat("en-US", { timeZone: INSTITUTE_TIME_ZONE, timeZoneName: "longOffset" })
        .formatToParts(now)
        .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
    const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(zone);
    const offsetMinutes = match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0)) : 0;
    return new Date(instituteToday(now).getTime() - offsetMinutes * 60_000);
}
