// Los cinco lugares del programa de fundadores, en orden. Cuando un instituto reserva o
// se suma, se cambia acá: de esta lista salen el bloque del lugar reservado (debajo del
// caso), el número del sello de Fundadores y el «Quedan N de 5».
// Al 30/09/2026: Modern English School es el Nº 01 y el Nº 02 lo está probando.

export type SpotStatus = "taken" | "reserved" | "free";

export const FOUNDER_SPOTS: readonly SpotStatus[] = ["taken", "reserved", "free", "free", "free"];

export const FREE_SPOTS = FOUNDER_SPOTS.filter((status) => status === "free").length;

/** Número del primer lugar libre, el que invita el sello de Fundadores. */
export const NEXT_FREE_SPOT = FOUNDER_SPOTS.indexOf("free") + 1;

/** Número del lugar reservado; 0 si no hay ninguno. */
export const RESERVED_SPOT = FOUNDER_SPOTS.indexOf("reserved") + 1;

export function spotNumber(n: number) {
  return String(n).padStart(2, "0");
}
