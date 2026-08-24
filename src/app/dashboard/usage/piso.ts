/**
 * Desde cuándo se puede confiar en cada métrica del panel de uso (FEAT-11).
 *
 * **Un mosaico sin historia no muestra un cero: dice desde cuándo mide.** Cero y
 * "no medido" son cosas distintas, y confundirlas es exactamente cómo el
 * administrador termina concluyendo que en marzo no entraba nadie. Las fechas
 * viven acá y no repartidas por la pantalla para que se lean juntas y para que
 * la de una métrica no se actualice sin la otra.
 *
 * Las cinco métricas que no aparecen en este archivo no tienen piso: se
 * calculan hacia atrás sin límite sobre datos que ya estaban en la base.
 */

/**
 * `Attendance.source`, que distingue el escáner de la carga a mano.
 *
 * Antes de esta fecha el origen se deducía de un texto que el propio escáner
 * escribía en la observación —un campo libre y editable—, así que lo anterior
 * es **aproximado**: recupera lo que quedó, no todo lo que pasó.
 */
export const PISO_QR = new Date(Date.UTC(2026, 7, 23));

/**
 * El registro de actividad, que alimenta las personas activas por día y los
 * últimos ingresos.
 *
 * Antes de esta fecha **no hay nada**, ni aproximado: el sistema no guardaba
 * ninguna fecha de ingreso. Para los tutores queda el rastro indirecto de un
 * mensaje leído o una firma, que es otra cosa y se muestra como tal.
 */
export const PISO_REGISTRO = new Date(Date.UTC(2026, 7, 23));

/** Para las frases de la pantalla: "23/8". */
export function pisoCorto(piso: Date): string {
    return `${piso.getUTCDate()}/${piso.getUTCMonth() + 1}`;
}
