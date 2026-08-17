import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names and handles tailwind conflicts correctly.
 * Use this in every component to combine dynamic and static classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mes con el que se guardan las matrículas. No es un vencimiento: la matrícula
 * es anual y por curso, así que el mes no significa nada más que "ninguno".
 *
 * Está fijo a propósito. La restricción única de `Fee`
 * —`[enrollmentId, type, year, month]`— sólo dice "una matrícula por inscripción
 * y año" si todas las matrículas comparten el mes; con el mes de creación, dos
 * generaciones en meses distintos pasaban de largo. Ver FIN-12.
 *
 * Ninguna pantalla lo muestra: `formatFeeLabel` ignora el mes de las matrículas.
 */
export const ENROLLMENT_FEE_MONTH = 0;

/**
 * Importes en pesos, con el locale del negocio y no el del proceso.
 *
 * `toLocaleString()` pelado usa el locale de donde corre: en Vercel es `en-US`,
 * así que 15000 sale `15,000` en vez de `15.000`. Pasa en pantalla, en la nota
 * del recibo y en los mensajes de error, que es texto que lee el operador.
 * Ver FIN-10.
 *
 * Devuelve el número sin el signo `$` a propósito: así reemplaza a
 * `toLocaleString()` en el lugar donde ya estaba, sin tocar el resto del string.
 */
export const formatCurrency = (amount: number): string => amount.toLocaleString("es-AR");

export const getMonthName = (month: number): string => {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return months[month - 1] || `Mes ${month}`;
};

export const formatFeeLabel = (type: string, month: number, year: number) => {
  if (type === "ENROLLMENT") return `Matrícula ${year}`;
  if (type === "EXAM") return `Derecho de Examen ${year}`;
  if (type === "FULL_COURSE") return `Pago Único (Curso Completo) ${year}`;
  return `Cuota ${getMonthName(month)} ${year}`;
};
