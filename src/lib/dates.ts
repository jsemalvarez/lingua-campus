import { getMonthName } from "@/lib/utils";

/**
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

const TIME_ZONE: Record<DateKind, string> = {
    day: "UTC",
    moment: "America/Argentina/Buenos_Aires",
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
    | "numeric";

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
    }
}
